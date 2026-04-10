CREATE TABLE IF NOT EXISTS web_credit_packs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  credits_total INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  purchased_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_web_credit_packs_user_id ON web_credit_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_web_credit_packs_expires_at ON web_credit_packs(expires_at);
