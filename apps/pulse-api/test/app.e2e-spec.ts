import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { loadSettings } from './../src/config/settings';
import { mountOpenApi } from './../src/openapi/mount-openapi';

const UTILITY = '00000000-0000-4000-8000-000000000001';
const OTHER = '00000000-0000-4000-8000-000000000002';
const KEYS = [
  'dev-platform:platform_admin:',
  `dev-operator:energy_operator:${UTILITY}`,
  `dev-viewer:viewer:${UTILITY}`,
].join(';');

describe('pulse-api (e2e)', () => {
  let app: INestApplication<App>;
  const prevAuth = process.env.PULSE_AUTH_ENABLED;
  const prevKeys = process.env.PULSE_AUTH_STUB_KEYS;

  beforeAll(() => {
    process.env.PULSE_AUTH_ENABLED = 'true';
    process.env.PULSE_AUTH_STUB_KEYS = KEYS;
  });

  afterAll(() => {
    if (prevAuth === undefined) {
      delete process.env.PULSE_AUTH_ENABLED;
    } else {
      process.env.PULSE_AUTH_ENABLED = prevAuth;
    }
    if (prevKeys === undefined) {
      delete process.env.PULSE_AUTH_STUB_KEYS;
    } else {
      process.env.PULSE_AUTH_STUB_KEYS = prevKeys;
    }
  });

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

  it('GET /health → 200 without credentials', () => {
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

  it('rejects unauthenticated inspections', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/inspections?utility_id=${UTILITY}`)
      .expect(401);
  });

  it('GET /api/v1/me via Bearer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer dev-operator')
      .expect(200);
    expect(res.body).toMatchObject({
      role: 'energy_operator',
      utility_id: UTILITY,
      auth_enabled: true,
    });
  });

  it('inspection create → list → get with X-API-Key', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/inspections')
      .set('X-API-Key', 'dev-operator')
      .send({ utility_id: UTILITY })
      .expect(201);

    expect(created.body.id).toBeTruthy();

    const listed = await request(app.getHttpServer())
      .get(`/api/v1/inspections?utility_id=${UTILITY}`)
      .set('X-API-Key', 'dev-operator')
      .expect(200);

    expect(listed.body.items).toHaveLength(1);

    await request(app.getHttpServer())
      .get(`/api/v1/inspections/${created.body.id}`)
      .set('X-API-Key', 'dev-operator')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('planned');
        expect(res.body.utility_id).toBe(UTILITY);
      });
  });

  it('viewer cannot POST; can GET', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/inspections')
      .set('X-API-Key', 'dev-viewer')
      .send({ utility_id: UTILITY })
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/v1/inspections?utility_id=${UTILITY}`)
      .set('X-API-Key', 'dev-viewer')
      .expect(200);
  });

  it('operator cannot list foreign utility_id', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/inspections?utility_id=${OTHER}`)
      .set('X-API-Key', 'dev-operator')
      .expect(403);
  });

  it('platform_admin may list any utility', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/inspections?utility_id=${OTHER}`)
      .set('X-API-Key', 'dev-platform')
      .expect(200);
  });

  it('asset + alert stubs with auth', async () => {
    const asset = await request(app.getHttpServer())
      .post('/api/v1/assets')
      .set('Authorization', 'Bearer dev-operator')
      .send({ utility_id: UTILITY, name: 'Tower-A1', criticality: 'high' })
      .expect(201);

    const alert = await request(app.getHttpServer())
      .post('/api/v1/alerts')
      .set('Authorization', 'Bearer dev-operator')
      .send({
        utility_id: UTILITY,
        finding_id: '00000000-0000-4000-8000-0000000000aa',
        severity: 'high',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/assets/${asset.body.id}`)
      .set('X-API-Key', 'dev-operator')
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/alerts/${alert.body.id}`)
      .set('X-API-Key', 'dev-operator')
      .expect(200);
  });
});
