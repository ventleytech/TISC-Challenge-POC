import type { Settings } from '../config/settings.js';
import type { Severity } from '../types.js';

export function slaDueAt(
  occurredAt: string,
  severity: Severity,
  settings: Settings,
): string {
  const minutes = settings.slaMinutes[severity];
  if (minutes === undefined) {
    throw new Error(`No SLA minutes configured for severity=${severity}`);
  }
  const base = Date.parse(occurredAt);
  if (Number.isNaN(base)) {
    throw new Error(`Invalid occurred_at: ${occurredAt}`);
  }
  return new Date(base + minutes * 60_000).toISOString();
}
