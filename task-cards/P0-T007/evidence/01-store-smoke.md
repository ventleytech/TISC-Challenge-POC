# P0-T007 evidence — pulse-store smoke

Date: 2026-11-18  
Host: overnight agent worktree `/home/ubuntu/voltpulse-P0-T007`  
Branch: `vp/P0-T007-pulse-store`

## Commands

```bash
cd apps/pulse-store
npm ci   # or npm install (lockfile present)
npm test
npm run smoke
PULSE_STORE_BACKEND=minio npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-store && exit 1 || true
graphify update .
```

## `npm test` (8 pass)

```text
▶ loadSettings — 3 pass
▶ evidence-id — 4 pass
▶ FsObjectStore — 1 pass
ℹ tests 8 / fail 0
```

## `npm run smoke` (filesystem default)

```text
[info] settings backend=fs bucket=voltpulse-evidence endpoint=http://127.0.0.1:9000 fsRoot=.../apps/pulse-store/.pulse-store-data
[ok] fs put/get key=util_smoke/insp_smoke001/evidence/ev_b26834713775.txt backend=fs bytes=33
[ok] pulse-store smoke complete
```

## `PULSE_STORE_BACKEND=minio npm run smoke` (endpoint down → FS fallback)

Compose `pulse-store` remains T001 alpine placeholder (not real MinIO). Expected skip:

```text
[info] settings backend=minio bucket=voltpulse-evidence endpoint=http://127.0.0.1:9000 ...
[skip] minio unreachable or unavailable: Error: connect ECONNREFUSED 127.0.0.1:9000
[fallback] running filesystem put/get for local proof
[ok] fs-fallback put/get key=util_smoke/insp_smoke001/evidence/ev_0e89914719c5.txt backend=fs bytes=42
[ok] pulse-store smoke complete
```

## Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' apps/pulse-store` → no matches.

## Notes

- Root `.env.template` appended: `PULSE_STORE_BACKEND`, `PULSE_STORE_REGION`, `PULSE_STORE_FS_ROOT`, `PULSE_STORE_USE_SSL` (existing MinIO keys kept).
- No `infra/compose/docker-compose.yml` edits.
- Evidence key layout matches `docs/storage-retention.md` (`…/insp_{id}/evidence/ev_{sha256_12}.{ext}`).
