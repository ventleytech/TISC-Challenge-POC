# P0-T337 — `utility_id` on `vp.findings.v1`

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T337-findings-utility-id` |
| Deps | T330 (consumer), T335 (producer), T336 (gap noted) |

## Objective

Close the T336 residual gap: a finding with unknown inspection and no env default was skipped (data dropped). Carry tenant on the event.

## Allowed paths

- `packages/contracts/events/findings/**`, `packages/contracts/events/catalog.yaml`
- `apps/grid-rules/src/{types,rules-engine}.ts`, `apps/grid-rules/test/rules-engine.test.ts`
- `apps/pulse-api/src/ingest/ingest.service{,.spec}.ts`, `apps/pulse-api/README.md`
- `task-cards/P0-T337/**`

## Decision: optional, not required

Top-level `utility_id` (uuid string) is **optional** on `vp.findings.v1`. Reason: additive/v1-compatible (old producers + in-flight messages still valid); `additionalProperties:false` means consumers on the old schema would reject a *required* new field only via producers, but optional keeps rollout order free. Producer sets it only when resolvable (asset context `utility_id`); never invented.

## Contract shape

```json
{ "event_id": "…", "occurred_at": "…", "inspection_id": "…",
  "utility_id": "<uuid, optional>", "finding": { … } }
```

## Consumer resolution (pulse-api `IngestService.ingestFinding`)

`stored inspection.utility_id` > `event.utility_id` > `PULSE_KAFKA_DEFAULT_UTILITY_ID` > reject (skip + warn, offset advances).
Inspection row stays authoritative (tenant isolation: event cannot override a known inspection).

## Acceptance criteria

- [x] Schema + types carry optional `utility_id`
- [x] grid-rules emits it when asset has `utility_id`; omitted otherwise
- [x] pulse-api persists unknown-inspection finding with event `utility_id`, no default
- [x] Precedence tests (event > default; inspection > event)
- [x] No infra/compose edits; anti-leak clean

## Follow-up (not done)

DLQ topic (e.g. `vp.findings.dlq.v1`) for still-unresolvable findings — needs topic in `infra/kafka` + producer in consumer; not cheap. Today: skip + warn log. Also: detect events do not carry `utility_id`, so producers without asset context still omit it.

## Evidence

`evidence/01-tests.md`.
