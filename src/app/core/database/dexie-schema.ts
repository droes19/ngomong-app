// Auto-generated Dexie.js database class from SQLite migrations
// Generated on 2025-05-15T02:15:01.121Z

import Dexie from 'dexie';


/**
 * Dexie database class with all migrations applied
 */
export class AppDatabase extends Dexie {
  // Table for users
  users: Dexie.Table<any, number>;

  constructor(dbName: string = 'AppDatabase') {
    super(dbName);

    // Define schema versions
    // v1 migration
    this.version(1).stores({
      users: '++id, email, nickname, pin'
    });

    // v2 migration
    this.version(2).stores({
      users: '++id, email, nickname, phone_number, pin'
    });

    // v3 migration
    this.version(3).stores({
      users: '++id, email, nickname, phone_number, pin, private_key'
    });

    // Initialize table references
    this.users = this.table('users');
  }
}

// Export a database instance with default name
export const db = new AppDatabase();
