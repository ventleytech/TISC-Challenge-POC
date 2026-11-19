# Anti-leak grep evidence (P0-T370)

## Code paths (must be empty)
```
$ git grep -niE 'trinetra|t-netra|tnetra' -- apps packages infra docs scripts models README.md .env.template
(exit 1; 1 = no match)
```

## Remaining tracked hits outside task-cards (policy only)
```
.cursor/rules/30-anti-leak.mdc:18:- Internal product names (Trinetra / T-Netra / etc.) in README, UI, PPT, submission, code comments meant for public
.gitignore:73:T-Netra*.pdf
```

## Remaining in task-cards: files (grep-guard patterns / do-not-edit notes)
```
task-cards/P0-T001/CARD.md
task-cards/P0-T001/evidence/01-compose-config.md
task-cards/P0-T002/CARD.md
task-cards/P0-T002/evidence/01-stubs.md
task-cards/P0-T003/CARD.md
task-cards/P0-T003/evidence/01-health-openapi-smoke.md
task-cards/P0-T004/CARD.md
task-cards/P0-T005/CARD.md
task-cards/P0-T005/evidence/01-web-shell.md
task-cards/P0-T006/CARD.md
task-cards/P0-T006/evidence/01-notify-mock.md
task-cards/P0-T007/CARD.md
task-cards/P0-T007/evidence/01-store-smoke.md
task-cards/P0-T008/CARD.md
task-cards/P0-T008/evidence/01-obs-stub.md
task-cards/P0-T010/CARD.md
task-cards/P0-T011/CARD.md
task-cards/P0-T020/CARD.md
task-cards/P0-T020/evidence/01-grid-rules-smoke.md
task-cards/P0-T030/CARD.md
task-cards/P0-T030/evidence/01-train-stub.md
task-cards/P0-T040/CARD.md
task-cards/P0-T040/evidence/01-gateway-scaffold.md
task-cards/P0-T050/CARD.md
task-cards/P0-T050/evidence/auth-roles-smoke.md
task-cards/P0-T070/CARD.md
task-cards/P0-T070/evidence/01-retention-hold-smoke.md
task-cards/P0-T080/CARD.md
task-cards/P0-T080/evidence/01-unit-tests.md
task-cards/P0-T100/CARD.md
task-cards/P0-T100/evidence/01-packages.md
task-cards/P0-T110/CARD.md
task-cards/P0-T110/evidence/01-minio-compose-config.md
task-cards/P0-T120/CARD.md
task-cards/P0-T120/evidence/01-html-stub.md
task-cards/P0-T130/CARD.md
task-cards/P0-T140/CARD.md
task-cards/P0-T140/evidence/utility-onboarding-smoke.md
task-cards/P0-T150/CARD.md
task-cards/P0-T150/evidence/01-unit-tests.md
task-cards/P0-T160/CARD.md
task-cards/P0-T170/CARD.md
task-cards/P0-T170/evidence/01-build-lint-smoke.md
task-cards/P0-T180/CARD.md
task-cards/P0-T180/evidence/01-alert-policy.md
task-cards/P0-T190/CARD.md
task-cards/P0-T190/evidence/01-s9-responsibility-hints.md
task-cards/P0-T200/CARD.md
task-cards/P0-T200/evidence/01-geo-map-stub.md
task-cards/P0-T210/CARD.md
task-cards/P0-T210/evidence/01-compose-kafka.md
task-cards/P0-T220/CARD.md
task-cards/P0-T220/evidence/01-o04-smoke.md
task-cards/P0-T230/CARD.md
task-cards/P0-T230/evidence/01-build-and-routes.md
task-cards/P0-T230/evidence/01-wow-ui-notes.md
task-cards/P0-T240/CARD.md
task-cards/P0-T240/evidence/perception-fallbacks-smoke.md
task-cards/P0-T250/CARD.md
task-cards/P0-T250/evidence/01-smoke-export.md
task-cards/P0-T260/CARD.md
task-cards/P0-T260/evidence/01-smoke.txt
task-cards/P0-T261/CARD.md
task-cards/P0-T261/evidence/01-merge-web.md
task-cards/P0-T270/CARD.md
task-cards/P0-T270/evidence/01-stubs.md
task-cards/P0-T280/CARD.md
task-cards/P0-T280/evidence/01-rules-alert-policy.md
task-cards/P0-T300/CARD.md
task-cards/P0-T320/CARD.md
task-cards/P0-T320/evidence/01-live-api-ack.md
```

## Tests
- grid-perception test_fallback_route: 2 passed
- detector-fallbacks: 5 passed
- i18n: 4 pass
