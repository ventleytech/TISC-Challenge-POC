# P0-T270 evidence — offline-sync + i18n stubs

## Commands

```bash
cd packages/offline-sync && npm test
cd packages/i18n && npm test
rg -n 'Trinetra|T-Netra|TNetra' packages/offline-sync/src packages/i18n/src || true
```

## Tree

```
packages/offline-sync/
  package.json
  README.md
  src/{index,protocol,queue}.js
  tests/{protocol,queue}.test.js
packages/i18n/
  package.json
  README.md
  src/catalogs/{en,hi}.js
  src/{index,t}.js
  tests/t.test.js
```

## Validation results

### `@voltpulse/offline-sync`

```
▶ protocol types — 4 pass
▶ InMemoryOpQueue — 4 pass
ℹ tests 8 / pass 8 / fail 0
```

### `@voltpulse/i18n`

```
▶ i18n catalogs — 4 pass
ℹ tests 4 / pass 4 / fail 0
```

### Anti-leak

`rg` on `packages/*/src` — no Trinetra / T-Netra / TNetra hits. Brand `VoltPulse` in `app.name`. Schema `vp.offline.sync.v1`.

## Notes

- Protocol stub only — no transport / durable store.
- Second locale: `hi` (same keys as `en`).
- No `pulse-web` changes (T230 owns UI mount).
