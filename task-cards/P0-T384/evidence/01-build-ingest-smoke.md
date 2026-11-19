# P0-T384 evidence

```
$ docker compose --env-file .env.template --profile {sense,media,stream,data,obs,store} config -q   # all ok
$ git diff | grep -c bitnamilegacy                                                                    # 0 (MinIO untouched)
$ python3 -m pytest apps/grid-perception/tests -q                                                      # 8 passed
$ docker compose --profile sense build grid-perception                                                 # Built
$ docker compose --profile sense up -d --no-deps grid-perception                                       # healthy, user vp
$ curl localhost:8081/health
{"status": "ok", "service": "grid-perception", ..., "ingest_loop": true, "detectors": ["sag","thermal_hotspot"], "processed": 0, "failed": 0, "detections": 0}
$ docker cp corrosion-sample.jpg vp-grid-perception:/data/inbox/vp-smoke.jpg
log: ingest ok vp-smoke.jpg detections=0 event=18de6ec5-...
$ docker exec vp-grid-perception wc -l /data/bus/vp.detect.v1.jsonl      # 1
  tail -n1 -> vp.detect.v1 event: source=upload, detections=[], fallback_reasons=[sag, thermal_hotspot] (honest stubs)
$ curl /health -> processed=1 failed=0 ; /data/inbox/processed/vp-smoke.jpg
```

Gate0 weight path (GP_MODELS_HOST_DIR=<main>/local-notes/models-experiments, GP_DETECTORS=corrosion,
GP_WEIGHTS_CORROSION_CONTAINER=/models/corrosion/weights/Basic_YOLO11_v1.pt):
`ls /models/corrosion/weights` shows Basic_YOLO11_v1.pt; loop logs `predict corrosion weights=...` then
`ingest failed ...: ultralytics missing` and the file moves to `inbox/failed/` (expected on CPU stub image).
Without weight env: `no detectors ran` -> `failed/`, health `failed=1`.

Containers/volumes created for the smoke were removed; pulse-bus/postgres left up.
