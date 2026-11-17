import type { ModelRecord, ModelAction, DetectionId, ModelFormat } from '../types.js';

export interface ModelRegistry {
  models: ModelRecord[];
}

export function createModelRegistry(): ModelRegistry {
  return { models: [] };
}

export interface RegisterModelInput {
  model_id: string;
  class_ids: DetectionId[];
  action?: ModelAction;
  artifact_uri: string;
  format?: ModelFormat;
  checksum_sha256?: string | null;
}

export function registerModel(registry: ModelRegistry, input: RegisterModelInput): ModelRecord {
  const record: ModelRecord = {
    model_id: input.model_id,
    class_ids: input.class_ids,
    action: input.action ?? 'registered',
    artifact_uri: input.artifact_uri,
    format: input.format,
    checksum_sha256: input.checksum_sha256 ?? null,
    registered_at: new Date().toISOString(),
  };
  registry.models.push(record);
  console.info(
    `[pulse-train] model registered id=${record.model_id} action=${record.action} uri=${record.artifact_uri}`,
  );
  return record;
}

export function listModels(registry: ModelRegistry): ModelRecord[] {
  return [...registry.models];
}

export function findModel(registry: ModelRegistry, modelId: string): ModelRecord | undefined {
  return registry.models.find((m) => m.model_id === modelId);
}
