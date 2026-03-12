CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  browser_id TEXT NOT NULL,
  user_id TEXT,
  mode TEXT NOT NULL,
  image_count INTEGER NOT NULL DEFAULT 1,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_rmb REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_budget (
  date TEXT PRIMARY KEY,
  total_cost_rmb REAL NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_images INTEGER NOT NULL DEFAULT 0,
  soft_stopped INTEGER NOT NULL DEFAULT 0,
  hard_stopped INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  mode TEXT NOT NULL,
  result_format TEXT NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  zip_url TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  date TEXT NOT NULL,
  used_images INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (key, date)
);
