import {
  slaDueAt as policySlaDueAt,
  type Severity as PolicySeverity,
} from '@voltpulse/alert-policy';
import type { Settings } from '../config/settings.js';
import type { Severity } from '../types.js';

/** Compute sla_due_at from `@voltpulse/alert-policy` severity map. */
export function slaDueAt(
  occurredAt: string,
  severity: Severity,
  settings: Settings,
): string {
  return policySlaDueAt(
    occurredAt,
    severity as PolicySeverity,
    settings.alertPolicy,
  );
}
