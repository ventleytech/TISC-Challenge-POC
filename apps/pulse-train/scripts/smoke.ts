import { createServer } from 'node:http';
import { createMockBus } from '../src/bus/mock-consumer.js';
import { loadSettings } from '../src/config.js';
import { createDatasetQueue } from '../src/dataset/queue.js';
import { createRetrainStore } from '../src/jobs/retrain.js';
import { createModelRegistry } from '../src/registry/models.js';
import { createTrainServer } from '../src/server.js';
import type { VpLabelsV1 } from '../src/types.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function postJson(base: string, route: string, body: unknown): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${base}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function getJson(base: string, route: string): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${base}${route}`);
  const json = await res.json();
  return { status: res.status, json };
}

async function main(): Promise<void> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-train-smoke-'));

  // bind ephemeral port then inject into settings
  const probe = createServer();
  await new Promise<void>((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = probe.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('failed to allocate port');
  }
  const port = addr.port;
  await new Promise<void>((resolve, reject) => {
    probe.close((err) => (err ? reject(err) : resolve()));
  });

  const settings = loadSettings({
    PULSE_TRAIN_HOST: '127.0.0.1',
    PULSE_TRAIN_PORT: String(port),
    PULSE_LABELS_TOPIC: 'vp.labels.v1',
    PULSE_MODELS_TOPIC: 'vp.models.v1',
    PULSE_STORE_ENDPOINT: 'http://127.0.0.1:9000',
    PULSE_TRAIN_DATA_DIR: dataDir,
    PULSE_TRAIN_RELOAD_MODE: 'log',
    PULSE_TRAIN_JOB_AUTO_ADVANCE: 'true',
  });

  const runtime = {
    settings,
    bus: createMockBus(settings.labelsTopic),
    queue: createDatasetQueue(settings.dataDir),
    jobs: createRetrainStore(),
    registry: createModelRegistry(),
    startedAt: new Date().toISOString(),
  };
  const server = createTrainServer(runtime);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(settings.port, settings.host, () => resolve());
  });

  const base = `http://127.0.0.1:${settings.port}`;

  const tp: VpLabelsV1 = {
    event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    occurred_at: '2026-11-18T02:00:00.000Z',
    label: {
      label_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      finding_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      class_id: 'corrosion',
      accepted: true,
      labeler_role: 'energy_operator',
    },
  };
  const fp: VpLabelsV1 = {
    event_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    occurred_at: '2026-11-18T02:01:00.000Z',
    label: {
      label_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      finding_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      class_id: 'crack',
      accepted: false,
      corrected_class_id: 'vegetation',
      labeler_role: 'energy_supervisor',
    },
  };

  const consumeTp = await postJson(base, '/internal/consume', tp);
  const consumeFp = await postJson(base, '/internal/consume', fp);
  const dataset = await getJson(base, '/internal/dataset');
  const retrain = await postJson(base, '/internal/retrain', {});
  const retrainBody = retrain.json as { id: string; status: string; model_id?: string };
  const job = await getJson(base, `/internal/retrain/${retrainBody.id}`);
  const models = await getJson(base, '/internal/models');
  const reload = await postJson(base, '/internal/reload', { model_id: retrainBody.model_id });
  const health = await getJson(base, '/health');

  const report = {
    ok:
      health.status === 200 &&
      consumeTp.status === 202 &&
      consumeFp.status === 202 &&
      retrain.status === 202 &&
      retrainBody.status === 'completed' &&
      reload.status === 202,
    health: health.json,
    consume: [consumeTp.json, consumeFp.json],
    datasetSize: (dataset.json as { items: unknown[] }).items?.length,
    retrain: retrain.json,
    job: job.json,
    models: models.json,
    reload: reload.json,
  };

  console.log(JSON.stringify(report, null, 2));

  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
