import type { RetentionPolicy } from './retention-policy.js';
import { resolveTier, type RetentionTier } from './retention-policy.js';
import { assertNotOnHold, LegalHoldError } from './legal-hold.js';
import type { MetaIndex, ObjectMeta } from './object-meta.js';
import type { GetResult, ObjectStore, PutResult } from './types.js';

export interface RetentionStatus {
  key: string;
  createdAt: string;
  legalHold: boolean;
  tier: RetentionTier;
}

/**
 * Object store + retention meta + legal hold gate on delete.
 * E03/E04 thin; M07 = policy injected from env settings.
 */
export class RetentionStore {
  constructor(
    private readonly store: ObjectStore,
    private readonly meta: MetaIndex,
    private readonly policy: RetentionPolicy,
  ) {}

  get backend() {
    return this.store.backend;
  }

  async put(
    key: string,
    body: Buffer | string,
    contentType?: string,
    opts?: { createdAt?: Date; legalHold?: boolean },
  ): Promise<PutResult> {
    const result = await this.store.put(key, body, contentType);
    const existing = await this.meta.get(key);
    const createdAt = (opts?.createdAt ?? new Date()).toISOString();
    await this.meta.upsert({
      key,
      createdAt: existing?.createdAt ?? createdAt,
      legalHold: opts?.legalHold ?? existing?.legalHold ?? false,
    });
    return result;
  }

  async get(key: string): Promise<GetResult> {
    return this.store.get(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.exists(key);
  }

  async setLegalHold(key: string, on: boolean): Promise<ObjectMeta> {
    const existing = await this.meta.get(key);
    if (!existing) {
      if (!(await this.store.exists(key))) {
        throw new Error(`object not found: ${key}`);
      }
      const created: ObjectMeta = {
        key,
        createdAt: new Date().toISOString(),
        legalHold: on,
      };
      await this.meta.upsert(created);
      return created;
    }
    const next = { ...existing, legalHold: on };
    await this.meta.upsert(next);
    return next;
  }

  async status(key: string, now: Date = new Date()): Promise<RetentionStatus> {
    const existing = await this.meta.get(key);
    if (!existing) throw new Error(`meta not found: ${key}`);
    return {
      key,
      createdAt: existing.createdAt,
      legalHold: existing.legalHold,
      tier: resolveTier(new Date(existing.createdAt), this.policy, now),
    };
  }

  /** Keys in expire tier without legal hold — safe delete candidates. */
  async listExpirable(now: Date = new Date()): Promise<string[]> {
    const all = await this.meta.list();
    return all
      .filter((m) => !m.legalHold)
      .filter((m) => resolveTier(new Date(m.createdAt), this.policy, now) === 'expire')
      .map((m) => m.key);
  }

  async delete(key: string): Promise<void> {
    const existing = await this.meta.get(key);
    assertNotOnHold(existing?.legalHold ?? false, key);
    await this.store.delete(key);
    await this.meta.remove(key);
  }
}

export { LegalHoldError };
