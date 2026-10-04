-- Contact pipeline storage (spec Q.3). Applied with
-- `wrangler d1 migrations apply DB --local` in development and `--remote`
-- by the deploy workflow. Never edit an applied migration; add a new file.

-- One row per accepted enquiry. Rows are persisted before forwarding to
-- Make.com and pruned after RETENTION_DAYS (90).
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  intent TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  contact_email_norm TEXT,
  is_duplicate INTEGER NOT NULL DEFAULT 0,
  duplicate_of INTEGER REFERENCES submissions (id),
  consent_given INTEGER NOT NULL,
  consent_timestamp TEXT NOT NULL,
  -- pending | forwarded | forward_failed | duplicate_not_forwarded
  status TEXT NOT NULL DEFAULT 'pending',
  forward_attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_submissions_email_created ON submissions (contact_email_norm, created_at);
CREATE INDEX idx_submissions_status ON submissions (status, next_attempt_at);

-- Fixed-window rate-limit counters keyed by an HMAC of the client IP, never
-- the raw IP. expires_at is a Unix timestamp in seconds.
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
