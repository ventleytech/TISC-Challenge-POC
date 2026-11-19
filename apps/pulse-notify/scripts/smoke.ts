/**
 * Boots pulse-notify on an ephemeral port, injects a vp.alerts.v1 event, checks health + deliveries.
 */
import { createMockBus } from '../src/bus/mock-consumer.js';
import { loadSettings } from '../src/config.js';
import { createNotifyServer } from '../src/server.js';

async function main(): Promise<void> {
  const settings = loadSettings({
    ...process.env,
    PULSE_NOTIFY_HOST: '127.0.0.1',
    PULSE_NOTIFY_PORT: '3010',
    PULSE_ALERTS_TOPIC: 'vp.alerts.v1',
    PULSE_NOTIFY_ADAPTER: 'log',
    PULSE_NOTIFY_ACK_MODE: 'log',
  });

  // Bind ephemeral port for smoke (settings.port unused for listen)
  const bus = createMockBus(settings.alertsTopic);
  const runtime = { settings, bus, startedAt: new Date().toISOString() };
  const server = createNotifyServer(runtime);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('failed to bind ephemeral port');
  }
  const base = `http://127.0.0.1:${addr.port}`;

  const healthRes = await fetch(`${base}/health`);
  const health = (await healthRes.json()) as { status: string; topic: string; service: string };
  if (healthRes.status !== 200 || health.status !== 'ok' || health.service !== 'pulse-notify') {
    throw new Error(`health failed: ${JSON.stringify(health)}`);
  }
  if (health.topic !== 'vp.alerts.v1') {
    throw new Error(`unexpected topic: ${health.topic}`);
  }

  const sample = {
    event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    occurred_at: new Date().toISOString(),
    alert: {
      alert_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      finding_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      severity: 'critical',
      sla_due_at: new Date(Date.now() + 3600_000).toISOString(),
      channels: ['push', 'sms'],
    },
  };

  const consumeRes = await fetch(`${base}/internal/consume`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sample),
  });
  const consumeBody = (await consumeRes.json()) as {
    id: string;
    topic: string;
    deliveries: { channel: string; status: string }[];
    ack: { mode: string; ok: boolean };
  };
  if (consumeRes.status !== 202) {
    throw new Error(`consume status ${consumeRes.status}: ${JSON.stringify(consumeBody)}`);
  }
  if (consumeBody.topic !== 'vp.alerts.v1') {
    throw new Error(`consume topic mismatch: ${consumeBody.topic}`);
  }
  if (consumeBody.deliveries.length < 2) {
    throw new Error(`expected sms+push deliveries, got ${JSON.stringify(consumeBody.deliveries)}`);
  }
  if (!consumeBody.ack.ok || consumeBody.ack.mode !== 'log') {
    throw new Error(`ack unexpected: ${JSON.stringify(consumeBody.ack)}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        base,
        health,
        consume: consumeBody,
      },
      null,
      2,
    ),
  );

  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
