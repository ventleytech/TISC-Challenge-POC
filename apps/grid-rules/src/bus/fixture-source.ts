import { readFile } from 'node:fs/promises';
import type { VpDetectV1 } from '../types.js';

/** Load synthetic vp.detect.v1 JSON from disk (mock Kafka source). */
export async function loadDetectFixture(path: string): Promise<VpDetectV1> {
  const raw = await readFile(path, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON fixture ${path}: ${(err as Error).message}`);
  }
  assertDetectShape(parsed, path);
  return parsed;
}

export function assertDetectShape(v: unknown, path: string): asserts v is VpDetectV1 {
  if (!v || typeof v !== 'object') {
    throw new Error(`Fixture ${path}: expected object`);
  }
  const o = v as Record<string, unknown>;
  if (typeof o.event_id !== 'string' || typeof o.inspection_id !== 'string') {
    throw new Error(`Fixture ${path}: missing event_id / inspection_id`);
  }
  if (!Array.isArray(o.detections)) {
    throw new Error(`Fixture ${path}: detections must be array`);
  }
}
