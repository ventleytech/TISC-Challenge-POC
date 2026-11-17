# @voltpulse/prioritisation

Shared sort/filter helpers for the C09 prioritisation board.

**W01 risk score** (`severity × criticality × …`) is computed in `grid-rules`. This package consumes board rows that already carry `risk_score` / `severity` / `criticality` and:

- sorts by risk (desc), then severity rank, then recency
- filters by severity, criticality, detection class, utility, min risk

Does not re-implement Flink/rules scoring.
