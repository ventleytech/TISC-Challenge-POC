import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { feederFeatureCollection } from '../src/geojson.ts';
import { boundingBox, project, renderMapHtml, renderMapSvg } from '../src/map-svg.ts';
import type { AssetPoint, SpanSegment } from '../src/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(
  readFileSync(join(root, 'fixtures/demo-feeder.json'), 'utf8'),
) as { points: AssetPoint[]; spans: SpanSegment[]; feederId: string };

test('boundingBox covers fixture extents', () => {
  const fc = feederFeatureCollection(fixture.points, fixture.spans);
  const b = boundingBox(fc);
  assert.ok(b.minLon <= 10.0);
  assert.ok(b.maxLon >= 10.05);
  assert.ok(b.minLat <= 50.0);
  assert.ok(b.maxLat >= 50.02);
});

test('project maps SW corner near padding', () => {
  const fc = feederFeatureCollection(fixture.points, fixture.spans);
  const b = boundingBox(fc);
  const p = project(b.minLon, b.minLat, b, 640, 400, 24);
  assert.ok(Math.abs(p.x - 24) < 0.01);
  assert.ok(Math.abs(p.y - (400 - 24)) < 0.01);
});

test('renderMapSvg includes polyline and circle', () => {
  const fc = feederFeatureCollection(fixture.points, fixture.spans, fixture.feederId);
  const svg = renderMapSvg(fc, { title: 'VoltPulse demo' });
  assert.match(svg, /<svg /);
  assert.match(svg, /<polyline /);
  assert.match(svg, /<circle /);
  assert.match(svg, /vp-demo-span-01/);
  assert.match(svg, /vp-demo-tower-01/);
  assert.match(svg, /VoltPulse/);
});

test('renderMapHtml wraps SVG', () => {
  const fc = feederFeatureCollection(fixture.points, fixture.spans);
  const html = renderMapHtml(fc);
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /@voltpulse\/geo-map/);
  assert.match(html, /<svg /);
});
