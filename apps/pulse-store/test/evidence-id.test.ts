import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { buildEvidenceKey, buildObjectKey, contentAddress12 } from '../src/evidence-id.js';

describe('evidence-id', () => {
  it('contentAddress12 matches sha256 first 12 hex', () => {
    const body = Buffer.from('volt-pulse-evidence');
    const expected = createHash('sha256').update(body).digest('hex').slice(0, 12);
    assert.equal(contentAddress12(body), expected);
  });

  it('buildEvidenceKey follows retention layout', () => {
    const body = Buffer.from('crack-crop');
    const key = buildEvidenceKey('util_demo', 'A1', body, 'jpg');
    const digest = contentAddress12(body);
    assert.equal(key, `util_demo/insp_A1/evidence/ev_${digest}.jpg`);
  });

  it('buildObjectKey upload + session + model', () => {
    assert.equal(
      buildObjectKey('upload', {
        utilityId: 'u1',
        inspectionId: 'i2',
        objectId: 'obj_abc',
      }),
      'u1/insp_i2/upload/obj_abc',
    );
    assert.equal(
      buildObjectKey('session', {
        utilityId: 'u1',
        inspectionId: 'i2',
        sessionSeq: 7,
      }),
      'u1/insp_i2/session/000007.mp4',
    );
    assert.equal(
      buildObjectKey('model', {
        utilityId: 'u1',
        inspectionId: 'unused',
        modelName: 'corrosion',
        modelVersion: '0.1.0',
        weightsFile: 'weights.pt',
      }),
      'u1/models/corrosion/0.1.0/weights.pt',
    );
  });

  it('rejects empty / unsafe segments', () => {
    assert.throws(() => buildEvidenceKey('', 'i1', 'x'), /utilityId/);
    assert.throws(
      () =>
        buildObjectKey('upload', {
          utilityId: 'u1',
          inspectionId: 'i1',
          objectId: '../etc',
        }),
      /objectId/,
    );
  });
});
