import type { NotifySettings } from '../config.js';
import type { DeliveryRecord, NotifyChannel, VpAlertBody } from '../types.js';
import { deliverMockPush } from './mock-push.js';
import { deliverMockSms } from './mock-sms.js';
import { sinkDeliveries } from './sink.js';

const DEFAULT_CHANNELS: NotifyChannel[] = ['push', 'sms'];

export async function deliverChannels(
  alert: VpAlertBody,
  settings: NotifySettings,
  fetchImpl?: typeof fetch,
): Promise<DeliveryRecord[]> {
  const adapter = settings.adapter;
  const wanted = alert.channels?.length ? alert.channels : DEFAULT_CHANNELS;
  const out: DeliveryRecord[] = [];
  for (const channel of wanted) {
    if (channel === 'sms') {
      out.push(deliverMockSms(alert, adapter));
      continue;
    }
    if (channel === 'push') {
      out.push(deliverMockPush(alert, adapter));
      continue;
    }
    // email stubbed as skipped in mock
    out.push({
      alertId: alert.alert_id,
      channel,
      adapter,
      status: 'skipped',
      detail: 'email adapter not implemented in mock',
      deliveredAt: new Date().toISOString(),
    });
    console.info(`[pulse-notify] email skipped alert=${alert.alert_id}`);
  }
  return sinkDeliveries(settings, alert, out, fetchImpl);
}
