import type { DetectionClass } from '../domain/types';

export const EVIDENCE_KINDS = [
  'crop',
  'rgb_frame',
  'ir_frame',
  'clip',
  'report',
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'application/pdf',
] as const;

export type EvidenceRetention = 'hot' | 'warm' | 'expire' | 'legal_hold';

/** Persisted sidecar (`<object_key>.meta.json`) — includes storage coordinates. */
export type EvidenceMeta = {
  id: string;
  utility_id: string;
  inspection_id: string;
  finding_id: string | null;
  asset_id: string | null;
  kind: EvidenceKind;
  class_id: DetectionClass | null;
  confidence: number | null;
  /** [x, y, w, h] in source-frame pixels. */
  bbox: [number, number, number, number] | null;
  label: string | null;
  content_type: string;
  bytes: number;
  retention: EvidenceRetention;
  captured_at: string;
  created_at: string;
  object_key: string;
};

/** API view: metadata + short-lived signed content path (relative to /api/v1). */
export type EvidenceObject = EvidenceMeta & {
  backend: string;
  content_path: string;
  content_expires_at: string;
};

export type EvidenceCreate = {
  utility_id: string;
  inspection_id: string;
  kind: EvidenceKind;
  content_type: string;
  /** Raw bytes, base64 (std alphabet). */
  data_base64: string;
  finding_id?: string | null;
  asset_id?: string | null;
  class_id?: DetectionClass | null;
  confidence?: number | null;
  bbox?: [number, number, number, number] | null;
  label?: string | null;
  captured_at?: string | null;
};
