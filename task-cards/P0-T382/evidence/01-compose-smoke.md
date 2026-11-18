# P0-T382 evidence

Env: `--env-file .env.template --profile stream`; `pulse-bus` already healthy from earlier cards (`up --no-deps grid-rules`).

## Unit
`cd apps/grid-rules && npm test` → 21 pass (incl. `FileTail` partial-line/truncate, loop jsonl→findings+alerts jsonl with bad line rejected, idle loop).

## Compose config / build
```
docker compose --env-file .env.template --profile {sense,media,stream,data,obs,store} config   # all ok
git diff -U0 infra/compose | grep -c bitnamilegacy   # 0
docker compose --profile stream build grid-rules      # Image voltpulse/grid-rules:dev Built
```

## Smoke A — file bus (compose defaults)
`up -d --no-deps grid-rules` → healthy. Appended `not-json` + one synthetic `vp.detect.v1` line to `/data/bus/vp.detect.v1.jsonl` in container:
```
/health → loop {"inputs":{"file":true,"kafka":false},"outputs":{"file":true,"kafka":false},"detects":1,"findings":1,"alerts":1,"rejected":1}
/data/bus/vp.findings.v1.jsonl → corrosion, severity medium, risk 52.05, extensions.party_type=oem (asset ctx applied)
/data/bus/vp.alerts.v1.jsonl   → sla_due_at 2026-11-18T04:30:00.000Z, channels push,sms
logs: [grid-rules] rejected /data/bus/vp.detect.v1.jsonl: Unexpected token 'o', "not-json" ...
```

## Smoke B — Kafka in + out
`GRID_RULES_KAFKA_CONSUMER_ENABLED=true GRID_RULES_KAFKA_PRODUCER_ENABLED=true GRID_RULES_KAFKA_FROM_BEGINNING=true` recreate → healthy; `/health` loop inputs.kafka=true outputs.kafka=true. Produced one `vp.detect.v1` (thermal_hotspot 0.95, inspection 5555…) via console-producer; consumed:
```
vp.findings.v1 → inspection 5555…, thermal_hotspot, severity critical, risk 89.28
vp.alerts.v1   → severity critical, sla_due_at 2026-11-18T00:55:00.000Z (15 min)
```
Container removed after smoke; pulse-bus/postgres left running.
