// Auto-generated TypeScript service for the contacts table
// Generated on 2025-05-15T02:51:28.891Z
// Originally defined in: V4__create_contact_table.sql

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
  async create(contact: Contact): Promise<number | undefined> {
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
          id: entityToInsert.id || 0,
          nickname: entityToInsert.nickname,
          pin: entityToInsert.pin,
          email: entityToInsert.email,
          phone_number: entityToInsert.phoneNumber,
          public_key: entityToInsert.publicKey,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO contacts (
            nickname,
            pin,
            email,
            phone_number,
            public_key,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            tableRow.nickname,
            tableRow.pin,
            tableRow.email,
            tableRow.phone_number || null,
            tableRow.public_key,
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
          id: entityToInsert.id || 0,
          nickname: entityToInsert.nickname,
          pin: entityToInsert.pin,
          email: entityToInsert.email,
          phone_number: entityToInsert.phoneNumber,
          public_key: entityToInsert.publicKey,
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
  async getById(id: number): Promise<Contact | null> {
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
  async update(id: number, updates: Partial<Contact>): Promise<boolean> {
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
          publicKey: 'public_key',
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
          publicKey: 'public_key',
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
  async delete(id: number): Promise<boolean> {
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

  /**
   * Map database entity object to model
   */
  private mapTableToModel(tableRow: ContactTable): Contact {
    return {
      id: tableRow.id,
      nickname: tableRow.nickname,
      pin: tableRow.pin,
      email: tableRow.email,
      phoneNumber: tableRow.phone_number,
      publicKey: tableRow.public_key,
      createdAt: tableRow.created_at,
      updatedAt: tableRow.updated_at,
    };
  }
}
