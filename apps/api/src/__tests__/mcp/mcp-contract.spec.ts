/**
 * MCP Contract Tests
 *
 * Verifies that the Inspyra API endpoints honor the contracts that MCP tools depend on.
 * Each test corresponds to one MCP tool and validates:
 *   - Correct HTTP method and path
 *   - Response shape that tools parse
 *   - X-Agent-Id header propagation
 *   - Token authorization
 */
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { AgentAuditInterceptor } from '../../common/interceptors/agent-audit.interceptor';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';
import { serviceToken, TEST_TENANT_ID } from '../helpers/jwt-factory';

const AGENT_TOKEN = serviceToken();
const AGENT_ID = 'research';

describe('MCP Contract — inspyra_* tools', () => {
  let app: INestApplication;
  let prisma: MockPrisma;

  beforeAll(async () => {
    prisma = createMockPrisma();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    const p = module.get(PrismaService);
    app.useGlobalInterceptors(new ResponseInterceptor(), new AgentAuditInterceptor(p));
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  describe('inspyra_list_prospects → GET /api/v1/prospects', () => {
    it('returns { success, data, meta } — required shape for MCP tool parsing', async () => {
      prisma.prospect.findMany.mockResolvedValue([{ id: 'p-1', nombreEmpresa: 'Corp', estado: 'NUEVO' }]);
      prisma.prospect.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/v1/prospects')
        .set('Authorization', `Bearer ${AGENT_TOKEN}`)
        .set('X-Agent-Id', AGENT_ID)
        .expect(200);

      expect(res.body).toMatchObject({ success: true, data: expect.any(Array), meta: expect.any(Object) });
    });

    it('accepts scoreMin/Max filter parameters (agent uses them for qualified leads)', async () => {
      prisma.prospect.findMany.mockResolvedValue([]);
      prisma.prospect.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/prospects?scoreMin=60&scoreMax=100')
        .set('Authorization', `Bearer ${AGENT_TOKEN}`)
        .expect(200);
    });
  });

  describe('inspyra_create_prospect → POST /api/v1/prospects', () => {
    it('creates prospect and returns created record with id', async () => {
      const created = { id: 'new-p', tenantId: TEST_TENANT_ID, nombreEmpresa: 'MCP Corp', detectadoPor: 'IA', estado: 'NUEVO' };
      prisma.prospect.create.mockResolvedValue(created as never);
      prisma.auditLog.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/api/v1/prospects')
        .set('Authorization', `Bearer ${AGENT_TOKEN}`)
        .set('X-Agent-Id', AGENT_ID)
        .send({ nombreEmpresa: 'MCP Corp', detectadoPor: 'IA', problemasEncontrados: ['Sin SEO'] })
        .expect(201);

      expect(res.body.data.id).toBe('new-p');
      expect(res.body.data.detectadoPor).toBe('IA');
    });

    it('triggers audit log with agentId when X-Agent-Id header is present', async () => {
      prisma.prospect.create.mockResolvedValue({ id: 'p-audit', tenantId: TEST_TENANT_ID, nombreEmpresa: 'Audit Co' } as never);
      prisma.auditLog.create.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/v1/prospects')
        .set('Authorization', `Bearer ${AGENT_TOKEN}`)
        .set('X-Agent-Id', AGENT_ID)
        .send({ nombreEmpresa: 'Audit Co' })
        .expect(201);

      // setImmediate needs one tick
      await new Promise<void>((r) => setImmediate(r));
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ changes: expect.objectContaining({ agentId: AGENT_ID }) }),
        }),
      );
    });
  });

  describe('inspyra_get_prospect → GET /api/v1/prospects/:id', () => {
    it('returns single prospect record', async () => {
      const prospect = { id: 'p-get', tenantId: TEST_TENANT_ID, nombreEmpresa: 'Get Corp', estado: 'INVESTIGADO' };
      prisma.prospect.findFirst.mockResolvedValue(prospect as never);

      const res = await request(app.getHttpServer())
        .get('/api/v1/prospects/p-get')
        .set('Authorization', `Bearer ${AGENT_TOKEN}`)
        .expect(200);

      expect(res.body.data.id).toBe('p-get');
    });
  });

  describe('inspyra_update_prospect → PATCH /api/v1/prospects/:id', () => {
    it('updates allowed fields (score, nivelOportunidad, estado)', async () => {
      const base = { id: 'p-upd', tenantId: TEST_TENANT_ID, nombreEmpresa: 'Upd Corp', estado: 'NUEVO', deletedAt: null, owner: null, creadoPor: null };
      prisma.prospect.findFirst.mockResolvedValue(base as never);
      prisma.prospect.update.mockResolvedValue({ ...base, score: 70, nivelOportunidad: 'ALTA', estado: 'INVESTIGADO' } as never);
      prisma.auditLog.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .patch('/api/v1/prospects/p-upd')
        .set('Authorization', `Bearer ${AGENT_TOKEN}`)
        .set('X-Agent-Id', AGENT_ID)
        .send({ score: 70, nivelOportunidad: 'ALTA', estado: 'INVESTIGADO' })
        .expect(200);

      expect(res.body.data.score).toBe(70);
      expect(res.body.data.nivelOportunidad).toBe('ALTA');
    });
  });

  describe('inspyra_analyze_problems → GET /api/v1/service-intelligence/analyze', () => {
    it('returns analysis results for comma-separated problems', async () => {
      prisma.serviceIntelligenceRule.findMany.mockResolvedValue([
        {
          id: 'r-1', problemPattern: 'sin seo', impactoDescripcion: 'Sin visibilidad',
          serviciosRecomendados: ['SEO Mensual'], prioridad: 'ALTA',
          ticketEstimadoUsd: '600', bundleSugerido: null,
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/service-intelligence/analyze?problems=Sin SEO local,Web desactualizada')
        .set('Authorization', `Bearer ${AGENT_TOKEN}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].problema).toBe('Sin SEO local');
    });
  });

  describe('inspyra_get_prospect_kpis → GET /api/v1/prospects/kpis', () => {
    it('returns KPI object with required fields', async () => {
      prisma.prospect.count.mockResolvedValue(5);
      prisma.prospect.aggregate.mockResolvedValue({ _avg: { score: 72 } } as never);

      const res = await request(app.getHttpServer())
        .get('/api/v1/prospects/kpis')
        .set('Authorization', `Bearer ${AGENT_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('scorePromedio');
    });
  });
});
