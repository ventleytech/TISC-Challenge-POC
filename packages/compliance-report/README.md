# packages/compliance-report

VoltPulse **W06** compliance report stub. Turns inspection summary JSON into an HTML artifact labeled **toward PDF** (stdlib only — no PDF engine yet).

## Layout

```
compliance-report/
  README.md
  compliance_report/   # library + CLI
  fixtures/            # sample summary JSON
  tests/
  scripts/
```

## Summary JSON (stub contract)

Required fields:

| Field | Type | Notes |
|-------|------|-------|
| `inspection_id` | string | Inspection UUID / id |
| `utility_id` | string | Multi-utility scope |
| `findings_counts` | object | Counts keyed by detection id |
| `risk` | object | `{ "score": number, "level": string }` |

Optional: `status`, `generated_at`, `title`.

Detection keys: `crack` · `sag` · `corrosion` · `vegetation` · `thermal_hotspot`

## CLI

```bash
python3 -m compliance_report fixtures/sample_summary.json /tmp/vp-compliance-stub.html
```

## Tests

```bash
python3 -m tests.test_render
```

## Roadmap

Stub HTML → later swap renderer (WeasyPrint / Chromium) without changing the summary JSON shape. Package name stays `compliance-report` (distinct from audit / responsibility packages).
