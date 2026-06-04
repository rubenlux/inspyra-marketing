import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';
import { humanToken, TEST_TENANT_ID, TEST_USER_ID } from '../helpers/jwt-factory';
import * as argon2 from 'argon2';

describe('Auth API', () => {
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
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/v1/auth/register', () => {
    it('creates tenant and returns access and refresh tokens', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.tenant.create.mockResolvedValue({ id: 'tenant-new', name: 'New Agency', slug: 'new-agency' });
      prisma.user.create.mockResolvedValue({ id: 'user-new', email: 'owner@new.io', tenantId: 'tenant-new', role: 'ADMIN' });
      prisma.userSession.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ tenantName: 'New Agency', email: 'owner@new.io', password: 'secret123', firstName: 'John', lastName: 'Doe' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('returns 409 when tenant slug already exists', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 'existing', slug: 'existing-agency' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ tenantName: 'Existing Agency', email: 'owner@existing.io', password: 'secret123', firstName: 'Jane', lastName: 'Doe' })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'noname@test.com' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns tokens with valid credentials', async () => {
      const hash = await argon2.hash('correct-password');
      prisma.user.findFirst.mockResolvedValue({
        id: TEST_USER_ID, email: 'admin@inspyra.io', password: hash, tenantId: TEST_TENANT_ID, role: 'ADMIN',
        isActive: true, deletedAt: null, tenant: { id: TEST_TENANT_ID },
      });
      prisma.userSession.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@inspyra.io', password: 'correct-password' })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('returns 401 with wrong password', async () => {
      const hash = await argon2.hash('correct-password');
      prisma.user.findFirst.mockResolvedValue({
        id: TEST_USER_ID, email: 'admin@inspyra.io', password: hash, tenantId: TEST_TENANT_ID, role: 'ADMIN',
        isActive: true, deletedAt: null,
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@inspyra.io', password: 'wrong-password' })
        .expect(401);
    });

    it('returns 401 when user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'validpassword123' })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns user profile when authenticated', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: TEST_USER_ID, email: 'admin@inspyra.io', firstName: 'Admin', lastName: 'Inspyra',
        role: 'ADMIN', tenantId: TEST_TENANT_ID, createdAt: new Date(),
        tenant: { id: TEST_TENANT_ID, name: 'Inspyra', slug: 'inspyra', plan: 'STARTER' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(200);

      expect(res.body.data.email).toBe('admin@inspyra.io');
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });
});
