// Auto-generated TypeScript service for the sessions table
// Generated on 2025-05-17T23:51:52.256Z
// Originally defined in: V3__create_session_table.sql
// Custom queries from SQL files

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Session, SessionTable } from '../models/session';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new session
   */
  async create(session: Session): Promise<number | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...session,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: SessionTable = {
          id: entityToInsert.id || 0,
          contact_id: entityToInsert.contactId,
          active: entityToInsert.active,
          root_key: entityToInsert.rootKey,
          sending_chain_key: entityToInsert.sendingChainKey,
          receiving_chain_key: entityToInsert.receivingChainKey,
          dh_ratchet_key_pair: entityToInsert.dhRatchetKeyPair,
          dh_ratchet_public_key: entityToInsert.dhRatchetPublicKey,
          dh_peer_ratchet_key: entityToInsert.dhPeerRatchetKey,
          sending_counter: entityToInsert.sendingCounter,
          receiving_counter: entityToInsert.receivingCounter,
          previous_sending_counter: entityToInsert.previousSendingCounter,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO sessions (
            contact_id,
            active,
            root_key,
            sending_chain_key,
            receiving_chain_key,
            dh_ratchet_key_pair,
            dh_ratchet_public_key,
            dh_peer_ratchet_key,
            sending_counter,
            receiving_counter,
            previous_sending_counter,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tableRow.contact_id,
            tableRow.active || null,
            tableRow.root_key || null,
            tableRow.sending_chain_key || null,
            tableRow.receiving_chain_key || null,
            tableRow.dh_ratchet_key_pair || null,
            tableRow.dh_ratchet_public_key || null,
            tableRow.dh_peer_ratchet_key || null,
            tableRow.sending_counter || null,
            tableRow.receiving_counter || null,
            tableRow.previous_sending_counter || null,
            tableRow.created_at,
            tableRow.updated_at
          ]
        );

        return result.changes?.lastId;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Convert model to table format for storage
        const tableRow: SessionTable = {
          id: entityToInsert.id || 0,
          contact_id: entityToInsert.contactId,
          active: entityToInsert.active,
          root_key: entityToInsert.rootKey,
          sending_chain_key: entityToInsert.sendingChainKey,
          receiving_chain_key: entityToInsert.receivingChainKey,
          dh_ratchet_key_pair: entityToInsert.dhRatchetKeyPair,
          dh_ratchet_public_key: entityToInsert.dhRatchetPublicKey,
          dh_peer_ratchet_key: entityToInsert.dhPeerRatchetKey,
          sending_counter: entityToInsert.sendingCounter,
          receiving_counter: entityToInsert.receivingCounter,
          previous_sending_counter: entityToInsert.previousSendingCounter,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        const id = await dexie.sessions.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getById(id: number): Promise<Session | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM sessions WHERE id = ?',
          [id]
        );
        
        if (result.values && result.values.length > 0) {
          return this.mapTableToModel(result.values[0]);
        }
        return null;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entity = await dexie.sessions.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting session by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  async getAll(): Promise<Session[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM sessions');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: SessionTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.sessions.toArray();
        return entities.map((entity: SessionTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all sessions:', error);
      throw error;
    }
  }

  /**
   * Update session
   */
  async update(id: number, updates: Partial<Session>): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const updatedEntity = {
        ...updates,
        updatedAt: now
      };

      if (this.databaseService.isNativeDatabase()) {
        // Dynamically build the update query based on the provided fields
        const updateFields: string[] = [];
        const updateValues: any[] = [];

        // Map of camelCase property names to database snake_case column names
        const fieldMappings: Record<string, string> = {
          id: 'id',
          contactId: 'contact_id',
          active: 'active',
          rootKey: 'root_key',
          sendingChainKey: 'sending_chain_key',
          receivingChainKey: 'receiving_chain_key',
          dhRatchetKeyPair: 'dh_ratchet_key_pair',
          dhRatchetPublicKey: 'dh_ratchet_public_key',
          dhPeerRatchetKey: 'dh_peer_ratchet_key',
          sendingCounter: 'sending_counter',
          receivingCounter: 'receiving_counter',
          previousSendingCounter: 'previous_sending_counter',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        };

        for (const [key, value] of Object.entries(updatedEntity)) {
          if (key === 'id') continue; // Skip the ID field

          // Get the snake_case column name or convert camelCase to snake_case
          const sqlKey = fieldMappings[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${sqlKey} = ?`);
          updateValues.push(value);
        }

        // Add the WHERE clause parameter
        updateValues.push(id);

        // Execute the update query
        const result = await this.databaseService.executeCommand(
          `UPDATE sessions SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );

        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Map of camelCase property names to database snake_case column names
        const fieldMappings: Record<string, string> = {
          id: 'id',
          contactId: 'contact_id',
          active: 'active',
          rootKey: 'root_key',
          sendingChainKey: 'sending_chain_key',
          receivingChainKey: 'receiving_chain_key',
          dhRatchetKeyPair: 'dh_ratchet_key_pair',
          dhRatchetPublicKey: 'dh_ratchet_public_key',
          dhPeerRatchetKey: 'dh_peer_ratchet_key',
          sendingCounter: 'sending_counter',
          receivingCounter: 'receiving_counter',
          previousSendingCounter: 'previous_sending_counter',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        };

        // Transform to snake_case for consistent field names
        const dexieUpdates: any = {};
        for (const [key, value] of Object.entries(updatedEntity)) {
          if (key === 'id') continue; // Skip the ID

          // Get the snake_case column name or convert camelCase to snake_case
          const dbKey = fieldMappings[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
          dexieUpdates[dbKey] = value;
        }

        // Update the record
        await dexie.sessions.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete session
   */
  async delete(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM sessions WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.sessions.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting session ${id}:`, error);
      throw error;
    }
  }

  // Custom queries from SQL file
  /**
   * countAll - Custom query
   *
   * @returns Array of entities
   */
  async countAll(): Promise<any[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          `SELECT COUNT(*) as total FROM sessions;`,
          []
        );

        if (result.values && result.values.length > 0) {
          return result.values;
        }
        return [{ total: 0 }];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        const count = await dexie.sessions.count();
        return [{ total: count }];
      }
    } catch (error) {
      console.error('Error executing countAll:', error);
      throw error;
    }
  }

  /**
   * Map database entity object to model
   */
  private mapTableToModel(tableRow: SessionTable): Session {
    // Filter out any undefined fields or SQL functions
    const model: any = {};

    if (tableRow.id !== undefined) {
      model.id = tableRow.id;
    }
    if (tableRow.contact_id !== undefined) {
      model.contactId = tableRow.contact_id;
    }
    if (tableRow.active !== undefined) {
      model.active = tableRow.active;
    }
    if (tableRow.root_key !== undefined) {
      model.rootKey = tableRow.root_key;
    }
    if (tableRow.sending_chain_key !== undefined) {
      model.sendingChainKey = tableRow.sending_chain_key;
    }
    if (tableRow.receiving_chain_key !== undefined) {
      model.receivingChainKey = tableRow.receiving_chain_key;
    }
    if (tableRow.dh_ratchet_key_pair !== undefined) {
      model.dhRatchetKeyPair = tableRow.dh_ratchet_key_pair;
    }
    if (tableRow.dh_ratchet_public_key !== undefined) {
      model.dhRatchetPublicKey = tableRow.dh_ratchet_public_key;
    }
    if (tableRow.dh_peer_ratchet_key !== undefined) {
      model.dhPeerRatchetKey = tableRow.dh_peer_ratchet_key;
    }
    if (tableRow.sending_counter !== undefined) {
      model.sendingCounter = tableRow.sending_counter;
    }
    if (tableRow.receiving_counter !== undefined) {
      model.receivingCounter = tableRow.receiving_counter;
    }
    if (tableRow.previous_sending_counter !== undefined) {
      model.previousSendingCounter = tableRow.previous_sending_counter;
    }
    if (tableRow.created_at !== undefined) {
      model.createdAt = tableRow.created_at;
    }
    if (tableRow.updated_at !== undefined) {
      model.updatedAt = tableRow.updated_at;
    }
    return model as Session;
  }
}
