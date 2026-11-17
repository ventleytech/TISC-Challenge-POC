import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSettings } from '../src/config.js';

describe('loadSettings', () => {
  it('defaults to fs backend with template-shaped keys', () => {
    const s = loadSettings({
      PULSE_STORE_ENDPOINT: 'http://pulse-store:9000',
      PULSE_STORE_BUCKET: 'voltpulse-evidence',
      PULSE_STORE_ACCESS_KEY: 'minioadmin',
      PULSE_STORE_SECRET_KEY: 'change-me-local-only',
    });
    assert.equal(s.backend, 'fs');
    assert.equal(s.bucket, 'voltpulse-evidence');
    assert.equal(s.endpoint, 'http://pulse-store:9000');
    assert.equal(s.accessKey, 'minioadmin');
    assert.equal(s.hotDays, 30);
    assert.equal(s.warmDays, 365);
  });

  it('loads retention days from env', () => {
    const s = loadSettings({
      PULSE_STORE_HOT_DAYS: '7',
      PULSE_STORE_WARM_DAYS: '90',
    });
    assert.equal(s.hotDays, 7);
    assert.equal(s.warmDays, 90);
  });

  it('rejects warm < hot', () => {
    assert.throws(
      () => loadSettings({ PULSE_STORE_HOT_DAYS: '30', PULSE_STORE_WARM_DAYS: '7' }),
      /WARM_DAYS/,
    );
  });

  it('accepts minio backend', () => {
    const s = loadSettings({ PULSE_STORE_BACKEND: 'minio' });
    assert.equal(s.backend, 'minio');
  });

  it('rejects unknown backend', () => {
    assert.throws(() => loadSettings({ PULSE_STORE_BACKEND: 'redis' }), /PULSE_STORE_BACKEND/);
  });
});
