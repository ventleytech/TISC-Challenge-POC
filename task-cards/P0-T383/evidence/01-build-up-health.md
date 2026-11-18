# P0-T383 evidence

Env: `--env-file .env.template`; overrides ADAPTER=file FILE_PATH_CONTAINER=/data/notify/alerts.jsonl KAFKA_ENABLED=true FROM_BEGINNING=true ACK_MODE=off, fresh group id. `pulse-bus` already up (healthy), KAFKA_BROKERS=pulse-bus:9092 in-compose.

```
$ docker compose --profile data config -q                    # ok; also sense media stream obs store ok
$ docker compose --profile data build pulse-notify           # Image voltpulse/pulse-notify:dev Built
$ docker compose --profile data up -d --no-deps pulse-notify
 Container vp-pulse-notify Started
health=healthy ; user=node
$ curl localhost:3010/health
{"status":"ok","service":"pulse-notify","topic":"vp.alerts.v1","adapter":"file","ackMode":"off","consumed":16,"startedAt":"..."}
$ docker logs vp-pulse-notify
[pulse-notify] kafka skip malformed message: Unexpected token 'g', "garbage-not-json" is not valid JSON
[pulse-notify] push mock delivered alert=a1cc31b5-... severity=high
[pulse-notify] file sink ok alert=a1cc31b5-... channel=push / channel=sms
$ docker exec vp-pulse-notify wc -l /data/notify/alerts.jsonl   # 32 lines, sink JSON per channel
```

Kafka smoke: consumer inside container read vp.alerts.v1 backlog from live `pulse-bus` -> 16 consumed, 32 file-sink lines.
Other checks: `git diff | grep -c bitnamilegacy` = 0; `npm test` in apps/pulse-notify 10/10 pass; container removed after run, bus/postgres left up.
