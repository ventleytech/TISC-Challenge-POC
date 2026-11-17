/**
 * Config for grid-rules. Business logic reads Settings — not raw env sprinkles.
 * SLA minutes + notify channels come from `@voltpulse/alert-policy` defaults.
 */

import {
  loadAlertPolicy,
  resolveChannels,
  type AlertChannel,
  type AlertPolicy,
} from '@voltpulse/alert-policy';

export type Settings = {
  serviceName: string;
  /** Kafka topic names (emit ownership); mock bus ignores brokers. */
  topics: {
    detect: string;
    findings: string;
    alerts: string;
  };
  /** Loaded M05/M06 policy (channels + SLA). */
  alertPolicy: AlertPolicy;
  /** SLA due offsets from occurred_at, by severity (minutes) — from alert-policy. */
  slaMinutes: AlertPolicy['slaMinutes'];
  /** Minimum severity that raises an alert (inclusive). */
  alertMinSeverity: string;
  /** Enabled default notify channels — from alert-policy resolveChannels. */
  defaultChannels: AlertChannel[];
  defaultCriticality: 'critical' | 'high' | 'medium' | 'low';
  kafkaBrokers: string | null;
};

/** Map legacy GRID_RULES_SLA_* into VP_ALERT_SLA_* when modern keys unset. */
function withLegacyAlertEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const pairs: Array<[legacy: string, modern: string]> = [
    ['GRID_RULES_SLA_CRITICAL_MIN', 'VP_ALERT_SLA_CRITICAL_MIN'],
    ['GRID_RULES_SLA_HIGH_MIN', 'VP_ALERT_SLA_HIGH_MIN'],
    ['GRID_RULES_SLA_MEDIUM_MIN', 'VP_ALERT_SLA_MEDIUM_MIN'],
    ['GRID_RULES_SLA_LOW_MIN', 'VP_ALERT_SLA_LOW_MIN'],
    ['GRID_RULES_SLA_INFO_MIN', 'VP_ALERT_SLA_INFO_MIN'],
  ];
  const out: NodeJS.ProcessEnv = { ...env };
  for (const [legacy, modern] of pairs) {
    const modernVal = out[modern];
    const legacyVal = out[legacy];
    if (
      (modernVal === undefined || modernVal === '') &&
      legacyVal !== undefined &&
      legacyVal !== ''
    ) {
      out[modern] = legacyVal;
    }
  }
  return out;
}

export function loadSettings(
  env: NodeJS.ProcessEnv = process.env,
): Settings {
  const alertPolicy = loadAlertPolicy({ env: withLegacyAlertEnv(env) });
  return {
    serviceName: env.GRID_RULES_SERVICE_NAME ?? 'grid-rules',
    topics: {
      detect: env.VP_TOPIC_DETECT ?? 'vp.detect.v1',
      findings: env.VP_TOPIC_FINDINGS ?? 'vp.findings.v1',
      alerts: env.VP_TOPIC_ALERTS ?? 'vp.alerts.v1',
    },
    alertPolicy,
    slaMinutes: { ...alertPolicy.slaMinutes },
    alertMinSeverity: env.GRID_RULES_ALERT_MIN_SEVERITY ?? 'medium',
    defaultChannels: resolveChannels(alertPolicy),
    defaultCriticality: 'medium',
    kafkaBrokers: env.KAFKA_BROKERS ?? null,
  };
}
