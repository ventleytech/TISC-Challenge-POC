# VoltPulse — Agent entrypoint

Public TISC Challenge 09 (Energy) face. Fresh stack. **Anti-leak first.**

## Where things live

| Path | Role | Git |
|------|------|-----|
| `task-plans/` | Design + ordered task list **before** cards | Tracked |
| `task-cards/` | Executable cards (+ `evidence/` per card) | Tracked (text); big blobs ignored |
| `docs/` | Finalized formal docs only | Tracked |
| `local-notes/` | Discussion, Q&A, drafts | **Ignored** |
| `.cursor/rules/` | Always-on + scoped project rules | Tracked |
| `.cursor/skills/` | VoltPulse workflow skills | Tracked |
| `scripts/` | Lightweight helpers (graphify, card status) | Tracked |

## Spec-driven loop

```
plan → task-plan → task-cards → implement → evidence → review → test → deploy
```

1. Brainstorm / lock decisions → write or update `task-plans/<id>.md`.
2. Split into parallelizable `task-cards/<CARD-ID>/CARD.md` (or `task-cards/<CARD-ID>.md`).
3. Agent picks **one** ready card; load only listed docs + matching rules.
4. Implement in allowed paths; attach evidence under card `evidence/`.
5. Update formal `docs/` only when decision/contract lands (not chat dumps).
6. PR review (`pr-review` skill) → tests → deploy/smoke.

## Pick next task

1. Open latest `task-plans/*` status section.
2. Prefer cards marked `status: ready` with unmet deps cleared.
3. Skip blocked / in-progress owned by another worktree.
4. One card per agent/worktree unless card says otherwise.

## Anti-leak (non-negotiable)

- Brand **VoltPulse** only. No internal product names in code, README, UI, decks, submission.
- No proprietary source/contracts/topics/UI chrome paste.
- No secrets, customer lists, internal weight filenames.
- See `docs/anti-leak.md` + rule `30-anti-leak.mdc`.

## Evidence required

Card done only when acceptance checks pass **and** evidence notes (commands + short output / screenshots refs) sit under the card’s `evidence/`.

## Memory (elephant / goldfish)

- **Elephant (pin):** `AGENTS.md`, `docs/**` frozen decisions, active task-plan, current card.
- **Goldfish (local):** long Q&A → `local-notes/` (gitignored).
- Do not stuff chat dumps into `docs/`.

## Tooling pointers

- **caveman** / **rtk**: user rules under `~/.cursor/rules/` — keep agent output + shell terse.
- **graphify**: `scripts/graphify-init.sh` or skill `graphify` — query code graph before blind greps when graph exists.
- **ponytail**: optional; see `.cursor/skills/ponytail/SKILL.md` (not required).
