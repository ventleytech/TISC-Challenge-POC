# P0-T350 verify

Run on branch before and after merging main `8dd3ff3`.

- pulse-api: `npm run build` ok; `jest` 9 suites / 37 tests; `test:e2e` 12 tests (pre-merge numbers; post-merge see below)
- pulse-web: `tsc --noEmit` clean; `npm run build` ok
- MinIO smoke: `smoke-minio.txt` (POST -> list -> signed GET sha match -> tamper 401 -> unauth 401 / wrong tenant 403 -> object in bucket)
- Seed: `seed-output.txt`

## Post-merge (main 8dd3ff3)
- pulse-api: build ok; jest 9 suites / 39 tests; e2e 12 tests
- pulse-web: tsc clean; build ok
- openapi: `/evidence`, `/evidence/{evidenceId}`, `/evidence/{evidenceId}/content` + `utility_id` on findings kept
- UI: browser check on vite :5350 vs pulse-api (backend=minio) shows hero "Every finding, on the record." with badge "Live · minio", 10 objects, 87% mean confidence
