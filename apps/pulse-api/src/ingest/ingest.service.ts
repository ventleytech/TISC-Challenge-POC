import { Injectable, Logger } from '@nestjs/common';
import { DomainStore } from '../domain/domain.store';
import {
  DETECTION_CLASSES,
  SEVERITIES,
  type Alert,
  type DetectionClass,
  type Finding,
  type Severity,
} from '../domain/types';

/** vp.findings.v1 envelope (packages/contracts/events/findings). */
export type FindingsEvent = {
  event_id: string;
  occurred_at: string;
  inspection_id: string;
  /** Optional tenant (additive); used when the inspection row is unknown. */
  utility_id?: string;
  finding: {
    finding_id: string;
    class_id: DetectionClass;
    severity: Severity;
    risk_score: number;
    asset_id?: string | null;
    source_detection_ids?: string[];
    evidence_object_ids?: string[];
  };
};

/** vp.alerts.v1 envelope (packages/contracts/events/alerts). */
export type AlertsEvent = {
  event_id: string;
  occurred_at: string;
  alert: {
    alert_id: string;
    finding_id: string;
    inspection_id?: string;
    utility_id?: string;
    severity: Severity;
    sla_due_at: string;
  };
};

export type IngestOutcome = 'created' | 'duplicate';

/** Non-retryable: message is malformed or cannot be attributed to a utility. */
export class IngestRejectedError extends Error {}

/**
 * Bus -> DomainStore writer. Nest stays write authority: consumers call this,
 * never the store directly. Idempotent on finding_id / alert_id so Kafka
 * at-least-once redelivery is safe.
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(private readonly store: DomainStore) {}

  async ingestFinding(
    event: FindingsEvent,
    defaultUtilityId: string | null,
  ): Promise<IngestOutcome> {
    const f = event?.finding;
    if (!f?.finding_id || !DETECTION_CLASSES.includes(f.class_id)) {
      throw new IngestRejectedError('finding: bad finding_id/class_id');
    }
    if (!SEVERITIES.includes(f.severity)) {
      throw new IngestRejectedError(`finding: bad severity ${f.severity}`);
    }
    if (typeof f.risk_score !== 'number' || Number.isNaN(f.risk_score)) {
      throw new IngestRejectedError('finding: risk_score must be a number');
    }
    if (await this.store.getFinding(f.finding_id)) {
      return 'duplicate';
    }
    const inspection = event.inspection_id
      ? await this.store.getInspection(event.inspection_id)
      : undefined;
    // Precedence: stored inspection (authoritative) > event.utility_id > env default.
    const utilityId =
      inspection?.utility_id ?? event.utility_id ?? defaultUtilityId;
    if (!utilityId) {
      throw new IngestRejectedError(
        `finding ${f.finding_id}: no utility (unknown inspection, no event utility_id, no default)`,
      );
    }
    const row: Finding = {
      id: f.finding_id,
      utility_id: utilityId,
      class_id: f.class_id,
      severity: f.severity,
      risk_score: f.risk_score,
      inspection_id: event.inspection_id ?? null,
      asset_id: f.asset_id ?? null,
      source_detection_ids: f.source_detection_ids ?? [],
      evidence_object_ids: f.evidence_object_ids ?? [],
    };
    await this.store.createFinding(row);
    this.logger.log(
      `finding ${row.id} ingested (${row.class_id}/${row.severity})`,
    );
    return 'created';
  }

  async ingestAlert(
    event: AlertsEvent,
    defaultUtilityId: string | null,
  ): Promise<IngestOutcome> {
    const a = event?.alert;
    if (!a?.alert_id || !a.finding_id) {
      throw new IngestRejectedError('alert: alert_id/finding_id required');
    }
    if (!SEVERITIES.includes(a.severity)) {
      throw new IngestRejectedError(`alert: bad severity ${a.severity}`);
    }
    if (await this.store.getAlert(a.alert_id)) {
      return 'duplicate';
    }
    const finding = await this.store.getFinding(a.finding_id);
    const utilityId = a.utility_id ?? finding?.utility_id ?? defaultUtilityId;
    if (!utilityId) {
      throw new IngestRejectedError(`alert ${a.alert_id}: no utility_id`);
    }
    const row: Alert = {
      id: a.alert_id,
      finding_id: a.finding_id,
      utility_id: utilityId,
      severity: a.severity,
      inspection_id: a.inspection_id,
      sla_due_at: a.sla_due_at ?? null,
      ack_at: null,
    };
    await this.store.createAlert(row);
    this.logger.log(`alert ${row.id} ingested (${row.severity})`);
    return 'created';
  }
}
