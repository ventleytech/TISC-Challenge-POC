import http from 'node:http';
import { LabelValidationError, parseVpLabelsV1, type MockBusState } from './bus/mock-consumer.js';
import type { TrainSettings } from './config.js';
import { listQueue, type DatasetQueue } from './dataset/queue.js';
import {
  advanceRetrainJob,
  enqueueRetrain,
  getRetrainJob,
  listRetrainJobs,
  runStubRetrainToCompletion,
  type RetrainStore,
} from './jobs/retrain.js';
import { findModel, listModels, registerModel, type ModelRegistry } from './registry/models.js';
import { processLabelEvent } from './pipeline.js';
import { sendReload } from './reload/hook.js';
import type { DetectionId } from './types.js';

export interface TrainRuntime {
  settings: TrainSettings;
  bus: MockBusState;
  queue: DatasetQueue;
  jobs: RetrainStore;
  registry: ModelRegistry;
  startedAt: string;
}

function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new LabelValidationError('invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

export function createTrainServer(runtime: TrainRuntime): http.Server {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const path = url.pathname;

      if (req.method === 'GET' && path === '/health') {
        sendJson(res, 200, {
          status: 'ok',
          service: 'pulse-train',
          labelsTopic: runtime.settings.labelsTopic,
          modelsTopic: runtime.settings.modelsTopic,
          reloadMode: runtime.settings.reloadMode,
          labelsConsumed: runtime.bus.consumed.length,
          queueSize: runtime.queue.items.length,
          jobs: runtime.jobs.jobs.size,
          models: runtime.registry.models.length,
          startedAt: runtime.startedAt,
        });
        return;
      }

      if (req.method === 'POST' && path === '/internal/consume') {
        const raw = await readJson(req);
        const event = parseVpLabelsV1(raw);
        const result = processLabelEvent(runtime.settings, runtime.bus, runtime.queue, event);
        sendJson(res, 202, {
          id: result.queueItem.label_id,
          topic: runtime.settings.labelsTopic,
          kind: result.queueItem.kind,
          class_id: result.queueItem.class_id,
          queueSize: runtime.queue.items.length,
        });
        return;
      }

      if (req.method === 'GET' && path === '/internal/labels') {
        sendJson(res, 200, {
          topic: runtime.bus.topic,
          items: runtime.bus.consumed,
        });
        return;
      }

      if (req.method === 'GET' && path === '/internal/dataset') {
        sendJson(res, 200, {
          path: runtime.queue.filePath,
          items: listQueue(runtime.queue),
        });
        return;
      }

      if (req.method === 'POST' && path === '/internal/retrain') {
        const raw = (await readJson(req)) as { class_ids?: DetectionId[] };
        let job = enqueueRetrain(runtime.jobs, runtime.queue, raw.class_ids);
        if (runtime.settings.jobAutoAdvance) {
          job = runStubRetrainToCompletion(
            runtime.jobs,
            runtime.registry,
            runtime.settings.storeEndpoint,
            job.id,
          );
        }
        sendJson(res, 202, { id: job.id, status: job.status, model_id: job.model_id });
        return;
      }

      const retrainMatch = path.match(/^\/internal\/retrain\/([^/]+)$/);
      if (req.method === 'GET' && retrainMatch) {
        const job = getRetrainJob(runtime.jobs, decodeURIComponent(retrainMatch[1]));
        if (!job) {
          sendJson(res, 404, { error: 'not_found' });
          return;
        }
        sendJson(res, 200, job);
        return;
      }

      const advanceMatch = path.match(/^\/internal\/retrain\/([^/]+)\/advance$/);
      if (req.method === 'POST' && advanceMatch) {
        const job = advanceRetrainJob(
          runtime.jobs,
          runtime.registry,
          runtime.settings.storeEndpoint,
          decodeURIComponent(advanceMatch[1]),
        );
        sendJson(res, 200, { id: job.id, status: job.status, model_id: job.model_id });
        return;
      }

      if (req.method === 'GET' && path === '/internal/retrain') {
        sendJson(res, 200, { items: listRetrainJobs(runtime.jobs) });
        return;
      }

      if (req.method === 'GET' && path === '/internal/models') {
        sendJson(res, 200, { topic: runtime.settings.modelsTopic, items: listModels(runtime.registry) });
        return;
      }

      if (req.method === 'POST' && path === '/internal/models') {
        const raw = (await readJson(req)) as {
          model_id?: string;
          class_ids?: DetectionId[];
          artifact_uri?: string;
          format?: 'onnx' | 'tensorrt' | 'ultralytics_pt';
        };
        if (!raw.model_id || !raw.artifact_uri || !raw.class_ids?.length) {
          sendJson(res, 400, {
            error: 'validation_error',
            message: 'model_id, class_ids, artifact_uri required',
          });
          return;
        }
        const record = registerModel(runtime.registry, {
          model_id: raw.model_id,
          class_ids: raw.class_ids,
          artifact_uri: raw.artifact_uri,
          format: raw.format,
          action: 'registered',
        });
        sendJson(res, 201, { id: record.model_id });
        return;
      }

      if (req.method === 'POST' && path === '/internal/reload') {
        const raw = (await readJson(req)) as { model_id?: string };
        if (!raw.model_id) {
          sendJson(res, 400, { error: 'validation_error', message: 'model_id required' });
          return;
        }
        const model = findModel(runtime.registry, raw.model_id);
        if (!model) {
          sendJson(res, 404, { error: 'not_found', message: 'model not registered' });
          return;
        }
        const result = await sendReload(runtime.settings, model);
        sendJson(res, 202, {
          id: model.model_id,
          topic: runtime.settings.modelsTopic,
          reload: { mode: result.mode, ok: result.ok },
          event_id: result.event.event_id,
        });
        return;
      }

      sendJson(res, 404, { error: 'not_found' });
    } catch (err) {
      if (err instanceof LabelValidationError) {
        sendJson(res, 400, { error: 'validation_error', message: err.message });
        return;
      }
      if (err instanceof Error && err.message.startsWith('retrain requires')) {
        sendJson(res, 400, { error: 'validation_error', message: err.message });
        return;
      }
      if (err instanceof Error && err.message.startsWith('job not found')) {
        sendJson(res, 404, { error: 'not_found', message: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[pulse-train] request error: ${message}`);
      sendJson(res, 500, { error: 'internal_error', message });
    }
  });
}
