import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  feederFeatureCollection,
  lineFeature,
  pointFeature,
} from '../src/geojson.ts';
import type { AssetPoint, SpanSegment } from '../src/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(
  readFileSync(join(root, 'fixtures/demo-feeder.json'), 'utf8'),
) as { points: AssetPoint[]; spans: SpanSegment[]; feederId: string };

test('pointFeature emits lon/lat Point', () => {
  const f = pointFeature(fixture.points[1]);
  assert.equal(f.type, 'Feature');
  assert.equal(f.geometry.type, 'Point');
  assert.deepEqual(f.geometry.coordinates, [10.01, 50.005]);
  assert.equal(f.properties.kind, 'tower');
  assert.equal(f.properties.feederId, 'vp-demo-feeder-01');
});

test('lineFeature emits LineString with ≥2 verts', () => {
  const f = lineFeature(fixture.spans[0]);
  assert.equal(f.geometry.type, 'LineString');
  assert.equal(f.geometry.coordinates.length, 2);
  assert.equal(f.properties.kind, 'span');
});

test('lineFeature rejects short spans', () => {
  assert.throws(
    () =>
      lineFeature({
        id: 'bad',
        feederId: 'x',
        coordinates: [{ lon: 1, lat: 2 }],
      }),
    /≥2/,
  );
});

test('feederFeatureCollection filters by feederId', () => {
  const extra: AssetPoint = {
    id: 'other',
    kind: 'tower',
    lon: 11,
    lat: 51,
    feederId: 'other-feeder',
  };
  const fc = feederFeatureCollection(
    [...fixture.points, extra],
    fixture.spans,
    fixture.feederId,
  );
  assert.equal(fc.type, 'FeatureCollection');
  assert.equal(fc.features.length, fixture.points.length + fixture.spans.length);
  assert.ok(fc.features.every((f) => f.properties.feederId === fixture.feederId || f.id === fixture.feederId));
});
