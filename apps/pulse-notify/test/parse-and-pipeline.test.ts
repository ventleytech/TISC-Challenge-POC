import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sendAck, buildReceipt } from '../src/ack/receipt-hook.js';
import { createMockBus, parseVpAlertsV1 } from '../src/bus/mock-consumer.js';
import { loadSettings } from '../src/config.js';
import { processAlertEvent } from '../src/pipeline.js';
import type { DeliveryRecord } from '../src/types.js';

const sample = {
  event_id: '11111111-1111-1111-1111-111111111111',
  occurred_at: '2026-11-18T00:00:00.000Z',
  alert: {
    alert_id: '22222222-2222-2222-2222-222222222222',
    finding_id: '33333333-3333-3333-3333-333333333333',
    severity: 'high',
    sla_due_at: '2026-11-18T01:00:00.000Z',
    channels: ['push', 'sms'],
  },
};

test('parseVpAlertsV1 accepts contract-shaped payload', () => {
  const event = parseVpAlertsV1(sample);
  assert.equal(event.alert.alert_id, sample.alert.alert_id);
  assert.deepEqual(event.alert.channels, ['push', 'sms']);
});

test('parseVpAlertsV1 rejects bad severity', () => {
  assert.throws(
    () =>
      parseVpAlertsV1({
        ...sample,
        alert: { ...sample.alert, severity: 'urgent' },
      }),
    /severity/,
  );
});

test('processAlertEvent delivers push+sms and log-acks', async () => {
  const settings = loadSettings({
    PULSE_NOTIFY_PORT: '3010',
    PULSE_ALERTS_TOPIC: 'vp.alerts.v1',
    PULSE_NOTIFY_ADAPTER: 'log',
    PULSE_NOTIFY_ACK_MODE: 'log',
    PULSE_API_BASE_URL: 'http://127.0.0.1:3000',
  });
  const bus = createMockBus(settings.alertsTopic);
  const result = await processAlertEvent(settings, bus, parseVpAlertsV1(sample));
  assert.equal(bus.consumed.length, 1);
  assert.equal(result.deliveries.length, 2);
  assert.ok(result.deliveries.every((d: DeliveryRecord) => d.status === 'sent'));
  assert.equal(result.ack.mode, 'log');
  assert.equal(result.ack.ok, true);
  assert.equal(settings.alertsTopic, 'vp.alerts.v1');
});

test('sendAck http posts receipt URL', async () => {
  const settings = loadSettings({
    PULSE_NOTIFY_ACK_MODE: 'http',
    PULSE_API_BASE_URL: 'http://api.test',
    PULSE_NOTIFY_ACK_PATH: '/api/v1/alerts',
  });
  const deliveries: DeliveryRecord[] = [
    {
      alertId: 'a1',
      channel: 'sms',
      adapter: 'log',
      status: 'sent',
      detail: 'x',
      deliveredAt: '2026-11-18T00:00:00.000Z',
    },
  ];
  const receipt = buildReceipt('a1', 'vp.alerts.v1', deliveries);
  let called = '';
  const fakeFetch: typeof fetch = async (input, init) => {
    called = String(input);
    assert.equal(init?.method, 'POST');
    return new Response('{}', { status: 201 });
  };
  const result = await sendAck(settings, receipt, fakeFetch);
  assert.equal(result.ok, true);
  assert.equal(called, 'http://api.test/api/v1/alerts/a1/receipts');
});
