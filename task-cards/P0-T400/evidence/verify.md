# P0-T400 evidence

## Commands

```bash
cd apps/pulse-web && npm run build
```

## Results

- build green (JS 388.57 kB)
- `liveApiEnabled()` returns true unless `VITE_PULSE_MOCK=1`
- `.env.development` + Dockerfile/Compose bake default API URL
- README documents live-default + mock opt-out

## Anti-leak

VoltPulse only.
