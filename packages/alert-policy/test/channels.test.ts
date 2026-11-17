import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getChannelConfig,
  isChannelEnabled,
  listEnabledChannels,
  resolveChannels,
} from '../src/channels.js';
import { DEFAULT_ALERT_POLICY } from '../src/defaults.js';
import type { AlertPolicy } from '../src/types.js';

function withEmailOn(base: AlertPolicy = DEFAULT_ALERT_POLICY): AlertPolicy {
  return {
    ...structuredClone(base),
    channels: {
      ...base.channels,
      email: { enabled: true, adapter: 'mock' },
    },
    defaultChannels: ['push', 'sms', 'email'],
  };
}

describe('channels', () => {
  it('reports mock push/sms enabled by default', () => {
    const p = DEFAULT_ALERT_POLICY;
    assert.equal(getChannelConfig(p, 'push').adapter, 'mock');
    assert.equal(isChannelEnabled(p, 'push'), true);
    assert.equal(isChannelEnabled(p, 'sms'), true);
    assert.equal(isChannelEnabled(p, 'email'), false);
    assert.deepEqual(listEnabledChannels(p), ['push', 'sms']);
  });

  it('resolveChannels uses defaults and drops disabled', () => {
    assert.deepEqual(resolveChannels(DEFAULT_ALERT_POLICY), ['push', 'sms']);
    assert.deepEqual(resolveChannels(DEFAULT_ALERT_POLICY, ['email', 'push']), ['push']);
  });

  it('resolveChannels keeps requested enabled set', () => {
    const p = withEmailOn();
    assert.deepEqual(resolveChannels(p, ['email']), ['email']);
    assert.deepEqual(resolveChannels(p), ['push', 'sms', 'email']);
  });

  it('treats adapter=off as disabled', () => {
    const p: AlertPolicy = {
      ...structuredClone(DEFAULT_ALERT_POLICY),
      channels: {
        push: { enabled: true, adapter: 'off' },
        sms: { enabled: true, adapter: 'mock' },
        email: { enabled: false, adapter: 'mock' },
      },
    };
    assert.equal(isChannelEnabled(p, 'push'), false);
    assert.deepEqual(resolveChannels(p), ['sms']);
  });
});
