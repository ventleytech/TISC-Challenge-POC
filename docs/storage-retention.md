# Evidence & media storage

## Modes

| Mode | Source | Default retention |
|------|--------|-------------------|
| Finding evidence | Perception crop/clip | Hot → warm → expire |
| Record-upload | Operator media | Tied to inspection |
| Session segments (P2) | Live recording | Short hot unless hold |
| Model artifacts | Train registry | Keep N versions; pin active |

## ID strategy

```
s3://pulse-store/{utility_id}/insp_{inspection_id}/upload/{object_id}
s3://pulse-store/{utility_id}/insp_{inspection_id}/evidence/ev_{sha256_12}.{ext}
s3://pulse-store/{utility_id}/insp_{inspection_id}/session/{seq:06d}.mp4
s3://pulse-store/{utility_id}/models/{model_name}/{version}/weights.*
```

Signed GET/PUT via Nest only. No public buckets for corridor media.

## Retention tiers

| Tier | Intent | Example defaults |
|------|--------|------------------|
| Hot | Active review | 7–30 days |
| Warm | Audit | 90–365 days |
| Expire | Delete object + soft-delete meta | After warm TTL |
| Legal hold | Freeze | Until cleared |

Per-utility overrides under platform ceilings.
