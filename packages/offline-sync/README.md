# `@voltpulse/offline-sync`

W07 stub: offline edge sync **protocol types** + in-memory **op queue**.

No network transport yet. Consumers (edge agent / later `pulse-web` / gateway) enqueue mutations while offline, then build a sync envelope for a future upload path.

## Layout

```
offline-sync/
  src/
    protocol.js   # SyncOp / SyncEnvelope / SyncAck shapes + builders
    queue.js      # InMemoryOpQueue
    index.js
  tests/
```

## Protocol (v1 stub)

| Type | Role |
|------|------|
| `SyncOp` | One queued mutation (`create` \| `update` \| `delete`) |
| `SyncEnvelope` | Device → cloud batch (`vp.offline.sync.v1`) |
| `SyncAck` | Cloud → device accept/reject + cursor |

Resources (stub set): `inspections` · `findings` · `alerts` · `assets`

## Usage

```js
import { InMemoryOpQueue, buildEnvelope, buildAck } from "@voltpulse/offline-sync";

const q = new InMemoryOpQueue();
q.enqueue({
  id: "op-1",
  op: "create",
  resource: "findings",
  payload: { finding_id: "f1", utility_id: "u1" },
  client_ts: new Date().toISOString(),
});

const envelope = buildEnvelope({
  device_id: "edge-1",
  utility_id: "u1",
  ops: q.drain(),
});
```

## Tests

```bash
cd packages/offline-sync && npm test
```

## Anti-leak

VoltPulse names only (`vp.offline.sync.v1`). No proprietary topic catalogs or UI chrome.
