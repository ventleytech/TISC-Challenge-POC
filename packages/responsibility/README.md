# @voltpulse/responsibility

Pure helpers for VoltPulse scenario **S9** (features **A04–A06**):

| Feature | Output |
|---------|--------|
| A04 Responsible-party hint | `party_type` |
| A05 Tender/contract ref | `tender_ref` (passthrough) |
| A06 Warranty breach hint | `warranty_hint` |

No I/O. Callers (`grid-rules`, `pulse-api`) supply finding `class_id` + asset OEM/warranty fields.

## API

```ts
import { hintResponsibility } from '@voltpulse/responsibility';

const hint = hintResponsibility({
  class_id: 'corrosion',
  asOf: '2026-06-15T12:00:00.000Z',
  asset: {
    oem: 'DemoTowerCo',
    warranty_end: '2027-01-01',
    anti_corrosion_sla_end: '2026-12-31',
    tender_ref: 'VP-TENDER-DEMO-42',
  },
});
// → { party_type: 'oem', warranty_hint: 'warranty_breach_suspect', tender_ref: 'VP-TENDER-DEMO-42' }
```

### `party_type`

`oem` · `installer` · `epc` · `maintenance_contractor` · `vegetation_contractor` · `utility` · `unknown`

Heuristic (Demo Day stub — not legal advice):

| Finding | In OEM warranty / SLA | Otherwise |
|---------|----------------------|-----------|
| `corrosion` | `oem` | `maintenance_contractor` |
| `crack` / `thermal_hotspot` | `oem` | `utility` |
| `sag` | `installer` | `utility` |
| `vegetation` | `vegetation_contractor` | same |

### `warranty_hint`

| Value | Meaning |
|-------|---------|
| `no_warranty_data` | No usable `warranty_end` (and no corrosion SLA) |
| `in_warranty` | Within `warranty_end`; class not treated as OEM breach suspect |
| `warranty_expired` | Past `warranty_end` |
| `warranty_breach_suspect` | Within warranty and class typically OEM-covered (`crack` / `corrosion` / `thermal_hotspot`) |
| `sla_active` | Corrosion within `anti_corrosion_sla_end` when not already breach-suspect |

Detection ids match `packages/contracts`: `crack | sag | corrosion | vegetation | thermal_hotspot`.

## Scripts

```bash
npm install
npm test
npm run build
```
