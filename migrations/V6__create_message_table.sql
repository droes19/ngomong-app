CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_id INTEGER,
  sent INTEGER NOT NULL,
  sent_timestamp TEXT,
  delivered_timestamp TEXT,
  read_timestamp TEXT,
  status TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES contacts (id) ON DELETE SET NULL
);
