import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { handleAlertMessage, kafkaConsumerActive } from '../src/bus/kafka-consumer.js';
import { createMockBus } from '../src/bus/mock-consumer.js';
import { loadSettings } from '../src/config.js';

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

test('kafka gate needs flag AND brokers', () => {
  assert.equal(kafkaConsumerActive(loadSettings({})), false);
  assert.equal(kafkaConsumerActive(loadSettings({ PULSE_NOTIFY_KAFKA_ENABLED: 'true' })), false);
  assert.equal(kafkaConsumerActive(loadSettings({ KAFKA_BROKERS: 'x:9092' })), false);
  assert.equal(
    kafkaConsumerActive(loadSettings({ PULSE_NOTIFY_KAFKA_ENABLED: 'true', KAFKA_BROKERS: 'x:9092' })),
    true,
  );
});

test('handleAlertMessage routes valid message to file sink', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'vp-notify-')), 'out.jsonl');
  const settings = loadSettings({
    PULSE_NOTIFY_ADAPTER: 'file',
    PULSE_NOTIFY_FILE_PATH: path,
    PULSE_NOTIFY_ACK_MODE: 'off',
  });
  const bus = createMockBus(settings.alertsTopic);
  assert.equal(await handleAlertMessage(settings, bus, JSON.stringify(sample)), true);
  assert.equal(bus.consumed.length, 1);
  assert.equal(readFileSync(path, 'utf8').trim().split('\n').length, 2);
});

test('handleAlertMessage skips malformed without throwing', async () => {
  const settings = loadSettings({ PULSE_NOTIFY_ACK_MODE: 'off' });
  const bus = createMockBus(settings.alertsTopic);
  assert.equal(await handleAlertMessage(settings, bus, 'not json'), false);
  assert.equal(await handleAlertMessage(settings, bus, '{"event_id":"x"}'), false);
  assert.equal(bus.consumed.length, 0);
});
