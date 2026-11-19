# P0-T230 evidence — VoltPulse wow UI

## Base / merge

- Branched from `vp/P0-T060-schedule-assets-ui`, then fast-forward / merge of `vp/P0-T170-priority-alerts-ui` @ `9950332`.
- Kept T170 `/priority` + `/alerts` APIs (`listFindings` filters, `SlaCountdown`, `ackAlert`, W01 `riskScore`).
- Restyled + deepened — did not ship T170 sparse look as final.

## Build / lint

```bash
cd apps/pulse-web && npm ci && npm run build && npx oxlint src
```

- `vite build` OK (tsc + production bundle).
- `oxlint src` exit 0.

## Screenshots (gitignored PNGs OK)

| File | Route |
|------|-------|
| `01-home.png` | `/` hero + below-fold corridor pulse |
| `02-priority.png` | `/priority` risk columns |
| `03-alerts.png` | `/alerts` SLA tiles + ack |
| `04-inspections.png` | `/inspections` dense table |
| `05-assets.png` | `/assets` registry tiles |
| `06-evidence.png` | `/evidence` retention tags |
| `07-admin.png` | `/admin` roles + pipeline |
| `08-schedule.png` | `/inspections/schedule` wizards |

Captured via Playwright against `vite preview` on `:5190`.

## Inspiration (read-only — anti-leak)

- Density / nav patterns: `local-notes/ui-refereces/` (layout only; **no** forest/terra/token paste).
- Ops surface shapes: `local-notes/Trinetra-POC/apps/` visual patterns only — **no** proprietary brand, chrome, CSS tokens, or component paste.
- Theme: VoltPulse steel / volt (`packages/ui-tokens/tokens.css`) — Syne + Figtree + IBM Plex Mono.

## Routes elevated

`/`, `/inspections`, `/inspections/schedule`, `/inspections/schedule/:kind`, `/assets`, `/assets/:id`, `/priority`, `/alerts`, `/evidence`, `/admin`.

## Motion

Corridor line-drift / pulse-glow; rail live-pulse; board-card / alert-tile stagger; breach-pulse; `prefers-reduced-motion` kill-switch.
