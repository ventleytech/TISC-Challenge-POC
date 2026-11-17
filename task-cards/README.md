# task-cards/

Executable cards for Cursor agents / worktrees.

```
task-cards/
  P0-T001-compose-scaffold/
    CARD.md
    evidence/
      01-smoke.md
  _TEMPLATE/
```

## Flow

1. Created from a `task-plans/` row  
2. Agent loads `CARD.md` + listed docs only  
3. Implements within **allowed paths**  
4. Drops evidence → marks `done`  
5. PR review skill before merge  

Large media/logs under `evidence/` are gitignored; keep short `.md` notes tracked.

Also: top-level `evidence/` for cross-card packs if needed.
