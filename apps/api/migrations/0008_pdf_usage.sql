CREATE TABLE IF NOT EXISTS daily_pdf_usage (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  used_pages INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_pdf_usage_date ON daily_pdf_usage(date);
