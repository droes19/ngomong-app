// Auto-generated TypeScript service for the users table
// Generated on 2025-05-15T02:15:01.125Z
// Originally defined in: V1__create_user_table.sql

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { User, UserTable } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new user
   */
  async create(user: User): Promise<number | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...user,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: UserTable = {
          id: entityToInsert.id || 0,
          nickname: entityToInsert.nickname,
          pin: entityToInsert.pin,
          email: entityToInsert.email,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
          phone_number: entityToInsert.phoneNumber,
          private_key: entityToInsert.privateKey,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO users (
            nickname,
            pin,
            email,
            created_at,
            updated_at,
            phone_number,
            private_key
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            tableRow.nickname,
            tableRow.pin,
            tableRow.email,
            tableRow.created_at,
            tableRow.updated_at,
            tableRow.phone_number || null,
            tableRow.private_key || null
          ]
        );

        return result.changes?.lastId;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Convert model to table format for storage
        const tableRow: UserTable = {
          id: entityToInsert.id || 0,
          nickname: entityToInsert.nickname,
          pin: entityToInsert.pin,
          email: entityToInsert.email,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
          phone_number: entityToInsert.phoneNumber,
          private_key: entityToInsert.privateKey,
        };

        const id = await dexie.users.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM users WHERE id = ?',
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
        
        const entity = await dexie.users.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting user by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAll(): Promise<User[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM users');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: UserTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.users.toArray();
        return entities.map((entity: UserTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id: number, updates: Partial<User>): Promise<boolean> {
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
          nickname: 'nickname',
          pin: 'pin',
          email: 'email',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          phoneNumber: 'phone_number',
          privateKey: 'private_key',
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
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
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
          nickname: 'nickname',
          pin: 'pin',
          email: 'email',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          phoneNumber: 'phone_number',
          privateKey: 'private_key',
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
        await dexie.users.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM users WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.users.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Map database entity object to model
   */
  private mapTableToModel(tableRow: UserTable): User {
    return {
      id: tableRow.id,
      nickname: tableRow.nickname,
      pin: tableRow.pin,
      email: tableRow.email,
      createdAt: tableRow.created_at,
      updatedAt: tableRow.updated_at,
      phoneNumber: tableRow.phone_number,
      privateKey: tableRow.private_key,
    };
  }
}
