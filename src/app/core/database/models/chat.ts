// Auto-generated TypeScript model for the chat table
// Generated on 2025-05-15T02:51:28.589Z
// Originally defined in: V5__create-chat-tables.sql

/**
 * Interface for the chat table
 */
export interface Chat {
  /** Primary Key, Auto Increment */
  id: number;
  message: string;
  userId: number;
}

/**
 * Table interface (snake_case) for the chat table
 */
export interface ChatTable {
  /** Primary Key, Auto Increment */
  id: number;
  message: string;
  user_id: number;
}
