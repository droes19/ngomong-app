CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  pin TEXT NOT NULL,
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  identity_key_pair TEXT NOT NULL,
  identity_public_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime'))
);
