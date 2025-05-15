// Auto-generated Dexie.js database class from SQLite migrations
// Generated on 2025-05-15T04:04:57.776Z

import Dexie from 'dexie';


/**
 * Dexie database class with all migrations applied
 */
export class AppDatabase extends Dexie {
  // Table for user
  user: Dexie.Table<any, number>;
  // Table for contacts
  contacts: Dexie.Table<any, number>;
  // Table for chat
  chat: Dexie.Table<any, number>;
  // Table for group_chat
  group_chat: Dexie.Table<any, number>;

  constructor(dbName: string = 'AppDatabase') {
    super(dbName);

    // Define schema versions
    // v1 migration
    this.version(1).stores({
      user: 'id, email, nickname, pin'
    });

    // v2 migration
    this.version(2).stores({
      user: 'id, email, nickname, phone_number, pin'
    });

    // v3 migration
    this.version(3).stores({
      user: 'id, email, nickname, phone_number, pin, private_key'
    });

    // v4 migration
    this.version(4).stores({
      user: 'id, email, nickname, phone_number, pin, private_key',
      contacts: '++id, email, nickname, phone_number, pin, public_key'
    });

    // v5 migration
    this.version(5).stores({
      user: 'id, email, nickname, phone_number, pin, private_key',
      contacts: '++id, email, nickname, phone_number, pin, public_key',
      chat: '++id, message, user_id',
      group_chat: 'chat_id, admin_user_id, group_name'
    });

    // Initialize table references
    this.user = this.table('user');
    this.contacts = this.table('contacts');
    this.chat = this.table('chat');
    this.group_chat = this.table('group_chat');
  }
}

// Export a database instance with default name
export const db = new AppDatabase();
