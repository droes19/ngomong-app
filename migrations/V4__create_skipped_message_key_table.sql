CREATE TABLE IF NOT EXISTS skipped_message_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  ratchet_key TEXT NOT NULL,
  counter INTEGER NOT NULL,
  message_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
  UNIQUE (session_id, ratchet_key, counter)
);
