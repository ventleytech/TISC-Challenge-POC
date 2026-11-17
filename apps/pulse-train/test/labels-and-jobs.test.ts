import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { parseVpLabelsV1 } from '../src/bus/mock-consumer.js';
import { createMockBus } from '../src/bus/mock-consumer.js';
import { loadSettings } from '../src/config.js';
import { createDatasetQueue, enqueueLabel, labelKind } from '../src/dataset/queue.js';
import {
  createRetrainStore,
  enqueueRetrain,
  runStubRetrainToCompletion,
} from '../src/jobs/retrain.js';
import { processLabelEvent } from '../src/pipeline.js';
import { createModelRegistry, findModel } from '../src/registry/models.js';
import { buildReloadEvent, sendReload } from '../src/reload/hook.js';
import type { VpLabelsV1 } from '../src/types.js';

const sampleTp: VpLabelsV1 = {
  event_id: '11111111-1111-1111-1111-111111111111',
  occurred_at: '2026-11-18T00:00:00.000Z',
  label: {
    label_id: '22222222-2222-2222-2222-222222222222',
    finding_id: '33333333-3333-3333-3333-333333333333',
    class_id: 'corrosion',
    accepted: true,
    labeler_role: 'energy_operator',
  },
};

const sampleFp: VpLabelsV1 = {
  event_id: '44444444-4444-4444-4444-444444444444',
  occurred_at: '2026-11-18T00:01:00.000Z',
  label: {
    label_id: '55555555-5555-5555-5555-555555555555',
    finding_id: '66666666-6666-6666-6666-666666666666',
    class_id: 'crack',
    accepted: false,
    corrected_class_id: 'vegetation',
    labeler_role: 'energy_supervisor',
  },
};

test('parseVpLabelsV1 accepts contract-shaped TP/FP payloads', () => {
  const tp = parseVpLabelsV1(sampleTp);
  assert.equal(tp.label.accepted, true);
  assert.equal(labelKind(tp), 'tp');
  const fp = parseVpLabelsV1(sampleFp);
  assert.equal(fp.label.accepted, false);
  assert.equal(labelKind(fp), 'fp');
  assert.equal(fp.label.corrected_class_id, 'vegetation');
});

test('parseVpLabelsV1 rejects bad class_id', () => {
  assert.throws(
    () =>
      parseVpLabelsV1({
        ...sampleTp,
        label: { ...sampleTp.label, class_id: 'rust' },
      }),
    /class_id/,
  );
});

test('processLabelEvent queues labels and persists file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-train-'));
  const settings = loadSettings({
    PULSE_TRAIN_PORT: '3020',
    PULSE_LABELS_TOPIC: 'vp.labels.v1',
    PULSE_MODELS_TOPIC: 'vp.models.v1',
    PULSE_STORE_ENDPOINT: 'http://store.test',
    PULSE_TRAIN_DATA_DIR: dir,
    PULSE_TRAIN_RELOAD_MODE: 'log',
  });
  const bus = createMockBus(settings.labelsTopic);
  const queue = createDatasetQueue(dir);
  processLabelEvent(settings, bus, queue, parseVpLabelsV1(sampleTp));
  processLabelEvent(settings, bus, queue, parseVpLabelsV1(sampleFp));
  assert.equal(bus.consumed.length, 2);
  assert.equal(queue.items.length, 2);
  assert.equal(queue.items[0].kind, 'tp');
  assert.equal(queue.items[1].kind, 'fp');
  assert.ok(fs.existsSync(path.join(dir, 'dataset-queue.json')));
});

test('retrain stub completes and registers model', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-train-'));
  const queue = createDatasetQueue(dir);
  enqueueLabel(queue, parseVpLabelsV1(sampleTp));
  const store = createRetrainStore();
  const registry = createModelRegistry();
  const job = enqueueRetrain(store, queue);
  const done = runStubRetrainToCompletion(store, registry, 'http://store.test', job.id);
  assert.equal(done.status, 'completed');
  assert.ok(done.model_id);
  assert.ok(findModel(registry, done.model_id!));
});

test('sendReload http posts vp.models.v1-shaped event', async () => {
  const settings = loadSettings({
    PULSE_TRAIN_RELOAD_MODE: 'http',
    PULSE_TRAIN_RELOAD_URL: 'http://perception.test/internal/reload',
    PULSE_MODELS_TOPIC: 'vp.models.v1',
  });
  const model = {
    model_id: 'm1',
    class_ids: ['corrosion' as const],
    action: 'registered' as const,
    artifact_uri: 'http://store.test/models/m1.onnx',
    format: 'onnx' as const,
    checksum_sha256: null,
    registered_at: '2026-11-18T00:00:00.000Z',
  };
  const event = buildReloadEvent(model, settings.modelsTopic);
  assert.equal(event.model.action, 'reload_requested');
  let called = '';
  const fakeFetch: typeof fetch = async (input, init) => {
    called = String(input);
    assert.equal(init?.method, 'POST');
    const body = JSON.parse(String(init?.body)) as { model: { action: string } };
    assert.equal(body.model.action, 'reload_requested');
    return new Response('{}', { status: 202 });
  };
  const result = await sendReload(settings, model, fakeFetch);
  assert.equal(result.ok, true);
  assert.equal(called, 'http://perception.test/internal/reload');
});
