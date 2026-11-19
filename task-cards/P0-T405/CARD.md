# P0-T405 — CUDA perception Compose image smoke

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | cost-efficient remaining build |
| Parallel | `no` |
| Branch | `main` |

## Objective

CUDA-capable grid-perception image + compose profile; smoke ≥1 Gate0 class (corrosion).

## Allowed paths

- `apps/grid-perception/Dockerfile.cuda`
- `apps/grid-perception/scripts/**`
- `apps/grid-perception/README.md`
- `infra/compose/docker-compose.yml`
- `infra/compose/README.md`
- `.env.template`
- `task-cards/P0-T405/**`

## Acceptance criteria

- [x] `Dockerfile.cuda` (nvidia base + perception code)
- [x] Compose profile `sense-cuda` with GPU + weight/venv mounts
- [x] Smoke ≥1 Gate0 class (corrosion) with evidence
- [x] CPU alpine image unchanged as default `sense`

## Evidence

`./evidence/verify.md`
