# P0-T100 evidence — audit + prioritisation packages

**Branch:** `vp/P0-T100-audit-priority`  
**Date:** 2026-11-18

## Tree

```
packages/audit/
  README.md package.json tsconfig.json package-lock.json
  src/{types,event,log,index}.ts
  test/audit.test.ts

packages/prioritisation/
  README.md package.json tsconfig.json package-lock.json
  src/{types,rank,sort,filter,board,index}.ts
  test/prioritisation.test.ts
```

## Tests

```bash
cd packages/audit && npm install && npm test
# → 6 pass

cd packages/prioritisation && npm install && npm test
# → 8 pass
```

Sample:

```
▶ createAuditEvent
  ✔ builds who/when/action/entity fields
  ✔ rejects empty actor_id
▶ AppendOnlyAuditLog
  ✔ appends in order and lists snapshots
  ✔ filters by actor / action / entity / utility / time
  ✔ rejects update / delete / clear
  ✔ freezes stored events against mutation

▶ sortBoardItems
  ✔ orders by risk_score desc
  ✔ prefers sla_breached on equal risk
▶ filterBoardItems / rankBoardItems
  ✔ filters + sorts for C09 board
```

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' packages/audit packages/prioritisation
# (no matches)
```

Package names: `@voltpulse/audit`, `@voltpulse/prioritisation`. No app edits.

## Notes

- Audit: append-only in-memory log; `update`/`delete`/`clear` throw.
- Prioritisation: consumes W01 `risk_score` from grid-rules; does not recompute severity×criticality.
- `graphify update .` run after package add.
