// Auto-generated TypeScript service for the contacts table
// Generated on 2025-05-17T23:51:52.205Z
// Originally defined in: V2__create_contact_table.sql
// Custom queries from SQL files

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Contact, ContactTable } from '../models/contact';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new contact
   */
  async create(contact: Contact): Promise<string | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...contact,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: ContactTable = {
          id: entityToInsert.id,
          nickname: entityToInsert.nickname,
          pin: entityToInsert.pin,
          email: entityToInsert.email,
          phone_number: entityToInsert.phoneNumber,
          identity_public_key: entityToInsert.identityPublicKey,
          status: entityToInsert.status,
          avatar_path: entityToInsert.avatarPath,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO contacts (
            id,
            nickname,
            pin,
            email,
            phone_number,
            identity_public_key,
            status,
            avatar_path,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tableRow.id,
            tableRow.nickname,
            tableRow.pin || null,
            tableRow.email || null,
            tableRow.phone_number || null,
            tableRow.identity_public_key,
            tableRow.status || null,
            tableRow.avatar_path || null,
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
        const tableRow: ContactTable = {
          id: entityToInsert.id,
          nickname: entityToInsert.nickname,
          pin: entityToInsert.pin,
          email: entityToInsert.email,
          phone_number: entityToInsert.phoneNumber,
          identity_public_key: entityToInsert.identityPublicKey,
          status: entityToInsert.status,
          avatar_path: entityToInsert.avatarPath,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        const id = await dexie.contacts.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async getById(id: string): Promise<Contact | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM contacts WHERE id = ?',
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
        
        const entity = await dexie.contacts.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting contact by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all contacts
   */
  async getAll(): Promise<Contact[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM contacts');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: ContactTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.contacts.toArray();
        return entities.map((entity: ContactTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all contacts:', error);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async update(id: string, updates: Partial<Contact>): Promise<boolean> {
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
          identityPublicKey: 'identity_public_key',
          status: 'status',
          avatarPath: 'avatar_path',
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
          `UPDATE contacts SET ${updateFields.join(', ')} WHERE id = ?`,
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
          identityPublicKey: 'identity_public_key',
          status: 'status',
          avatarPath: 'avatar_path',
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
        await dexie.contacts.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete contact
   */
  async delete(id: string): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM contacts WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.contacts.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting contact ${id}:`, error);
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
          `SELECT COUNT(*) as total FROM contacts;`,
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

        const count = await dexie.contacts.count();
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
  private mapTableToModel(tableRow: ContactTable): Contact {
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
    if (tableRow.identity_public_key !== undefined) {
      model.identityPublicKey = tableRow.identity_public_key;
    }
    if (tableRow.status !== undefined) {
      model.status = tableRow.status;
    }
    if (tableRow.avatar_path !== undefined) {
      model.avatarPath = tableRow.avatar_path;
    }
    if (tableRow.created_at !== undefined) {
      model.createdAt = tableRow.created_at;
    }
    if (tableRow.updated_at !== undefined) {
      model.updatedAt = tableRow.updated_at;
    }
    return model as Contact;
  }
}
