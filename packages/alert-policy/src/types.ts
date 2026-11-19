/** VoltPulse severity ladder — matches packages/contracts/enums/severity.json */
export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;
export type Severity = (typeof SEVERITIES)[number];

/** Notify channels — matches vp.alerts.v1 channels enum */
export const ALERT_CHANNELS = ['push', 'sms', 'email'] as const;
export type AlertChannel = (typeof ALERT_CHANNELS)[number];

/** Demo Day adapters; real providers land after manager approval. */
export const CHANNEL_ADAPTERS = ['mock', 'off'] as const;
export type ChannelAdapter = (typeof CHANNEL_ADAPTERS)[number];

export interface ChannelConfig {
  enabled: boolean;
  adapter: ChannelAdapter;
}

export interface AlertPolicy {
  version: number;
  channels: Record<AlertChannel, ChannelConfig>;
  defaultChannels: AlertChannel[];
  /** SLA due offset from occurred_at, minutes by severity. */
  slaMinutes: Record<Severity, number>;
}

export interface LoadAlertPolicyOptions {
  /** Absolute or relative path to policy JSON. */
  path?: string;
  /** Env bag for overlays (defaults to process.env). */
  env?: NodeJS.ProcessEnv;
  /** Skip reading filesystem; use in-memory base (tests). */
  base?: AlertPolicy;
}
