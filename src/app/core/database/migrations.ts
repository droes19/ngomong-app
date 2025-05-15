// Auto-generated SQLite migrations array from SQL files
// Generated on 2025-05-15T02:15:01.106Z

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
      `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT UNIQUE NOT NULL, pin TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`
    ]
  },
  {
    version: 2,
    description: 'Add Phone Number',
    queries: [
      `ALTER TABLE users ADD COLUMN phone_number TEXT`
    ]
  },
  {
    version: 3,
    description: 'Add Private Key',
    queries: [
      `ALTER TABLE users ADD COLUMN private_key TEXT`
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
