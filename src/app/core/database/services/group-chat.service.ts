// Auto-generated TypeScript service for the group_chat table
// Generated on 2025-05-15T02:51:28.920Z
// Originally defined in: V5__create-chat-tables.sql

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { GroupChat, GroupChatTable } from '../models/group-chat';

@Injectable({
  providedIn: 'root'
})
export class GroupChatService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new groupchat
   */
  async create(groupchat: GroupChat): Promise<number | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...groupchat,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: GroupChatTable = {
          chat_id: entityToInsert.chatId,
          group_name: entityToInsert.groupName,
          admin_user_id: entityToInsert.adminUserId,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO group_chat (
            chat_id,
            group_name,
            admin_user_id
          ) VALUES (?, ?, ?)`,
          [
            tableRow.chat_id,
            tableRow.group_name,
            tableRow.admin_user_id
          ]
        );

        return result.changes?.lastId;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Convert model to table format for storage
        const tableRow: GroupChatTable = {
          chat_id: entityToInsert.chatId,
          group_name: entityToInsert.groupName,
          admin_user_id: entityToInsert.adminUserId,
        };

        const id = await dexie.group_chat.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating groupchat:', error);
      throw error;
    }
  }

  /**
   * Get groupchat by ID
   */
  async getById(id: number): Promise<GroupChat | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM group_chat WHERE chat_id = ?',
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
        
        const entity = await dexie.group_chat.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting groupchat by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all group_chat
   */
  async getAll(): Promise<GroupChat[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM group_chat');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: GroupChatTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.group_chat.toArray();
        return entities.map((entity: GroupChatTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all group_chat:', error);
      throw error;
    }
  }

  /**
   * Update groupchat
   */
  async update(id: number, updates: Partial<GroupChat>): Promise<boolean> {
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
          chatId: 'chat_id',
          groupName: 'group_name',
          adminUserId: 'admin_user_id',
        };

        for (const [key, value] of Object.entries(updatedEntity)) {
          if (key === 'chatId') continue; // Skip the ID field

          // Get the snake_case column name or convert camelCase to snake_case
          const sqlKey = fieldMappings[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${sqlKey} = ?`);
          updateValues.push(value);
        }

        // Add the WHERE clause parameter
        updateValues.push(id);

        // Execute the update query
        const result = await this.databaseService.executeCommand(
          `UPDATE group_chat SET ${updateFields.join(', ')} WHERE chat_id = ?`,
          updateValues
        );

        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Map of camelCase property names to database snake_case column names
        const fieldMappings: Record<string, string> = {
          chatId: 'chat_id',
          groupName: 'group_name',
          adminUserId: 'admin_user_id',
        };

        // Transform to snake_case for consistent field names
        const dexieUpdates: any = {};
        for (const [key, value] of Object.entries(updatedEntity)) {
          if (key === 'chatId') continue; // Skip the ID

          // Get the snake_case column name or convert camelCase to snake_case
          const dbKey = fieldMappings[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
          dexieUpdates[dbKey] = value;
        }

        // Update the record
        await dexie.group_chat.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating groupchat ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete groupchat
   */
  async delete(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM group_chat WHERE chat_id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.group_chat.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting groupchat ${id}:`, error);
      throw error;
    }
  }

  /**
   * Map database entity object to model
   */
  private mapTableToModel(tableRow: GroupChatTable): GroupChat {
    return {
      chatId: tableRow.chat_id,
      groupName: tableRow.group_name,
      adminUserId: tableRow.admin_user_id,
    };
  }
}
