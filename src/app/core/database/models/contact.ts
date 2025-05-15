// Auto-generated TypeScript model for the contacts table
// Generated on 2025-05-15T02:51:28.588Z
// Originally defined in: V4__create_contact_table.sql

import { BaseModel, BaseTable } from './base.model';

/**
 * Interface for the contacts table
 */
export interface Contact extends BaseModel {
  /** Unique */
  nickname: string;
  /** Unique */
  pin: string;
  /** Unique */
  email: string;
  phoneNumber?: string;
  publicKey: string;
}

/**
 * Table interface (snake_case) for the contacts table
 */
export interface ContactTable extends BaseTable {
  /** Unique */
  nickname: string;
  /** Unique */
  pin: string;
  /** Unique */
  email: string;
  phone_number?: string;
  public_key: string;
}
