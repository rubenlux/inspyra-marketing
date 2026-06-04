import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';
import { humanToken } from '../helpers/jwt-factory';

const CATALOG_ITEM = {
  id: 'seo-mensual',
  nombre: 'SEO Mensual',
  categoria: 'SEO',
  precioBaseUsd: '600',
  billingModelDefault: 'MENSUAL',
  activo: true,
};

describe('ServiceCatalog API', () => {
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

  describe('GET /api/v1/service-catalog', () => {
    it('returns 401 without token', () =>
      request(app.getHttpServer()).get('/api/v1/service-catalog').expect(401));

    it('returns catalog items', async () => {
      prisma.serviceCatalogItem.findMany.mockResolvedValue([CATALOG_ITEM]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/service-catalog')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nombre).toBe('SEO Mensual');
    });

    it('filters by categoria query param', async () => {
      prisma.serviceCatalogItem.findMany.mockResolvedValue([CATALOG_ITEM]);

      await request(app.getHttpServer())
        .get('/api/v1/service-catalog?categoria=SEO')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(200);

      const whereArg = prisma.serviceCatalogItem.findMany.mock.calls[0][0].where;
      expect(whereArg.categoria).toBe('SEO');
    });
  });

  describe('GET /api/v1/service-catalog/:id', () => {
    it('returns single item', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(CATALOG_ITEM);

      const res = await request(app.getHttpServer())
        .get('/api/v1/service-catalog/seo-mensual')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(200);

      expect(res.body.data.nombre).toBe('SEO Mensual');
    });

    it('returns 404 when item not found', async () => {
      prisma.serviceCatalogItem.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/service-catalog/missing')
        .set('Authorization', `Bearer ${humanToken()}`)
        .expect(404);
    });
  });
});
