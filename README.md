# VoltPulse

Public TISC face for **Challenge 09 — Drone Based Monitoring** (Energy).

AI inspection of feeders, lines, and substations: **crack, sag, corrosion, vegetation, thermal hotspot** — ranked by **severity × criticality**, with **push/SMS + SLA**, plus asset intelligence, vendor mapping, scheduling, evidence governance, observability, and retrain loops.

**Final architecture now** (isolated Docker services on one host; multi-box-ready planes). Features phase; architecture does not redesign later.

**Not** branded as an internal product. Fresh stack — conceptual open-source parity only; **no proprietary code copy**.

Agents: start at [`AGENTS.md`](AGENTS.md).

## Spec-driven workflow

```
plan → task-plan → task-cards → implement → evidence → review → test → deploy
```

| Path | Role | Git |
|------|------|-----|
| `task-plans/` | Design + ordered tasks before cards | Tracked |
| `task-cards/` | Executable cards + per-card `evidence/` | Tracked (text) |
| `docs/` | Finalized formal docs only | Tracked |
| `local-notes/` | Internal discussion / drafts / Q&A | **Ignored** |
| `.cursor/rules/` · `.cursor/skills/` | Project rules + workflow skills | Tracked |
| `scripts/` | graphify init, card status | Tracked |

Parallel work: disjoint cards → separate worktrees/subagents (see `.cursor/rules/40-parallel-worktrees.mdc`).

## Formal docs

| Doc | Content |
|-----|---------|
| [`docs/product/overview.md`](docs/product/overview.md) | Intent + locked decisions |
| [`docs/product/requirements.md`](docs/product/requirements.md) | Slim requirements |
| [`docs/product/feature-catalog.md`](docs/product/feature-catalog.md) | Slim feature IDs |
| [`docs/product/submission-1500.md`](docs/product/submission-1500.md) | ≤1500-char form text |
| [`docs/architecture.md`](docs/architecture.md) | Planes, ownership, stack |
| [`docs/repo-structure.md`](docs/repo-structure.md) | Monorepo map |
| [`docs/storage-retention.md`](docs/storage-retention.md) | Evidence IDs + tiers |
| [`docs/anti-leak.md`](docs/anti-leak.md) | Distinctness checklist |
| [`docs/adr/`](docs/adr/) | Decision records |

Longer drafts, scenarios, deck outlines, assumptions dumps → **`local-notes/`** (local only, not git-tracked).

## Timeline

| Window | Focus |
|--------|--------|
| **Nov 18–20** | Architecture lock · ≤1500-char form · deck |
| **Nov 21–30** | Parallel build on stable arch |
| **Dec 1** | Demo Day |

## Tooling

- **caveman** / **rtk** — token-efficient agent + shell (user `~/.cursor` rules/skills)
- **graphify** — `./scripts/graphify-init.sh` (CLI may already be installed)
- **ponytail** — optional; stub skill only unless you ask to install

## Status

SDD scaffold + slim formal docs in place. Product code build window Nov 21–30.
