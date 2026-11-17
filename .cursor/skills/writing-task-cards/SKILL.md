---
name: writing-task-cards
description: Turn VoltPulse task-plan rows into executable task cards for agents/worktrees.
---

# Writing task cards

Path: `task-cards/<CARD-ID>/CARD.md` + empty `evidence/`.

## Card must include

- Objective (one outcome)
- Input docs (formal paths)
- Allowed paths (hard boundary)
- Acceptance criteria (checkboxable)
- Validation commands
- Deps / parallel notes
- Anti-leak note if UI/docs/contracts touched
- `status: ready|blocked|in_progress|done`

## Parallel design

- One writable owner per path set.
- Prefer app-boundary splits: `pulse-api` / `pulse-web` / `grid-perception` / `packages/contracts`.
- ID scheme: `P0-T001`, `P1-T012`, or `VP-T###`.

## Do not

- Embed long discussion — link plan + docs.
- Allow entire repo as writable paths.
