# Anti-leak / distinctness

**Goal:** Reviewer sees **TPulse**, not a renamed clone.  
**OK:** conceptual open stack. **Not OK:** same names, folder tree, topics, UI chrome, pasted source.

## OK to reuse (concepts)

Ingest → perception → bus → rules → API → UI · frames stop at perception · isolated services · severity + evidence + SLA · retention tiers idea · Kafka+Flink realtime pattern.

## Must differ

| Area | TPulse |
|------|--------|
| Brand | **TPulse** only (UI / README / diagrams) |
| Packages | `@voltpulse/*` OK internally; public copy says TPulse |
| Folders | `pulse-*`, `grid-*` |
| Planes | Sense / Media / **Realtime (stream)** / Apps (data) / Obs / Train / Store |
| Topics | `vp.*` |
| Compose | project `voltpulse`; profiles `sense|media|stream|data|obs|train|store` |
| API | Own OpenAPI (`/inspections`, `/assets`, `/alerts`) |
| UI | Energy themes — not foreign chrome |
| Models | Open Hub/GitHub + attribution |
| Seeds | Synthetic Demo Feeder — not customer corridors |

## Pre-share checklist

- [ ] No foreign product name in README, UI, PPT, submission
- [ ] No copied proprietary source
- [ ] No `.env` secrets / internal endpoints / customer lists
- [ ] Topics / OpenAPI clean of foreign prefixes
- [ ] Diagrams redrawn with TPulse labels
- [ ] Model cards cite public licenses
- [ ] **Decks / 1500-char / teammate PDFs stay in `local-notes/`** (not in public repo)

**Do not:** copy folder then rename.
