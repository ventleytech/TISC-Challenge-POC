import type { DeliveryRecord, NotifyChannel, VpAlertBody } from '../types.js';

export function deliverMockSms(alert: VpAlertBody, adapter: string): DeliveryRecord {
  const channel: NotifyChannel = 'sms';
  const deliveredAt = new Date().toISOString();
  const detail = `mock-sms:${alert.severity}:${alert.alert_id}`;
  // shortcut: log-only SMS; swap for real provider when PULSE_NOTIFY_ADAPTER grows
  console.info(`[pulse-notify] SMS mock delivered alert=${alert.alert_id} severity=${alert.severity}`);
  return {
    alertId: alert.alert_id,
    channel,
    adapter,
    status: 'sent',
    detail,
    deliveredAt,
  };
}
