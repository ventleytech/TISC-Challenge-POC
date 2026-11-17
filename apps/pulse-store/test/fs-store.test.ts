import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { buildEvidenceKey } from '../src/evidence-id.js';
import { FsObjectStore } from '../src/fs-store.js';

describe('FsObjectStore', () => {
  it('put/get roundtrip under inspection-scoped key', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pulse-store-'));
    const store = new FsObjectStore(root, 'voltpulse-evidence');
    const body = Buffer.from('evidence-bytes');
    const key = buildEvidenceKey('util_a', 'insp99', body, 'png');

    const put = await store.put(key, body, 'image/png');
    assert.equal(put.backend, 'fs');
    assert.equal(put.key, key);
    assert.equal(await store.exists(key), true);

    const got = await store.get(key);
    assert.equal(got.body.toString(), 'evidence-bytes');
    assert.equal(got.backend, 'fs');
  });
});
