// Auto-generated TypeScript service for the devices table
// Generated on 2025-05-21T05:38:39.714Z
// Originally defined in: V7__create_device_table.sql
// Custom queries from SQL files

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Device, DeviceTable } from '../models/device';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create a new device entity in the database.
   * 
   * @param device - The entity to create
   * @returns Promise resolving to the ID of the created entity or undefined on failure
   */
  async create(device: Device): Promise<number | undefined> {
    const now = new Date().toISOString();
    const entityToInsert = {
      ...device,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // Convert model to snake_case for SQL database
        const tableRow: DeviceTable = {
          id: entityToInsert.id || 0,
          contact_id: entityToInsert.contactId,
          device_id: entityToInsert.deviceId,
          identity_public_key: entityToInsert.identityPublicKey,
          active: entityToInsert.active,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO devices (
            contact_id,
            device_id,
            identity_public_key,
            active,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            tableRow.contact_id,
            tableRow.device_id,
            tableRow.identity_public_key,
            tableRow.active || null,
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
        const tableRow: DeviceTable = {
          id: entityToInsert.id || 0,
          contact_id: entityToInsert.contactId,
          device_id: entityToInsert.deviceId,
          identity_public_key: entityToInsert.identityPublicKey,
          active: entityToInsert.active,
          created_at: entityToInsert.createdAt,
          updated_at: entityToInsert.updatedAt,
        };

        const id = await dexie.devices.add(tableRow);
        return id;
      }
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  }

  /**
   * Retrieves all devices entities from the database.
   * 
   * @returns Promise resolving to an array of Device entities
   */
  async getAll(): Promise<Device[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM devices');
        
        if (result.values && result.values.length > 0) {
          return result.values.map((entity: DeviceTable) => this.mapTableToModel(entity));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const entities = await dexie.devices.toArray();
        return entities.map((entity: DeviceTable) => this.mapTableToModel(entity));
      }
    } catch (error) {
      console.error('Error getting all devices:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single device entity by its ID.
   * 
   * @param id - The primary key (id) of the entity to retrieve
   * @returns Promise resolving to the entity if found, or null if not found
   */
  async getById(id: number): Promise<Device | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM devices WHERE id = ?',
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
        
        const entity = await dexie.devices.get(id);
        return entity ? this.mapTableToModel(entity) : null;
      }
    } catch (error) {
      console.error(`Error getting device by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing device entity in the database.
   * Only the fields provided in the updates parameter will be modified.
   * The updatedAt field is automatically set to the current timestamp.
   * 
   * @param id - The primary key (id) of the entity to update
   * @param updates - Partial object containing only the fields to update
   * @returns Promise resolving to true if the update was successful, false otherwise
   */
  async update(id: number, updates: Partial<Device>): Promise<boolean> {
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
          deviceId: 'device_id',
          identityPublicKey: 'identity_public_key',
          active: 'active',
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
          `UPDATE devices SET ${updateFields.join(', ')} WHERE id = ?`,
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
          deviceId: 'device_id',
          identityPublicKey: 'identity_public_key',
          active: 'active',
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
        await dexie.devices.update(id, dexieUpdates);
        return true;
      }
    } catch (error) {
      console.error(`Error updating device ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an existing device entity from the database.
   * 
   * @param id - The primary key (id) of the entity to delete
   * @returns Promise resolving to true if the delete was successful, false otherwise
   */
  async delete(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM devices WHERE id = ?',
          [id]
        );
        
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        await dexie.devices.delete(id);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting device ${id}:`, error);
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
          `SELECT COUNT(*) as total FROM devices;`,
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

        const count = await dexie.devices.count();
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
  private mapTableToModel(tableRow: DeviceTable): Device {
    // Filter out any undefined fields or SQL functions
    const model: any = {};

    if (tableRow.id !== undefined) {
      model.id = tableRow.id;
    }
    if (tableRow.contact_id !== undefined) {
      model.contactId = tableRow.contact_id;
    }
    if (tableRow.device_id !== undefined) {
      model.deviceId = tableRow.device_id;
    }
    if (tableRow.identity_public_key !== undefined) {
      model.identityPublicKey = tableRow.identity_public_key;
    }
    if (tableRow.active !== undefined) {
      model.active = tableRow.active;
    }
    if (tableRow.created_at !== undefined) {
      model.createdAt = tableRow.created_at;
    }
    if (tableRow.updated_at !== undefined) {
      model.updatedAt = tableRow.updated_at;
    }
    return model as Device;
  }
}
