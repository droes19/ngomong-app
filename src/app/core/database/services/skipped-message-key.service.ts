// Auto-generated TypeScript service for the skipped_message_keys table
// Generated on 2025-05-17T23:51:52.275Z
// Originally defined in: V4__create_skipped_message_key_table.sql
// Custom queries from SQL files

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { SkippedMessageKey, SkippedMessageKeyTable } from '../models/skipped-message-key';

@Injectable({
  providedIn: 'root'
})
export class SkippedMessageKeyService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new skippedmessagekey
   */
  async create(skippedmessagekey: SkippedMessageKey): Promise<number | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...skippedmessagekey,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: SkippedMessageKeyTable = {
          id: entityToInsert.id || 0,
          session_id: entityToInsert.sessionId,
          ratchet_key: entityToInsert.ratchetKey,
          counter: entityToInsert.counter,
          message_key: entityToInsert.messageKey,
          created_at: entityToInsert.createdAt,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO skipped_message_keys (
            session_id,
            ratchet_key,
            counter,
            message_key,
            created_at
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            tableRow.session_id,
            tableRow.ratchet_key,
            tableRow.counter,
            tableRow.message_key,
            tableRow.created_at
          ]
        );

        return result.changes?.lastId;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Convert model to table format for storage
        const tableRow: SkippedMessageKeyTable = {
          id: entityToInsert.id || 0,
          session_id: entityToInsert.sessionId,
          ratchet_key: entityToInsert.ratchetKey,
          counter: entityToInsert.counter,
          message_key: entityToInsert.messageKey,
          created_at: entityToInsert.createdAt,
        };

        const id = await dexie.skipped_message_keys.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating skippedmessagekey:', error);
      throw error;
    }
  }

  /**
   * Get skippedmessagekey by ID
   */
  async getById(id: number): Promise<SkippedMessageKey | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM skipped_message_keys WHERE id = ?',
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
        
        const entity = await dexie.skipped_message_keys.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting skippedmessagekey by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all skipped_message_keys
   */
  async getAll(): Promise<SkippedMessageKey[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM skipped_message_keys');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: SkippedMessageKeyTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.skipped_message_keys.toArray();
        return entities.map((entity: SkippedMessageKeyTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all skipped_message_keys:', error);
      throw error;
    }
  }

  /**
   * Update skippedmessagekey
   */
  async update(id: number, updates: Partial<SkippedMessageKey>): Promise<boolean> {
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
          sessionId: 'session_id',
          ratchetKey: 'ratchet_key',
          counter: 'counter',
          messageKey: 'message_key',
          createdAt: 'created_at',
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
          `UPDATE skipped_message_keys SET ${updateFields.join(', ')} WHERE id = ?`,
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
          sessionId: 'session_id',
          ratchetKey: 'ratchet_key',
          counter: 'counter',
          messageKey: 'message_key',
          createdAt: 'created_at',
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
        await dexie.skipped_message_keys.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating skippedmessagekey ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete skippedmessagekey
   */
  async delete(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM skipped_message_keys WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.skipped_message_keys.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting skippedmessagekey ${id}:`, error);
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
          `SELECT COUNT(*) as total FROM skipped_message_keys;`,
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

        const count = await dexie.skipped_message_keys.count();
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
  private mapTableToModel(tableRow: SkippedMessageKeyTable): SkippedMessageKey {
    // Filter out any undefined fields or SQL functions
    const model: any = {};

    if (tableRow.id !== undefined) {
      model.id = tableRow.id;
    }
    if (tableRow.session_id !== undefined) {
      model.sessionId = tableRow.session_id;
    }
    if (tableRow.ratchet_key !== undefined) {
      model.ratchetKey = tableRow.ratchet_key;
    }
    if (tableRow.counter !== undefined) {
      model.counter = tableRow.counter;
    }
    if (tableRow.message_key !== undefined) {
      model.messageKey = tableRow.message_key;
    }
    if (tableRow.created_at !== undefined) {
      model.createdAt = tableRow.created_at;
    }
    return model as SkippedMessageKey;
  }
}
