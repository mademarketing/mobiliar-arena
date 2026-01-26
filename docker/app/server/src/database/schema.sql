-- Prize Management Database Schema
-- SQLite database for managing prizes, schedules, and inventory

-- Prizes table: Reusable prize definitions
-- Multiple prizes can share the same texture_key (e.g., CHF 10/50/100 giftcards)
CREATE TABLE prizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  texture_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_prizes_texture_key ON prizes(texture_key);

-- Scheduled prizes: Time-specific prize instances
CREATE TABLE scheduled_prizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prize_id INTEGER NOT NULL,
  datetime TEXT NOT NULL,
  date TEXT NOT NULL,
  awarded BOOLEAN NOT NULL DEFAULT 0,
  awarded_at TEXT,
  FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE CASCADE
);
CREATE INDEX idx_scheduled_datetime ON scheduled_prizes(datetime);
CREATE INDEX idx_scheduled_awarded ON scheduled_prizes(awarded);
CREATE INDEX idx_scheduled_date ON scheduled_prizes(date);
-- Composite index for the critical query: WHERE datetime <= ? AND awarded = 0
CREATE INDEX idx_scheduled_awarded_datetime ON scheduled_prizes(awarded, datetime);
-- Composite index for date-based queries: WHERE date = ? AND awarded = ?
CREATE INDEX idx_scheduled_awarded_date ON scheduled_prizes(awarded, date);

-- Daily inventory: Per-day inventory quotas (supports multiple prize types)
CREATE TABLE daily_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prize_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
  awarded_quantity INTEGER NOT NULL DEFAULT 0 CHECK (awarded_quantity >= 0),
  FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE CASCADE,
  UNIQUE(prize_id, date),
  CHECK (awarded_quantity <= total_quantity)
);
CREATE INDEX idx_inventory_date ON daily_inventory(date);
CREATE INDEX idx_inventory_prize_date ON daily_inventory(prize_id, date);

-- Game state: Key-value store for game configuration
CREATE TABLE game_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Play log: Historical record of all plays
CREATE TABLE play_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  date TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  prize_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  win_probability REAL NOT NULL,
  inventory_remaining INTEGER,
  inventory_total INTEGER,
  print_status TEXT NOT NULL DEFAULT 'not_printed' CHECK(print_status IN ('not_printed', 'success', 'failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_play_log_date ON play_log(date);
CREATE INDEX idx_play_log_timestamp ON play_log(timestamp);
-- Composite index for stats queries: WHERE date = ? (and often grouped by prize_type)
CREATE INDEX idx_play_log_date_prize_type ON play_log(date, prize_type);

-- QR codes: Voucher codes for prize redemption
CREATE TABLE qr_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prize_id INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_used INTEGER DEFAULT 0,
  used_at TEXT,
  play_log_id INTEGER,
  FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE CASCADE,
  FOREIGN KEY (play_log_id) REFERENCES play_log(id) ON DELETE SET NULL
);
CREATE INDEX idx_qr_codes_prize_unused ON qr_codes(prize_id, is_used);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
