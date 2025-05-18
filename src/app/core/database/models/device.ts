// Auto-generated TypeScript model for the devices table
// Generated on 2025-05-17T23:51:52.084Z
// Originally defined in: V7__create_device_table.sql

import { BaseModel, BaseTable } from './base.model';
import { Contact } from './contact';

/**
 * Interface for the devices table
 */
export interface Device extends BaseModel<number> {
  contactId: number;
  deviceId: string;
  identityPublicKey: string;
  /** Default: 1 */
  active?: number;

  /**
   * Relation to contacts
   * @see Contact
   */
  // contactId references contacts(id)
}

/**
 * Table interface (snake_case) for the devices table
 */
export interface DeviceTable extends BaseTable<number> {
  contact_id: number;
  device_id: string;
  identity_public_key: string;
  /** Default: 1 */
  active?: number;
}
