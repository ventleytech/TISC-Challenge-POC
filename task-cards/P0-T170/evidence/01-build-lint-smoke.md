# P0-T170 evidence — priority board + alerts SLA/ack

## Scope

Web-only thin slice on `vp/P0-T170-priority-alerts-ui` (from `P0-T060` @ `e74ee9c`).

- C09 / W01: `/priority` — mock findings sorted by severity-weighted × criticality risk
- C07: `/alerts` — SLA countdown stub + Ack (mock-local state)
- Data: `src/mock/*` (default). **No `pulse-api` / foreign package edits**

## Commands

```bash
cd apps/pulse-web
npm ci
./node_modules/.bin/oxlint src   # exit 0
npm run build                    # tsc -b && vite build — exit 0
```

Build excerpt (2026-11-18):

```
✓ 41 modules transformed.
dist/assets/index-*.css   ~11.0 kB
dist/assets/index-*.js   ~286.6 kB
✓ built in ~375ms
```

## Mock smoke (tsx)

```
findings_order fnd-02:98,fnd-01:77,fnd-04:77,fnd-03:51,fnd-05:26,fnd-06:0
open_alerts alt-03,alt-01,alt-02
open_after_ack alt-03,alt-02
```

Ack of `alt-01` removes it from open-only list. Risk order places critical crack (`fnd-02`) first.

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-web   # no hits
```

VoltPulse brand + C07/C09/W01 labels only. No proprietary paste.
