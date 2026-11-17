# P0-T120 evidence — compliance report HTML stub

Date: 2026-11-18  
Branch: `vp/P0-T120-compliance-report`  
Host Python: 3.10.12

## What shipped

`packages/compliance-report` — stdlib-only HTML stub **toward PDF** from inspection summary JSON (`utility_id`, findings counts, risk).

## Commands

```bash
cd packages/compliance-report
python3 -m tests.test_render
python3 -m compliance_report fixtures/sample_summary.json /tmp/vp-compliance-stub.html
rg -n 'VoltPulse|toward PDF|utility_id' /tmp/vp-compliance-stub.html
rg -ni 'trinetra|t-netra|tnetra' packages/compliance-report || true
```

## Outputs (abridged)

```
PASS test_render
wrote /tmp/vp-compliance-stub.html
40:  ... VoltPulse compliance report stub — HTML artifact toward PDF ...
41:  <p class="brand">VoltPulse</p>
44:    utility_id: <strong>util-demo-01</strong><br />
67:    Package: compliance-report · Brand: VoltPulse · Format: HTML stub toward PDF
anti-leak: clean
```

## Tree

```
packages/compliance-report/
  README.md
  compliance_report/{__init__,__main__,summary,render}.py
  fixtures/sample_summary.json
  scripts/smoke_render.sh
  tests/test_render.py
```

## Anti-leak

- Brand: VoltPulse only
- Package name: `compliance-report` (distinct from audit / responsibility)
- No proprietary strings in package tree (`rg` clean)

## Result

AC met. Real PDF engine deferred; HTML contract ready for later renderer swap.
