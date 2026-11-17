# P0-T280 evidence — grid-rules × alert-policy

Branch: `vp/P0-T280-rules-alert-policy`  
Worktree: `/home/ubuntu/voltpulse-P0-T280` (from `vp/P0-T190-rules-responsibility` + cherry-pick T180)

## Commands

```bash
cd packages/alert-policy && npm ci && npm test && npm run build
# → 12 pass

cd apps/grid-rules && npm install && npm test && npm run smoke
# → 15 pass
```

## Unit tests (excerpt)

- `loadSettings alert-policy wiring` — defaults match `DEFAULT_ALERT_POLICY`; `VP_ALERT_*` wins over legacy `GRID_RULES_SLA_*`
- `slaDueAt (via alert-policy)` — package minutes + overlays
- `alert channels follow alert-policy enable flags` — disabled `sms` dropped; enabled `email` kept

## Smoke (excerpt)

From `npm run smoke` with default fixtures:

| severity | sla_due_at (from occurred_at `2026-11-18T00:00:00Z`) | channels |
|----------|------------------------------------------------------|----------|
| medium | `2026-11-18T04:00:00.000Z` (= 240 min policy default) | `push`, `sms` |
| critical | `2026-11-18T00:15:00.000Z` (= 15 min) | `push`, `sms` |

No hardcoded SLA map / channel list in rules engine — `loadAlertPolicy` + `resolveChannels` + package `slaDueAt`.

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' apps/grid-rules packages/alert-policy
# → clean
```

## Integrator note

Finished on branch only. Prefer merge after T190/T180 land; do not force onto mid-merge main.
