import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { loadSettings } from './../src/config/settings';
import { mountOpenApi } from './../src/openapi/mount-openapi';

const UTILITY = '00000000-0000-4000-8000-000000000001';

describe('pulse-api (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
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
  });

  it('inspection create → list → get', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/inspections')
      .send({ utility_id: UTILITY })
      .expect(201);

    expect(created.body.id).toBeTruthy();

    const listed = await request(app.getHttpServer())
      .get(`/api/v1/inspections?utility_id=${UTILITY}`)
      .expect(200);

    expect(listed.body.items).toHaveLength(1);

    await request(app.getHttpServer())
      .get(`/api/v1/inspections/${created.body.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('planned');
        expect(res.body.utility_id).toBe(UTILITY);
      });
  });

  it('asset + alert stubs', async () => {
    const asset = await request(app.getHttpServer())
      .post('/api/v1/assets')
      .send({ utility_id: UTILITY, name: 'Tower-A1', criticality: 'high' })
      .expect(201);

    const alert = await request(app.getHttpServer())
      .post('/api/v1/alerts')
      .send({
        utility_id: UTILITY,
        finding_id: '00000000-0000-4000-8000-0000000000aa',
        severity: 'high',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/assets/${asset.body.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/alerts/${alert.body.id}`)
      .expect(200);
  });
});
