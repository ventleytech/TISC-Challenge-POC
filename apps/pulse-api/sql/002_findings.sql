-- VoltPulse pulse-api findings (S2 rules → API). Ids are TEXT so rules finding_id round-trips.
CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  utility_id UUID NOT NULL,
  class_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  risk_score DOUBLE PRECISION NOT NULL,
  inspection_id TEXT,
  asset_id TEXT,
  source_detection_ids TEXT[] NOT NULL DEFAULT '{}',
  evidence_object_ids TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_findings_utility_id ON findings (utility_id);
CREATE INDEX IF NOT EXISTS idx_findings_inspection_id ON findings (inspection_id);
