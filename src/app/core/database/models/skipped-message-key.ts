// Auto-generated TypeScript model for the skipped_message_keys table
// Generated on 2025-05-17T23:51:52.038Z
// Originally defined in: V4__create_skipped_message_key_table.sql

import { Session } from './session';

/**
 * Interface for the skipped_message_keys table
 */
export interface SkippedMessageKey {
  /** Primary Key, Auto Increment */
  id: number;
  sessionId: number;
  ratchetKey: string;
  counter: number;
  messageKey: string;
  /** Default: (datetime ('now', 'localtime')) */
  createdAt: string;

  /**
   * Relation to sessions
   * @see Session
   */
  // sessionId references sessions(id)
}

/**
 * Table interface (snake_case) for the skipped_message_keys table
 */
export interface SkippedMessageKeyTable {
  /** Primary Key, Auto Increment */
  id: number;
  session_id: number;
  ratchet_key: string;
  counter: number;
  message_key: string;
  /** Default: (datetime ('now', 'localtime')) */
  created_at: string;
}
