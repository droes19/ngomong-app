// Auto-generated TypeScript model for the users table
// Generated on 2025-05-15T02:15:01.113Z
// Originally defined in: V1__create_user_table.sql

import { BaseModel, BaseTable } from './base.model';

/**
 * Interface for the users table
 */
export interface User extends BaseModel {
  /** Unique */
  nickname: string;
  /** Unique */
  pin: string;
  /** Unique */
  email: string;
  phoneNumber?: string;
  privateKey?: string;
}

/**
 * Table interface (snake_case) for the users table
 */
export interface UserTable extends BaseTable {
  /** Unique */
  nickname: string;
  /** Unique */
  pin: string;
  /** Unique */
  email: string;
  phone_number?: string;
  private_key?: string;
}
