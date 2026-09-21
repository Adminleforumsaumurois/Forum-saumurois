CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  subtype TEXT,
  other_name TEXT,
  address TEXT NOT NULL,
  territory TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  description TEXT,
  observed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'published',
  spam_score INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT,
  moderation_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_observed_at ON reports(observed_at);
CREATE INDEX IF NOT EXISTS idx_reports_territory ON reports(territory);
CREATE INDEX IF NOT EXISTS idx_reports_ip_created ON reports(ip_hash, created_at);