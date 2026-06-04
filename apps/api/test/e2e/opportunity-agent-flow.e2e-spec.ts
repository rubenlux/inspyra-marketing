/**
 * E2E #2 — Research Agent → Prospect → Opportunity Agent
 *
 * Validates the second link in the Inspyra AI Workforce chain:
 *   Research Agent creates prospect
 *   → Opportunity Agent scores it (Service Intelligence + Pricing Engine)
 *   → Validation record stored in PostgreSQL (PENDING)
 *   → Human reviews and assigns real score
 *   → Drift report shows learning signal (IA vs human)
 *
 * This test is the contract for the Opportunity Agent.
 * If it fails, no commercial intelligence can be trusted.
 *
 * Run: npm run test:e2e:opportunity
 * Requirements: PostgreSQL running (docker-compose up)
 */

import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { AgentAuditInterceptor } from '../../src/common/interceptors/agent-audit.interceptor';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';

const TENANT_ID = '483e19af-46e0-480e-a4ea-5e8513216ef9';

const RESEARCH_AGENT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzYS1yZXNlYXJjaCIsImFnZW50SWQiOiJyZXNlYXJjaC1hZ2VudCIsInRlbmFudElkIjoiNDgzZTE5YWYtNDZlMC00ODBlLWE0ZWEtNWU4NTEzMjE2ZWY5Iiwic2NvcGVzIjpbInByb3NwZWN0cy5yZWFkIiwicHJvc3BlY3RzLmNyZWF0ZSIsInByb3NwZWN0cy51cGRhdGUiLCJpbnRlbC5yZWFkIl0sInR5cGUiOiJzZXJ2aWNlIiwiaWF0IjoxNzgwNTQ4OTk5LCJleHAiOjE4MTIwODQ5OTl9.puMQ6mcy6m3nBx8o4xnbyFpa-0hDNBibSMG4vHxUb6U';

const OPPORTUNITY_AGENT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZXMiOlsicHJvc3BlY3RzLnJlYWQiLCJwcm9zcGVjdHMudXBkYXRlIiwiaW50ZWwucmVhZCIsImNhdGFsb2cucmVhZCIsInByb3NwZWN0LXZhbGlkYXRpb25zLmNyZWF0ZSIsInByb3NwZWN0LXZhbGlkYXRpb25zLnJlYWQiLCJwcmljaW5nLnJlYWQiXSwiaWF0IjoxNzgwNTgzNjkwLCJ0eXBlIjoic2VydmljZSIsInRlbmFudElkIjoiNDgzZTE5YWYtNDZlMC00ODBlLWE0ZWEtNWU4NTEzMjE2ZWY5Iiwic3ViIjoiOWEwZGIzMmQtNmYzYi00ZjllLWJhMTEtOTc4MTdhN2RkYjgwIiwiYWdlbnRJZCI6Im9wcG9ydHVuaXR5IiwiZXhwIjoxODEyMTE5NjkwfQ.tEZAcWosCKd2dBv3t8emH3XEjKbM2bVcvAqZ0se8KhY';

// Human admin JWT (same secret, for human-only review endpoint)
import { JwtService } from '@nestjs/jwt';
const HUMAN_TOKEN = new JwtService({ secret: 'change_me_in_production_must_be_32_chars_min' }).sign(
  { sub: 'a0d2f8bf-e4ff-458e-baa5-90fb0450b6aa', email: 'admin@inspyra.io', tenantId: TENANT_ID, role: 'ADMIN' },
  { expiresIn: '1h' },
);

const E2E_COMPANY = 'E2E-Opportunity-Flow-Test';

describe('E2E #2 — Research → Prospect → Opportunity Agent', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testProspectId: string;
  let validationId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.useGlobalFilters(new AllExceptionsFilter());
    prisma = module.get(PrismaService);
    app.useGlobalInterceptors(new ResponseInterceptor(), new AgentAuditInterceptor(prisma));
    await app.init();

    // Clean previous test runs
    await prisma.prospectValidation.deleteMany({ where: { tenantId: TENANT_ID, prospect: { nombreEmpresa: E2E_COMPANY } } });
    await prisma.prospect.deleteMany({ where: { tenantId: TENANT_ID, nombreEmpresa: E2E_COMPANY } });
  });

  afterAll(async () => {
    // Cleanup
    if (validationId) await prisma.prospectValidation.deleteMany({ where: { id: validationId } });
    if (testProspectId) await prisma.prospect.deleteMany({ where: { id: testProspectId } });
    await app.close();
  });

  // ─── Link 1: Research Agent creates the prospect ─────────────────────────────
  it('Step 1 — Research Agent creates prospect (simulates create_prospect MCP tool)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/prospects')
      .set('Authorization', `Bearer ${RESEARCH_AGENT_TOKEN}`)
      .set('X-Agent-Id', 'research')
      .send({
        nombreEmpresa: E2E_COMPANY,
        ciudad: 'Buenos Aires',
        pais: 'Argentina',
        rubro: 'Clínica dental',
        problemasEncontrados: ['Sin SEO local', 'Web desactualizada', 'Sin Google Business', 'Sin HTTPS'],
        oportunidadDetectada: 'Clínica con 4 problemas digitales críticos, mercado local competitivo.',
        detectadoPor: 'IA',
        score: 60,
      })
      .expect(201);

    testProspectId = res.body.data.id;
    expect(testProspectId).toBeTruthy();
  });

  it('Step 2 — Research Agent advances prospect to INVESTIGADO (simulates update_prospect)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/prospects/${testProspectId}`)
      .set('Authorization', `Bearer ${RESEARCH_AGENT_TOKEN}`)
      .set('X-Agent-Id', 'research')
      .send({ estado: 'INVESTIGADO' })
      .expect(200);

    const p = await prisma.prospect.findUnique({ where: { id: testProspectId } });
    expect(p!.estado).toBe('INVESTIGADO');
  });

  // ─── Link 2: Opportunity Agent scores the prospect ───────────────────────────
  it('Step 3 — Opportunity Agent token is accepted', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/prospects')
      .set('Authorization', `Bearer ${OPPORTUNITY_AGENT_TOKEN}`)
      .expect(200);
  });

  it('Step 4 — Opportunity Agent sees the prospect in pending queue (simulates list_pending_validations)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/prospects?estado=INVESTIGADO&limit=50')
      .set('Authorization', `Bearer ${OPPORTUNITY_AGENT_TOKEN}`)
      .expect(200);

    const ids = (res.body.data as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(testProspectId);
  });

  it('Step 5 — analyze_problems returns service recommendations (Service Intelligence Engine)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/service-intelligence/analyze?problems=Sin SEO local,Web desactualizada,Sin Google Business,Sin HTTPS')
      .set('Authorization', `Bearer ${OPPORTUNITY_AGENT_TOKEN}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(4);

    // Each result must conform to the IntelResult contract
    for (const result of res.body.data as Record<string, unknown>[]) {
      expect(result).toHaveProperty('problema');
      expect(result).toHaveProperty('prioridad');
      expect(result).toHaveProperty('serviciosRecomendados');
      expect(result).toHaveProperty('ticketEstimadoUsd');
      expect(Array.isArray(result['serviciosRecomendados'])).toBe(true);
    }
  });

  it('Step 6 — Opportunity Agent submits scoring assessment (simulates submit_validation)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/prospect-validations')
      .set('Authorization', `Bearer ${OPPORTUNITY_AGENT_TOKEN}`)
      .set('X-Agent-Id', 'opportunity')
      .send({
        prospectId: testProspectId,
        agentScore: 72,
        servicesRecommended: ['SEO Mensual', 'Diseño Web Corporativo', 'Hosting Gestionado'],
        estimatedTicketUsd: 2349,
        prioridad: 'ALTA',
        reasoning: '4 problemas detectados (3 ALTA, 1 MEDIA). Service fit 100%. Ticket $2349 (SEO $600/mes + Web $1500 + Hosting $249). Score components: problems=25, priority=20, fit=25, ticket=20.',
      })
      .expect(201);

    validationId = res.body.data.id;
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.humanScore).toBeNull();
    expect(res.body.data.agentScore).toBe(72);
  });

  // ─── Link 3: Verification in PostgreSQL ─────────────────────────────────────
  it('Step 7 — Validation record exists in PostgreSQL with correct data', async () => {
    const v = await prisma.prospectValidation.findUnique({ where: { prospectId: testProspectId } });
    expect(v).not.toBeNull();
    expect(v!.agentScore).toBe(72);
    expect(v!.status).toBe('PENDING');
    expect(v!.humanScore).toBeNull();
    expect(v!.validatedBy).toBeNull();
    expect(v!.servicesRecommended).toContain('SEO Mensual');
    expect(Number(v!.estimatedTicketUsd)).toBe(2349);
  });

  it('Step 8 — Opportunity Agent CANNOT self-review (NoServiceAccountGuard enforced)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/prospect-validations/${validationId}/review`)
      .set('Authorization', `Bearer ${OPPORTUNITY_AGENT_TOKEN}`)
      .send({ humanScore: 72, status: 'VALIDATED', notes: 'Agent self-validating' })
      .expect(403);

    // Validation is still PENDING — the 403 protected it
    const v = await prisma.prospectValidation.findUnique({ where: { id: validationId } });
    expect(v!.status).toBe('PENDING');
    expect(v!.humanScore).toBeNull();
  });

  it('Step 9 — Human reviews and assigns their own score (the learning signal)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/prospect-validations/${validationId}/review`)
      .set('Authorization', `Bearer ${HUMAN_TOKEN}`)
      .send({
        humanScore: 45,
        status: 'VALIDATED',
        notes: 'Sin presupuesto este mes. La dueña no es quien decide. Score real 45.',
      })
      .expect(200);

    expect(res.body.data.humanScore).toBe(45);
    expect(res.body.data.status).toBe('VALIDATED');
    expect(res.body.data.validatedBy).toBeTruthy();
    expect(res.body.data.validatedAt).toBeTruthy();
  });

  it('Step 10 — Prospect score was synced to PostgreSQL from human review', async () => {
    const p = await prisma.prospect.findUnique({ where: { id: testProspectId } });
    // Human overrode the score: prospect.score should now be 45
    expect(p!.score).toBe(45);
  });

  it('Step 11 — Score drift report shows IA overestimated (avgDrift > 0)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/prospect-validations/drift')
      .set('Authorization', `Bearer ${HUMAN_TOKEN}`)
      .expect(200);

    expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    // avgDrift = agentScore - humanScore = 72 - 45 = +27
    // Positive drift means IA overestimates (common early on)
    expect(res.body.data.avgDrift).toBeGreaterThan(0);
    expect(res.body.data.overestimated).toBeGreaterThanOrEqual(1);
  });
});
