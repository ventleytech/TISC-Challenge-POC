-- VoltPulse tenancy (utilities / sites / memberships) — M01/M02 durable
CREATE TABLE IF NOT EXISTS utilities (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY,
  utility_id UUID NOT NULL REFERENCES utilities (id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sites_utility_id ON sites (utility_id);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY,
  utility_id UUID NOT NULL REFERENCES utilities (id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  key_id TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_memberships_utility_id ON memberships (utility_id);
