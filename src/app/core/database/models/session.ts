// Auto-generated TypeScript model for the sessions table
// Generated on 2025-05-17T23:51:52.033Z
// Originally defined in: V3__create_session_table.sql

import { BaseModel, BaseTable } from './base.model';
import { Contact } from './contact';

/**
 * Interface for the sessions table
 */
export interface Session extends BaseModel<number> {
  contactId: number;
  /** Default: 1 */
  active?: number;
  rootKey?: string;
  sendingChainKey?: string;
  receivingChainKey?: string;
  dhRatchetKeyPair?: string;
  dhRatchetPublicKey?: string;
  dhPeerRatchetKey?: string;
  /** Default: 0 */
  sendingCounter?: number;
  /** Default: 0 */
  receivingCounter?: number;
  /** Default: 0 */
  previousSendingCounter?: number;

  /**
   * Relation to contacts
   * @see Contact
   */
  // contactId references contacts(id)
}

/**
 * Table interface (snake_case) for the sessions table
 */
export interface SessionTable extends BaseTable<number> {
  contact_id: number;
  /** Default: 1 */
  active?: number;
  root_key?: string;
  sending_chain_key?: string;
  receiving_chain_key?: string;
  dh_ratchet_key_pair?: string;
  dh_ratchet_public_key?: string;
  dh_peer_ratchet_key?: string;
  /** Default: 0 */
  sending_counter?: number;
  /** Default: 0 */
  receiving_counter?: number;
  /** Default: 0 */
  previous_sending_counter?: number;
}
