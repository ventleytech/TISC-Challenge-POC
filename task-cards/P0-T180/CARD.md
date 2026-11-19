# P0-T180 — `packages/alert-policy` (M05/M06)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs apps/* (packages only) |
| Branch | `vp/P0-T180-alert-policy` |
| Deps | `packages/contracts` severity enum + `vp.alerts` channels |

## Objective

Shared **alert-policy** package for admin M05 (channel config: mock sms/push/email) and M06 (severity → SLA duration helpers). Load from JSON + env overlays. Unit tests + evidence. No Nest/UI/Compose work.

## Input docs

- `docs/architecture.md` (rules emit SLA; `pulse-notify` delivers)
- `docs/anti-leak.md`
- `docs/product/requirements.md` (severity ladder)
- `packages/contracts/enums/severity.json`
- `packages/contracts/events/alerts/vp.alerts.v1.schema.json` (channels enum)

## Allowed paths

- `packages/alert-policy/**`
- `task-cards/P0-T180/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit `apps/pulse-web`, `apps/pulse-api`, Compose MinIO worker, or `local-notes/Trinetra-POC/**`.

## Acceptance criteria

- [x] Package `@voltpulse/alert-policy` under `packages/alert-policy/`
- [x] Channel config for `push` \| `sms` \| `email` with mock adapter defaults (M05)
- [x] Severity → SLA duration (minutes) map + `slaDueAt` helper (M06)
- [x] Load policy from default JSON; overlay via env (`VP_ALERT_POLICY_*`)
- [x] Unit tests cover load / channels / SLA
- [x] Evidence under `./evidence/`
- [x] Anti-leak: VoltPulse names only; no proprietary paste

## Validation

```bash
cd packages/alert-policy && npm ci && npm test && npm run build
rg -ni 'trinetra|t-netra|tnetra' packages/alert-policy && exit 1 || true
```

## Evidence

Write under `./evidence/` (commands + short output).

## Anti-leak

- [x] VoltPulse / `vp.*` / severity ids only
- [x] No proprietary channel catalogs or internal brand strings

## Notes

- Aligns with contracts severity + alert channels; Demo Day = mock adapters OK.
- Consumers later: `grid-rules`, `pulse-notify`, admin M05/M06 UI — out of this card.
