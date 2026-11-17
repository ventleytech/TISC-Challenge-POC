import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { loadSettings } from './../src/config/settings';
import { mountOpenApi } from './../src/openapi/mount-openapi';

describe('pulse-api (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    mountOpenApi(app, loadSettings());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health → 200', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'pulse-api' });
  });

  it('GET /api/openapi.yaml mounts VoltPulse contract paths', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/openapi.yaml')
      .expect(200);

    expect(res.text).toMatch(/title:\s*VoltPulse API/);
    expect(res.text).toMatch(/\/inspections/);
    expect(res.text).toMatch(/\/assets/);
    expect(res.text).toMatch(/\/alerts/);
    expect(res.text).toMatch(/servers:[\s\S]*url:\s*\/api\/v1/);
  });

  it('GET /api/docs serves Swagger UI', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs/').expect(200);
    expect(res.text).toMatch(/swagger-ui|Swagger UI|VoltPulse API/i);
  });
});
