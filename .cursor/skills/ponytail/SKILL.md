---
name: ponytail
description: Optional ponytail helper stub for Cursor/Codex. Use only if user explicitly wants ponytail installed.
---

# Ponytail (optional — stub)

**Status for VoltPulse:** documented, **not installed** by default. Caveman + project rules already cover terse discipline.

Ponytail = third-party “lazy senior” ruleset/hooks for Claude Code / Codex / Cursor  
Upstream: https://github.com/DietrichGebert/ponytail · https://ponytail.dev/

## Cursor install (only if user asks)

```bash
git clone https://github.com/DietrichGebert/ponytail
node ponytail/scripts/cursor-hooks.js install --project
# or instruction-only: copy their .cursor/rules/ponytail.mdc
```

Do **not** duplicate caveman + ponytail ultra verbosity rules without need — pick one intensity source.

## Skip reason (default)

VoltPulse already has `caveman.mdc`, SDD rules, and anti-leak. Extra hooks optional.
