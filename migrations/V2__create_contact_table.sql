CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  pin TEXT,
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  identity_public_key TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  avatar_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime'))
);
