import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { loadSettings } from '../src/config.js';
import { FileSessionRegistry } from '../src/registry.js';
import { createGatewayServer } from '../src/server.js';

async function withServer(
  fn: (base: string, registry: FileSessionRegistry) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'vp-gw-srv-'));
  const settings = loadSettings({
    PULSE_GATEWAY_HOST: '127.0.0.1',
    PULSE_GATEWAY_PUBLIC_HOST: '127.0.0.1',
    PULSE_GATEWAY_RTSP_PORT: '8554',
    PULSE_GATEWAY_RTMP_PORT: '1935',
    PULSE_GATEWAY_SESSION_DIR: dir,
  });
  const registry = new FileSessionRegistry(settings);
  const server = createGatewayServer({
    settings,
    registry,
    startedAt: new Date().toISOString(),
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('bind failed');
  }
  const base = `http://127.0.0.1:${addr.port}`;

  try {
    await fn(base, registry);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await rm(dir, { recursive: true, force: true });
  }
}

test('GET /health returns pulse-gateway ok', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    const body = (await res.json()) as { status: string; service: string; plane: string };
    assert.equal(res.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'pulse-gateway');
    assert.equal(body.plane, 'media');
  });
});

test('POST /sessions registers RTMP URL and handoff is available', async () => {
  await withServer(async (base) => {
    const create = await fetch(`${base}/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'substation-a',
        protocol: 'rtmp',
        path: 'live/substation-a',
      }),
    });
    const created = (await create.json()) as {
      id: string;
      session: { pullUrl: string };
    };
    assert.equal(create.status, 201);
    assert.equal(created.session.pullUrl, 'rtmp://127.0.0.1:1935/live/substation-a');

    const handoffRes = await fetch(`${base}/sessions/${created.id}/handoff`);
    const handoff = (await handoffRes.json()) as {
      target: string;
      pullUrl: string;
      protocol: string;
    };
    assert.equal(handoffRes.status, 200);
    assert.equal(handoff.target, 'grid-perception');
    assert.equal(handoff.protocol, 'rtmp');
    assert.equal(handoff.pullUrl, created.session.pullUrl);
  });
});
