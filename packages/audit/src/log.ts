import { createAuditEvent } from './event.js';
import type { AuditEvent, AuditEventInput, AuditFilter } from './types.js';

/**
 * In-memory append-only audit log (W09).
 * No update / delete / replace — mutation methods throw.
 */
export class AppendOnlyAuditLog {
  #events: AuditEvent[] = [];

  /** Append one event. Returns the frozen stored copy. */
  append(input: AuditEventInput): AuditEvent {
    const event = createAuditEvent(input);
    this.#events.push(event);
    return event;
  }

  /** Snapshot of all events in append order (oldest first). */
  list(): readonly AuditEvent[] {
    return this.#events.slice();
  }

  /** Filter without mutating the log. Order preserved (oldest first). */
  filter(query: AuditFilter = {}): AuditEvent[] {
    return this.#events.filter((e) => matches(e, query));
  }

  get size(): number {
    return this.#events.length;
  }

  /** Explicitly forbidden — immutable trail. */
  update(_eventId: string, _patch: Partial<AuditEvent>): never {
    throw new Error('audit: update is not allowed (append-only)');
  }

  /** Explicitly forbidden — immutable trail. */
  delete(_eventId: string): never {
    throw new Error('audit: delete is not allowed (append-only)');
  }

  /** Explicitly forbidden — immutable trail. */
  clear(): never {
    throw new Error('audit: clear is not allowed (append-only)');
  }
}

function matches(e: AuditEvent, q: AuditFilter): boolean {
  if (q.actor_id !== undefined && e.actor_id !== q.actor_id) return false;
  if (q.action !== undefined && e.action !== q.action) return false;
  if (q.entity_type !== undefined && e.entity_type !== q.entity_type) return false;
  if (q.entity_id !== undefined && e.entity_id !== q.entity_id) return false;
  if (q.utility_id !== undefined && e.utility_id !== q.utility_id) return false;
  if (q.since !== undefined && e.occurred_at < q.since) return false;
  if (q.until !== undefined && e.occurred_at > q.until) return false;
  return true;
}
