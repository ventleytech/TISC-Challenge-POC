# @voltpulse/audit

Append-only audit event helper for VoltPulse (W09 immutable audit trail).

## Event shape

| Field | Meaning |
|-------|---------|
| `actor_id` | Who |
| `occurred_at` | When (ISO-8601 UTC) |
| `action` | What (e.g. `finding.ack`, `label.create`) |
| `entity_type` / `entity_id` | Target |
| `utility_id` | Optional tenancy scope |
| `detail` | Optional structured note |

## API

- `createAuditEvent(...)` — build a validated event (does not persist)
- `AppendOnlyAuditLog.append(input)` — append; returns frozen event
- `list` / `filter` — read-only queries
- **No** update / delete / rewrite APIs

Storage is in-memory by default (tests + Nest adapter can wrap later).
