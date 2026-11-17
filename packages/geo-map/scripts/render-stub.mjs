#!/usr/bin/env node
/**
 * Render fixtures/demo-feeder.json → stub/map.html
 * Run: npm run render-stub  (from packages/geo-map)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  feederFeatureCollection,
  renderMapHtml,
} from '../src/index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'fixtures/demo-feeder.json'), 'utf8'));
const fc = feederFeatureCollection(raw.points, raw.spans, raw.feederId);
const html = renderMapHtml(fc, {
  title: 'VoltPulse digital-twin lite — demo feeder',
  width: 720,
  height: 420,
});

const outDir = join(root, 'stub');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'map.html');
writeFileSync(outPath, html, 'utf8');
console.log(`wrote ${outPath} features=${fc.features.length}`);
