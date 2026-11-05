CREATE TABLE IF NOT EXISTS admin_login_attempts (
 bucket TEXT PRIMARY KEY,
 count INTEGER NOT NULL DEFAULT 0,
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS inquiry_events (
 id TEXT PRIMARY KEY,
 inquiry_id TEXT NOT NULL,
 actor TEXT NOT NULL,
 from_status TEXT,
 to_status TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inquiry_events ON inquiry_events(inquiry_id,created_at DESC);
