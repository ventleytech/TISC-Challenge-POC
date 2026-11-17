import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { DEFAULT_ALERT_POLICY } from '../src/defaults.js';
import { loadAlertPolicy, parseAlertPolicyJson } from '../src/load.js';

describe('loadAlertPolicy', () => {
  it('loads package default JSON when env empty', () => {
    const policy = loadAlertPolicy({ env: {} });
    assert.equal(policy.version, 1);
    assert.equal(policy.channels.push.enabled, true);
    assert.equal(policy.channels.sms.adapter, 'mock');
    assert.equal(policy.channels.email.enabled, false);
    assert.deepEqual(policy.defaultChannels, ['push', 'sms']);
    assert.equal(policy.slaMinutes.critical, 15);
    assert.equal(policy.slaMinutes.info, 10080);
  });

  it('applies env overlays on top of base', () => {
    const policy = loadAlertPolicy({
      base: structuredClone(DEFAULT_ALERT_POLICY),
      env: {
        VP_ALERT_CHANNEL_EMAIL_ENABLED: 'true',
        VP_ALERT_CHANNEL_SMS_ENABLED: 'false',
        VP_ALERT_DEFAULT_CHANNELS: 'push,email',
        VP_ALERT_SLA_CRITICAL_MIN: '30',
        VP_ALERT_CHANNEL_ADAPTER: 'mock',
      },
    });
    assert.equal(policy.channels.email.enabled, true);
    assert.equal(policy.channels.sms.enabled, false);
    assert.deepEqual(policy.defaultChannels, ['push', 'email']);
    assert.equal(policy.slaMinutes.critical, 30);
    assert.equal(policy.slaMinutes.high, 60);
  });

  it('loads custom JSON path then overlays env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vp-alert-policy-'));
    const path = join(dir, 'custom.json');
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        channels: {
          push: { enabled: false, adapter: 'off' },
          sms: { enabled: true, adapter: 'mock' },
          email: { enabled: true, adapter: 'mock' },
        },
        defaultChannels: ['sms'],
        slaMinutes: {
          critical: 10,
          high: 20,
          medium: 30,
          low: 40,
          info: 50,
        },
      }),
    );
    const policy = loadAlertPolicy({
      path,
      env: { VP_ALERT_SLA_HIGH_MIN: '25' },
    });
    assert.equal(policy.channels.push.adapter, 'off');
    assert.deepEqual(policy.defaultChannels, ['sms']);
    assert.equal(policy.slaMinutes.critical, 10);
    assert.equal(policy.slaMinutes.high, 25);
  });

  it('rejects invalid JSON shape', () => {
    assert.throws(() => parseAlertPolicyJson({ channels: {} }), /Missing channels/);
  });
});
