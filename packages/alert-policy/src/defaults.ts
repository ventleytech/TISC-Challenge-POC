import type { AlertPolicy } from './types.js';

/** Built-in Demo Day defaults (M05 mock channels + M06 SLA minutes). */
export const DEFAULT_ALERT_POLICY: AlertPolicy = {
  version: 1,
  channels: {
    push: { enabled: true, adapter: 'mock' },
    sms: { enabled: true, adapter: 'mock' },
    email: { enabled: false, adapter: 'mock' },
  },
  defaultChannels: ['push', 'sms'],
  slaMinutes: {
    critical: 15,
    high: 60,
    medium: 240,
    low: 1440,
    info: 10080,
  },
};
