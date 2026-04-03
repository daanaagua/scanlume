CREATE TABLE IF NOT EXISTS billing_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_session_id TEXT,
  provider_event_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS web_subscription_terms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  billing_interval TEXT NOT NULL,
  credits_total INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_credit_packs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  credits_total INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  purchased_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_four TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  result_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_billing_purchases_user_id ON billing_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_web_subscription_terms_user_id ON web_subscription_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_api_credit_packs_user_id ON api_credit_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_credit_packs_expires_at ON api_credit_packs(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_jobs_user_id ON api_jobs(user_id);
