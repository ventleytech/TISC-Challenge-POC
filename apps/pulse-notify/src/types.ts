/** Aligns with packages/contracts/events/alerts/vp.alerts.v1.schema.json */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type NotifyChannel = 'push' | 'sms' | 'email';

export interface VpAlertBody {
  alert_id: string;
  finding_id: string;
  inspection_id?: string;
  utility_id?: string;
  severity: Severity;
  sla_due_at: string;
  channels?: NotifyChannel[];
}

export interface VpAlertsV1 {
  event_id: string;
  occurred_at: string;
  alert: VpAlertBody;
}

export type DeliveryStatus = 'sent' | 'failed' | 'skipped';

export interface DeliveryRecord {
  alertId: string;
  channel: NotifyChannel;
  adapter: string;
  status: DeliveryStatus;
  detail: string;
  deliveredAt: string;
}

export interface AckReceipt {
  alert_id: string;
  topic: string;
  deliveries: DeliveryRecord[];
  ack_at: string;
}
