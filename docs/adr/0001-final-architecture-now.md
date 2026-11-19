# ADR 0001 — Final architecture now

- **Status:** accepted
- **Date:** 2026-11-18

## Context

Challenge 09 demo window is short. Redesigning services mid-build burns the schedule.

## Decision

Lock **final deployed architecture** now: Sense / Media / **Realtime event plane** (Kafka + Flink as one `stream` profile) / Apps (data) / Obs / Train / Store as isolated Docker services on one host (multi-box-ready; **hybrid Sense** for product). **Demo Day = central.** **Features phase; architecture does not redesign** for Demo Day.

## Consequences

- New capabilities = cards on existing services/contracts
- Boundary changes require a new ADR + plan update
- Anti-leak naming (`pulse-*`, `grid-*`, `vp.*`) + public brand **TPulse** are part of the freeze
- Binding detail: `docs/tdd.md`, `docs/observability.md`, `docs/retraining.md`, `docs/product/frd.md`
