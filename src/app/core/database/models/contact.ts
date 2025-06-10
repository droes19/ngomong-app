// Auto-generated TypeScript model for the contacts table
// Generated on 2025-06-07T18:16:20.345Z
// Originally defined in: V2__create_contact_table.sql

import { BaseModel, BaseTable } from './base.model';

/**
 * Interface for the contacts table
 */
export interface Contact extends BaseModel<string> {
  nickname: string;
  pin?: string;
  /** Unique */
  email?: string;
  /** Unique */
  phoneNumber?: string;
  identityPublicKey: string;
  /** Default: 'active' */
  status?: string;
  avatarPath?: string;
  /** Default: 0 */
  isMe?: number;
}

/**
 * Table interface (snake_case) for the contacts table
 */
export interface ContactTable extends BaseTable<string> {
  nickname: string;
  pin?: string;
  /** Unique */
  email?: string;
  /** Unique */
  phone_number?: string;
  identity_public_key: string;
  /** Default: 'active' */
  status?: string;
  avatar_path?: string;
  /** Default: 0 */
  is_me?: number;
}
