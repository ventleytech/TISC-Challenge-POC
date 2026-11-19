import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { NotifySettings } from '../config.js';
import type { DeliveryRecord, VpAlertBody } from '../types.js';

/** Wire shape written to the webhook body / file line (one per channel delivery). */
export interface SinkMessage {
  alert_id: string;
  finding_id: string;
  inspection_id?: string;
  utility_id?: string;
  severity: string;
  sla_due_at: string;
  channel: string;
  delivered_at: string;
}

function toMessage(alert: VpAlertBody, d: DeliveryRecord): SinkMessage {
  return {
    alert_id: alert.alert_id,
    finding_id: alert.finding_id,
    inspection_id: alert.inspection_id,
    utility_id: alert.utility_id,
    severity: alert.severity,
    sla_due_at: alert.sla_due_at,
    channel: d.channel,
    delivered_at: d.deliveredAt,
  };
}

/**
 * Real-sink hop for adapter=webhook|file. Mock channel records stay as the base;
 * sink result overwrites status/detail (sent | failed). adapter=log is a no-op.
 * Skipped records (e.g. email) are not emitted.
 */
export async function sinkDeliveries(
  settings: NotifySettings,
  alert: VpAlertBody,
  records: DeliveryRecord[],
  fetchImpl: typeof fetch = fetch,
): Promise<DeliveryRecord[]> {
  if (settings.adapter === 'log') return records;
  const out: DeliveryRecord[] = [];
  for (const d of records) {
    if (d.status === 'skipped') {
      out.push(d);
      continue;
    }
    const msg = toMessage(alert, d);
    try {
      const detail =
        settings.adapter === 'webhook'
          ? await postWebhook(settings, msg, fetchImpl)
          : await appendLine(settings.filePath, msg);
      console.info(`[pulse-notify] ${settings.adapter} sink ok alert=${alert.alert_id} channel=${d.channel}`);
      out.push({ ...d, status: 'sent', detail });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[pulse-notify] ${settings.adapter} sink failed alert=${alert.alert_id} channel=${d.channel}: ${message}`,
      );
      out.push({ ...d, status: 'failed', detail: `${settings.adapter}: ${message}` });
    }
  }
  return out;
}

async function postWebhook(
  settings: NotifySettings,
  msg: SinkMessage,
  fetchImpl: typeof fetch,
): Promise<string> {
  const res = await fetchImpl(settings.webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(msg),
    signal: AbortSignal.timeout(settings.webhookTimeoutMs),
  });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return `webhook:http ${res.status}`;
}

async function appendLine(filePath: string, msg: SinkMessage): Promise<string> {
  await mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(msg)}\n`, 'utf8');
  return `file:${filePath}`;
}
