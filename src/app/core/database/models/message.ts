// Auto-generated TypeScript model for the messages table
// Generated on 2025-05-17T23:51:52.065Z
// Originally defined in: V6__create_message_table.sql

import { Conversation } from './conversation';
import { Session } from './session';
import { Contact } from './contact';

/**
 * Interface for the messages table
 */
export interface Message {
  /** Primary Key, Auto Increment */
  id: number;
  conversationId: number;
  sessionId: number;
  messageType: string;
  content: string;
  senderId?: number;
  sent: number;
  sentTimestamp?: string;
  deliveredTimestamp?: string;
  readTimestamp?: string;
  status: string;

  /**
   * Relation to conversations
   * @see Conversation
   */
  // conversationId references conversations(id)

  /**
   * Relation to sessions
   * @see Session
   */
  // sessionId references sessions(id)

  /**
   * Relation to contacts
   * @see Contact
   */
  // senderId references contacts(id)
}

/**
 * Table interface (snake_case) for the messages table
 */
export interface MessageTable {
  /** Primary Key, Auto Increment */
  id: number;
  conversation_id: number;
  session_id: number;
  message_type: string;
  content: string;
  sender_id?: number;
  sent: number;
  sent_timestamp?: string;
  delivered_timestamp?: string;
  read_timestamp?: string;
  status: string;
}
