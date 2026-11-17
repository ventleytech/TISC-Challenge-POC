# @voltpulse/work-order

Pure helpers for VoltPulse feature **A07** (work-order export):

| Input | Role |
|-------|------|
| Finding | `finding_id`, `class_id`, `severity`, optional `risk_score` / `inspection_id` |
| Asset | `id`, `name`, optional `utility_id` / criticality / voltage / OEM |
| Party hint | A04 `party_type` (+ optional A05/A06 `tender_ref` / `warranty_hint`) |

| Output | Encoding |
|--------|----------|
| `WorkOrderRow` | Stable column bag |
| `toCsv(rows)` | Header + RFC4180-ish cells |
| `toJson(rows)` | JSON array |

No I/O. Callers (`pulse-api`, `pulse-web`) supply hydrated finding/asset/hint.

Built as **CommonJS** (`dist/`) so Nest/Jest can `require` the package; run `npm run build` before linking from `pulse-api`.

## API

```ts
import { exportWorkOrders } from '@voltpulse/work-order';

const { rows, csv, json } = exportWorkOrders(
  [
    {
      finding: {
        finding_id: 'f-1',
        inspection_id: 'i-1',
        class_id: 'corrosion',
        severity: 'high',
        risk_score: 0.9,
        asset_id: 'a-1',
      },
      asset: {
        id: 'a-1',
        name: 'Demo Tower T-01',
        utility_id: 'u-1',
        criticality: 'critical',
        voltage_class: '132kV',
        oem: 'DemoTowerCo',
      },
      partyHint: {
        party_type: 'oem',
        warranty_hint: 'warranty_breach_suspect',
        tender_ref: 'VP-TENDER-DEMO-42',
      },
    },
  ],
  { exportedAt: '2026-11-18T00:00:00.000Z' },
);
```

### Columns

`work_order_id`, `finding_id`, `inspection_id`, `asset_id`, `asset_name`,
`utility_id`, `class_id`, `severity`, `risk_score`, `criticality`,
`voltage_class`, `party_type`, `warranty_hint`, `tender_ref`, `oem`,
`recommendation`, `exported_at`

Detection ids match contracts: `crack | sag | corrosion | vegetation | thermal_hotspot`.  
Severity: `critical | high | medium | low | info`.

Party hint is **caller-supplied** (align with `@voltpulse/responsibility` when available). This package does not invent legal responsibility.

## Scripts

```bash
npm install
npm test
npm run build
```
