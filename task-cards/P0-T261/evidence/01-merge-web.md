# P0-T261 — merge T230 wow pulse-web evidence

**When:** 2026-11-18  
**Source:** `vp/P0-T230-wow-ui` @ `0cc1055`  
**Base main:** `9e33416` (post-T260 overnight integrate)  
**Merge commit:** `d7189c2`  
**Main tip after merge:** `d7189c2a0b6ad18b0c5e918381674e4b82351b63`

## Merge

```bash
git checkout main
git merge vp/P0-T230-wow-ui
```

- Conflict: `task-plans/2026-11-18-gate0-and-p0-spine.md` (add/add) — resolved keeping main spine rows + T230 web rows (T060/T170/T230 done).
- `apps/pulse-web/**` and `packages/ui-tokens/**` took T230 cleanly (no content conflict).

## Smoke

```bash
cd apps/pulse-web && npm install && npm run build
```

Result: **OK** — `tsc -b && vite build`; 43 modules; dist CSS ~25kB / JS ~321kB.

## Anti-leak skim

- No `Trinetra` / `T-Netra` / `tnetra` in `apps/pulse-web` or `packages/ui-tokens`
- Brand surfaces: VoltPulse / `@voltpulse/ui-tokens` / `vp.detect.v1` mock hint
- No secrets / private keys / AWS keys in web tree
- `import.meta.env` only for optional `VITE_PULSE_API_URL`

## Follow-ups

None for merge. npm audit reports 5 high (vite/deps) — out of scope for this card.
