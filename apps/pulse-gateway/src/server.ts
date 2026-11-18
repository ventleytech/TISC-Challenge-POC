import http from 'node:http';
import type { GatewaySettings } from './config.js';
import { buildPerceptionHandoff } from './handoff.js';
import {
  FileSessionRegistry,
  SessionNotFoundError,
  SessionValidationError,
} from './registry.js';
import { buildSyntheticDetect, FrameValidationError } from './detect-sink.js';
import type { DetectSink, SyntheticFrameInput } from './detect-sink.js';
import type { RegisterSessionInput, StreamProtocol } from './types.js';

export interface GatewayRuntime {
  settings: GatewaySettings;
  registry: FileSessionRegistry;
  startedAt: string;
  /** Null/undefined → frame publishing disabled (PULSE_GATEWAY_DETECT_SINK=off). */
  detectSink?: DetectSink | null;
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
        reject(new SessionValidationError('invalid JSON'));
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

function parseRegisterBody(raw: unknown): RegisterSessionInput {
  if (!raw || typeof raw !== 'object') {
    throw new SessionValidationError('body must be an object');
  }
  const body = raw as Record<string, unknown>;
  const protocol = body.protocol as StreamProtocol;
  return {
    name: String(body.name ?? ''),
    protocol,
    path: body.path === undefined ? undefined : String(body.path),
    url: body.url === undefined ? undefined : String(body.url),
  };
}

export function createGatewayServer(runtime: GatewayRuntime): http.Server {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const path = url.pathname;

      if (req.method === 'GET' && path === '/health') {
        const sessions = await runtime.registry.list();
        sendJson(res, 200, {
          status: 'ok',
          service: 'pulse-gateway',
          plane: 'media',
          rtspPort: runtime.settings.rtspPort,
          rtmpPort: runtime.settings.rtmpPort,
          publicHost: runtime.settings.publicHost,
          sessionCount: sessions.length,
          pullTargets: runtime.settings.pullUrls.length,
          detectSink: runtime.detectSink?.mode ?? 'off',
          startedAt: runtime.startedAt,
        });
        return;
      }

      if (req.method === 'GET' && path === '/metrics') {
        const sessions = await runtime.registry.list();
        const body = [
          '# HELP vp_up VoltPulse process up',
          '# TYPE vp_up gauge',
          'vp_up{service="pulse-gateway",plane="media"} 1',
          '# HELP vp_gateway_sessions Sessions registered',
          '# TYPE vp_gateway_sessions gauge',
          `vp_gateway_sessions ${sessions.length}`,
          '',
        ].join('\n');
        res.writeHead(200, {
          'content-type': 'text/plain; version=0.0.4; charset=utf-8',
        });
        res.end(body);
        return;
      }

      if (req.method === 'POST' && path === '/sessions') {
        const input = parseRegisterBody(await readJson(req));
        const session = await runtime.registry.register(input);
        sendJson(res, 201, { id: session.id, session });
        return;
      }

      if (req.method === 'GET' && path === '/sessions') {
        const sessions = await runtime.registry.list();
        sendJson(res, 200, { items: sessions });
        return;
      }

      if (req.method === 'GET' && path === '/pull/targets') {
        sendJson(res, 200, { items: runtime.settings.pullUrls });
        return;
      }

      if (req.method === 'POST' && path === '/pull/sync') {
        const items = [];
        for (const pullUrl of runtime.settings.pullUrls) {
          const { session, created } = await runtime.registry.registerPullUrl(pullUrl);
          items.push({ id: session.id, pullUrl, created });
        }
        sendJson(res, 200, { items });
        return;
      }

      const framesMatch = path.match(/^\/sessions\/([^/]+)\/frames$/);
      if (req.method === 'POST' && framesMatch) {
        const session = await runtime.registry.get(decodeURIComponent(framesMatch[1]));
        if (!runtime.detectSink) {
          sendJson(res, 409, {
            error: 'detect_sink_disabled',
            message: 'set PULSE_GATEWAY_DETECT_SINK=file|kafka',
          });
          return;
        }
        const body = await readJson(req);
        if (!body || typeof body !== 'object') {
          throw new FrameValidationError('body must be an object');
        }
        const event = buildSyntheticDetect(body as SyntheticFrameInput, session.name);
        await runtime.detectSink.publish(event);
        sendJson(res, 202, {
          id: event.event_id,
          inspection_id: event.inspection_id,
          sink: runtime.detectSink.mode,
        });
        return;
      }

      const sessionMatch = path.match(/^\/sessions\/([^/]+)$/);
      if (req.method === 'GET' && sessionMatch) {
        const session = await runtime.registry.get(decodeURIComponent(sessionMatch[1]));
        sendJson(res, 200, session);
        return;
      }

      const handoffMatch = path.match(/^\/sessions\/([^/]+)\/handoff$/);
      if (req.method === 'GET' && handoffMatch) {
        const session = await runtime.registry.get(decodeURIComponent(handoffMatch[1]));
        sendJson(res, 200, buildPerceptionHandoff(session));
        return;
      }

      sendJson(res, 404, { error: 'not_found' });
    } catch (err) {
      if (err instanceof SessionValidationError || err instanceof FrameValidationError) {
        sendJson(res, 400, { error: 'validation_error', message: err.message });
        return;
      }
      if (err instanceof SessionNotFoundError) {
        sendJson(res, 404, { error: 'not_found', message: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[pulse-gateway] request error: ${message}`);
      sendJson(res, 500, { error: 'internal_error', message });
    }
  });
}
