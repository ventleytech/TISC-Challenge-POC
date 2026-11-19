import { randomUUID } from 'node:crypto';
import type { DetectionId, RetrainJob, RetrainJobStatus } from '../types.js';
import type { DatasetQueue } from '../dataset/queue.js';
import { registerModel, type ModelRegistry } from '../registry/models.js';

export interface RetrainStore {
  jobs: Map<string, RetrainJob>;
}

export function createRetrainStore(): RetrainStore {
  return { jobs: new Map() };
}

export function enqueueRetrain(
  store: RetrainStore,
  queue: DatasetQueue,
  classIds?: DetectionId[],
): RetrainJob {
  const ids =
    classIds && classIds.length > 0
      ? classIds
      : ([...new Set(queue.items.map((i) => i.class_id))] as DetectionId[]);
  if (ids.length === 0) {
    throw new Error('retrain requires labels in dataset queue or explicit class_ids');
  }
  const now = new Date().toISOString();
  const job: RetrainJob = {
    id: randomUUID(),
    status: 'queued',
    class_ids: ids,
    label_count: queue.items.filter((i) => ids.includes(i.class_id)).length,
    enqueued_at: now,
    updated_at: now,
    detail: 'stub job queued',
  };
  store.jobs.set(job.id, job);
  console.info(
    `[pulse-train] retrain enqueued id=${job.id} classes=${ids.join(',')} labels=${job.label_count}`,
  );
  return job;
}

export function getRetrainJob(store: RetrainStore, id: string): RetrainJob | undefined {
  return store.jobs.get(id);
}

export function listRetrainJobs(store: RetrainStore): RetrainJob[] {
  return [...store.jobs.values()];
}

function setStatus(job: RetrainJob, status: RetrainJobStatus, detail: string): RetrainJob {
  job.status = status;
  job.detail = detail;
  job.updated_at = new Date().toISOString();
  return job;
}

/**
 * Stub advance: queued → running → completed + optional registry entry.
 * No real training — status machine only.
 */
export function advanceRetrainJob(
  store: RetrainStore,
  registry: ModelRegistry,
  storeEndpoint: string,
  jobId: string,
): RetrainJob {
  const job = store.jobs.get(jobId);
  if (!job) {
    throw new Error(`job not found: ${jobId}`);
  }
  if (job.status === 'queued') {
    return setStatus(job, 'running', 'stub training running');
  }
  if (job.status === 'running') {
    const modelId = `vp-stub-${job.class_ids[0]}-${job.id.slice(0, 8)}`;
    const artifactUri = `${storeEndpoint.replace(/\/$/, '')}/models/${modelId}.onnx`;
    registerModel(registry, {
      model_id: modelId,
      class_ids: job.class_ids,
      action: 'registered',
      artifact_uri: artifactUri,
      format: 'onnx',
      checksum_sha256: null,
    });
    job.model_id = modelId;
    return setStatus(job, 'completed', `stub model registered ${modelId}`);
  }
  return job;
}

/** Auto-run stub to completed for smoke (when settings.jobAutoAdvance). */
export function runStubRetrainToCompletion(
  store: RetrainStore,
  registry: ModelRegistry,
  storeEndpoint: string,
  jobId: string,
): RetrainJob {
  advanceRetrainJob(store, registry, storeEndpoint, jobId);
  return advanceRetrainJob(store, registry, storeEndpoint, jobId);
}
