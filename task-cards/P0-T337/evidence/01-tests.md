# P0-T337 tests

pulse-api: `cd apps/pulse-api && npx jest src/ingest` → Tests: 9 passed (2 new: unknown-inspection + event utility_id with null default; precedence event>default, inspection>event).
grid-rules: `cd apps/grid-rules && npm test` → 18 pass, 0 fail (new: findings carry asset utility_id; omitted when no asset). `tsc --noEmit` clean.
