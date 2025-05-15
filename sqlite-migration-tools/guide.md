# How to Use SQLite Migration Tools in Your Ionic Angular Project

This guide explains how to use the updated SQLite migration tools in your specific Ionic Angular project structure. 

## Project Setup

Based on your project structure, you have:

- An Ionic Angular application
- SQLite migration files in the `migrations` directory
- A `sqlite-migration-tools` package in your project

## Running the Tools

There are two ways to run the tools:

### Method 1: Using NPM Scripts (Recommended)

Add these scripts to your root `package.json`:

```json
"scripts": {
  "generate-db": "cd sqlite-migration-tools && npm run generate-all",
  "generate-migrations": "cd sqlite-migration-tools && npm run generate-migrations",
  "generate-models": "cd sqlite-migration-tools && npm run generate-models",
  "generate-dexie": "cd sqlite-migration-tools && npm run generate-dexie",
  "generate-services": "cd sqlite-migration-tools && npm run generate-services"
}
```

Then run:

```bash
# Generate everything
npm run generate-db

# Or generate specific components
npm run generate-migrations
npm run generate-models
npm run generate-dexie
npm run generate-services
```

### Method 2: Running Tools Directly

Make the scripts executable:

```bash
chmod +x sqlite-migration-tools/bin/*.js
```

Then run:

```bash
# Generate everything
node sqlite-migration-tools/bin/sqlite-run-all.js

# Generate specific components
node sqlite-migration-tools/bin/sqlite-migrate.js --dir ./migrations
node sqlite-migration-tools/bin/sqlite-to-models.js --dir ./migrations
node sqlite-migration-tools/bin/sqlite-to-dexie.js --dir ./migrations
node sqlite-migration-tools/bin/sqlite-to-services.js --dir ./migrations
```

## Using Numeric File Format

If you want to use the numeric file format (`001_create_user_table.sql` instead of `V1__create_user_table.sql`), add the `--numeric` flag:

```bash
# Generate everything with numeric pattern
node sqlite-migration-tools/bin/sqlite-run-all.js --numeric

# Add to package.json
"generate-db-numeric": "cd sqlite-migration-tools && npm run generate-all-numeric"
```

Then run:

```bash
npm run generate-db-numeric
```

## Default Output Paths

The tools will generate files in these default locations:

- **Migrations**: `./src/app/core/database/migrations.ts`
- **Models**: `./src/app/core/database/models/`
- **Dexie Schema**: `./src/app/core/database/dexie-schema.ts`
- **Services**: `./src/app/core/database/services/`

You can customize these paths by editing `sqlite-migration-tools/src/config.js`.

## Generated Files

### Models

Each table in your migrations will generate:
- A TypeScript interface (`User`) for your application code
- A TableInterface (`UserTable`) for database operations

### Services

Each table will have a service with CRUD operations:
- `create(entity)`: Create a new record
- `getById(id)`: Get a record by ID
- `getAll()`: Get all records
- `update(id, changes)`: Update a record
- `delete(id)`: Delete a record
- `mapTableToModel(tableRow)`: Convert between database format and application format

## Integration with Your App

### Database Service Integration

The generated code assumes you have a `DatabaseService` with these methods:

1. `isNativeDatabase()`: Returns true if using SQLite, false if using Dexie
2. `executeQuery(sql, params)`: Executes SQL queries that return data
3. `executeCommand(sql, params)`: Executes SQL commands that modify data
4. `getDexieInstance()`: Returns the Dexie database instance

### Example Database Service

If you don't have one already, here's a simple DatabaseService implementation:

```typescript
// src/app/core/database/services/database.service.ts
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import Dexie from 'dexie';
import { AppDatabase } from '../dexie-schema';
import { ALL_MIGRATIONS, prepareMigrations } from '../migrations';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: any;
  private dexieDb: AppDatabase | null = null;
  private _isNative = false;

  constructor(private platform: Platform) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.initializeDatabase();
  }

  async initializeDatabase() {
    await this.platform.ready();
    this._isNative = this.platform.is('ios') || this.platform.is('android');
    
    if (this._isNative) {
      // Native SQLite implementation
      const migrations = prepareMigrations();
      
      this.db = await this.sqlite.createConnection(
        'app_database',
        false,
        'no-encryption',
        1,
        false
      );
      
      await this.db.open();
      
      // Apply migrations
      for (const migration of migrations) {
        await this.db.executeSet(migration.statements.join(';'));
      }
    } else {
      // Web implementation with Dexie
      this.dexieDb = new AppDatabase();
    }
  }

  isNativeDatabase(): boolean {
    return this._isNative;
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    if (!this._isNative || !this.db) {
      throw new Error('Native database not available');
    }
    
    return this.db.query(query, params);
  }

  async executeCommand(command: string, params: any[] = []): Promise<any> {
    if (!this._isNative || !this.db) {
      throw new Error('Native database not available');
    }
    
    return this.db.run(command, params);
  }

  getDexieInstance(): AppDatabase | null {
    return this.dexieDb;
  }
}
```

## Example Usage

Here's how to use the generated services in your app:

```typescript
// src/app/home/home.page.ts
import { Component, OnInit } from '@angular/core';
import { UserService } from '../core/database/services/user.service';
import { User } from '../core/database/models/user';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  users: User[] = [];
  newUser: Partial<User> = {
    nickname: '',
    email: '',
    pin: ''
  };

  constructor(private userService: UserService) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.users = await this.userService.getAll();
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async createUser() {
    try {
      if (!this.newUser.nickname || !this.newUser.email || !this.newUser.pin) {
        // Validate input
        return;
      }

      const userId = await this.userService.create(this.newUser as User);
      console.log('User created with ID:', userId);
      
      // Reset form and reload users
      this.newUser = { nickname: '', email: '', pin: '' };
      await this.loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

  async deleteUser(id: number) {
    try {
      await this.userService.delete(id);
      await this.loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }
}
```

```html
<!-- src/app/home/home.page.html -->
<ion-header>
  <ion-toolbar>
    <ion-title>
      User Management
    </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-card>
    <ion-card-header>
      <ion-card-title>Add New User</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <ion-item>
        <ion-label position="stacked">Nickname</ion-label>
        <ion-input [(ngModel)]="newUser.nickname"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Email</ion-label>
        <ion-input type="email" [(ngModel)]="newUser.email"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">PIN</ion-label>
        <ion-input type="password" [(ngModel)]="newUser.pin"></ion-input>
      </ion-item>
      <ion-button expand="block" (click)="createUser()">Add User</ion-button>
    </ion-card-content>
  </ion-card>

  <ion-list>
    <ion-list-header>
      <ion-label>Users</ion-label>
    </ion-list-header>
    <ion-item *ngFor="let user of users">
      <ion-label>
        <h2>{{ user.nickname }}</h2>
        <p>{{ user.email }}</p>
      </ion-label>
      <ion-button slot="end" color="danger" (click)="deleteUser(user.id)">
        <ion-icon name="trash"></ion-icon>
      </ion-button>
    </ion-item>
  </ion-list>
</ion-content>
```

## Advanced Usage: Adding Custom Functionality

### Extending Generated Services

You can extend the generated services with custom functionality by creating a subclass:

```typescript
// src/app/core/services/extended-user.service.ts
import { Injectable } from '@angular/core';
import { UserService } from '../database/services/user.service';
import { User } from '../database/models/user';

@Injectable({
  providedIn: 'root'
})
export class ExtendedUserService extends UserService {
  
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM users WHERE email = ?',
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
        
        const users = await dexie.users
          .where('email')
          .equals(email)
          .toArray();
          
        return users.length > 0 ? this.mapTableToModel(users[0]) : null;
      }
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }
  
  /**
   * Authenticate user with email and PIN
   */
  async authenticate(email: string, pin: string): Promise<User | null> {
    try {
      if (this.databaseService.isNativeDatabase()) {
        // SQLite implementation
        const result = await this.databaseService.executeQuery(
          'SELECT * FROM users WHERE email = ? AND pin = ?',
          [email, pin]
        );
        
        if (result.values && result.values.length > 0) {
          return this.mapTableToModel(result.values[0]);
        }
        return null;
      } else {
        // Dexie implementation
        const dexie = this.databaseService.getDexieInstance();
        if (!dexie) throw new Error('Dexie database not initialized');
        
        const users = await dexie.users
          .where('email')
          .equals(email)
          .and(user => user.pin === pin)
          .toArray();
          
        return users.length > 0 ? this.mapTableToModel(users[0]) : null;
      }
    } catch (error) {
      console.error(`Error authenticating user ${email}:`, error);
      throw error;
    }
  }
}
```

## Regenerating Code After Schema Changes

Whenever you update your database schema:

1. Add a new migration file (e.g., `V4__add_status_column.sql` or `004_add_status_column.sql`)
2. Run the generators:
   ```bash
   npm run generate-db
   ```
3. All your code (migrations, models, Dexie schema, and services) will be updated automatically

## Handling Migrations in Your App

When your app starts, the database service should:

1. Check the current database version
2. Apply any pending migrations
3. Record each migration in a migrations table

This is handled in the `initializeDatabase` method of the database service.

## Troubleshooting

### Migration Files Not Being Processed

- Ensure your migration files follow the correct naming format (`V1__name.sql` or `001_name.sql`)
- If using numeric format, make sure to use the `--numeric` flag

### Generated Services Missing Methods

- Check that your DatabaseService implements all required methods
- Ensure your migration files contain proper SQL table definitions with primary keys

### SQLite vs Dexie Implementation Issues

- The generated code uses `isNativeDatabase()` to switch between SQLite and Dexie
- Ensure this method correctly returns true on mobile devices and false on web

### Database Operations Failing

- Check that your database initialization completes before any operations
- Verify that all migrations are applied successfully
- Use try/catch blocks to handle database errors gracefully
