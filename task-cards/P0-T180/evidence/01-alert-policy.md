# P0-T180 evidence — `@voltpulse/alert-policy`

**Branch:** `vp/P0-T180-alert-policy`  
**Date:** 2026-11-18  
**Host:** packages-only worktree `/home/ubuntu/voltpulse-P0-T180`

## Tree

```text
packages/alert-policy/
  config/default-policy.json
  src/{types,defaults,load,channels,sla,index}.ts
  test/{load,channels,sla}.test.ts
  .env.template
  package.json
  README.md
```

## Validation

```bash
cd packages/alert-policy && npm ci && npm test && npm run build
```

Result (2026-11-18):

```text
ℹ tests 12
ℹ suites 3
ℹ pass 12
ℹ fail 0
npm run build → tsc OK (dist/*.js + .d.ts)
```

## Behavior checked

| Area | Proof |
|------|--------|
| M05 channels | default push/sms mock on; email off; `resolveChannels` drops disabled/`off` |
| M06 SLA map | critical 15 / high 60 / medium 240 / low 1440 / info 10080 |
| `slaDueAt` | `2026-11-18T00:00:00Z` + critical → `…T00:15:00.000Z` |
| JSON + env | custom path load; `VP_ALERT_SLA_*` / `VP_ALERT_CHANNEL_*` overlays |

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' packages/alert-policy
# no matches (exit 1)
```

VoltPulse severity + `push|sms|email` only. No proprietary catalogs.
