---
name: graphify
description: Build or query VoltPulse code knowledge graph via graphify CLI. Use for structural questions, blast radius, or before large refactors.
---

# Graphify (VoltPulse)

## Setup

```bash
# once per machine
uv tool install graphifyy   # provides `graphify` CLI

# once per repo
./scripts/graphify-init.sh
# → graphify cursor install  (writes .cursor/rules/graphify.mdc)
# → graphify update .        when code exists
```

`graphify-out/` is gitignored.

## Use

- Structural “who calls X / what breaks if Y” → prefer graph before blind recursive greps.
- Rebuild after large refactors: `graphify update . --force` if needed.
- No graph yet (empty repo): skip; use normal search.

## Docs

https://docs.graphify.com/integrations/cursor  
Package: PyPI `graphifyy` → command `graphify`.
