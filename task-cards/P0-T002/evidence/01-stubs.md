# P0-T002 evidence — contracts stubs

Date: 2026-11-18  
Branch: `vp/P0-T002-contracts`

## Commands

```bash
test -d packages/contracts
find packages/contracts -type f | sort
rg -n 'vp\.(detect|findings|alerts|labels|models)' packages/contracts
rg -n '/api/v1/(inspections|assets|alerts)' packages/contracts
rg -ni 'trinetra|t-netra|tnetra' packages/contracts && exit 1 || true
graphify update .
```

## Tree

```
packages/contracts/README.md
packages/contracts/enums/detection.json
packages/contracts/enums/inspection-status.json
packages/contracts/enums/severity.json
packages/contracts/events/alerts/vp.alerts.v1.schema.json
packages/contracts/events/catalog.yaml
packages/contracts/events/detect/vp.detect.v1.schema.json
packages/contracts/events/findings/vp.findings.v1.schema.json
packages/contracts/events/labels/vp.labels.v1.schema.json
packages/contracts/events/models/vp.models.v1.schema.json
packages/contracts/openapi/openapi.yaml
```

## Validation results

- `test -d packages/contracts` — pass
- Topic stubs present for `vp.detect.*`, `vp.findings.*`, `vp.alerts.*`, `vp.labels.*`, `vp.models.*` (catalog + one schema each)
- OpenAPI + README list `/api/v1/inspections`, `/api/v1/assets`, `/api/v1/alerts`
- Detection enum: `crack | sag | corrosion | vegetation | thermal_hotspot`
- Inspection status: `planned | in_progress | processing | review | closed | cancelled`
- Anti-leak grep (`trinetra|t-netra|tnetra`): **no matches**
- `graphify update .` — rebuilt (AST); JSON schemas may be zero-node (expected for data stubs)

## Anti-leak checklist

- [x] VoltPulse names only (`vp.*`, pulse/grid in comments)
- [x] No proprietary topic catalog / OpenAPI paste
- [x] Fresh stubs only
