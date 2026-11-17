import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { loadSettings } from '../src/config.js';
import { buildPerceptionHandoff } from '../src/handoff.js';
import { FileSessionRegistry, SessionValidationError } from '../src/registry.js';
import { buildPullUrl } from '../src/urls.js';

test('loadSettings reads gateway ports from env', () => {
  const settings = loadSettings({
    PULSE_GATEWAY_HOST: '127.0.0.1',
    PULSE_GATEWAY_PORT: '3021',
    PULSE_GATEWAY_PUBLIC_HOST: 'media.local',
    PULSE_GATEWAY_RTSP_PORT: '8555',
    PULSE_GATEWAY_RTMP_PORT: '1936',
    PULSE_GATEWAY_SESSION_DIR: '/tmp/vp-sessions',
  });
  assert.equal(settings.port, 3021);
  assert.equal(settings.publicHost, 'media.local');
  assert.equal(settings.rtspPort, 8555);
  assert.equal(settings.rtmpPort, 1936);
  assert.equal(settings.sessionDir, '/tmp/vp-sessions');
});

test('buildPullUrl constructs rtsp and rtmp URLs', () => {
  const settings = loadSettings({
    PULSE_GATEWAY_PUBLIC_HOST: '127.0.0.1',
    PULSE_GATEWAY_RTSP_PORT: '8554',
    PULSE_GATEWAY_RTMP_PORT: '1935',
  });
  assert.equal(
    buildPullUrl(settings, 'rtsp', 'live/feeder-1'),
    'rtsp://127.0.0.1:8554/live/feeder-1',
  );
  assert.equal(
    buildPullUrl(settings, 'rtmp', 'live/feeder-1'),
    'rtmp://127.0.0.1:1935/live/feeder-1',
  );
});

test('FileSessionRegistry persists RTSP session and handoff targets grid-perception', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vp-gw-'));
  try {
    const settings = loadSettings({
      PULSE_GATEWAY_PUBLIC_HOST: '127.0.0.1',
      PULSE_GATEWAY_RTSP_PORT: '8554',
      PULSE_GATEWAY_SESSION_DIR: dir,
    });
    const registry = new FileSessionRegistry(settings);
    const session = await registry.register({
      name: 'feeder-demo',
      protocol: 'rtsp',
      path: 'live/feeder-demo',
    });
    assert.equal(session.pullUrl, 'rtsp://127.0.0.1:8554/live/feeder-demo');
    assert.equal(session.status, 'registered');

    const listed = await registry.list();
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, session.id);

    const handoff = buildPerceptionHandoff(session);
    assert.equal(handoff.service, 'pulse-gateway');
    assert.equal(handoff.target, 'grid-perception');
    assert.equal(handoff.pullUrl, session.pullUrl);
    assert.match(handoff.notes, /grid-perception/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('FileSessionRegistry rejects bad protocol', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vp-gw-'));
  try {
    const settings = loadSettings({ PULSE_GATEWAY_SESSION_DIR: dir });
    const registry = new FileSessionRegistry(settings);
    await assert.rejects(
      () =>
        registry.register({
          name: 'x',
          protocol: 'http' as 'rtsp',
          path: 'live/x',
        }),
      (err: unknown) => err instanceof SessionValidationError,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
