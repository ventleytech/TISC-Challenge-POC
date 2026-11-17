# Plan: SDD bootstrap + arch lock

| Field | Value |
|-------|-------|
| ID | `PLAN-20261118-sdd-bootstrap` |
| Status | `active` |
| Created | 2026-11-18 |

## Goal

Land Cursor/spec-driven scaffold, formal slim docs, and anti-leak gates so Nov 21–30 build can run as parallel cards.

## Non-goals

- Implementing `apps/*` in this plan
- Committing proprietary PDFs or local-notes

## Design notes

- Formal docs under `docs/` (curated from former discussion set)
- Discussion remains in `local-notes/` (gitignored)
- Loop: plan → cards → implement → evidence → review → test → deploy

## Tasks

| # | Card ID | Title | Deps | Parallel | Status |
|---|---------|-------|------|----------|--------|
| 1 | — | SDD scaffold (rules/skills/folders) | — | — | done (this change) |
| 2 | P0-T001 | Compose skeleton + profiles | scaffold | no | ready (write card next) |
| 3 | P0-T002 | `packages/contracts` stubs (`vp.*`) | scaffold | ok w/ UI tokens | ready (write card next) |
| 4 | P0-T003 | `pulse-api` Nest skeleton | P0-T002 | ok vs perception | blocked on card write |

## Done when

- [x] `.cursor/`, `AGENTS.md`, templates, gitignore
- [x] Slim formal docs promoted
- [ ] First build cards authored under `task-cards/`
