/**
 * Boots pulse-gateway on an ephemeral port, registers RTSP session, checks health + handoff.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadSettings } from '../src/config.js';
import { FileSessionRegistry } from '../src/registry.js';
import { createGatewayServer } from '../src/server.js';

async function main(): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'vp-gw-smoke-'));
  const settings = loadSettings({
    ...process.env,
    PULSE_GATEWAY_HOST: '127.0.0.1',
    PULSE_GATEWAY_PORT: '3020',
    PULSE_GATEWAY_PUBLIC_HOST: '127.0.0.1',
    PULSE_GATEWAY_RTSP_PORT: '8554',
    PULSE_GATEWAY_RTMP_PORT: '1935',
    PULSE_GATEWAY_SESSION_DIR: dir,
  });

  const registry = new FileSessionRegistry(settings);
  const runtime = { settings, registry, startedAt: new Date().toISOString() };
  const server = createGatewayServer(runtime);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('failed to bind ephemeral port');
  }
  const base = `http://127.0.0.1:${addr.port}`;

  try {
    const healthRes = await fetch(`${base}/health`);
    const health = (await healthRes.json()) as {
      status: string;
      service: string;
      rtspPort: number;
    };
    if (healthRes.status !== 200 || health.status !== 'ok' || health.service !== 'pulse-gateway') {
      throw new Error(`health failed: ${JSON.stringify(health)}`);
    }

    const createRes = await fetch(`${base}/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'smoke-feeder',
        protocol: 'rtsp',
        path: 'live/smoke-feeder',
      }),
    });
    const created = (await createRes.json()) as {
      id: string;
      session: { pullUrl: string; protocol: string };
    };
    if (createRes.status !== 201) {
      throw new Error(`create status ${createRes.status}: ${JSON.stringify(created)}`);
    }
    if (created.session.pullUrl !== 'rtsp://127.0.0.1:8554/live/smoke-feeder') {
      throw new Error(`unexpected pullUrl: ${created.session.pullUrl}`);
    }

    const handoffRes = await fetch(`${base}/sessions/${created.id}/handoff`);
    const handoff = (await handoffRes.json()) as {
      target: string;
      service: string;
      pullUrl: string;
    };
    if (handoffRes.status !== 200 || handoff.target !== 'grid-perception') {
      throw new Error(`handoff failed: ${JSON.stringify(handoff)}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          base,
          health,
          session: { id: created.id, pullUrl: created.session.pullUrl },
          handoff,
        },
        null,
        2,
      ),
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
