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
| Detector stubs (C04 remaining) | `packages/detector-fallbacks/**` |
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
| 6 | P0-T003 | `pulse-api` Nest health + OpenAPI mount | P0-T002 | ok vs perception | blocked |
| 7 | P0-T010 | `grid-perception` file-ingest → `vp.detect.v1` JSON | Gate 0.1 (M002+) | ok vs pulse-* / rules | done |
| 8 | P0-T011 | ONNX export notes (all three Gate0 ONNX on disk) | M003/M004/T010 | ok vs pulse-* | done |
| 9 | P0-T020 | `grid-rules` findings/alerts + W01 risk (fixture bus) | P0-T002 | ok vs pulse-* / perception | done |
| 10 | P0-T130 | S2 file-bus smoke: detect → rules → evidence JSON | P0-T010, P0-T020 | ok vs pulse-api/web/store | done |
| 10b | P0-T300 | S2 bus E2E: detect → rules → pulse-api findings/alerts | P0-T130, P0-T003 | ok vs web/store | done |
| 11 | P0-T160 | Honest `sag` + `thermal_hotspot` stubs (C04 remaining) | contracts enum | **ok** vs T130 / perception | done |
| 12 | P0-T240 | Wire perception fallbacks for `sag` / `thermal_hotspot` | T160, T130 | ok vs pulse-web | done |
| 13 | P0-T060 | Schedule wizards + assets UI shells (S8/A01) | P0-T005 | **ok** vs api auth (web-only) | done |
| 14 | P0-T170 | C09 priority board + alerts SLA/ack (mock) | P0-T060 | **ok** vs api (web-only) | done |
| 15 | P0-T230 | Wow pulse-web redesign (brand + density) | P0-T170 | no (web) | done |
| 16 | P0-T310 | Postgres behind pulse-api (kill MemoryStore) | T004 + compose data | serialize vs other pulse-api writers | done |
| 16 | P0-T320 | pulse-web live API + real ack/write | T230, T300 | ok vs T310 (tiny ack only) | done |
| 17 | P0-T330 | pulse-api Kafka consumer (vp.findings/alerts → store) | T300, T310, T210 | ok vs web | done |
| 18 | P0-T337 | `utility_id` on `vp.findings.v1` | T330 | ok vs T350/T360 | done |
| 19 | P0-T340 | Compose real images: pulse-api/web/grid-rules/grid-perception | T330 | no vs compose | done |
| 20 | P0-T350 | Evidence API + MinIO store + Evidence page | T330, T340 | ok vs T360/T365 | done |
| 21 | P0-T360 | pulse-notify real channel sink | T330, T340 | ok vs T350 | done |
| 22 | P0-T365 | pulse-notify Kafka consumer | T360 | no vs web | done |
| 23 | P0-T370 | Compose hygiene scrub (anti-leak) | T340 | no vs compose | done |
| 23 | P0-T371 | MinIO image re-pin (`bitnamilegacy` tag+digest) | T110, T350 | no vs compose | done |
| 24 | P0-T380 | pulse-gateway pull targets + env-gated synthetic `vp.detect.v1` | T040 | ok vs compose | done |
| 25 | P0-T381 | pulse-gateway real Docker image + compose service | T380, T371 | no vs compose | done |
| 26 | P0-T382 | grid-rules compose runs real rules loop (file/Kafka) | T340, T381 | no vs compose | done |
| 26 | P0-T383 | pulse-notify real Docker image + compose service | T360, T365, T381 | no vs compose | done |
| 27 | P0-T384 | grid-perception compose runs file-ingest loop (not health-only) | T010, T240, T340 | no vs compose | done |
| 27 | P0-T385 | shared `pulse_bus_files` volume: pulse-gateway ↔ grid-rules file bus | T381, T382 | no vs compose | done |
| 28 | P0-T390 | compose file-bus E2E smoke (`-p vp390`): gateway → bus → rules → api+pg | T385, T300 | yes | done |
| 29 | P0-T393 | grid-rules HTTP sink → pulse-api (in-container bridge; replaces T390 host glue) | T390 | yes | done |

Suggested overnight pick order: **M001 → M002 → T002 → T001 → T005 → T003**; after Gate 0.1 → **T010 → T020 → T130**; web via **T060 → T170 → T230**.

Merge order (morning): **contracts → compose → api → web**; perception after Gate 0.1 evidence (`P0-T010`); rules + S2 glue (`P0-T020`, `P0-T130`); prefer T230 tip for `apps/pulse-web`.

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
- [x] P0-T010 / P0-T020 / P0-T130: detect → rules file-bus smoke with evidence
- [x] P0-T300: detect → rules → pulse-api findings/alerts HTTP ingest E2E with evidence
- [x] P0-T160 honest sag/thermal fallbacks under `packages/detector-fallbacks` (no accuracy claims)
- [x] P0-T240 perception emits honest empty/low-conf `vp.detect.v1` + reason for sag/thermal
- [x] P0-T230 wow pulse-web on main (`apps/pulse-web`, `packages/ui-tokens`)
- [x] P0-T337 optional `utility_id` on `vp.findings.v1`
- [x] P0-T340 compose real images for api/web/rules/perception
- [x] P0-T350 evidence API + MinIO store + Evidence page
- [x] P0-T360 pulse-notify real channel sink
- [x] P0-T365 pulse-notify Kafka consumer
- [x] P0-T370 compose hygiene scrub
- [x] P0-T371 MinIO image re-pin
- [x] P0-T380 pulse-gateway pull stub + detect sink
- [x] P0-T381 pulse-gateway Docker image + compose
- [x] P0-T382 grid-rules compose rules loop
- [x] P0-T383 pulse-notify Docker image + compose
- [x] P0-T384 grid-perception compose file-ingest loop
- [x] P0-T385 shared compose file-bus volume (gateway ↔ rules)
- [x] P0-T390 compose file-bus E2E smoke (file bus + HTTP glue; Kafka not in path)
- [x] P0-T393 grid-rules HTTP sink → pulse-api (T390 script now read-only; project `vp393`)
- [ ] No secrets / internal brands in tracked diffs
- [ ] Formal `docs/` updated only if contract/arch decision changes
