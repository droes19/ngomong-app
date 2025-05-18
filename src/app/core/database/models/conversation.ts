// Auto-generated TypeScript model for the conversations table
// Generated on 2025-05-17T23:51:52.049Z
// Originally defined in: V5__create_conversation_table.sql

import { BaseModel, BaseTable } from './base.model';
import { Contact } from './contact';
import { Session } from './session';

/**
 * Interface for the conversations table
 */
export interface Conversation extends BaseModel<number> {
  contactId: number;
  sessionId: number;
  lastMessagePreview?: string;
  lastMessageTimestamp?: string;
  /** Default: 0 */
  unreadCount?: number;
  /** Default: 0 */
  pinned?: number;
  /** Default: 0 */
  archived?: number;

  /**
   * Relation to contacts
   * @see Contact
   */
  // contactId references contacts(id)

  /**
   * Relation to sessions
   * @see Session
   */
  // sessionId references sessions(id)
}

/**
 * Table interface (snake_case) for the conversations table
 */
export interface ConversationTable extends BaseTable<number> {
  contact_id: number;
  session_id: number;
  last_message_preview?: string;
  last_message_timestamp?: string;
  /** Default: 0 */
  unread_count?: number;
  /** Default: 0 */
  pinned?: number;
  /** Default: 0 */
  archived?: number;
}
