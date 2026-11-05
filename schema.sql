CREATE TABLE IF NOT EXISTS inquiries (
 id TEXT PRIMARY KEY,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 phone TEXT,
 service TEXT NOT NULL,
 message TEXT NOT NULL,
 consent INTEGER NOT NULL DEFAULT 1,
 status TEXT NOT NULL DEFAULT 'new',
 source TEXT NOT NULL DEFAULT 'website'
);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status,created_at DESC);
CREATE TABLE IF NOT EXISTS request_limits (
 bucket TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
