CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  last_message_preview TEXT,
  last_message_timestamp TEXT,
  unread_count INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);
