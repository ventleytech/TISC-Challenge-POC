# TPulse

Public TISC face for **Challenge 09 — Drone Based Monitoring** (Energy).

AI inspection of feeders, lines, and substations: **crack, sag, corrosion, vegetation, thermal hotspot** — ranked by **severity × criticality**, with **push/SMS + SLA**, plus asset intelligence, vendor mapping, scheduling, evidence governance, observability, and **automatic** continuous training.

**Final architecture now** (isolated Docker services on one host; multi-box-ready / hybrid Sense). Features phase; architecture does not redesign later. **Kafka + Flink = one Realtime event plane.**

**Not** branded as an internal competitor product. Fresh stack — conceptual open-source parity only; **no proprietary code copy**.

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
| `local-notes/` | Internal discussion / decks / PDFs / Q&A | **Ignored** |
| `.cursor/rules/` · `.cursor/skills/` | Project rules + workflow skills | Tracked |
| `scripts/` | graphify init, card status | Tracked |

Parallel work: disjoint cards → separate worktrees/subagents (see `.cursor/rules/40-parallel-worktrees.mdc`).

## Formal docs

| Doc | Content |
|-----|---------|
| [`docs/product/overview.md`](docs/product/overview.md) | Intent + locked decisions |
| [`docs/product/frd.md`](docs/product/frd.md) | Functional requirements (full) |
| [`docs/product/requirements.md`](docs/product/requirements.md) | Slim requirements index |
| [`docs/product/feature-catalog.md`](docs/product/feature-catalog.md) | Slim feature IDs |
| [`docs/architecture.md`](docs/architecture.md) | Planes, ownership, stack |
| [`docs/tdd.md`](docs/tdd.md) | Technical design + diagrams |
| [`docs/observability.md`](docs/observability.md) | Three-pillar observability guide |
| [`docs/retraining.md`](docs/retraining.md) | Automatic CT guide |
| [`docs/repo-structure.md`](docs/repo-structure.md) | Monorepo map |
| [`docs/storage-retention.md`](docs/storage-retention.md) | Evidence IDs + tiers |
| [`docs/anti-leak.md`](docs/anti-leak.md) | Distinctness checklist |
| [`docs/adr/`](docs/adr/) | Decision records |

Decks, 1500-char drafts, Gemma prompts, teammate PDFs → **`local-notes/`** (local only, not git-tracked).

## Timeline

| Window | Focus |
|--------|--------|
| **Nov 18–20** | Architecture lock · formal FRD/TDD/obs/retrain |
| **Nov 21–30** | Parallel build on stable arch |
| **Dec 1** | Demo Day |

## Tooling

- **caveman** / **rtk** — token-efficient agent + shell (user `~/.cursor` rules/skills)
- **graphify** — `./scripts/graphify-init.sh` (CLI may already be installed)
- **ponytail** — optional; stub skill only unless you ask to install

## Status

SDD scaffold + slim formal docs in place. Product code build window Nov 21–30.
