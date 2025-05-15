// Auto-generated TypeScript model for the group_chat table
// Generated on 2025-05-15T02:51:28.591Z
// Originally defined in: V5__create-chat-tables.sql

/**
 * Interface for the group_chat table
 */
export interface GroupChat {
  /** Primary Key */
  chatId: number;
  groupName: string;
  adminUserId: number;
}

/**
 * Table interface (snake_case) for the group_chat table
 */
export interface GroupChatTable {
  /** Primary Key */
  chat_id: number;
  group_name: string;
  admin_user_id: number;
}
