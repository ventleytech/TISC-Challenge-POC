---
name: using-git-worktrees
description: Isolated git worktrees for VoltPulse cards. Use before parallel implementation or risky experiments.
---

# Git worktrees (VoltPulse)

```bash
git fetch origin
git worktree add -b vp/<card-id>-slug ../voltpulse-<card-id> origin/main   # or local main
cd ../voltpulse-<card-id>
# work the card only
```

## Hygiene

- Clean status before add
- Never commit `local-notes/`, `.env`, weights, `graphify-out/`
- One card per worktree
- Remove worktree after merge when user asks: `git worktree remove …`

See rule `40-parallel-worktrees.mdc`.
