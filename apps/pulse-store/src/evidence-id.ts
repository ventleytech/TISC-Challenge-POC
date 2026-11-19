import { createHash } from 'node:crypto';
import path from 'node:path';

export type EvidenceKind = 'evidence' | 'upload' | 'session' | 'model';

export interface EvidenceIdInput {
  utilityId: string;
  inspectionId: string;
  /** Raw bytes for content-addressed evidence keys (sha256_12). */
  content?: Buffer | string;
  /** Explicit object id for upload keys (defaults to sha256_12 of content when present). */
  objectId?: string;
  ext?: string;
  /** Session segment sequence (zero-padded to 6). */
  sessionSeq?: number;
  modelName?: string;
  modelVersion?: string;
  weightsFile?: string;
}

function sanitizeSegment(raw: string, field: string): string {
  const v = raw.trim();
  if (!v) throw new Error(`${field} must be non-empty`);
  if (!/^[a-zA-Z0-9._-]+$/.test(v)) {
    throw new Error(`${field} must be alphanumeric / ._- only: ${raw}`);
  }
  return v;
}

function normalizeExt(ext: string | undefined): string {
  if (!ext || !ext.trim()) return 'bin';
  const cleaned = ext.trim().replace(/^\./, '');
  if (!/^[a-zA-Z0-9]+$/.test(cleaned)) {
    throw new Error(`ext invalid: ${ext}`);
  }
  return cleaned.toLowerCase();
}

/** First 12 hex chars of sha256 — matches docs/storage-retention.md `ev_{sha256_12}`. */
export function contentAddress12(content: Buffer | string): string {
  const buf = typeof content === 'string' ? Buffer.from(content) : content;
  return createHash('sha256').update(buf).digest('hex').slice(0, 12);
}

/**
 * Inspection-scoped object key (no s3:// bucket prefix).
 * Layout from docs/storage-retention.md:
 *   {utility_id}/insp_{inspection_id}/evidence/ev_{sha256_12}.{ext}
 *   {utility_id}/insp_{inspection_id}/upload/{object_id}
 *   {utility_id}/insp_{inspection_id}/session/{seq:06d}.mp4
 *   {utility_id}/models/{model_name}/{version}/weights.*
 */
export function buildObjectKey(kind: EvidenceKind, input: EvidenceIdInput): string {
  const utilityId = sanitizeSegment(input.utilityId, 'utilityId');
  const inspectionId = sanitizeSegment(input.inspectionId, 'inspectionId');
  const insp = `insp_${inspectionId}`;

  switch (kind) {
    case 'evidence': {
      if (input.content === undefined) {
        throw new Error('evidence keys require content for sha256_12');
      }
      const digest = contentAddress12(input.content);
      const ext = normalizeExt(input.ext);
      return path.posix.join(utilityId, insp, 'evidence', `ev_${digest}.${ext}`);
    }
    case 'upload': {
      const objectId =
        input.objectId?.trim() ||
        (input.content !== undefined ? contentAddress12(input.content) : '');
      if (!objectId) throw new Error('upload keys require objectId or content');
      return path.posix.join(utilityId, insp, 'upload', sanitizeSegment(objectId, 'objectId'));
    }
    case 'session': {
      if (input.sessionSeq === undefined || !Number.isInteger(input.sessionSeq) || input.sessionSeq < 0) {
        throw new Error('session keys require non-negative integer sessionSeq');
      }
      const seq = String(input.sessionSeq).padStart(6, '0');
      return path.posix.join(utilityId, insp, 'session', `${seq}.mp4`);
    }
    case 'model': {
      const modelName = sanitizeSegment(input.modelName ?? '', 'modelName');
      const modelVersion = sanitizeSegment(input.modelVersion ?? '', 'modelVersion');
      const weights = sanitizeSegment(input.weightsFile ?? 'weights.pt', 'weightsFile');
      return path.posix.join(utilityId, 'models', modelName, modelVersion, weights);
    }
    default: {
      const _exhaustive: never = kind;
      throw new Error(`unknown kind: ${_exhaustive}`);
    }
  }
}

/** Convenience: evidence object key from bytes + extension. */
export function buildEvidenceKey(
  utilityId: string,
  inspectionId: string,
  content: Buffer | string,
  ext = 'jpg',
): string {
  return buildObjectKey('evidence', { utilityId, inspectionId, content, ext });
}
