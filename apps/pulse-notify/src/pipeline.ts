import { buildReceipt, sendAck, type AckResult } from './ack/receipt-hook.js';
import { consumeAlert, type MockBusState } from './bus/mock-consumer.js';
import { deliverChannels } from './channels/index.js';
import type { NotifySettings } from './config.js';
import type { DeliveryRecord, VpAlertsV1 } from './types.js';

export interface ProcessResult {
  event: VpAlertsV1;
  deliveries: DeliveryRecord[];
  ack: AckResult;
}

export async function processAlertEvent(
  settings: NotifySettings,
  bus: MockBusState,
  event: VpAlertsV1,
  fetchImpl?: typeof fetch,
): Promise<ProcessResult> {
  consumeAlert(bus, event);
  const deliveries = deliverChannels(event.alert, settings.adapter);
  const receipt = buildReceipt(event.alert.alert_id, settings.alertsTopic, deliveries);
  const ack = await sendAck(settings, receipt, fetchImpl);
  return { event, deliveries, ack };
}
