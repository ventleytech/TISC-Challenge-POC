/**
 * Config for grid-rules. Business logic reads Settings — not raw env sprinkles.
 */

export type Settings = {
  serviceName: string;
  /** Kafka topic names (emit ownership); mock bus ignores brokers. */
  topics: {
    detect: string;
    findings: string;
    alerts: string;
  };
  /** SLA due offsets from occurred_at, by severity (minutes). */
  slaMinutes: Record<string, number>;
  /** Minimum severity that raises an alert (inclusive). */
  alertMinSeverity: string;
  defaultChannels: Array<'push' | 'sms' | 'email'>;
  defaultCriticality: 'critical' | 'high' | 'medium' | 'low';
  kafkaBrokers: string | null;
};

function parseIntEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) {
    throw new Error(`Invalid integer env value: ${raw}`);
  }
  return n;
}

export function loadSettings(
  env: NodeJS.ProcessEnv = process.env,
): Settings {
  return {
    serviceName: env.GRID_RULES_SERVICE_NAME ?? 'grid-rules',
    topics: {
      detect: env.VP_TOPIC_DETECT ?? 'vp.detect.v1',
      findings: env.VP_TOPIC_FINDINGS ?? 'vp.findings.v1',
      alerts: env.VP_TOPIC_ALERTS ?? 'vp.alerts.v1',
    },
    slaMinutes: {
      critical: parseIntEnv(env.GRID_RULES_SLA_CRITICAL_MIN, 15),
      high: parseIntEnv(env.GRID_RULES_SLA_HIGH_MIN, 60),
      medium: parseIntEnv(env.GRID_RULES_SLA_MEDIUM_MIN, 240),
      low: parseIntEnv(env.GRID_RULES_SLA_LOW_MIN, 1440),
      info: parseIntEnv(env.GRID_RULES_SLA_INFO_MIN, 10080),
    },
    alertMinSeverity: env.GRID_RULES_ALERT_MIN_SEVERITY ?? 'medium',
    defaultChannels: ['push', 'sms'],
    defaultCriticality: 'medium',
    kafkaBrokers: env.KAFKA_BROKERS ?? null,
  };
}
