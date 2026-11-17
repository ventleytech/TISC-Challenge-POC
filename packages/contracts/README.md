# packages/contracts

VoltPulse shared contracts: Kafka topic / event stubs (`vp.*`) and OpenAPI skeleton for `pulse-api`.

## Layout

```
contracts/
  README.md
  enums/           # detection + inspection status
  events/          # vp.* topic catalog + per-domain stubs
  openapi/         # /api/v1 OpenAPI skeleton
```

## Topic families

| Prefix | Producer (emit) | Consumer notes |
|--------|-----------------|----------------|
| `vp.detect.*` | `grid-perception` | Detections + short evidence refs |
| `vp.findings.*` | `grid-rules` | Ranked findings (Nest persists) |
| `vp.alerts.*` | `grid-rules` | Severity/SLA alerts (Nest persists) |
| `vp.labels.*` | `pulse-api` / label flow | Operator labels → retrain loop |
| `vp.models.*` | `pulse-train` | Registry / reload signals |

## API surface (stub)

- `GET/POST /api/v1/inspections`
- `GET/POST /api/v1/assets`
- `GET/POST /api/v1/alerts`

Enums and schemas here are stubs for Nest and rules to mount. No proprietary topic catalogs.

## Detection IDs

`crack` · `sag` · `corrosion` · `vegetation` · `thermal_hotspot`

## Inspection status

`planned` · `in_progress` · `processing` · `review` · `closed` · `cancelled`
