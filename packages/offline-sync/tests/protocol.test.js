import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACK_SCHEMA,
  PROTOCOL_SCHEMA,
  PROTOCOL_VERSION,
  buildAck,
  buildEnvelope,
  buildOp,
  isSyncOp,
} from "../src/index.js";

const sampleOp = {
  id: "op-1",
  op: "create",
  resource: "findings",
  payload: { finding_id: "f1", utility_id: "u1" },
  client_ts: "2026-11-18T00:00:00.000Z",
};

describe("protocol types", () => {
  it("accepts valid SyncOp", () => {
    assert.equal(isSyncOp(sampleOp), true);
    const built = buildOp(sampleOp);
    assert.equal(built.id, "op-1");
    assert.equal(built.resource, "findings");
  });

  it("rejects bad SyncOp", () => {
    assert.equal(isSyncOp({ ...sampleOp, op: "upsert" }), false);
    assert.equal(isSyncOp({ ...sampleOp, resource: "labels" }), false);
    assert.throws(() => buildOp({ ...sampleOp, id: "" }), /invalid SyncOp/);
  });

  it("builds vp.offline.sync.v1 envelope", () => {
    const envelope = buildEnvelope({
      device_id: "edge-1",
      utility_id: "u1",
      ops: [sampleOp],
      client_cursor: "c0",
      created_at: "2026-11-18T01:00:00.000Z",
    });
    assert.equal(envelope.schema, PROTOCOL_SCHEMA);
    assert.equal(envelope.version, PROTOCOL_VERSION);
    assert.equal(envelope.ops.length, 1);
    assert.equal(envelope.device_id, "edge-1");
    assert.match(envelope.schema, /^vp\./);
  });

  it("builds ack with accepts and rejects", () => {
    const ack = buildAck({
      accepted_ids: ["op-1"],
      rejected: [{ id: "op-2", reason: "conflict" }],
      server_cursor: "s1",
      ack_at: "2026-11-18T02:00:00.000Z",
    });
    assert.equal(ack.schema, ACK_SCHEMA);
    assert.deepEqual(ack.accepted_ids, ["op-1"]);
    assert.equal(ack.rejected[0].reason, "conflict");
  });
});
