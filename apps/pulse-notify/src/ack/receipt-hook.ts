import type { NotifySettings } from '../config.js';
import type { AckReceipt, DeliveryRecord } from '../types.js';

export interface AckResult {
  mode: NotifySettings['ackMode'];
  ok: boolean;
  detail: string;
  receipt: AckReceipt;
}

export function buildReceipt(
  alertId: string,
  topic: string,
  deliveries: DeliveryRecord[],
): AckReceipt {
  return {
    alert_id: alertId,
    topic,
    deliveries,
    ack_at: new Date().toISOString(),
  };
}

/**
 * Ack/receipt hook after channel delivery.
 * log = local only; http = POST receipt under pulse-api alerts path; off = no-op.
 */
export async function sendAck(
  settings: NotifySettings,
  receipt: AckReceipt,
  fetchImpl: typeof fetch = fetch,
): Promise<AckResult> {
  if (settings.ackMode === 'off') {
    return { mode: 'off', ok: true, detail: 'ack disabled', receipt };
  }

  if (settings.ackMode === 'log') {
    console.info(
      `[pulse-notify] ack receipt alert=${receipt.alert_id} deliveries=${receipt.deliveries.length}`,
    );
    return { mode: 'log', ok: true, detail: 'logged', receipt };
  }

  const base = settings.apiBaseUrl.replace(/\/$/, '');
  const path = settings.ackPath.startsWith('/') ? settings.ackPath : `/${settings.ackPath}`;
  const url = `${base}${path}/${encodeURIComponent(receipt.alert_id)}/receipts`;

  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(receipt),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(
        `[pulse-notify] ack http failed status=${res.status} alert=${receipt.alert_id} body=${text.slice(0, 200)}`,
      );
      return {
        mode: 'http',
        ok: false,
        detail: `http ${res.status}`,
        receipt,
      };
    }
    console.info(`[pulse-notify] ack http ok alert=${receipt.alert_id} url=${url}`);
    return { mode: 'http', ok: true, detail: `http ${res.status}`, receipt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pulse-notify] ack http error alert=${receipt.alert_id}: ${message}`);
    return { mode: 'http', ok: false, detail: message, receipt };
  }
}
