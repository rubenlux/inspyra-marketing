import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { AgentAuditInterceptor } from '../../common/interceptors/agent-audit.interceptor';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';
import { humanToken, serviceToken, TEST_TENANT_ID } from '../helpers/jwt-factory';

const PROSPECT = {
  id: 'prospect-1',
  tenantId: TEST_TENANT_ID,
  nombreEmpresa: 'Test Corp',
  estado: 'NUEVO',
  score: 60,
  deletedAt: null,
  owner: null,
  creadoPor: null,
};

describe('Prospects API', () => {
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    const p = module.get(PrismaService);
    app.useGlobalInterceptors(new ResponseInterceptor(), new AgentAuditInterceptor(p));
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/v1/prospects', () => {
    it('returns 401 without token', () =>
      request(app.getHttpServer()).get('/api/v1/prospects').expect(401));

    it('returns paginated list with valid token', async () => {
      prisma.prospect.findMany.mockResolvedValue([PROSPECT]);
      prisma.prospect.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/v1/prospects')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBe(1);
    });

    it('accepts scoreMin and scoreMax filters', async () => {
      prisma.prospect.findMany.mockResolvedValue([]);
      prisma.prospect.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/prospects?scoreMin=70&scoreMax=100')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(200);

      const whereArg = prisma.prospect.findMany.mock.calls[0][0].where;
      expect(whereArg.score).toEqual({ gte: 70, lte: 100 });
    });
  });

  describe('POST /api/v1/prospects', () => {
    it('creates prospect and returns 201', async () => {
      prisma.prospect.create.mockResolvedValue({ ...PROSPECT, id: 'new-1' });
      prisma.auditLog.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/api/v1/prospects')
        .set('Authorization', `Bearer ${humanToken()}`)
        .send({ nombreEmpresa: 'Test Corp', ciudad: 'Buenos Aires' })
        .expect(201);

      expect(res.body.data.nombreEmpresa).toBe('Test Corp');
    });

    it('returns 400 when nombreEmpresa is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/prospects')
        .set('Authorization', `Bearer ${humanToken()}`)
        .send({ ciudad: 'Buenos Aires' })
        .expect(400);
    });

    it('service account can create prospect (allowed operation)', async () => {
      prisma.prospect.create.mockResolvedValue({ ...PROSPECT, detectadoPor: 'IA' });
      prisma.auditLog.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/api/v1/prospects')
        .set('Authorization', `Bearer ${serviceToken()}`)
        .set('X-Agent-Id', 'research')
        .send({ nombreEmpresa: 'Agent Corp', detectadoPor: 'IA' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/prospects/:id', () => {
    it('returns prospect by id', async () => {
      prisma.prospect.findFirst.mockResolvedValue(PROSPECT);

      const res = await request(app.getHttpServer())
        .get('/api/v1/prospects/prospect-1')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(200);

      expect(res.body.data.id).toBe('prospect-1');
    });

    it('returns 404 when not found', async () => {
      prisma.prospect.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/prospects/missing')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/prospects/:id', () => {
    it('updates prospect score', async () => {
      prisma.prospect.findFirst.mockResolvedValue(PROSPECT);
      prisma.prospect.update.mockResolvedValue({ ...PROSPECT, score: 75 });
      prisma.auditLog.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .patch('/api/v1/prospects/prospect-1')
        .set('Authorization', `Bearer ${humanToken()}`)
        .send({ score: 75 })
        .expect(200);

      expect(res.body.data.score).toBe(75);
    });
  });

  describe('DELETE /api/v1/prospects/:id', () => {
    it('returns 403 when called with service account token', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/prospects/prospect-1')
        .set('Authorization', `Bearer ${serviceToken()}`)
        .expect(403);
    });

    it('soft-deletes when called with human token', async () => {
      prisma.prospect.findFirst.mockResolvedValue(PROSPECT);
      prisma.prospect.update.mockResolvedValue({ ...PROSPECT, deletedAt: new Date() });

      await request(app.getHttpServer())
        .delete('/api/v1/prospects/prospect-1')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(204);
    });
  });
});
