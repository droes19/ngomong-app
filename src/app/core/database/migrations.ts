// Auto-generated SQLite migrations array from SQL files
// Generated on 2025-05-21T05:38:39.554Z

import { capSQLiteVersionUpgrade } from "@capacitor-community/sqlite";

/**
 * SQLite migration definition
 */
export interface Migration {
  /** Version number of this migration */
  version: number;
  /** Human-readable description of what this migration does */
  description: string;
  /** Array of SQL queries to execute for this migration */
  queries: string[];
}

/**
 * Array of all SQLite migrations to apply
 */
export const ALL_MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Create User Table',
    queries: [
      `CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY, nickname TEXT NOT NULL, pin TEXT NOT NULL, email TEXT UNIQUE, phone_number TEXT UNIQUE, identity_key_pair TEXT NOT NULL, identity_public_key TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ) ) ;`
    ]
  },
  {
    version: 2,
    description: 'Create Contact Table',
    queries: [
      `CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, nickname TEXT NOT NULL, pin TEXT, email TEXT UNIQUE, phone_number TEXT UNIQUE, identity_public_key TEXT NOT NULL, status TEXT DEFAULT 'active', avatar_path TEXT, created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ) ) ;`
    ]
  },
  {
    version: 3,
    description: 'Create Session Table',
    queries: [
      `CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, contact_id INTEGER NOT NULL, active INTEGER DEFAULT 1, root_key TEXT, sending_chain_key TEXT, receiving_chain_key TEXT, dh_ratchet_key_pair TEXT, dh_ratchet_public_key TEXT, dh_peer_ratchet_key TEXT, sending_counter INTEGER DEFAULT 0, receiving_counter INTEGER DEFAULT 0, previous_sending_counter INTEGER DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE) ;`
    ]
  },
  {
    version: 4,
    description: 'Create Skipped Message Key Table',
    queries: [
      `CREATE TABLE IF NOT EXISTS skipped_message_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL, ratchet_key TEXT NOT NULL, counter INTEGER NOT NULL, message_key TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE, UNIQUE (session_id, ratchet_key, counter) ) ;`
    ]
  },
  {
    version: 5,
    description: 'Create Conversation Table',
    queries: [
      `CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, contact_id INTEGER NOT NULL, session_id INTEGER NOT NULL, last_message_preview TEXT, last_message_timestamp TEXT, unread_count INTEGER DEFAULT 0, pinned INTEGER DEFAULT 0, archived INTEGER DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE, FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE) ;`
    ]
  },
  {
    version: 6,
    description: 'Create Message Table',
    queries: [
      `CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, session_id INTEGER NOT NULL, message_type TEXT NOT NULL, content TEXT NOT NULL, sender_id INTEGER, sent INTEGER NOT NULL, sent_timestamp TEXT, delivered_timestamp TEXT, read_timestamp TEXT, status TEXT NOT NULL, FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE, FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE, FOREIGN KEY (sender_id) REFERENCES contacts (id) ON DELETE SET NULL) ;`
    ]
  },
  {
    version: 7,
    description: 'Create Device Table',
    queries: [
      `CREATE TABLE IF NOT EXISTS devices (id INTEGER PRIMARY KEY AUTOINCREMENT, contact_id INTEGER NOT NULL, device_id TEXT NOT NULL, identity_public_key TEXT NOT NULL, active INTEGER DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), updated_at TEXT NOT NULL DEFAULT (datetime ('now', 'localtime') ), FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE, UNIQUE (contact_id, device_id) ) ;`
    ]
  },
  {
    version: 8,
    description: 'Create Index And Trigger 1',
    queries: [
      `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id) ;`,
      `CREATE INDEX IF NOT EXISTS idx_messages_session ON messages (session_id) ;`,
      `CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (sent_timestamp) ;`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_contact ON sessions (contact_id) ;`,
      `CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations (contact_id) ;`,
      `CREATE INDEX IF NOT EXISTS idx_skipped_keys_session ON skipped_message_keys (session_id) ;`,
      `CREATE INDEX IF NOT EXISTS idx_devices_contact ON devices (contact_id) ;`,
      `CREATE TRIGGER IF NOT EXISTS user_updated_at AFTER UPDATE ON user BEGIN UPDATE user SET updated_at = datetime ('now', 'localtime') WHERE id = NEW.id; END;`,
      `CREATE TRIGGER IF NOT EXISTS contacts_updated_at AFTER UPDATE ON contacts BEGIN UPDATE contacts SET updated_at = datetime ('now', 'localtime') WHERE id = NEW.id; END;`,
      `CREATE TRIGGER IF NOT EXISTS sessions_updated_at AFTER UPDATE ON sessions BEGIN UPDATE sessions SET updated_at = datetime ('now', 'localtime') WHERE id = NEW.id; END;`,
      `CREATE TRIGGER IF NOT EXISTS conversations_updated_at AFTER UPDATE ON conversations BEGIN UPDATE conversations SET updated_at = datetime ('now', 'localtime') WHERE id = NEW.id; END;`
    ]
  }
];

/**
 * Prepare migration statements for Capacitor SQLite
 * @returns Upgrade statements for Capacitor SQLite
 */
export function prepareMigrations(): capSQLiteVersionUpgrade[] {
  // Create migrations table first
  const createMigrationsTable = `
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      executed_at TEXT NOT NULL
    )
  `;

  // Prepare upgrade statements for each version
  const upgradeStatements: capSQLiteVersionUpgrade[] = [];

  // Add upgrade statement for each migration
  for (const migration of ALL_MIGRATIONS) {
    upgradeStatements.push({
      toVersion: migration.version,
      statements: [createMigrationsTable, ...migration.queries]
    });
  }

  return upgradeStatements;
}
