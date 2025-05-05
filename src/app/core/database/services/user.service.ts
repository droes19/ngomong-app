import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { User, UserTable } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private databaseService: DatabaseService) { }

  /**
   * Create a new user
   */
  async createUser(user: User): Promise<number | undefined> {
    const now = new Date().toISOString();
    const userToInsert = {
      ...user,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          `INSERT INTO users (
            username,
            email,
            usercode,
            avatar_url,
            bio,
            phone_number,
            created_at,
            updated_at,
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userToInsert.username,
            userToInsert.email,
            userToInsert.usercode,
            userToInsert.avatarUrl || null,
            userToInsert.bio || null,
            userToInsert.phoneNumber || null,
            userToInsert.createdAt,
            userToInsert.updatedAt,
          ]
        );

        this.databaseService.development()
        return result.changes?.lastId;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        const id = await dexie.users.add({
          username: userToInsert.username,
          email: userToInsert.email,
          usercode: userToInsert.usercode,
          avatar_url: userToInsert.avatarUrl,
          bio: userToInsert.bio,
          phone_number: userToInsert.phoneNumber,
          created_at: userToInsert.createdAt,
          updated_at: userToInsert.updatedAt,
        });
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
  async getUserById(id: number): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM users WHERE id = ?',
          [id]
        );

        if (result.values && result.values.length > 0) {
          return this.mapUserTableToModel(result.values[0]);
        }
        return null;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        const user = await dexie.users.get(id);
        return user ? this.mapUserTableToModel(user) : null;
      }
    } catch (error) {
      console.error(`Error getting user by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM users WHERE username = ?',
          [username]
        );

        if (result.values && result.values.length > 0) {
          return this.mapUserTableToModel(result.values[0]);
        }
        return null;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        const user = await dexie.users.where('username').equals(username).first();
        return user ? this.mapUserTableToModel(user) : null;
      }
    } catch (error) {
      console.error(`Error getting user by username ${username}:`, error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery('SELECT * FROM users');

        if (result.values && result.values.length > 0) {
          return result.values.map((user: UserTable) => this.mapUserTableToModel(user));
        }
        return [];
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        const users = await dexie.users.toArray();
        return users.map((user: UserTable) => this.mapUserTableToModel(user));
      }
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: number, updates: Partial<User>): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const updatedUser = {
        ...updates,
        updatedAt: now
      };

      if (this.databaseService.isNativeDatabase()) {
        // Dynamically build the update query based on the provided fields
        const updateFields: string[] = [];
        const updateValues: any[] = [];

        for (const [key, value] of Object.entries(updatedUser)) {
          if (key === 'id') continue; // Skip the ID field

          // Convert camelCase to snake_case for SQL
          const sqlKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
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

        this.databaseService.development()
        return result.changes?.changes > 0;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');

        // Transform to snake_case for consistent field names
        const dexieUpdates: any = {};
        for (const [key, value] of Object.entries(updatedUser)) {
          if (key === 'id') continue; // Skip the ID

          // Convert camelCase to snake_case for consistency
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
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
  async deleteUser(id: number): Promise<boolean> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeCommand(
          'DELETE FROM users WHERE id = ?',
          [id]
        );

        await this.databaseService.executeQuery("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'users'")
        this.databaseService.development()
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
   * Map database user object to model
   */
  private mapUserTableToModel(userTable: UserTable): User {
    return {
      id: userTable.id,
      username: userTable.username,
      email: userTable.email,
      usercode: userTable.usercode,
      avatarUrl: userTable.avatar_url,
      bio: userTable.bio,
      phoneNumber: userTable.phone_number,
      createdAt: userTable.created_at,
      updatedAt: userTable.updated_at,
    };
  }
}
