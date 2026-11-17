---
name: writing-plans
description: Write VoltPulse task-plans before task cards or code. Use when multi-step work needs ordered tasks and deps.
---

# Writing plans (VoltPulse)

Save to: `task-plans/<YYYY-MM-DD>-<slug>.md` (use `_TEMPLATE.md`).

## Contents

1. Goal + non-goals
2. Design notes (link `docs/` — not whole local-notes)
3. File/path map
4. Ordered tasks with deps + suggested parallelism
5. Risks (anti-leak, GPU, contracts)
6. Status table

## Rules

- Bite-sized tasks → each becomes one card later.
- Disjoint paths → mark `parallel: ok`.
- Shared contracts/migrations → serialize.
- YAGNI / TDD bias; no proprietary paste.

## Next

`writing-task-cards` for ready tasks.
