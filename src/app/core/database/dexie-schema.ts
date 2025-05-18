// Auto-generated Dexie.js database class from SQLite migrations
// Generated on 2025-05-17T23:51:52.161Z

import Dexie from 'dexie';


/**
 * Dexie database class with all migrations applied
 */
export class AppDatabase extends Dexie {
  // Table for user
  user: Dexie.Table<any, number>;
  // Table for contacts
  contacts: Dexie.Table<any, number>;
  // Table for sessions
  sessions: Dexie.Table<any, number>;
  // Table for skipped_message_keys
  skipped_message_keys: Dexie.Table<any, number>;
  // Table for conversations
  conversations: Dexie.Table<any, number>;
  // Table for messages
  messages: Dexie.Table<any, number>;
  // Table for devices
  devices: Dexie.Table<any, number>;

  constructor(dbName: string = 'AppDatabase') {
    super(dbName);

    // Define schema versions
    // v1 migration
    this.version(1).stores({
      user: 'id, email, identity_key_pair, identity_public_key, nickname, phone_number, pin'
    });

    // v2 migration
    this.version(2).stores({
      user: 'id, email, identity_key_pair, identity_public_key, nickname, phone_number, pin',
      contacts: 'id, avatar_path, email, identity_public_key, nickname, phone_number, pin, status'
    });

    // v3 migration
    this.version(3).stores({
      user: 'id, email, identity_key_pair, identity_public_key, nickname, phone_number, pin',
      contacts: 'id, avatar_path, email, identity_public_key, nickname, phone_number, pin, status',
      sessions: '++id, active, contact_id, dh_peer_ratchet_key, dh_ratchet_key_pair, dh_ratchet_public_key, previous_sending_counter, receiving_chain_key, receiving_counter, root_key, sending_chain_key, sending_counter'
    });

    // v4 migration
    this.version(4).stores({
      user: 'id, email, identity_key_pair, identity_public_key, nickname, phone_number, pin',
      contacts: 'id, avatar_path, email, identity_public_key, nickname, phone_number, pin, status',
      sessions: '++id, active, contact_id, dh_peer_ratchet_key, dh_ratchet_key_pair, dh_ratchet_public_key, previous_sending_counter, receiving_chain_key, receiving_counter, root_key, sending_chain_key, sending_counter',
      skipped_message_keys: '++id, counter, message_key, ratchet_key, session_id'
    });

    // v5 migration
    this.version(5).stores({
      user: 'id, email, identity_key_pair, identity_public_key, nickname, phone_number, pin',
      contacts: 'id, avatar_path, email, identity_public_key, nickname, phone_number, pin, status',
      sessions: '++id, active, contact_id, dh_peer_ratchet_key, dh_ratchet_key_pair, dh_ratchet_public_key, previous_sending_counter, receiving_chain_key, receiving_counter, root_key, sending_chain_key, sending_counter',
      skipped_message_keys: '++id, counter, message_key, ratchet_key, session_id',
      conversations: '++id, archived, contact_id, last_message_preview, last_message_timestamp, pinned, session_id, unread_count'
    });

    // v6 migration
    this.version(6).stores({
      user: 'id, email, identity_key_pair, identity_public_key, nickname, phone_number, pin',
      contacts: 'id, avatar_path, email, identity_public_key, nickname, phone_number, pin, status',
      sessions: '++id, active, contact_id, dh_peer_ratchet_key, dh_ratchet_key_pair, dh_ratchet_public_key, previous_sending_counter, receiving_chain_key, receiving_counter, root_key, sending_chain_key, sending_counter',
      skipped_message_keys: '++id, counter, message_key, ratchet_key, session_id',
      conversations: '++id, archived, contact_id, last_message_preview, last_message_timestamp, pinned, session_id, unread_count',
      messages: '++id, conversation_id, delivered_timestamp, message_type, read_timestamp, sender_id, sent, sent_timestamp, session_id, status'
    });

    // v7 migration
    this.version(7).stores({
      user: 'id, email, identity_key_pair, identity_public_key, nickname, phone_number, pin',
      contacts: 'id, avatar_path, email, identity_public_key, nickname, phone_number, pin, status',
      sessions: '++id, active, contact_id, dh_peer_ratchet_key, dh_ratchet_key_pair, dh_ratchet_public_key, previous_sending_counter, receiving_chain_key, receiving_counter, root_key, sending_chain_key, sending_counter',
      skipped_message_keys: '++id, counter, message_key, ratchet_key, session_id',
      conversations: '++id, archived, contact_id, last_message_preview, last_message_timestamp, pinned, session_id, unread_count',
      messages: '++id, conversation_id, delivered_timestamp, message_type, read_timestamp, sender_id, sent, sent_timestamp, session_id, status',
      devices: '++id, active, contact_id, device_id, identity_public_key'
    });

    // v8 migration
    this.version(8).stores({
      user: 'id, email, identity_key_pair, identity_public_key, nickname, phone_number, pin',
      contacts: 'id, avatar_path, email, identity_public_key, nickname, phone_number, pin, status',
      sessions: '++id, active, contact_id, dh_peer_ratchet_key, dh_ratchet_key_pair, dh_ratchet_public_key, previous_sending_counter, receiving_chain_key, receiving_counter, root_key, sending_chain_key, sending_counter',
      skipped_message_keys: '++id, counter, message_key, ratchet_key, session_id',
      conversations: '++id, archived, contact_id, last_message_preview, last_message_timestamp, pinned, session_id, unread_count',
      messages: '++id, conversation_id, delivered_timestamp, message_type, read_timestamp, sender_id, sent, sent_timestamp, session_id, status',
      devices: '++id, active, contact_id, device_id, identity_public_key'
    });

    // Initialize table references
    this.user = this.table('user');
    this.contacts = this.table('contacts');
    this.sessions = this.table('sessions');
    this.skipped_message_keys = this.table('skipped_message_keys');
    this.conversations = this.table('conversations');
    this.messages = this.table('messages');
    this.devices = this.table('devices');
  }
}

// Export a database instance with default name
export const db = new AppDatabase();
