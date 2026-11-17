import http from 'node:http';
import { AlertValidationError, parseVpAlertsV1, type MockBusState } from './bus/mock-consumer.js';
import type { NotifySettings } from './config.js';
import { processAlertEvent } from './pipeline.js';

export interface NotifyRuntime {
  settings: NotifySettings;
  bus: MockBusState;
  startedAt: string;
}

function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new AlertValidationError('invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

export function createNotifyServer(runtime: NotifyRuntime): http.Server {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const path = url.pathname;

      if (req.method === 'GET' && path === '/health') {
        sendJson(res, 200, {
          status: 'ok',
          service: 'pulse-notify',
          topic: runtime.settings.alertsTopic,
          adapter: runtime.settings.adapter,
          ackMode: runtime.settings.ackMode,
          consumed: runtime.bus.consumed.length,
          startedAt: runtime.startedAt,
        });
        return;
      }

      // Mock Kafka inject: POST vp.alerts.v1 payload as if consumed from bus
      if (req.method === 'POST' && path === '/internal/consume') {
        const raw = await readJson(req);
        const event = parseVpAlertsV1(raw);
        const result = await processAlertEvent(runtime.settings, runtime.bus, event);
        sendJson(res, 202, {
          id: result.event.alert.alert_id,
          topic: runtime.settings.alertsTopic,
          deliveries: result.deliveries.map((d) => ({
            channel: d.channel,
            status: d.status,
          })),
          ack: { mode: result.ack.mode, ok: result.ack.ok },
        });
        return;
      }

      if (req.method === 'GET' && path === '/internal/consumed') {
        sendJson(res, 200, {
          topic: runtime.bus.topic,
          items: runtime.bus.consumed,
        });
        return;
      }

      sendJson(res, 404, { error: 'not_found' });
    } catch (err) {
      if (err instanceof AlertValidationError) {
        sendJson(res, 400, { error: 'validation_error', message: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[pulse-notify] request error: ${message}`);
      sendJson(res, 500, { error: 'internal_error', message });
    }
  });
}
