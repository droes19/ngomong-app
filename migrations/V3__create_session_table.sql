CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  root_key TEXT,
  sending_chain_key TEXT,
  receiving_chain_key TEXT,
  dh_ratchet_key_pair TEXT,
  dh_ratchet_public_key TEXT,
  dh_peer_ratchet_key TEXT,
  sending_counter INTEGER DEFAULT 0,
  receiving_counter INTEGER DEFAULT 0,
  previous_sending_counter INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
);
