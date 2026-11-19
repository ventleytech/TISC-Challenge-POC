-- VoltPulse pulse-api minimal schema (inspections / assets / alerts)
-- Idempotent: safe to re-run via db:migrate

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY,
  utility_id UUID NOT NULL,
  name TEXT NOT NULL,
  site_id UUID,
  criticality TEXT,
  voltage_class TEXT
);

CREATE INDEX IF NOT EXISTS idx_assets_utility_id ON assets (utility_id);

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY,
  utility_id UUID NOT NULL,
  status TEXT NOT NULL,
  asset_ids UUID[] NOT NULL DEFAULT '{}',
  planned_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inspections_utility_id ON inspections (utility_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections (status);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY,
  finding_id TEXT NOT NULL,
  utility_id UUID NOT NULL,
  severity TEXT NOT NULL,
  inspection_id UUID,
  sla_due_at TIMESTAMPTZ,
  ack_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_utility_id ON alerts (utility_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
