# P0-T381 evidence

Env: `--env-file .env.template`, overrides PULSE_GATEWAY_PORT=3021 RTSP=18554 SINK=file PULL_URLS=rtsp://127.0.0.1:8554/live/feeder-demo (host ports 3020/8554 free-choice).

```
$ docker compose --profile media build pulse-gateway   # -> Image voltpulse/pulse-gateway:dev Built
$ docker compose --profile media up -d pulse-gateway && curl ...
 Container vp-pulse-gateway Created 
 Container vp-pulse-gateway Starting 
 Container vp-pulse-gateway Started 
health=healthy
== /health
{"status":"ok","service":"pulse-gateway","plane":"media","rtspPort":18554,"rtmpPort":1935,"publicHost":"127.0.0.1","sessionCount":0,"pullTargets":1,"detectSink":"file","startedAt":"2026-11-18T00:28:09.775Z"}
== /pull/targets
{"items":["rtsp://127.0.0.1:8554/live/feeder-demo"]}
== sync {"items":[{"id":"bbcab131-e7de-449f-9f61-1b3638d3722b","pullUrl":"rtsp://127.0.0.1:8554/live/feeder-demo","created":true}]}
== frame
{"id":"9b8a6681-7153-4a2c-8142-3fc240624580","inspection_id":"1934ca1f-5955-4aed-b5f8-983df66846e8","sink":"file"}
== bus file in container
{"event_id":"9b8a6681-7153-4a2c-8142-3fc240624580","occurred_at":"2026-11-18T00:28:15Z","inspection_id":"1934ca1f-5955-4aed-b5f8-983df66846e8","asset_id":null,"source":"live","detections":[{"detection_id":"2c90beb8-91fb-415c-81fb-6829ef3d5399","class_id":"corrosion","confidence":0.82,"bbox":[10,20,110,220],"reason":"synthetic gateway frame for session live-feeder-demo; no inference run"}]}
node
 Network voltpulse_default Removing 
 Network voltpulse_default Resource is still in use 
NAME                IMAGE                COMMAND                  SERVICE          CREATED          STATUS                    PORTS
vp-pulse-bus        apache/kafka:4.1.0   "/__cacert_entrypoin…"   pulse-bus        39 minutes ago   Up 33 minutes (healthy)   0.0.0.0:9092->9092/tcp, [::]:9092->9092/tcp, 0.0.0.0:9094->9094/tcp, [::]:9094->9094/tcp
vp-pulse-postgres   postgres:16-alpine   "docker-entrypoint.s…"   pulse-postgres   54 minutes ago   Up 54 minutes (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

Also: all 6 profiles `docker compose config` OK; bitnamilegacy lines untouched by diff (0 hits in `git diff`); gateway `npm test` pass.
