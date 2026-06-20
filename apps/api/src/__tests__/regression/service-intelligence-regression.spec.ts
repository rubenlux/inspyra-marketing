/**
 * Service Intelligence Regression Tests — Golden Fixtures
 *
 * These are the "prompt regression tests" for Inspyra's commercial intelligence layer.
 * Each fixture captures a known input → expected output contract.
 *
 * Run with: npm run test:agents
 *
 * WHEN TO ADD A FIXTURE:
 * - When the Research Agent finds a common problem type in production
 * - After tuning service intelligence rules
 * - When adding a new service to the catalog
 *
 * WHEN THIS FAILS:
 * - Someone changed a service intelligence rule that breaks known recommendations
 * - A rule pattern no longer matches a common problem string
 * - Priority ordering changed unexpectedly
 * - The ServiceIntelligenceService response shape changed (breaks MCP tools)
 */

import { Test } from '@nestjs/testing';
import { ServiceIntelligenceService, IntelResult } from '../../modules/service-intelligence/service-intelligence.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';

const TENANT = 'tenant-fixtures';

// Simulated production rules — copy of what should be in service_intelligence_rules table
const PRODUCTION_RULES = [
  {
    id: 'rule-seo', tenantId: TENANT, activo: true,
    problemPattern: 'sin seo, sin posicionamiento, seo inexistente, no aparece en google',
    impactoDescripcion: 'No aparece en búsquedas locales — clientes van a la competencia',
    serviciosRecomendados: ['SEO Mensual'],
    prioridad: 'ALTA', ticketEstimadoUsd: '600', bundleSugerido: 'SEO + Web',
  },
  {
    id: 'rule-web', tenantId: TENANT, activo: true,
    problemPattern: 'web vieja, web desactualizada, web 2015, web 2016, web 2017, sin sitio, sin website',
    impactoDescripcion: 'Tasa de rebote alta, no convierte, daña imagen de marca',
    serviciosRecomendados: ['Diseño Web Corporativo'],
    prioridad: 'ALTA', ticketEstimadoUsd: '1500', bundleSugerido: 'SEO + Web',
  },
  {
    id: 'rule-gbp', tenantId: TENANT, activo: true,
    problemPattern: 'sin google business, sin ficha google, google business inexistente',
    impactoDescripcion: 'Invisible en búsquedas locales de Google Maps — pierde clientes que buscan su rubro en la zona',
    serviciosRecomendados: ['Gestión de Google Business Profile'],
    prioridad: 'ALTA', ticketEstimadoUsd: '600', bundleSugerido: null,
  },
  {
    id: 'rule-gbp-unclaimed', tenantId: TENANT, activo: true,
    problemPattern: 'perfil gbp sin reclamar, gbp sin reclamar, ficha sin reclamar',
    impactoDescripcion: 'Perfil en Google Maps existe pero no está siendo gestionado — la competencia con perfiles optimizados aparece primero',
    serviciosRecomendados: ['Gestión de Google Business Profile'],
    prioridad: 'ALTA', ticketEstimadoUsd: '600', bundleSugerido: null,
  },
  {
    id: 'rule-ssl', tenantId: TENANT, activo: true,
    problemPattern: 'sin https, sin ssl, certificado ssl, certificado expirado, sitio inseguro',
    impactoDescripcion: 'Navegadores marcan el sitio como inseguro — pérdida inmediata de confianza',
    serviciosRecomendados: ['Hosting Gestionado (HostingGuard)'],
    prioridad: 'CRITICA', ticketEstimadoUsd: '49', bundleSugerido: null,
  },
  {
    id: 'rule-ads', tenantId: TENANT, activo: true,
    problemPattern: 'sin ads, sin google ads, sin campañas pagas, sin publicidad digital',
    impactoDescripcion: 'No captura demanda activa — depende solo de orgánico',
    serviciosRecomendados: ['Google Ads Management'],
    prioridad: 'MEDIA', ticketEstimadoUsd: '500', bundleSugerido: null,
  },
];

// ─── Golden Fixtures ──────────────────────────────────────────────────────────

interface Fixture {
  name: string;
  description: string;
  input: string[];
  expect: {
    count: number;
    containsProblems?: string[];           // at least these problems appear in results
    minTicketTotal?: number;               // sum of ticketEstimadoUsd across all results
    hasHighPriority?: boolean;             // at least one ALTA or CRITICA
    hasCriticalPriority?: boolean;         // at least one CRITICA
    topPrioridad?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  };
}

const FIXTURES: Fixture[] = [
  {
    name: 'dental-clinic-seo',
    description: 'Typical dental clinic with no local SEO — the most common Research Agent finding',
    input: ['Sin SEO local', 'Sin Google Business', 'Web desactualizada'],
    expect: {
      count: 3,
      containsProblems: ['Sin SEO local'],
      hasHighPriority: true,
      minTicketTotal: 600,
    },
  },
  {
    name: 'ssl-critical',
    description: 'Expired SSL certificate — must be classified as CRITICA',
    input: ['Certificado SSL expirado'],
    expect: {
      count: 1,
      hasCriticalPriority: true,
      containsProblems: ['Certificado SSL expirado'],
    },
  },
  {
    name: 'full-digital-absence',
    description: 'Company with no digital presence at all — maximum opportunity',
    input: ['Sin SEO local', 'Sin sitio web', 'Sin Google Ads', 'Sin HTTPS', 'Sin Google Business'],
    expect: {
      count: 5,
      hasHighPriority: true,
      hasCriticalPriority: true,
      minTicketTotal: 1000,
    },
  },
  {
    name: 'unrecognized-problem',
    description: 'Unknown problem — must return generic fallback, never crash',
    input: ['Usa fax como canal principal de comunicacion'],
    expect: {
      count: 1,
      // Generic fallback: prioridad MEDIA, empty services
    },
  },
  {
    name: 'empty-input',
    description: 'Empty problems list — must return empty array, never crash',
    input: [],
    expect: { count: 0 },
  },
];

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Service Intelligence Regression — Golden Fixtures', () => {
  let service: ServiceIntelligenceService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    prisma.serviceIntelligenceRule.findMany.mockResolvedValue(PRODUCTION_RULES as never);

    const module = await Test.createTestingModule({
      providers: [ServiceIntelligenceService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ServiceIntelligenceService);
  });

  // ── Contract: every result must conform to IntelResult shape ─────────────────
  describe('Response Contract', () => {
    FIXTURES.forEach((fixture) => {
      it(`"${fixture.name}" always returns valid IntelResult[] shape`, async () => {
        const results = await service.analyze(TENANT, fixture.input);

        expect(results).toHaveLength(fixture.expect.count);

        for (const r of results) {
          expect(r).toHaveProperty('problema');
          expect(r).toHaveProperty('prioridad');
          expect(r).toHaveProperty('serviciosRecomendados');
          expect(r).toHaveProperty('ticketEstimadoUsd');
          expect(r).toHaveProperty('bundleSugerido');
          expect(r).toHaveProperty('impactoDescripcion');
          expect(Array.isArray(r.serviciosRecomendados)).toBe(true);
          expect(typeof r.ticketEstimadoUsd).toBe('number');
          expect(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).toContain(r.prioridad);
        }
      });
    });
  });

  // ── Commercial expectations per fixture ──────────────────────────────────────
  describe('Commercial Intelligence', () => {
    it('"dental-clinic-seo": returns 3 results and at least one ALTA or CRITICA', async () => {
      const f = FIXTURES.find((x) => x.name === 'dental-clinic-seo')!;
      const results = await service.analyze(TENANT, f.input);

      expect(results).toHaveLength(3);
      const hasHigh = results.some((r) => ['ALTA', 'CRITICA'].includes(r.prioridad));
      expect(hasHigh).toBe(true);

      const totalTicket = results.reduce((sum, r) => sum + r.ticketEstimadoUsd, 0);
      expect(totalTicket).toBeGreaterThanOrEqual(600);
    });

    it('"ssl-critical": SSL problem is CRITICA (safety-critical rule)', async () => {
      const results = await service.analyze(TENANT, ['Certificado SSL expirado']);
      expect(results[0].prioridad).toBe('CRITICA');
    });

    it('"full-digital-absence": at least one CRITICA and total ticket above $1000', async () => {
      const f = FIXTURES.find((x) => x.name === 'full-digital-absence')!;
      const results = await service.analyze(TENANT, f.input);

      const hasCritical = results.some((r) => r.prioridad === 'CRITICA');
      expect(hasCritical).toBe(true);

      const totalTicket = results.reduce((sum, r) => sum + r.ticketEstimadoUsd, 0);
      expect(totalTicket).toBeGreaterThanOrEqual(1000);
    });

    it('"unrecognized-problem": returns generic fallback without crashing', async () => {
      const results = await service.analyze(TENANT, ['Usa fax como canal principal de comunicacion']);
      expect(results).toHaveLength(1);
      expect(results[0].prioridad).toBe('MEDIA');
      expect(results[0].ticketEstimadoUsd).toBe(0);
      expect(results[0].serviciosRecomendados).toHaveLength(0);
    });

    it('"empty-input": returns empty array without crashing', async () => {
      const results = await service.analyze(TENANT, []);
      expect(results).toHaveLength(0);
    });
  });

  // ── Priority ordering correctness ─────────────────────────────────────────────
  describe('Priority Ordering (most important safeguard)', () => {
    it('when problem matches CRITICA and ALTA rules, CRITICA wins', async () => {
      // Both 'sin ssl' (CRITICA) and 'ssl' (ALTA) match "Sin SSL expirado"
      // CRITICA must always win
      const sslRule = PRODUCTION_RULES.find((r) => r.id === 'rule-ssl')!;
      prisma.serviceIntelligenceRule.findMany.mockResolvedValue([
        { ...sslRule, prioridad: 'CRITICA' }, // ssl → CRITICA
        { id: 'rule-ssl-alta', tenantId: TENANT, activo: true, problemPattern: 'ssl', prioridad: 'ALTA', serviciosRecomendados: ['Generic SSL'], impactoDescripcion: 'SSL issue', ticketEstimadoUsd: '100', bundleSugerido: null },
      ] as never);

      const results = await service.analyze(TENANT, ['Sin SSL expirado']);
      expect(results[0].prioridad).toBe('CRITICA');
    });
  });
});
