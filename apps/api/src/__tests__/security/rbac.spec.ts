import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';
import { humanToken, serviceToken, TEST_TENANT_ID } from '../helpers/jwt-factory';

const PROSPECT = {
  id: 'p-1',
  tenantId: TEST_TENANT_ID,
  nombreEmpresa: 'RBAC Test Corp',
  estado: 'NUEVO',
  deletedAt: null,
  owner: null,
  creadoPor: null,
};

describe('RBAC — Service Account Restrictions', () => {
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
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  describe('Unauthenticated access', () => {
    it('GET /prospects returns 401', () =>
      request(app.getHttpServer()).get('/api/v1/prospects').expect(401));

    it('POST /prospects returns 401', () =>
      request(app.getHttpServer()).post('/api/v1/prospects').send({ nombreEmpresa: 'X' }).expect(401));

    it('DELETE /prospects/:id returns 401', () =>
      request(app.getHttpServer()).delete('/api/v1/prospects/some-id').expect(401));

    it('GET /service-intelligence/analyze returns 401', () =>
      request(app.getHttpServer()).get('/api/v1/service-intelligence/analyze?problems=test').expect(401));
  });

  describe('Service account forbidden operations', () => {
    it('DELETE /prospects/:id returns 403 for service account', () =>
      request(app.getHttpServer())
        .delete('/api/v1/prospects/p-1')
        .set('Authorization', `Bearer ${serviceToken()}`)
        .expect(403));

    // Note: service-catalog DELETE does not have NoServiceAccountGuard
    // (catalog is read-only for agents by convention, not by guard)
  });

  describe('Service account allowed operations', () => {
    it('GET /prospects returns 200 for service account', async () => {
      prisma.prospect.findMany.mockResolvedValue([]);
      prisma.prospect.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/prospects')
        .set('Authorization', `Bearer ${serviceToken()}`)
        .expect(200);
    });

    it('POST /prospects returns 201 for service account', async () => {
      prisma.prospect.create.mockResolvedValue({ ...PROSPECT });
      prisma.auditLog.create.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/v1/prospects')
        .set('Authorization', `Bearer ${serviceToken()}`)
        .send({ nombreEmpresa: 'Agent Corp' })
        .expect(201);
    });

    it('GET /service-catalog returns 200 for service account', async () => {
      prisma.serviceCatalogItem.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/service-catalog')
        .set('Authorization', `Bearer ${serviceToken()}`)
        .expect(200);
    });
  });

  describe('Human account — full access to destructive operations', () => {
    it('DELETE /prospects/:id returns 204 for human admin', async () => {
      prisma.prospect.findFirst.mockResolvedValue(PROSPECT);
      prisma.prospect.update.mockResolvedValue({ ...PROSPECT, deletedAt: new Date() });

      await request(app.getHttpServer())
        .delete('/api/v1/prospects/p-1')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(204);
    });
  });
});
