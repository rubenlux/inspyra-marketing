import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface PricingItem {
  catalogItemId: string;
  cantidad?: number;
}

interface PricingRequest {
  items: PricingItem[];
  bundle?: string;
  descuentoManual?: number;
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(tenantId: string, req: PricingRequest) {
    const descuento = req.descuentoManual ?? 0;
    const results = [];
    let subtotal = 0;
    let mrrNuevo = 0;
    let pagoInicialUsd = 0;

    for (const item of req.items) {
      const catalogItem = await this.prisma.serviceCatalogItem.findFirst({
        where: { id: item.catalogItemId, tenantId, activo: true },
      });

      if (!catalogItem) {
        throw new NotFoundException(`Catalog item ${item.catalogItemId} not found or inactive`);
      }

      const precioBase = Number(catalogItem.precioBaseUsd) * (item.cantidad ?? 1);
      const descuentoUsd = precioBase * (descuento / 100);
      const precioFinal = precioBase - descuentoUsd;
      const billing = catalogItem.billingModelDefault;

      subtotal += precioBase;

      const mrr = this.calcMrr(billing, precioFinal);
      mrrNuevo += mrr;

      if (['UNICO', 'POR_PROYECTO'].includes(billing)) {
        pagoInicialUsd += precioFinal;
      }

      results.push({
        catalogItemId: catalogItem.id,
        nombre: catalogItem.nombre,
        categoria: catalogItem.categoria,
        billing,
        cantidad: item.cantidad ?? 1,
        precioBase,
        descuentoPct: descuento,
        descuentoUsd,
        precioFinal,
        mrrAporte: mrr,
      });
    }

    const descuentoTotal = subtotal - results.reduce((s, i) => s + i.precioFinal, 0);
    const total = subtotal - descuentoTotal;

    return {
      bundle: req.bundle ?? null,
      items: results,
      subtotal,
      descuentoTotal,
      total,
      mrrNuevo,
      pagoInicialUsd,
      currency: 'USD',
    };
  }

  private calcMrr(billing: string, precio: number): number {
    switch (billing) {
      case 'MENSUAL':
      case 'SUSCRIPCION':
        return precio;
      case 'TRIMESTRAL':
        return precio / 3;
      case 'ANUAL':
        return precio / 12;
      default:
        return 0;
    }
  }
}
