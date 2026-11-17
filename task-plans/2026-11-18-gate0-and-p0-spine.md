# Plan: Gate 0 detectors + P0 spine scaffold

| Field | Value |
|-------|-------|
| ID | `PLAN-20261118-gate0-and-p0-spine` |
| Status | `active` |
| Owner | overnight agents |
| Created | 2026-11-18 |

## Goal

**Spine plan** (first cards). Full overnight objective is broader — see `local-notes/05-roadmap-assumptions/06-master-execution-plan.md` + `/goal` template in `07-sleep-loop-goal-playbook.md` (entire catalog/scenarios; calendar is not a start gate).

This plan’s slice: prove at least one open detector (prefer corrosion) on this host’s Tesla T4, while scaffolding VoltPulse contracts / Compose / Nest / web shells on disjoint paths — then keep pulling full-catalog cards without waiting for Nov 21.

## Non-goals

- Implementing full `grid-perception` → Kafka → rules glue (blocked until Gate 0.1 evidence)
- DeepStream-only Demo Day path before Ultralytics/ONNX works
- Sag / thermal_hotspot accuracy claims
- Committing `local-notes/`, weights, `.env`, or `graphify-out/`
- Copying any proprietary POC apps/contracts/UI into tracked tree

## Skills for this plan

| Skill / tool | Path | Why |
|--------------|------|-----|
| graphify | `.cursor/skills/graphify` + CLI | Orient before explore |
| using-git-worktrees + subagent-driven-development | `.cursor/skills/…` | Parallel M* vs T* |
| verification-before-completion | `.cursor/skills/verification-before-completion` | Evidence before `done` |
| systematic-debugging | `.cursor/skills/systematic-debugging` | CUDA / install fails |
| hf-cli | Hugging Face skills plugin | Corrosion weight fetch |
| loop / goal | `~/.cursor/skills-cursor/loop`, `goal` | Overnight cadence |
| writing-task-cards | `.cursor/skills/writing-task-cards` | New cards from plan rows |
| rtk / Docker / nvidia-smi | host | Quiet shell; Compose; T4 |

## Gaps to set up

| Item | Req/Opt | Notes |
|------|---------|-------|
| `torch` CUDA + `ultralytics` | **Required** | `P0-M001` |
| Worktree dirs for parallel | **Required** if parallel | Clean git first |
| HF token | Optional | Only if download 401 |

If ML install fails: continue `P0-T002` / `P0-T001` / `P0-T005`; leave Gate 0 blocked — **never fake done**. Read each skill’s `SKILL.md` before use.

## Design notes

Formal (load these, not whole `local-notes/`):

- `docs/architecture.md` — planes, services, `vp.*` topics
- `docs/anti-leak.md` — VoltPulse-only public surfaces
- `docs/adr/0001-final-architecture-now.md` — arch freeze
- `docs/repo-structure.md` — target tree
- `docs/product/requirements.md` — detection enum + P0 spine

Private execution brain (gitignored; agents may read, never commit):

- `local-notes/05-roadmap-assumptions/06-master-execution-plan.md`
- `local-notes/05-roadmap-assumptions/07-sleep-loop-goal-playbook.md`
- `local-notes/05-roadmap-assumptions/08-model-gate-corrosion-crack-vegetation.md`

### Gate 0 sequence (serialize critical path)

```text
P0-M001 (ML host CUDA+ultralytics)
    └──► P0-M002 (corrosion local smoke)     ← unlock Gate0-partial
            └──► P0-M003 / P0-M004 (crack / veg)  [later cards]
                    └──► ONNX ×3 → grid-perception file ingest
```

**Parallel while models bake:** `P0-T002` contracts (no model dep). Optionally `P0-T001` compose + `P0-T005` web shell (disjoint paths). Nest `P0-T003` waits on contracts preferred.

### Anti-leak VoltPulse naming (tracked artifacts)

| Area | VoltPulse |
|------|-----------|
| Brand | VoltPulse only |
| Services | `pulse-gateway`, `grid-perception`, `grid-rules`, `pulse-api`, `pulse-web`, `pulse-notify`, `pulse-train`, `pulse-store` |
| Topics | `vp.detect.*` `vp.findings.*` `vp.alerts.*` `vp.labels.*` `vp.models.*` |
| Compose | project `voltpulse`; profiles `sense` `media` `stream` `data` `obs` `store` |
| Planes | Sense / Media / Stream / Data |
| API | `/api/v1/inspections`, `/assets`, `/alerts` |
| Detection enum | `crack \| sag \| corrosion \| vegetation \| thermal_hotspot` |

Forbidden in this plan’s public outcomes: internal product brand strings, proprietary contracts/topics/UI chrome, secrets, customer corridors.

## Path map

| Area | Paths |
|------|-------|
| ML scratch / smoke | `local-notes/models-experiments/_scratch/**`, `…/corrosion/**` (gitignored tree) |
| Contracts | `packages/contracts/**` |
| Compose | `infra/compose/**`, root `.env.template` |
| API | `apps/pulse-api/**` |
| Web | `apps/pulse-web/**`, `packages/ui-tokens/**` |
| Cards / plan | `task-cards/P0-*`, this file |

## Tasks (ordered)

| # | Card ID | Title | Deps | Parallel | Status |
|---|---------|-------|------|----------|--------|
| 1 | P0-M001 | ML host baseline (CUDA torch + ultralytics) | — | no (GPU host) | done |
| 2 | P0-M002 | Corrosion local smoke / first detection proof | P0-M001 | ok vs T* after M001 | done |
| 2b | P0-M003 | Crack local smoke | P0-M001 | serialize GPU | done |
| 2c | P0-M004 | Vegetation local smoke (AGPL) | P0-M001 | serialize GPU | done |
| 3 | P0-T002 | `packages/contracts` `vp.*` + OpenAPI stubs | — | **ok** vs M* | ready |
| 4 | P0-T001 | Compose profiles skeleton (`voltpulse`) | — | **ok** vs M* / T002 | ready |
| 5 | P0-T005 | `pulse-web` shell + VoltPulse brand | — | **ok** | ready |
| 6 | P0-T003 | `pulse-api` Nest health + OpenAPI mount | P0-T002 | ok vs perception | done |
| 7 | P0-T004 | `pulse-api` in-memory `/api/v1` stubs | P0-T003 | serialize vs api writers | done |
| 8 | P0-T050 | C10 Auth + Energy roles stub (`pulse-api`) | P0-T004 | serialize vs api writers | done |
| 9 | P0-T010 | `grid-perception` file-ingest → `vp.detect.v1` JSON | Gate 0.1 (M002+) | ok vs pulse-* / rules | done |

Suggested overnight pick order: **M001 → M002 → T002 → T001 → T005 → T003 → T004 → T050**; after Gate 0.1 → **T010**.

Merge order (morning): **contracts → compose → api → web**; perception after Gate 0.1 evidence (`P0-T010`).

## Risks

| Risk | Mitigation |
|------|------------|
| Anti-leak / clone smell | Naming map + `pr-review`; no proprietary paste |
| Fake Gate 0 done | `verification-before-completion` + annotated evidence |
| AGPL YOLO / veg weights | Smoke local; retrain permissive before ship |
| Disk pressure | Slim YOLO; purge `_scratch`; stop if &lt;10G free |
| Compose path collision | One owner of `docker-compose.yml` (`P0-T001`) |
| GPU contention | One model worktree on T4 at a time |

## Done when

- [x] P0-M001 evidence: CUDA import + ultralytics version
- [x] P0-M002 evidence: ≥1 annotated corrosion detection on T4
- [x] P0-M003 evidence: ≥1 annotated crack/broken box on T4
- [x] P0-M004 evidence: ≥1 annotated Powerline OBB on T4 (AGPL smoke)
- [ ] P0-T002 stubs exist for `vp.*` + OpenAPI skeleton
- [ ] Optional: T001 / T005 scaffold with smoke cmds
- [ ] No secrets / internal brands in tracked diffs
- [ ] Formal `docs/` updated only if contract/arch decision changes
