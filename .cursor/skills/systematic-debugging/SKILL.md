---
name: systematic-debugging
description: Debug VoltPulse failures with evidence before fixing. Use on bugs, flaky tests, pipeline breaks.
---

# Systematic debugging

1. **Reproduce** — exact command, env, run_mode.
2. **Locate** — logs/metrics; graphify path if structural.
3. **Hypothesize** — one cause; test it.
4. **Fix** — smallest change; add regression test when behavior wrong.
5. **Evidence** — before/after notes under card or `local-notes/` if exploratory.

No shotgun refactors. No proprietary dump comparison in repo.
