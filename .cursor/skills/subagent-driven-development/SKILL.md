---
name: subagent-driven-development
description: Run independent VoltPulse task cards via parallel subagents/worktrees. Use when multiple ready cards have disjoint paths.
---

# Subagent-driven development

1. From task-plan, list `status: ready` cards with `parallel: ok`.
2. Assign one card per subagent/worktree.
3. Brief: card path, allowed paths, input docs, AC, anti-leak.
4. Each agent: implement → evidence → mark done locally (do not commit unless user asks).
5. Parent: merge order contracts → services → UI; run `pr-review`.

Conflict on same file → stop parallel; serialize or rewrite cards.
