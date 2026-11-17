import type { DeliveryRecord, NotifyChannel, VpAlertBody } from '../types.js';

export function deliverMockPush(alert: VpAlertBody, adapter: string): DeliveryRecord {
  const channel: NotifyChannel = 'push';
  const deliveredAt = new Date().toISOString();
  const detail = `mock-push:${alert.severity}:${alert.alert_id}`;
  // shortcut: log-only push; swap for FCM/APNs-class adapter later
  console.info(`[pulse-notify] push mock delivered alert=${alert.alert_id} severity=${alert.severity}`);
  return {
    alertId: alert.alert_id,
    channel,
    adapter,
    status: 'sent',
    detail,
    deliveredAt,
  };
}
