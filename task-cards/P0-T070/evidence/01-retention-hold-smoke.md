# P0-T070 evidence — retention + legal hold

Date: 2026-11-18  
Host: overnight worktree `/home/ubuntu/voltpulse-P0-T070`  
Branch: `vp/P0-T070-retention-hold` (from `vp/P0-T007-pulse-store`)

## Commands

```bash
cd apps/pulse-store
npm ci
npm test
npm run smoke
npm run smoke:retention
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-store && exit 1 || true
graphify update .
```

## `npm test` (13 pass)

```text
▶ loadSettings — 5 pass (incl. hot/warm days)
▶ evidence-id — 4 pass
▶ FsObjectStore — 1 pass
▶ resolveTier — 1 pass
▶ RetentionStore legal hold — 2 pass
ℹ tests 13 / fail 0
```

## `npm run smoke` (FS put/get)

```text
[ok] fs put/get key=util_smoke/insp_smoke001/evidence/ev_….txt backend=fs
[ok] pulse-store smoke complete
```

## `npm run smoke:retention`

```text
[info] retention hotDays=1 warmDays=2 fsRoot=/tmp/pulse-store-ret-smoke-…
[ok] status tier=expire legalHold=false key=util_ret/insp_ret001/evidence/ev_….txt
[ok] legal hold blocked delete: legal hold blocks delete: util_ret/insp_ret001/evidence/ev_….txt
[ok] listExpirable excludes held key (count=0)
[ok] delete after hold clear key=…
[ok] pulse-store retention/hold smoke complete
```

## Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' apps/pulse-store` → no matches.

## Notes

- Policy via `PULSE_STORE_HOT_DAYS` / `PULSE_STORE_WARM_DAYS` (M07 thin — no admin UI).
- Meta index: `{fsRoot}/.retention-meta.json` (`createdAt`, `legalHold`).
- Root `.env.template` appended with retention day keys only.
- No edits to pulse-api / pulse-web / grid-perception / pulse-train / pulse-gateway / compose.
