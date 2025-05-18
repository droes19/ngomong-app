// Auto-generated TypeScript model for the user table
// Generated on 2025-05-17T23:51:52.014Z
// Originally defined in: V1__create_user_table.sql

import { BaseModel, BaseTable } from './base.model';

/**
 * Interface for the user table
 */
export interface User extends BaseModel<string> {
  nickname: string;
  pin: string;
  /** Unique */
  email?: string;
  /** Unique */
  phoneNumber?: string;
  identityKeyPair: string;
  identityPublicKey: string;
}

/**
 * Table interface (snake_case) for the user table
 */
export interface UserTable extends BaseTable<string> {
  nickname: string;
  pin: string;
  /** Unique */
  email?: string;
  /** Unique */
  phone_number?: string;
  identity_key_pair: string;
  identity_public_key: string;
}
