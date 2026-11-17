# ADR 0001 — Final architecture now

- **Status:** accepted
- **Date:** 2026-11-18

## Context

Challenge 09 demo window is short. Redesigning services mid-build burns the schedule.

## Decision

Lock **final deployed architecture** now: Sense / Media / Stream / Data planes as isolated Docker services on one host (multi-box-ready via Compose profiles). **Features phase; architecture does not redesign** for Demo Day.

## Consequences

- New capabilities = cards on existing services/contracts
- Boundary changes require a new ADR + plan update
- Anti-leak naming (`pulse-*`, `grid-*`, `vp.*`) is part of the freeze
