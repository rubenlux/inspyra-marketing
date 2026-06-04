import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PricingService } from '../../modules/pricing/pricing.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';

const TENANT = 'tenant-1';

function makeCatalogItem(overrides: Partial<{ precioBaseUsd: string; billingModelDefault: string; activo: boolean }> = {}) {
  return {
    id: 'item-1',
    nombre: 'SEO Mensual',
    categoria: 'SEO',
    precioBaseUsd: '600',
    billingModelDefault: 'MENSUAL',
    activo: true,
    ...overrides,
  };
}

describe('PricingService', () => {
  let service: PricingService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [PricingService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PricingService);
  });

  describe('calculate — basic', () => {
    it('returns correct structure for a single item', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(makeCatalogItem());

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }] });

      expect(result.currency).toBe('USD');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].nombre).toBe('SEO Mensual');
      expect(result.items[0].precioBase).toBe(600);
      expect(result.items[0].descuentoPct).toBe(0);
    });

    it('applies cantidad multiplier', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(makeCatalogItem());

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1', cantidad: 3 }] });

      expect(result.items[0].precioBase).toBe(1800);
    });

    it('applies descuentoManual correctly', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(makeCatalogItem());

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }], descuentoManual: 10 });

      expect(result.items[0].descuentoUsd).toBe(60);
      expect(result.items[0].precioFinal).toBe(540);
      expect(result.descuentoTotal).toBe(60);
      expect(result.total).toBe(540);
    });

    it('sets bundle in output when provided', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(makeCatalogItem());

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }], bundle: 'SEO + Web' });

      expect(result.bundle).toBe('SEO + Web');
    });

    it('throws NotFoundException when catalog item not found', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(null);

      await expect(service.calculate(TENANT, { items: [{ catalogItemId: 'missing' }] })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when catalog item is inactive', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(null); // activo: false excluded by query

      await expect(service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }] })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('calcMrr — billing models', () => {
    it('MENSUAL: full price adds to mrrNuevo', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(makeCatalogItem({ billingModelDefault: 'MENSUAL' }));

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }] });

      expect(result.mrrNuevo).toBe(600);
      expect(result.pagoInicialUsd).toBe(0);
    });

    it('SUSCRIPCION: treated same as MENSUAL', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(makeCatalogItem({ billingModelDefault: 'SUSCRIPCION' }));

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }] });

      expect(result.mrrNuevo).toBe(600);
    });

    it('TRIMESTRAL: MRR = price / 3', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(
        makeCatalogItem({ precioBaseUsd: '300', billingModelDefault: 'TRIMESTRAL' }),
      );

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }] });

      expect(result.mrrNuevo).toBe(100);
    });

    it('ANUAL: MRR = price / 12', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(
        makeCatalogItem({ precioBaseUsd: '1200', billingModelDefault: 'ANUAL' }),
      );

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }] });

      expect(result.mrrNuevo).toBe(100);
    });

    it('UNICO: no MRR, full price goes to pagoInicialUsd', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(
        makeCatalogItem({ precioBaseUsd: '1500', billingModelDefault: 'UNICO' }),
      );

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }] });

      expect(result.mrrNuevo).toBe(0);
      expect(result.pagoInicialUsd).toBe(1500);
    });

    it('POR_PROYECTO: no MRR, full price goes to pagoInicialUsd', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(
        makeCatalogItem({ precioBaseUsd: '2000', billingModelDefault: 'POR_PROYECTO' }),
      );

      const result = await service.calculate(TENANT, { items: [{ catalogItemId: 'item-1' }] });

      expect(result.mrrNuevo).toBe(0);
      expect(result.pagoInicialUsd).toBe(2000);
    });
  });

  describe('calculate — multi-item', () => {
    it('aggregates subtotal, MRR, and pagoInicial across items', async () => {
      prisma.serviceCatalogItem.findFirst
        .mockResolvedValueOnce(makeCatalogItem({ precioBaseUsd: '600', billingModelDefault: 'MENSUAL' }))
        .mockResolvedValueOnce(makeCatalogItem({ precioBaseUsd: '1500', billingModelDefault: 'UNICO' }));

      const result = await service.calculate(TENANT, {
        items: [{ catalogItemId: 'seo' }, { catalogItemId: 'web' }],
      });

      expect(result.subtotal).toBe(2100);
      expect(result.mrrNuevo).toBe(600);
      expect(result.pagoInicialUsd).toBe(1500);
      expect(result.total).toBe(2100);
    });
  });
});
