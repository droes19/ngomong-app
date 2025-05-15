// Auto-generated TypeScript service for the chat table
// Generated on 2025-05-15T02:51:28.902Z
// Originally defined in: V5__create-chat-tables.sql

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Chat, ChatTable } from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new chat
   */
  async create(chat: Chat): Promise<number | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...chat,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: ChatTable = {
          id: entityToInsert.id || 0,
          message: entityToInsert.message,
          user_id: entityToInsert.userId,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO chat (
            message,
            user_id
          ) VALUES (?, ?)`,
          [
            tableRow.message,
            tableRow.user_id
          ]
        );

        return result.changes?.lastId;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Convert model to table format for storage
        const tableRow: ChatTable = {
          id: entityToInsert.id || 0,
          message: entityToInsert.message,
          user_id: entityToInsert.userId,
        };

        const id = await dexie.chat.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Get chat by ID
   */
  async getById(id: number): Promise<Chat | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM chat WHERE id = ?',
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
        
        const entity = await dexie.chat.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting chat by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all chat
   */
  async getAll(): Promise<Chat[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM chat');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: ChatTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.chat.toArray();
        return entities.map((entity: ChatTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all chat:', error);
      throw error;
    }
  }

  /**
   * Update chat
   */
  async update(id: number, updates: Partial<Chat>): Promise<boolean> {
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
          message: 'message',
          userId: 'user_id',
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
          `UPDATE chat SET ${updateFields.join(', ')} WHERE id = ?`,
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
          message: 'message',
          userId: 'user_id',
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
        await dexie.chat.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating chat ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete chat
   */
  async delete(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM chat WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.chat.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting chat ${id}:`, error);
      throw error;
    }
  }

  /**
   * Map database entity object to model
   */
  private mapTableToModel(tableRow: ChatTable): Chat {
    return {
      id: tableRow.id,
      message: tableRow.message,
      userId: tableRow.user_id,
    };
  }
}
