import type { StoreSettings } from './config.js';

export type RetentionTier = 'hot' | 'warm' | 'expire';

export interface RetentionPolicy {
  /** Age < hotDays → hot. */
  hotDays: number;
  /** Age < warmDays → warm; else expire. Must be >= hotDays. */
  warmDays: number;
}

export function retentionPolicyFromSettings(settings: StoreSettings): RetentionPolicy {
  return { hotDays: settings.hotDays, warmDays: settings.warmDays };
}

/** Days since createdAt (UTC), floored. */
export function ageDays(createdAt: Date, now: Date = new Date()): number {
  const ms = now.getTime() - createdAt.getTime();
  if (Number.isNaN(ms)) throw new Error('invalid createdAt');
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * Tier from docs/storage-retention.md:
 * hot (active review) → warm (audit) → expire (delete candidate).
 */
export function resolveTier(
  createdAt: Date,
  policy: RetentionPolicy,
  now: Date = new Date(),
): RetentionTier {
  if (policy.hotDays < 0 || policy.warmDays < 0) {
    throw new Error('retention days must be non-negative');
  }
  if (policy.warmDays < policy.hotDays) {
    throw new Error('PULSE_STORE_WARM_DAYS must be >= PULSE_STORE_HOT_DAYS');
  }
  const age = ageDays(createdAt, now);
  if (age < policy.hotDays) return 'hot';
  if (age < policy.warmDays) return 'warm';
  return 'expire';
}
