/**
 * Real-channel smoke: pulse-notify (adapter=webhook, then adapter=file) over HTTP.
 * Local receiver collects webhook POSTs; file sink writes JSONL. Prints delivery records.
 */
import { mkdtemp, readFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createMockBus } from '../src/bus/mock-consumer.js';
import { loadSettings } from '../src/config.js';
import { createNotifyServer } from '../src/server.js';

const alert = {
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

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve((server.address() as { port: number }).port));
  });
}

async function consume(env: Record<string, string>) {
  const settings = loadSettings({ ...process.env, ...env, PULSE_NOTIFY_ACK_MODE: 'log' });
  const server = createNotifyServer({
    settings,
    bus: createMockBus(settings.alertsTopic),
    startedAt: new Date().toISOString(),
  });
  const port = await listen(server);
  const res = await fetch(`http://127.0.0.1:${port}/internal/consume`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(alert),
  });
  const body = (await res.json()) as { deliveries: { channel: string; status: string }[] };
  await new Promise((r) => server.close(r));
  if (res.status !== 202 || body.deliveries.some((d) => d.status !== 'sent')) {
    throw new Error(`consume failed ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function main(): Promise<void> {
  const received: unknown[] = [];
  const hook = http.createServer((req, res) => {
    const c: Buffer[] = [];
    req.on('data', (d) => c.push(d));
    req.on('end', () => {
      received.push(JSON.parse(Buffer.concat(c).toString()));
      res.writeHead(200).end('ok');
    });
  });
  const hookPort = await listen(hook);
  const webhook = await consume({
    PULSE_NOTIFY_ADAPTER: 'webhook',
    PULSE_NOTIFY_WEBHOOK_URL: `http://127.0.0.1:${hookPort}/vp-hook`,
  });
  await new Promise((r) => hook.close(r));

  const file = path.join(await mkdtemp(path.join(os.tmpdir(), 'vp-notify-')), 'alerts.jsonl');
  const fileRes = await consume({ PULSE_NOTIFY_ADAPTER: 'file', PULSE_NOTIFY_FILE_PATH: file });
  const lines = (await readFile(file, 'utf8')).trim().split('\n').map((l) => JSON.parse(l));

  if (received.length !== 2 || lines.length !== 2) {
    throw new Error(`expected 2+2 records, got webhook=${received.length} file=${lines.length}`);
  }
  console.log(JSON.stringify({ ok: true, webhook: { response: webhook, received }, file: { path: file, response: fileRes, lines } }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
