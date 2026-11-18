import http from 'node:http';
import { buildEvidenceKey } from './evidence-id.js';
import type { HttpSettings } from './http-config.js';
import { LegalHoldError, type RetentionStore } from './retention-store.js';

const OBJECTS = '/v1/objects/';
const HOLD = '/v1/legal-hold/';
const RETENTION = '/v1/retention/';

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > maxBytes) {
        reject(new HttpError(413, 'PAYLOAD_TOO_LARGE', `body exceeds ${maxBytes} bytes`));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Key = remainder of path after prefix; rejects empty / traversal. */
function keyFrom(pathname: string, prefix: string): string {
  let key: string;
  try {
    key = decodeURIComponent(pathname.slice(prefix.length)).replace(/^\/+/, '');
  } catch {
    throw new HttpError(400, 'INVALID_KEY', 'malformed key encoding');
  }
  if (!key || key.split('/').includes('..')) {
    throw new HttpError(400, 'INVALID_KEY', 'invalid object key');
  }
  return key;
}

async function requireExists(store: RetentionStore, key: string): Promise<void> {
  if (!(await store.exists(key))) {
    throw new HttpError(404, 'NOT_FOUND', `object not found: ${key}`);
  }
}

export function createStoreServer(
  store: RetentionStore,
  http_: HttpSettings,
  info: { bucket: string },
): http.Server {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const p = url.pathname;
      const m = req.method ?? 'GET';

      if (m === 'GET' && p === '/health') {
        sendJson(res, 200, {
          status: 'ok',
          service: 'pulse-store',
          backend: store.backend,
          bucket: info.bucket,
        });
        return;
      }

      // Content-addressed evidence put: key is derived, caller gets it back.
      if (m === 'POST' && p === '/v1/evidence') {
        const utilityId = url.searchParams.get('utility_id');
        const inspectionId = url.searchParams.get('inspection_id');
        if (!utilityId || !inspectionId) {
          throw new HttpError(400, 'INVALID_REQUEST', 'utility_id and inspection_id required');
        }
        const body = await readBody(req, http_.maxBodyBytes);
        if (body.length === 0) throw new HttpError(400, 'INVALID_REQUEST', 'empty body');
        const key = buildEvidenceKey(utilityId, inspectionId, body, url.searchParams.get('ext') ?? 'jpg');
        const put = await store.put(key, body, req.headers['content-type']);
        sendJson(res, 201, { key: put.key });
        return;
      }

      if (p.startsWith(OBJECTS)) {
        const key = keyFrom(p, OBJECTS);
        if (m === 'PUT') {
          const body = await readBody(req, http_.maxBodyBytes);
          const legalHold = url.searchParams.get('legal_hold') === 'true' ? true : undefined;
          const put = await store.put(key, body, req.headers['content-type'], { legalHold });
          sendJson(res, 201, { key: put.key });
          return;
        }
        if (m === 'GET' || m === 'HEAD') {
          await requireExists(store, key);
          const got = await store.get(key);
          res.writeHead(200, {
            'content-type': got.contentType ?? 'application/octet-stream',
            'content-length': got.body.length,
          });
          res.end(m === 'HEAD' ? undefined : got.body);
          return;
        }
        if (m === 'DELETE') {
          await requireExists(store, key);
          await store.delete(key);
          res.writeHead(204).end();
          return;
        }
      }

      if (p.startsWith(HOLD) && (m === 'PUT' || m === 'DELETE')) {
        const key = keyFrom(p, HOLD);
        await requireExists(store, key);
        const meta = await store.setLegalHold(key, m === 'PUT');
        sendJson(res, 200, { key: meta.key, legal_hold: meta.legalHold });
        return;
      }

      if (p.startsWith(RETENTION) && m === 'GET') {
        const key = keyFrom(p, RETENTION);
        await requireExists(store, key);
        let status;
        try {
          status = await store.status(key);
        } catch {
          // Object exists but predates the meta index (e.g. written straight to MinIO).
          throw new HttpError(404, 'NO_RETENTION_META', `no retention meta: ${key}`);
        }
        sendJson(res, 200, {
          key: status.key,
          created_at: status.createdAt,
          legal_hold: status.legalHold,
          tier: status.tier,
        });
        return;
      }

      throw new HttpError(404, 'NOT_FOUND', 'route not found');
    } catch (err) {
      if (err instanceof HttpError) {
        sendJson(res, err.status, { error: { code: err.code, message: err.message } });
      } else if (err instanceof LegalHoldError) {
        sendJson(res, 409, { error: { code: err.code, message: err.message } });
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[pulse-store] request failed: ${message}`);
        sendJson(res, 500, { error: { code: 'INTERNAL', message } });
      }
    }
  });
}
