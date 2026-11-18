# P0-T403 evidence

## Commands

```bash
cd apps/grid-perception && PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_evidence*.py' -v
```

## Results

- 2 tests OK (mock HTTP evidence create; crop_bytes payload)
- `GP_EVIDENCE_ENABLED=1` wires `attach_crops` in `loop.process_file`
- Compose env stubs for API base/key/utility

## Anti-leak

VoltPulse only; util-demo-01 fixture.
