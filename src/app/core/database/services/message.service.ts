// Auto-generated TypeScript service for the messages table
// Generated on 2025-05-21T05:38:39.721Z
// Originally defined in: V6__create_message_table.sql
// Custom queries from SQL files

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Message, MessageTable } from '../models/message';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new message entity in the database.
   * 
   * @param message - The entity to create
   * @returns Promise resolving to the ID of the created entity or undefined on failure
   */
  async create(message: Message): Promise<number | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...message,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: MessageTable = {
          id: entityToInsert.id || 0,
          conversation_id: entityToInsert.conversationId,
          session_id: entityToInsert.sessionId,
          message_type: entityToInsert.messageType,
          content: entityToInsert.content,
          sender_id: entityToInsert.senderId,
          sent: entityToInsert.sent,
          sent_timestamp: entityToInsert.sentTimestamp,
          delivered_timestamp: entityToInsert.deliveredTimestamp,
          read_timestamp: entityToInsert.readTimestamp,
          status: entityToInsert.status,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO messages (
            conversation_id,
            session_id,
            message_type,
            content,
            sender_id,
            sent,
            sent_timestamp,
            delivered_timestamp,
            read_timestamp,
            status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tableRow.conversation_id,
            tableRow.session_id,
            tableRow.message_type,
            tableRow.content,
            tableRow.sender_id || null,
            tableRow.sent,
            tableRow.sent_timestamp || null,
            tableRow.delivered_timestamp || null,
            tableRow.read_timestamp || null,
            tableRow.status
          ]
        );

        return result.changes?.lastId;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Convert model to table format for storage
        const tableRow: MessageTable = {
          id: entityToInsert.id || 0,
          conversation_id: entityToInsert.conversationId,
          session_id: entityToInsert.sessionId,
          message_type: entityToInsert.messageType,
          content: entityToInsert.content,
          sender_id: entityToInsert.senderId,
          sent: entityToInsert.sent,
          sent_timestamp: entityToInsert.sentTimestamp,
          delivered_timestamp: entityToInsert.deliveredTimestamp,
          read_timestamp: entityToInsert.readTimestamp,
          status: entityToInsert.status,
        };

        const id = await dexie.messages.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Retrieves all messages entities from the database.
   * 
   * @returns Promise resolving to an array of Message entities
   */
  async getAll(): Promise<Message[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM messages');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: MessageTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.messages.toArray();
        return entities.map((entity: MessageTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all messages:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single message entity by its ID.
   * 
   * @param id - The primary key (id) of the entity to retrieve
   * @returns Promise resolving to the entity if found, or null if not found
   */
  async getById(id: number): Promise<Message | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM messages WHERE id = ?',
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
        
        const entity = await dexie.messages.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting message by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing message entity in the database.
   * Only the fields provided in the updates parameter will be modified.
   * The updatedAt field is automatically set to the current timestamp.
   * 
   * @param id - The primary key (id) of the entity to update
   * @param updates - Partial object containing only the fields to update
   * @returns Promise resolving to true if the update was successful, false otherwise
   */
  async update(id: number, updates: Partial<Message>): Promise<boolean> {
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
          conversationId: 'conversation_id',
          sessionId: 'session_id',
          messageType: 'message_type',
          content: 'content',
          senderId: 'sender_id',
          sent: 'sent',
          sentTimestamp: 'sent_timestamp',
          deliveredTimestamp: 'delivered_timestamp',
          readTimestamp: 'read_timestamp',
          status: 'status',
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
          `UPDATE messages SET ${updateFields.join(', ')} WHERE id = ?`,
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
          conversationId: 'conversation_id',
          sessionId: 'session_id',
          messageType: 'message_type',
          content: 'content',
          senderId: 'sender_id',
          sent: 'sent',
          sentTimestamp: 'sent_timestamp',
          deliveredTimestamp: 'delivered_timestamp',
          readTimestamp: 'read_timestamp',
          status: 'status',
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
        await dexie.messages.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating message ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an existing message entity from the database.
   * 
   * @param id - The primary key (id) of the entity to delete
   * @returns Promise resolving to true if the delete was successful, false otherwise
   */
  async delete(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM messages WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.messages.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting message ${id}:`, error);
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
          `SELECT COUNT(*) as total FROM messages;`,
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

        const count = await dexie.messages.count();
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
  private mapTableToModel(tableRow: MessageTable): Message {
    // Filter out any undefined fields or SQL functions
    const model: any = {};

    if (tableRow.id !== undefined) {
      model.id = tableRow.id;
    }
    if (tableRow.conversation_id !== undefined) {
      model.conversationId = tableRow.conversation_id;
    }
    if (tableRow.session_id !== undefined) {
      model.sessionId = tableRow.session_id;
    }
    if (tableRow.message_type !== undefined) {
      model.messageType = tableRow.message_type;
    }
    if (tableRow.content !== undefined) {
      model.content = tableRow.content;
    }
    if (tableRow.sender_id !== undefined) {
      model.senderId = tableRow.sender_id;
    }
    if (tableRow.sent !== undefined) {
      model.sent = tableRow.sent;
    }
    if (tableRow.sent_timestamp !== undefined) {
      model.sentTimestamp = tableRow.sent_timestamp;
    }
    if (tableRow.delivered_timestamp !== undefined) {
      model.deliveredTimestamp = tableRow.delivered_timestamp;
    }
    if (tableRow.read_timestamp !== undefined) {
      model.readTimestamp = tableRow.read_timestamp;
    }
    if (tableRow.status !== undefined) {
      model.status = tableRow.status;
    }
    return model as Message;
  }
}
