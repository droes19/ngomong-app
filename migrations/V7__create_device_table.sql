CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  identity_public_key TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
  UNIQUE (contact_id, device_id)
);
