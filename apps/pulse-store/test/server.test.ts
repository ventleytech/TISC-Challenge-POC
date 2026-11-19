import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { loadSettings } from '../src/config.js';
import { createRetentionStore } from '../src/create-store.js';
import { createStoreServer } from '../src/server.js';

describe('store HTTP server (fs backend)', () => {
  let base = '';
  let server: ReturnType<typeof createStoreServer>;

  before(async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pulse-store-http-'));
    const settings = loadSettings({ PULSE_STORE_BACKEND: 'fs', PULSE_STORE_FS_ROOT: root });
    server = createStoreServer(
      createRetentionStore(settings),
      { host: '127.0.0.1', port: 0, maxBodyBytes: 1024 },
      { bucket: settings.bucket },
    );
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => new Promise((r) => server.close(() => r(undefined))));

  it('health', async () => {
    const r = await fetch(`${base}/health`);
    assert.equal(r.status, 200);
    assert.equal(((await r.json()) as { backend: string }).backend, 'fs');
  });

  it('put/get/delete + legal hold blocks delete', async () => {
    const k = `${base}/v1/objects/util_a/insp_1/evidence/ev_x.txt`;
    assert.equal((await fetch(k, { method: 'PUT', body: 'hello' })).status, 201);
    assert.equal(await (await fetch(k)).text(), 'hello');

    const hold = `${base}/v1/legal-hold/util_a/insp_1/evidence/ev_x.txt`;
    assert.equal((await fetch(hold, { method: 'PUT' })).status, 200);
    const ret = (await (await fetch(`${base}/v1/retention/util_a/insp_1/evidence/ev_x.txt`)).json()) as {
      legal_hold: boolean;
      tier: string;
    };
    assert.deepEqual([ret.legal_hold, ret.tier], [true, 'hot']);
    assert.equal((await fetch(k, { method: 'DELETE' })).status, 409);

    await fetch(hold, { method: 'DELETE' });
    assert.equal((await fetch(k, { method: 'DELETE' })).status, 204);
    assert.equal((await fetch(k)).status, 404);
  });

  it('evidence POST derives content-addressed key', async () => {
    const r = await fetch(`${base}/v1/evidence?utility_id=util_a&inspection_id=insp_2&ext=png`, {
      method: 'POST',
      body: 'img',
    });
    assert.equal(r.status, 201);
    const { key } = (await r.json()) as { key: string };
    assert.match(key, /^util_a\/insp_insp_2\/evidence\/ev_[0-9a-f]{12}\.png$/);
  });

  it('rejects traversal and oversize', async () => {
    assert.equal((await fetch(`${base}/v1/objects/a%2F..%2Fb`, { method: 'PUT', body: 'x' })).status, 400);
    assert.equal((await fetch(`${base}/v1/objects/big`, { method: 'PUT', body: 'x'.repeat(2000) }).catch(() => ({ status: 413 }))).status, 413);
  });
});
