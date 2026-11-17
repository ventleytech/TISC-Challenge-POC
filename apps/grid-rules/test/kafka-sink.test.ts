import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KafkaSink, kafkaSinkEnabled, recordKey } from '../src/bus/kafka-sink.js';
import { loadSettings } from '../src/config/settings.js';
import { MemorySink } from '../src/bus/memory-sink.js';
import { loadDetectFixture } from '../src/bus/fixture-source.js';
import { processDetectEvent } from '../src/rules-engine.js';

const detectPath = new URL('../fixtures/synthetic-detect.v1.json', import.meta.url).pathname;

test('disabled unless flag AND brokers', () => {
  assert.equal(kafkaSinkEnabled(loadSettings({})), false);
  assert.equal(kafkaSinkEnabled(loadSettings({ KAFKA_BROKERS: 'b:1' })), false);
  assert.equal(kafkaSinkEnabled(loadSettings({ GRID_RULES_KAFKA_PRODUCER_ENABLED: 'true' })), false);
  assert.equal(
    kafkaSinkEnabled(
      loadSettings({ GRID_RULES_KAFKA_PRODUCER_ENABLED: 'true', KAFKA_BROKERS: 'b:1' }),
    ),
    true,
  );
});

test('publishes findings + alerts to env-configured topics', async () => {
  const settings = loadSettings({
    VP_TOPIC_FINDINGS: 'vp.findings.v1',
    VP_TOPIC_ALERTS: 'vp.alerts.v1',
  });
  const detect = await loadDetectFixture(detectPath);
  const result = processDetectEvent(detect, { settings });
  const emitted = new MemorySink(settings).emit(result);
  assert.ok(result.findings.length > 0 && result.alerts.length > 0);

  const sent: Array<{ topic: string; messages: Array<{ key: string; value: string }> }> = [];
  const sink = new KafkaSink({
    send: async (a) => void sent.push(a),
    disconnect: async () => {},
  });
  const n = await sink.publish(emitted);

  assert.equal(n, emitted.length);
  const topics = sent.map((s) => s.topic).sort();
  assert.deepEqual(topics, ['vp.alerts.v1', 'vp.findings.v1']);
  for (const s of sent) {
    for (const m of s.messages) {
      const body = JSON.parse(m.value);
      assert.ok(body.event_id && body.occurred_at);
      assert.equal(m.key.length > 0, true);
    }
  }
  const f = sent.find((s) => s.topic === 'vp.findings.v1')!;
  assert.equal(f.messages[0]!.key, JSON.parse(f.messages[0]!.value).inspection_id);
  assert.equal(recordKey(emitted[0]!), f.messages[0]!.key);
});
