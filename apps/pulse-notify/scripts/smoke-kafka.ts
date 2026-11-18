/** Live smoke: produce vp.alerts.v1 to KAFKA_BROKERS, expect file sink lines for the smoke alert (topic backlog is also consumed). Skips if brokers unset. */
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Kafka, logLevel } from 'kafkajs';
import { startKafkaConsumer } from '../src/bus/kafka-consumer.js';
import { createMockBus } from '../src/bus/mock-consumer.js';
import { loadSettings } from '../src/config.js';

const brokers = process.env.KAFKA_BROKERS?.trim();
if (!brokers) {
  console.log(JSON.stringify({ skipped: 'KAFKA_BROKERS unset' }));
  process.exit(0);
}
const out = join(mkdtempSync(join(tmpdir(), 'vp-notify-kafka-')), 'alerts.jsonl');
const run = Date.now();
const settings = loadSettings({
  ...process.env,
  PULSE_NOTIFY_KAFKA_ENABLED: 'true',
  PULSE_NOTIFY_KAFKA_GROUP_ID: `pulse-notify-smoke-${run}`,
  PULSE_NOTIFY_KAFKA_FROM_BEGINNING: 'true',
  PULSE_NOTIFY_ADAPTER: 'file',
  PULSE_NOTIFY_FILE_PATH: out,
  PULSE_NOTIFY_ACK_MODE: 'off',
});
const kafka = new Kafka({ clientId: 'pulse-notify-smoke', brokers: brokers.split(','), logLevel: logLevel.WARN });
const admin = kafka.admin();
await admin.connect();
await admin.createTopics({ topics: [{ topic: settings.alertsTopic }] });
await admin.disconnect();

const alertId = crypto.randomUUID();
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: settings.alertsTopic,
  messages: [
    { value: 'garbage-not-json' },
    {
      value: JSON.stringify({
        event_id: crypto.randomUUID(),
        occurred_at: new Date().toISOString(),
        alert: {
          alert_id: alertId,
          finding_id: crypto.randomUUID(),
          severity: 'high',
          sla_due_at: new Date(run + 3600_000).toISOString(),
          channels: ['push', 'sms'],
        },
      }),
    },
  ],
});
await producer.disconnect();

const bus = createMockBus(settings.alertsTopic);
const consumer = await startKafkaConsumer(settings, bus);
let lines: string[] = [];
const mine = (): string[] => lines.filter((l) => l.includes(alertId));
for (let i = 0; i < 60 && mine().length < 2; i++) {
  await new Promise((r) => setTimeout(r, 500));
  if (existsSync(out)) lines = readFileSync(out, 'utf8').trim().split('\n').filter(Boolean);
}
await consumer.disconnect();
const ok = mine().length === 2 && bus.consumed.some((e) => e.alert.alert_id === alertId);
console.log(JSON.stringify({ ok, brokers, topic: settings.alertsTopic, sinkLines: lines.length, sinkLinesForSmokeAlert: mine().length, consumed: bus.consumed.length, sample: mine()[0] ? JSON.parse(mine()[0]) : null }, null, 2));
process.exit(ok ? 0 : 1);
