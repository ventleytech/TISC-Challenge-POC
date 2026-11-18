import type { Settings } from '../config/settings.js';
import type { EmittedRecord } from './memory-sink.js';

type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'text'>>;

export type HttpPostResult = { posted: number; failed: number };

/** True when GRID_RULES_API_BASE_URL is set. */
export function httpSinkEnabled(settings: Settings): boolean {
  return settings.apiSink.baseUrl !== null;
}

/**
 * Posts emitted findings/alerts to pulse-api (`POST /api/v1/findings`, `POST /api/v1/alerts`).
 * Never throws: each failure is logged and counted so the rules loop keeps running.
 */
export class HttpSink {
  /** finding_id → utility_id, so an alert without utility_id can reuse its finding's tenant. */
  private readonly tenantByFinding = new Map<string, string>();

  constructor(
    private readonly settings: Settings,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async post(records: EmittedRecord[]): Promise<HttpPostResult> {
    const out: HttpPostResult = { posted: 0, failed: 0 };
    for (const rec of records) {
      const p = rec.payload;
      const req =
        'finding' in p ? this.findingRequest(p) : this.alertRequest(p);
      if ('error' in req) {
        out.failed++;
        console.error(`[grid-rules] http sink skip: ${req.error}`);
        continue;
      }
      if (await this.send(req.path, req.body)) out.posted++;
      else out.failed++;
    }
    return out;
  }

  private findingRequest(p: Extract<EmittedRecord['payload'], { finding: unknown }>) {
    const f = p.finding;
    const utility = p.utility_id;
    if (!utility) return { error: `finding ${f.finding_id} has no utility_id` };
    this.tenantByFinding.set(f.finding_id, utility);
    return {
      path: '/api/v1/findings',
      body: {
        id: f.finding_id,
        utility_id: utility,
        class_id: f.class_id,
        severity: f.severity,
        risk_score: f.risk_score,
        inspection_id: p.inspection_id,
        asset_id: f.asset_id ?? null,
        source_detection_ids: f.source_detection_ids ?? [],
        evidence_object_ids: f.evidence_object_ids ?? [],
      },
    };
  }

  private alertRequest(p: Extract<EmittedRecord['payload'], { alert: unknown }>) {
    const a = p.alert;
    const utility = a.utility_id ?? this.tenantByFinding.get(a.finding_id);
    if (!utility) return { error: `alert ${a.alert_id} has no utility_id` };
    return {
      path: '/api/v1/alerts',
      body: {
        finding_id: a.finding_id,
        utility_id: utility,
        severity: a.severity,
        inspection_id: a.inspection_id,
        sla_due_at: a.sla_due_at,
      },
    };
  }

  private async send(path: string, body: unknown): Promise<boolean> {
    const { baseUrl, apiKey, timeoutMs } = this.settings.apiSink;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    try {
      const res = await this.fetchImpl(`${baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return true;
      console.error(`[grid-rules] http sink ${path} -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
    } catch (err) {
      console.error(`[grid-rules] http sink ${path} failed: ${(err as Error).message}`);
    }
    return false;
  }
}
