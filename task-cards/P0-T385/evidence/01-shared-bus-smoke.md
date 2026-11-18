# P0-T385 evidence

Isolated project `-p vp385` (clean volume `vp385_pulse_bus_files`, host ports 3420/8754) so other worktrees' stacks/volumes untouched.
`PULSE_GATEWAY_DETECT_SINK=file ... --profile media --profile stream up -d --build --no-deps pulse-gateway grid-rules` → both healthy.

## Config
```
docker compose --env-file .env.template --profile {sense,media,stream,data,obs,store} config   # all ok
config shows pulse_bus_files → /data/bus on pulse-gateway and grid-rules; volume name voltpulse_pulse_bus_files
git diff -U0 | grep -c bitnamilegacy   # 0
```

## Smoke
POST `/sessions` (rtsp, live/feeder-demo) → POST `/sessions/<id>/frames` (corrosion 0.9) → `202 sink=file`. After 4 s:
```
gateway /data/bus: vp.detect.v1.jsonl 364B, vp.findings.v1.jsonl 375B, vp.alerts.v1.jsonl 342B  (owner node)
rules   /data/bus: identical listing
gateway wc -l findings=1 alerts=1   # rules output visible back in gateway container
grid-rules /health loop: detects=1 findings=1 alerts=1 rejected=0
findings: corrosion, severity medium, risk 34.02; alert emitted
```
Teardown: `down -v` on `vp385` only.
