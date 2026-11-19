#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDetectFixture } from './bus/fixture-source.js';
import { KafkaSink, kafkaSinkEnabled } from './bus/kafka-sink.js';
import { MemorySink } from './bus/memory-sink.js';
import { loadSettings } from './config/settings.js';
import { processDetectEvent } from './rules-engine.js';
import type { AssetContext } from './types.js';

function parseArgs(argv: string[]): {
  fixture: string;
  assetsPath?: string;
} {
  let fixture =
    'fixtures/synthetic-detect.v1.json';
  let assetsPath: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fixture' && argv[i + 1]) {
      fixture = argv[++i]!;
    } else if (a === '--assets' && argv[i + 1]) {
      assetsPath = argv[++i]!;
    } else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: grid-rules --fixture <detect.json> [--assets <assets.json>]',
      );
      process.exit(0);
    }
  }
  return { fixture, assetsPath };
}

async function main(): Promise<void> {
  const settings = loadSettings();
  const { fixture, assetsPath } = parseArgs(process.argv.slice(2));
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const fixturePath = resolve(root, fixture);
  const detect = await loadDetectFixture(fixturePath);

  let assets: Record<string, AssetContext> | undefined;
  const { readFile, access } = await import('node:fs/promises');
  const { constants } = await import('node:fs');
  if (assetsPath) {
    const raw = await readFile(resolve(root, assetsPath), 'utf8');
    assets = JSON.parse(raw) as Record<string, AssetContext>;
  } else {
    const defaultAssets = resolve(root, 'fixtures/assets.json');
    try {
      await access(defaultAssets, constants.R_OK);
      const raw = await readFile(defaultAssets, 'utf8');
      assets = JSON.parse(raw) as Record<string, AssetContext>;
    } catch {
      // Fallback demo asset (no OEM/warranty → no S9 extensions)
      if (detect.asset_id) {
        assets = {
          [detect.asset_id]: {
            asset_id: detect.asset_id,
            criticality: 'high',
            voltage_class: '132kV HV',
            utility_id: '11111111-1111-4111-8111-111111111111',
          },
        };
      }
    }
  }

  const result = processDetectEvent(detect, { settings, assets });
  const sink = new MemorySink(settings);
  const emitted = sink.emit(result);

  let kafkaPublished = 0;
  if (kafkaSinkEnabled(settings)) {
    const kafka = await KafkaSink.connect(settings);
    try {
      kafkaPublished = await kafka.publish(emitted);
    } finally {
      await kafka.disconnect();
    }
  } else if (settings.kafkaProducer.enabled) {
    console.error(
      '[grid-rules] GRID_RULES_KAFKA_PRODUCER_ENABLED=true but KAFKA_BROKERS unset — kafka publish skipped',
    );
  }

  const summary = {
    service: settings.serviceName,
    source_topic: settings.topics.detect,
    input_detections: detect.detections.length,
    findings: result.findings.length,
    alerts: result.alerts.length,
    kafka_published: kafkaPublished,
    top_risk: result.findings[0]?.finding.risk_score ?? null,
    emitted: emitted.map((e) => ({
      topic: e.topic,
      id:
        'finding' in e.payload
          ? e.payload.finding.finding_id
          : e.payload.alert.alert_id,
      severity:
        'finding' in e.payload
          ? e.payload.finding.severity
          : e.payload.alert.severity,
      risk_score:
        'finding' in e.payload ? e.payload.finding.risk_score : undefined,
      party_type:
        'finding' in e.payload
          ? e.payload.finding.extensions?.party_type
          : undefined,
      warranty_hint:
        'finding' in e.payload
          ? e.payload.finding.extensions?.warranty_hint
          : undefined,
      sla_due_at:
        'alert' in e.payload ? e.payload.alert.sla_due_at : undefined,
    })),
  };

  console.log(JSON.stringify({ summary, findings: result.findings, alerts: result.alerts }, null, 2));
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[grid-rules] ${message}`);
  process.exit(1);
});
