# P0-T403 — perception crops → evidence API

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | cost-efficient remaining build |
| Parallel | `no` |
| Branch | `main` |

## Objective

grid-perception posts detection crops (or frame+bbox) to pulse-api `POST /evidence` when enabled.

## Allowed paths

- `apps/grid-perception/**`
- `infra/compose/docker-compose.yml`
- `.env.template`
- `task-cards/P0-T403/**`

## Acceptance criteria

- [x] `GP_EVIDENCE_ENABLED=1` uploads crops via evidence API
- [x] detection rows get `evidence_object_id` when upload succeeds
- [x] unit test without live API (mock HTTP)
- [x] compose/env stubs documented

## Validation

```bash
cd apps/grid-perception && python -m unittest discover -s tests -p 'test_evidence*.py'
```

## Evidence

`./evidence/verify.md`
