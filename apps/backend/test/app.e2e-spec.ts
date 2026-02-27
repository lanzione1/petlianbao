import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/wechat/login (POST)', () => {
    it('should return token with mock code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/wechat/login')
        .send({ code: 'test_code' })
        .expect(201);
    });
  });

  describe('/api/v1/services (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/services')
        .expect(401);
    });
  });

  describe('/api/v1/appointments/today (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/appointments/today')
        .expect(401);
    });
  });

  describe('/api/v1/customers (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers')
        .expect(401);
    });
  });

  describe('/api/v1/billing/today (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/billing/today')
        .expect(401);
    });
  });

  describe('/api/v1/reports/daily (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/daily')
        .expect(401);
    });
  });
});
