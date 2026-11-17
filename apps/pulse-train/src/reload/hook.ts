import { randomUUID } from 'node:crypto';
import type { TrainSettings } from '../config.js';
import type { ModelRecord, VpModelsV1 } from '../types.js';

export interface ReloadResult {
  mode: TrainSettings['reloadMode'];
  ok: boolean;
  detail: string;
  event: VpModelsV1;
}

export function buildReloadEvent(model: ModelRecord, topic: string): VpModelsV1 {
  void topic;
  return {
    event_id: randomUUID(),
    occurred_at: new Date().toISOString(),
    model: {
      model_id: model.model_id,
      class_ids: model.class_ids,
      action: 'reload_requested',
      artifact_uri: model.artifact_uri,
      format: model.format,
      checksum_sha256: model.checksum_sha256 ?? null,
    },
  };
}

/**
 * Reload hook stub after model register/promote.
 * log = local only; http = POST vp.models.v1-shaped event (noop on failure logged);
 * off = no-op.
 */
export async function sendReload(
  settings: TrainSettings,
  model: ModelRecord,
  fetchImpl: typeof fetch = fetch,
): Promise<ReloadResult> {
  const event = buildReloadEvent(model, settings.modelsTopic);

  if (settings.reloadMode === 'off') {
    return { mode: 'off', ok: true, detail: 'reload disabled', event };
  }

  if (settings.reloadMode === 'log') {
    console.info(
      `[pulse-train] reload stub topic=${settings.modelsTopic} model=${model.model_id} action=reload_requested`,
    );
    return { mode: 'log', ok: true, detail: 'logged', event };
  }

  const url = settings.reloadUrl;
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(
        `[pulse-train] reload http failed status=${res.status} model=${model.model_id} body=${text.slice(0, 200)}`,
      );
      return { mode: 'http', ok: false, detail: `http ${res.status}`, event };
    }
    console.info(`[pulse-train] reload http ok model=${model.model_id} url=${url}`);
    return { mode: 'http', ok: true, detail: `http ${res.status}`, event };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pulse-train] reload http error model=${model.model_id}: ${message}`);
    return { mode: 'http', ok: false, detail: message, event };
  }
}
