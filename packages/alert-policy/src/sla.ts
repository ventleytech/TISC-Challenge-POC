import type { AlertPolicy, Severity } from './types.js';
import { SEVERITIES } from './types.js';

export function assertSeverity(value: string): asserts value is Severity {
  if (!(SEVERITIES as readonly string[]).includes(value)) {
    throw new Error(`Unknown severity: ${value}`);
  }
}

/** SLA duration in minutes for a severity. */
export function slaMinutesForSeverity(
  policy: AlertPolicy,
  severity: Severity,
): number {
  assertSeverity(severity);
  const minutes = policy.slaMinutes[severity];
  if (minutes === undefined || !Number.isFinite(minutes) || minutes < 0) {
    throw new Error(`No SLA minutes configured for severity=${severity}`);
  }
  return minutes;
}

export function slaDurationMs(
  policy: AlertPolicy,
  severity: Severity,
): number {
  return slaMinutesForSeverity(policy, severity) * 60_000;
}

/**
 * Compute `sla_due_at` ISO timestamp from occurred_at + severity mapping.
 */
export function slaDueAt(
  occurredAt: string,
  severity: Severity,
  policy: AlertPolicy,
): string {
  const base = Date.parse(occurredAt);
  if (Number.isNaN(base)) {
    throw new Error(`Invalid occurred_at: ${occurredAt}`);
  }
  return new Date(base + slaDurationMs(policy, severity)).toISOString();
}

/** True when now is at/after sla_due_at and alert is still open. */
export function isSlaBreached(
  slaDueAtIso: string,
  now: Date = new Date(),
): boolean {
  const due = Date.parse(slaDueAtIso);
  if (Number.isNaN(due)) {
    throw new Error(`Invalid sla_due_at: ${slaDueAtIso}`);
  }
  return now.getTime() >= due;
}
