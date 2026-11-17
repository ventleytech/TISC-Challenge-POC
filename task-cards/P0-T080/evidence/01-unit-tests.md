# P0-T080 evidence — responsibility unit tests

## Commands

```bash
cd packages/responsibility
npm install
npm test
npm run build
rg -ni 'trinetra|t-netra|tnetra' packages/responsibility --glob '!node_modules/**' --glob '!dist/**'
# (no matches → clean)
graphify update .
```

## `npm test` (2026-11-18)

```
ℹ tests 13
ℹ suites 4
ℹ pass 13
ℹ fail 0
```

Coverage highlights:

- corrosion in warranty → `oem` + `warranty_breach_suspect` (A04+A06)
- corrosion SLA-only → `oem` + `sla_active`
- corrosion expired → `maintenance_contractor` + `warranty_expired`
- vegetation → `vegetation_contractor`
- tender_ref passthrough (A05)
- missing dates → `no_warranty_data`

## Package tree (tracked)

```
packages/responsibility/
  README.md
  package.json
  tsconfig.json
  .gitignore
  src/hint.ts
  src/index.ts
  src/types.ts
  test/hint.test.ts
```

## Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' packages/responsibility` → no matches.

## Graphify

`graphify update .` rebuilt graph; `graphify query "responsibility warranty party_type hint"` surfaces `hintResponsibility()`, `WarrantyHint`, `PartyType`.
