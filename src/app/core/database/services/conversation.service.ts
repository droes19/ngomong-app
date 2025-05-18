// Auto-generated TypeScript service for the conversations table
// Generated on 2025-05-17T23:51:52.215Z
// Originally defined in: V5__create_conversation_table.sql
// Custom queries from SQL files

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Conversation, ConversationTable } from '../models/conversation';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new conversation
   */
  async create(conversation: Conversation): Promise<number | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...conversation,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: ConversationTable = {
          id: entityToInsert.id || 0,
          contact_id: entityToInsert.contactId,
          session_id: entityToInsert.sessionId,
          last_message_preview: entityToInsert.lastMessagePreview,
          last_message_timestamp: entityToInsert.lastMessageTimestamp,
          unread_count: entityToInsert.unreadCount,
          pinned: entityToInsert.pinned,
          archived: entityToInsert.archived,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO conversations (
            contact_id,
            session_id,
            last_message_preview,
            last_message_timestamp,
            unread_count,
            pinned,
            archived,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tableRow.contact_id,
            tableRow.session_id,
            tableRow.last_message_preview || null,
            tableRow.last_message_timestamp || null,
            tableRow.unread_count || null,
            tableRow.pinned || null,
            tableRow.archived || null,
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
        const tableRow: ConversationTable = {
          id: entityToInsert.id || 0,
          contact_id: entityToInsert.contactId,
          session_id: entityToInsert.sessionId,
          last_message_preview: entityToInsert.lastMessagePreview,
          last_message_timestamp: entityToInsert.lastMessageTimestamp,
          unread_count: entityToInsert.unreadCount,
          pinned: entityToInsert.pinned,
          archived: entityToInsert.archived,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        const id = await dexie.conversations.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getById(id: number): Promise<Conversation | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM conversations WHERE id = ?',
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
        
        const entity = await dexie.conversations.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting conversation by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all conversations
   */
  async getAll(): Promise<Conversation[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM conversations');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: ConversationTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.conversations.toArray();
        return entities.map((entity: ConversationTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all conversations:', error);
      throw error;
    }
  }

  /**
   * Update conversation
   */
  async update(id: number, updates: Partial<Conversation>): Promise<boolean> {
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
          sessionId: 'session_id',
          lastMessagePreview: 'last_message_preview',
          lastMessageTimestamp: 'last_message_timestamp',
          unreadCount: 'unread_count',
          pinned: 'pinned',
          archived: 'archived',
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
          `UPDATE conversations SET ${updateFields.join(', ')} WHERE id = ?`,
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
          sessionId: 'session_id',
          lastMessagePreview: 'last_message_preview',
          lastMessageTimestamp: 'last_message_timestamp',
          unreadCount: 'unread_count',
          pinned: 'pinned',
          archived: 'archived',
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
        await dexie.conversations.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating conversation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  async delete(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM conversations WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.conversations.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting conversation ${id}:`, error);
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
          `SELECT COUNT(*) as total FROM conversations;`,
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

        const count = await dexie.conversations.count();
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
  private mapTableToModel(tableRow: ConversationTable): Conversation {
    // Filter out any undefined fields or SQL functions
    const model: any = {};

    if (tableRow.id !== undefined) {
      model.id = tableRow.id;
    }
    if (tableRow.contact_id !== undefined) {
      model.contactId = tableRow.contact_id;
    }
    if (tableRow.session_id !== undefined) {
      model.sessionId = tableRow.session_id;
    }
    if (tableRow.last_message_preview !== undefined) {
      model.lastMessagePreview = tableRow.last_message_preview;
    }
    if (tableRow.last_message_timestamp !== undefined) {
      model.lastMessageTimestamp = tableRow.last_message_timestamp;
    }
    if (tableRow.unread_count !== undefined) {
      model.unreadCount = tableRow.unread_count;
    }
    if (tableRow.pinned !== undefined) {
      model.pinned = tableRow.pinned;
    }
    if (tableRow.archived !== undefined) {
      model.archived = tableRow.archived;
    }
    if (tableRow.created_at !== undefined) {
      model.createdAt = tableRow.created_at;
    }
    if (tableRow.updated_at !== undefined) {
      model.updatedAt = tableRow.updated_at;
    }
    return model as Conversation;
  }
}
