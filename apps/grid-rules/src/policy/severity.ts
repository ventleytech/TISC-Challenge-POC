import type { DetectionClass, DetectionItem, Severity } from '../types.js';

/** Class base severity when confidence is strong (≥0.75). */
const CLASS_BASE: Record<DetectionClass, Severity> = {
  crack: 'high',
  sag: 'high',
  corrosion: 'medium',
  vegetation: 'medium',
  thermal_hotspot: 'critical',
};

const ORDER: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];

function clampSeverity(s: Severity, delta: number): Severity {
  const i = ORDER.indexOf(s);
  const next = Math.max(0, Math.min(ORDER.length - 1, i + delta));
  return ORDER[next]!;
}

/**
 * Map a detection to severity from class + confidence.
 * Low confidence demotes; very high confidence can promote one step.
 */
export function severityFromDetection(d: DetectionItem): Severity {
  const base = CLASS_BASE[d.class_id] ?? 'info';
  const c = d.confidence;
  if (c < 0.35) return 'info';
  if (c < 0.55) return clampSeverity(base, -2);
  if (c < 0.75) return clampSeverity(base, -1);
  if (c >= 0.92) return clampSeverity(base, 1);
  return base;
}

export function severityRank(s: Severity): number {
  return ORDER.indexOf(s);
}

export function severityAtLeast(a: Severity, min: Severity): boolean {
  return severityRank(a) >= severityRank(min);
}
