# P0-T150 evidence — work-order unit tests

## Commands

```bash
cd packages/work-order
npm install
npm test
npm run build
rg -ni 'trinetra|t-netra|tnetra' packages/work-order --glob '!node_modules/**' --glob '!dist/**'
# (no matches → clean)
graphify update .
```

## `npm test` (2026-11-18)

```
ℹ tests 10
ℹ suites 3
ℹ pass 10
ℹ fail 0
```

Coverage highlights:

- finding + asset + party hint → stable `WorkOrderRow` (A07)
- missing asset / optional warranty_hint + tender_ref → empty cells
- custom recommendation passthrough
- asset id mismatch + invalid enums rejected
- multi-row CSV header + cells; JSON round-trip via `exportWorkOrders`

## Package tree (tracked)

```
packages/work-order/
  README.md
  package.json
  tsconfig.json
  .gitignore
  src/types.ts
  src/export.ts
  src/index.ts
  test/export.test.ts
```

## Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' packages/work-order` → no matches.

## Graphify

`graphify update .` after package add; query `work-order export CSV JSON party` should surface `@voltpulse/work-order` / `buildWorkOrderRow` / `exportWorkOrders`.
