// Auto-generated TypeScript model for the contacts table
// Generated on 2025-05-17T23:51:52.023Z
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
}
