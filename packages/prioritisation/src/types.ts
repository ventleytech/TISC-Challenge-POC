/** Aligns with packages/contracts/enums/severity.json */
export const SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
] as const;
export type Severity = (typeof SEVERITIES)[number];

/** Asset criticality ladder (A03). */
export const CRITICALITIES = ['critical', 'high', 'medium', 'low'] as const;
export type Criticality = (typeof CRITICALITIES)[number];

/** Detection ids from contracts. */
export const DETECTION_CLASSES = [
  'crack',
  'sag',
  'corrosion',
  'vegetation',
  'thermal_hotspot',
] as const;
export type DetectionClass = (typeof DETECTION_CLASSES)[number];

/**
 * Minimal board row for C09. Callers may extend; helpers only read these fields.
 * `risk_score` expected from grid-rules W01 (0–100).
 */
export type BoardItem = {
  id: string;
  risk_score: number;
  severity: Severity;
  criticality: Criticality;
  class_id?: DetectionClass | string;
  utility_id?: string;
  /** ISO-8601; newer wins on tie after severity. */
  occurred_at?: string;
  sla_breached?: boolean;
};

export type BoardFilter = {
  severities?: Severity[];
  criticalities?: Criticality[];
  class_ids?: string[];
  utility_id?: string;
  /** Inclusive minimum risk_score. */
  min_risk?: number;
  /** When true, only rows with sla_breached === true. */
  sla_breached_only?: boolean;
};

export type BoardSortOptions = {
  /**
   * When true (default), SLA-breached rows float above equal risk peers.
   */
  prefer_sla_breach?: boolean;
};
