// Auto-generated TypeScript service for the user table
// Generated on 2025-05-21T05:38:39.733Z
// Originally defined in: V1__create_user_table.sql
// Custom queries from SQL files

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { User, UserTable } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new user entity in the database.
   * 
   * @param user - The entity to create
   * @returns Promise resolving to the ID of the created entity or undefined on failure
   */
  async create(user: User): Promise<string | undefined> {
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
          id: entityToInsert.id,
          nickname: entityToInsert.nickname,
          pin: entityToInsert.pin,
          email: entityToInsert.email,
          phone_number: entityToInsert.phoneNumber,
          identity_key_pair: entityToInsert.identityKeyPair,
          identity_public_key: entityToInsert.identityPublicKey,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO user (
            id,
            nickname,
            pin,
            email,
            phone_number,
            identity_key_pair,
            identity_public_key,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tableRow.id,
            tableRow.nickname,
            tableRow.pin,
            tableRow.email || null,
            tableRow.phone_number || null,
            tableRow.identity_key_pair,
            tableRow.identity_public_key,
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
        const tableRow: UserTable = {
          id: entityToInsert.id,
          nickname: entityToInsert.nickname,
          pin: entityToInsert.pin,
          email: entityToInsert.email,
          phone_number: entityToInsert.phoneNumber,
          identity_key_pair: entityToInsert.identityKeyPair,
          identity_public_key: entityToInsert.identityPublicKey,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        const id = await dexie.user.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Retrieves all user entities from the database.
   * 
   * @returns Promise resolving to an array of User entities
   */
  async getAll(): Promise<User[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM user');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: UserTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.user.toArray();
        return entities.map((entity: UserTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all user:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single user entity by its ID.
   * 
   * @param id - The primary key (id) of the entity to retrieve
   * @returns Promise resolving to the entity if found, or null if not found
   */
  async getById(id: string): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM user WHERE id = ?',
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
        
        const entity = await dexie.user.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting user by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing user entity in the database.
   * Only the fields provided in the updates parameter will be modified.
   * The updatedAt field is automatically set to the current timestamp.
   * 
   * @param id - The primary key (id) of the entity to update
   * @param updates - Partial object containing only the fields to update
   * @returns Promise resolving to true if the update was successful, false otherwise
   */
  async update(id: string, updates: Partial<User>): Promise<boolean> {
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
          phoneNumber: 'phone_number',
          identityKeyPair: 'identity_key_pair',
          identityPublicKey: 'identity_public_key',
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
          `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`,
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
          phoneNumber: 'phone_number',
          identityKeyPair: 'identity_key_pair',
          identityPublicKey: 'identity_public_key',
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
        await dexie.user.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an existing user entity from the database.
   * 
   * @param id - The primary key (id) of the entity to delete
   * @returns Promise resolving to true if the delete was successful, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM user WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.user.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
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
          `SELECT COUNT(*) as total FROM user;`,
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

        const count = await dexie.user.count();
        return [{ total: count }];
      }
    } catch (error) {
      console.error('Error executing countAll:', error);
      throw error;
    }
  }

  /**
   * findByCredentials - Custom query
   *
   * @param nickname, pin Parameters for the query
   * @returns Entity or null
   */
  async findByCredentials(nickname: any, pin: any): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          `SELECT * FROM user WHERE nickname = ? AND pin = ? LIMIT 1;`,
          [nickname, pin]
        );

        if (result.values && result.values.length > 0) {
          return this.mapTableToModel(result.values[0]);
        }
        return null;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        const entity = await dexie.user.where('nickname').equals(nickname).where('pin').equals(pin).first();
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error('Error executing findByCredentials:', error);
      throw error;
    }
  }

  /**
   * findByEmail - Custom query
   *
   * @param email Parameters for the query
   * @returns Entity or null
   */
  async findByEmail(email: any): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          `SELECT * FROM user WHERE email = ?;`,
          [email]
        );

        if (result.values && result.values.length > 0) {
          return this.mapTableToModel(result.values[0]);
        }
        return null;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        const entity = await dexie.user.where('email').equals(email).first();
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error('Error executing findByEmail:', error);
      throw error;
    }
  }

  /**
   * findByNickname - Custom query
   *
   * @param nickname Parameters for the query
   * @returns Entity or null
   */
  async findByNickname(nickname: any): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          `SELECT * FROM user WHERE nickname = ?;`,
          [nickname]
        );

        if (result.values && result.values.length > 0) {
          return this.mapTableToModel(result.values[0]);
        }
        return null;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        const entity = await dexie.user.where('nickname').equals(nickname).first();
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error('Error executing findByNickname:', error);
      throw error;
    }
  }

  /**
   * Map database entity object to model
   */
  private mapTableToModel(tableRow: UserTable): User {
    // Filter out any undefined fields or SQL functions
    const model: any = {};

    if (tableRow.id !== undefined) {
      model.id = tableRow.id;
    }
    if (tableRow.nickname !== undefined) {
      model.nickname = tableRow.nickname;
    }
    if (tableRow.pin !== undefined) {
      model.pin = tableRow.pin;
    }
    if (tableRow.email !== undefined) {
      model.email = tableRow.email;
    }
    if (tableRow.phone_number !== undefined) {
      model.phoneNumber = tableRow.phone_number;
    }
    if (tableRow.identity_key_pair !== undefined) {
      model.identityKeyPair = tableRow.identity_key_pair;
    }
    if (tableRow.identity_public_key !== undefined) {
      model.identityPublicKey = tableRow.identity_public_key;
    }
    if (tableRow.created_at !== undefined) {
      model.createdAt = tableRow.created_at;
    }
    if (tableRow.updated_at !== undefined) {
      model.updatedAt = tableRow.updated_at;
    }
    return model as User;
  }
}
