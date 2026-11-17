# Anti-leak / distinctness

**Goal:** Reviewer sees **VoltPulse**, not a renamed clone.  
**OK:** conceptual open stack. **Not OK:** same names, folder tree, topics, UI chrome, pasted source.

## OK to reuse (concepts)

Ingest → perception → bus → rules → API → UI · frames stop at perception · isolated services · severity + evidence + SLA · retention tiers idea.

## Must differ

| Area | VoltPulse |
|------|-----------|
| Brand | VoltPulse only |
| Folders | `pulse-*`, `grid-*` |
| Planes | Sense / Media / Stream / Data |
| Topics | `vp.*` |
| Compose | project `voltpulse`; profiles `sense|media|stream|data|obs|store` |
| API | Own OpenAPI (`/inspections`, `/assets`, `/alerts`) |
| UI | T1–T3 Energy themes |
| Models | Open Hub/GitHub + attribution |
| Seeds | Synthetic Demo Feeder — not customer corridors |

## Pre-share checklist

- [ ] No internal product name in README, UI, PPT, submission
- [ ] No copied proprietary source
- [ ] No `.env` secrets / internal endpoints / customer lists
- [ ] Topics / OpenAPI clean of internal prefixes
- [ ] Diagrams redrawn with VoltPulse labels
- [ ] Model cards cite public licenses

**Do not:** copy folder then rename.
