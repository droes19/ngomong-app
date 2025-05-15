// Auto-generated SQLite migrations array from SQL files
// Generated on 2025-05-15T04:04:57.560Z

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
      `CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, nickname TEXT UNIQUE NOT NULL, pin TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`
    ]
  },
  {
    version: 2,
    description: 'Add Phone Number',
    queries: [
      `ALTER TABLE user ADD COLUMN phone_number TEXT`
    ]
  },
  {
    version: 3,
    description: 'Add Private Key',
    queries: [
      `ALTER TABLE user ADD COLUMN private_key TEXT`
    ]
  },
  {
    version: 4,
    description: 'Create Contact Table',
    queries: [
      `CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT UNIQUE NOT NULL, pin TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, phone_number TEXT NULL, public_key TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`
    ]
  },
  {
    version: 5,
    description: 'Create Chat Tables',
    queries: [
      `CREATE TABLE chat (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT NOT NULL, user_id INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users (id) )`,
      `CREATE TABLE group_chat (chat_id INTEGER PRIMARY KEY, group_name TEXT NOT NULL, admin_user_id INTEGER NOT NULL, FOREIGN KEY (chat_id) REFERENCES chat (id) ON DELETE CASCADE, FOREIGN KEY (admin_user_id) REFERENCES users (id) )`
    ]
  }
];

/**
 * Prepare migration statements for Capacitor SQLite
 * @returns Upgrade statements for Capacitor SQLite
 */
export function prepareMigrations() {
  // Create migrations table first
  const createMigrationsTable = `
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      executed_at TEXT NOT NULL
    )
  `;

  // Prepare upgrade statements for each version
  const upgradeStatements = [];

  // Add upgrade statement for each migration
  for (const migration of ALL_MIGRATIONS) {
    upgradeStatements.push({
      toVersion: migration.version,
      statements: [createMigrationsTable, ...migration.queries]
    });
  }

  return upgradeStatements;
}
