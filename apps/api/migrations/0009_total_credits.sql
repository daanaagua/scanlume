CREATE TABLE IF NOT EXISTS credit_balances (
  actor_type TEXT NOT NULL,
  actor_key TEXT NOT NULL,
  granted_credits INTEGER NOT NULL,
  used_credits INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (actor_type, actor_key)
);

CREATE INDEX IF NOT EXISTS idx_credit_balances_actor_type ON credit_balances(actor_type);
