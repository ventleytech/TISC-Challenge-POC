import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { PulseApiSettings } from '../config/settings';
import { loadEvidenceSettings } from '../config/settings';
import { EvidenceService } from './evidence.service';
import type { EvidenceCreate } from './evidence.types';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function svc(env: NodeJS.ProcessEnv = {}): EvidenceService {
  const settings = {
    port: 3000,
    databaseUrl: null,
    openapiPath: '/tmp/x',
    openapiUrlPath: '/api/openapi.yaml',
    swaggerPath: '/api/docs',
    authEnabled: false,
    authPrincipals: new Map(),
    evidence: loadEvidenceSettings({
      PULSE_EVIDENCE_SIGNING_SECRET: 's3cret',
      ...env,
    }),
  } as PulseApiSettings;
  return new EvidenceService(settings);
}

const body = (over: Partial<EvidenceCreate> = {}): EvidenceCreate => ({
  utility_id: 'util-demo-01',
  inspection_id: 'insp-1',
  kind: 'crop',
  content_type: 'image/png',
  data_base64: PNG_1PX.toString('base64'),
  class_id: 'corrosion',
  confidence: 0.91,
  bbox: [10, 20, 30, 40],
  ...over,
});

function parseSigned(path: string) {
  const u = new URL(path, 'http://x');
  return { exp: u.searchParams.get('exp')!, sig: u.searchParams.get('sig')! };
}

describe('EvidenceService', () => {
  it('puts crop, lists, gets, and round-trips bytes via signed url', async () => {
    const s = svc();
    const meta = await s.create(body());
    expect(meta.id).toMatch(/^ev_[0-9a-f]{12}$/);
    expect(meta.object_key).toBe(
      `util-demo-01/insp_insp-1/evidence/${meta.id}.png`,
    );

    const { items } = { items: await s.list({ utilityId: 'util-demo-01' }) };
    expect(items).toHaveLength(1);
    expect(await s.list({ utilityId: 'other' })).toHaveLength(0);

    const view = await s.getView(meta.id);
    const { exp, sig } = parseSigned(view.content_path);
    const out = await s.readSigned(meta.id, exp, sig);
    expect(out.contentType).toBe('image/png');
    expect(out.body.equals(PNG_1PX)).toBe(true);
  });

  it('same bytes, different inspection → different ids', async () => {
    const s = svc();
    const a = await s.create(body());
    const b = await s.create(body({ inspection_id: 'insp-2' }));
    expect(a.id).not.toBe(b.id);
  });

  it('rejects tampered, missing, and expired signatures', async () => {
    const s = svc({ PULSE_EVIDENCE_URL_TTL_SECONDS: '1' });
    const meta = await s.create(body());
    const { exp, sig } = parseSigned((await s.getView(meta.id)).content_path);
    await expect(s.readSigned(meta.id, exp, 'ab'.repeat(32))).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(s.readSigned(meta.id, undefined, undefined)).rejects.toThrow(
      UnauthorizedException,
    );
    const old = String(Math.floor(Date.now() / 1000) - 5);
    await expect(s.readSigned(meta.id, old, sig)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('validates input and size', async () => {
    const s = svc({ PULSE_EVIDENCE_MAX_BYTES: '16' });
    await expect(s.create(body({ kind: 'nope' as never }))).rejects.toThrow(
      BadRequestException,
    );
    await expect(s.create(body({ content_type: 'text/html' }))).rejects.toThrow(
      BadRequestException,
    );
    await expect(s.create(body({ class_id: 'ufo' as never }))).rejects.toThrow(
      BadRequestException,
    );
    await expect(s.create(body({ confidence: 2 }))).rejects.toThrow(
      BadRequestException,
    );
    await expect(s.create(body({ utility_id: '../x' }))).rejects.toThrow(
      BadRequestException,
    );
    await expect(s.create(body())).rejects.toThrow(/MAX_BYTES/);
  });

  it('404s unknown id', async () => {
    await expect(svc().getView('ev_000000000000')).rejects.toThrow(
      NotFoundException,
    );
  });
});
