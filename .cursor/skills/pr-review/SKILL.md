---
name: pr-review
description: Low-token PR/branch review for VoltPulse. Use when user asks to review a PR, pull request, or branch diff.
---

# VoltPulse PR review

Project rules already loaded — do not re-summarize `AGENTS.md`.

## Fetch (cheap first)

1. Changed files only: `gh pr view <N> --json files` or `git diff --name-only base...HEAD`
2. Scoped diff only — never whole-repo unscoped on large PRs
3. Read full files only when hunk ambiguous

## Checklist

| Area | Check |
|------|-------|
| Anti-leak | Brand, no proprietary paste, no secrets |
| Arch freeze | Planes/topics/ownership unchanged without ADR |
| Config | No hardcoded env in feature code |
| Contracts | API/events updated with code |
| Tests/evidence | Behavior change covered |
| Scope | Matches card allowed paths |

## Output

```
path:line: blocker|major|minor: problem. Fix.
totals: Nb Nm Ni
```

Default: blockers + majors. Use caveman terseness unless user wants prose.
