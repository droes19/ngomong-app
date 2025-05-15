// Auto-generated TypeScript model for the user table
// Generated on 2025-05-15T02:51:28.586Z
// Originally defined in: V1__create_user_table.sql

import { BaseModel, BaseTable } from './base.model';

/**
 * Interface for the user table
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
 * Table interface (snake_case) for the user table
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
