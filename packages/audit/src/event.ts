import { randomUUID } from 'node:crypto';
import type { AuditEvent, AuditEventInput } from './types.js';

function utcNowIso(): string {
  return new Date().toISOString();
}

function requireNonEmpty(name: string, value: string): string {
  const v = value.trim();
  if (!v) {
    throw new Error(`audit: ${name} is required`);
  }
  return v;
}

/**
 * Build a validated audit event. Does not persist.
 * `detail` is shallow-cloned so callers cannot mutate the returned object later.
 */
export function createAuditEvent(input: AuditEventInput): AuditEvent {
  const actor_id = requireNonEmpty('actor_id', input.actor_id);
  const action = requireNonEmpty('action', input.action);
  const entity_type = requireNonEmpty('entity_type', input.entity_type);
  const entity_id = requireNonEmpty('entity_id', input.entity_id);

  const event: AuditEvent = {
    event_id: input.event_id?.trim() || randomUUID(),
    actor_id,
    occurred_at: input.occurred_at?.trim() || utcNowIso(),
    action,
    entity_type,
    entity_id,
  };

  if (input.utility_id !== undefined) {
    event.utility_id = requireNonEmpty('utility_id', input.utility_id);
  }
  if (input.detail !== undefined) {
    event.detail = { ...input.detail };
  }

  return Object.freeze(event) as AuditEvent;
}
