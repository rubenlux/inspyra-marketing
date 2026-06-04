import { Test } from '@nestjs/testing';
import { ServiceIntelligenceService } from '../../modules/service-intelligence/service-intelligence.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';

const TENANT = 'tenant-1';

function makeRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    tenantId: TENANT,
    problemPattern: 'sin seo',
    impactoDescripcion: 'No aparece en búsquedas locales',
    serviciosRecomendados: ['SEO Mensual'],
    prioridad: 'ALTA',
    ticketEstimadoUsd: '600',
    bundleSugerido: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ServiceIntelligenceService', () => {
  let service: ServiceIntelligenceService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [ServiceIntelligenceService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ServiceIntelligenceService);
  });

  it('returns generic entry when no rules are configured', async () => {
    prisma.serviceIntelligenceRule.findMany.mockResolvedValue([]);

    const result = await service.analyze(TENANT, ['Sin SEO local']);

    expect(result).toHaveLength(1);
    expect(result[0].problema).toBe('Sin SEO local');
    expect(result[0].prioridad).toBe('MEDIA');
    expect(result[0].ticketEstimadoUsd).toBe(0);
    expect(result[0].serviciosRecomendados).toHaveLength(0);
    expect(result[0].bundleSugerido).toBeNull();
  });

  it('matches rule by keyword in problem string (case insensitive)', async () => {
    prisma.serviceIntelligenceRule.findMany.mockResolvedValue([makeRule()]);

    const result = await service.analyze(TENANT, ['Sin SEO Local']);

    expect(result[0].serviciosRecomendados).toContain('SEO Mensual');
    expect(result[0].prioridad).toBe('ALTA');
    expect(result[0].ticketEstimadoUsd).toBe(600);
  });

  it('handles empty problems array', async () => {
    prisma.serviceIntelligenceRule.findMany.mockResolvedValue([makeRule()]);

    const result = await service.analyze(TENANT, []);

    expect(result).toHaveLength(0);
  });

  it('returns one result per problem even when multiple rules match the same problem', async () => {
    prisma.serviceIntelligenceRule.findMany.mockResolvedValue([
      makeRule({ problemPattern: 'sin seo', prioridad: 'ALTA' }),
      makeRule({ id: 'rule-2', problemPattern: 'seo', prioridad: 'MEDIA' }),
    ]);

    const result = await service.analyze(TENANT, ['Sin SEO local']);

    expect(result).toHaveLength(1);
  });

  describe('priority resolution', () => {
    it('picks CRITICA over ALTA when both match', async () => {
      prisma.serviceIntelligenceRule.findMany.mockResolvedValue([
        makeRule({ problemPattern: 'ssl', prioridad: 'ALTA' }),
        makeRule({ id: 'rule-2', problemPattern: 'sin ssl', prioridad: 'CRITICA', serviciosRecomendados: ['Hosting Seguro'] }),
      ]);

      const result = await service.analyze(TENANT, ['Sin SSL']);

      expect(result[0].prioridad).toBe('CRITICA');
      expect(result[0].serviciosRecomendados).toContain('Hosting Seguro');
    });

    it('picks ALTA over MEDIA', async () => {
      prisma.serviceIntelligenceRule.findMany.mockResolvedValue([
        makeRule({ problemPattern: 'web', prioridad: 'MEDIA' }),
        makeRule({ id: 'rule-2', problemPattern: 'web 2015', prioridad: 'ALTA', serviciosRecomendados: ['Rediseño'] }),
      ]);

      const result = await service.analyze(TENANT, ['Web 2015 desactualizada']);

      expect(result[0].prioridad).toBe('ALTA');
    });
  });

  it('handles comma-separated patterns within a single rule', async () => {
    prisma.serviceIntelligenceRule.findMany.mockResolvedValue([
      makeRule({ problemPattern: 'sin ssl, certificado vencido, http' }),
    ]);

    const results = await Promise.all([
      service.analyze(TENANT, ['Sin SSL']),
      service.analyze(TENANT, ['Certificado vencido']),
      service.analyze(TENANT, ['Sitio en HTTP']),
    ]);

    for (const result of results) {
      expect(result[0].serviciosRecomendados).toContain('SEO Mensual');
    }
  });

  it('processes multiple problems independently', async () => {
    prisma.serviceIntelligenceRule.findMany.mockResolvedValue([
      makeRule({ problemPattern: 'seo', prioridad: 'ALTA', serviciosRecomendados: ['SEO Mensual'] }),
    ]);

    const result = await service.analyze(TENANT, ['Sin SEO', 'Sin SSL']);

    expect(result).toHaveLength(2);
    expect(result[0].serviciosRecomendados).toContain('SEO Mensual');
    expect(result[1].serviciosRecomendados).toHaveLength(0); // SSL no matched
  });
});
