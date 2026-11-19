# P0-T402 evidence

## Commands

```bash
cd apps/pulse-api && npm test -- --testPathPatterns=utilities && npm test
```

## Results

- utilities: 3 passed
- full suite: 42 passed / 9 suites
- Migration `sql/003_tenancy.sql` (utilities, sites, memberships)
- PostgresStore + MemoryStore tenancy CRUD
- MembershipHydrateService reloads stub keys into AuthService on boot

## Anti-leak

VoltPulse only.
