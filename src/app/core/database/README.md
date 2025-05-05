# Database Structure

This directory contains all database-related code for the application, using different implementations based on the platform:
- **Mobile (iOS/Android)**: Uses `@capacitor-community/sqlite`
- **Desktop/Web**: Uses `dexie` (IndexedDB wrapper)

## Directory Structure

- `/database`
  - `/models` - Data models and migration definitions
  - `/services` - Database services
  - `/templates` - Templates for creating new models, services, and migrations
  - `migration-helper.ts` - Utilities for managing migrations
  - `database.config.ts` - Central database configuration

## Migration-Based Architecture

This database system uses a migration-based approach for all database changes:

- All database changes (including table creation) are defined as migrations
- Each migration has a unique version number, description, and set of SQL queries
- Migrations are run in order based on their version number
- The system tracks which migrations have been applied
- New migrations are automatically detected and applied on app startup
- Validation tools help catch migration versioning errors early

This approach allows for:
- Adding new tables
- Adding columns to existing tables
- Making schema changes over time
- Tracking database version history
- Maintaining consistency across platforms

## Migration Versioning System

To ensure migrations are applied in the correct order and prevent version conflicts:

1. The database has a single global version number in `database.config.ts`
2. The `NEXT_MIGRATION_VERSION` constant in `database.config.ts` always indicates the next available version
3. When adding a new migration, always use `NEXT_MIGRATION_VERSION` for its version number
4. After adding a migration, increment both `DATABASE_CONFIG.version` and `NEXT_MIGRATION_VERSION`
5. Use `validateMigrations()` during development to check for versioning issues

## Adding a New Table

To add a new table to the database:

1. Create a new model file in `models/` using the template in `templates/model.template.txt`
2. Define your entity interfaces (both camelCase and snake_case versions)
3. Create a migration using `NEXT_MIGRATION_VERSION` for the version number
4. Update `ALL_MIGRATIONS` in models/index.ts to include your new table's migrations
5. Increment both `DATABASE_CONFIG.version` and `NEXT_MIGRATION_VERSION` in database.config.ts
6. Update the Dexie schema in initWebDatabase method to include the new table
7. Create a new service in `services/` for the entity using the template
8. Run `validateMigrations()` to check for version conflicts

Example:
```typescript
// In database.config.ts (before adding migration)
export const DATABASE_CONFIG = {
  name: 'ngomong_db',
  version: 3,
  // ...
};
export const NEXT_MIGRATION_VERSION = 4;

// In new-entity.model.ts
import { NEXT_MIGRATION_VERSION } from '../database.config';

export const NEW_ENTITY_MIGRATIONS: Migration[] = [
  {
    version: NEXT_MIGRATION_VERSION, // Will be 4
    description: 'Create new_entities table',
    queries: [
      generateTableSchema('new_entities', [
        'name TEXT NOT NULL',
        'description TEXT'
      ])
    ]
  }
];

// In models/index.ts
export const ALL_MIGRATIONS = [
  ...USER_MIGRATIONS,
  ...NEW_ENTITY_MIGRATIONS
];

// In database.config.ts (after adding migration)
export const DATABASE_CONFIG = {
  name: 'ngomong_db',
  version: 4,  // Updated to match the migration version
  // ...
};
export const NEXT_MIGRATION_VERSION = 5; // Incremented for the next migration

// In database.service.ts
// v4 migration: Add new table
this.version(4).stores({
  users: '++id, username, email, phone_number, preferences, created_at',
  new_entities: '++id, name, description, created_at'
});
```

## Adding a New Column to an Existing Table

To add a new field to an existing table:

1. Update the model interfaces (both the camelCase and snake_case versions)
2. Add a new migration to the table's migrations array using `NEXT_MIGRATION_VERSION`
3. Increment both `DATABASE_CONFIG.version` and `NEXT_MIGRATION_VERSION` in database.config.ts
4. Update the Dexie schema for web/desktop platforms
5. Run `validateMigrations()` to check for version conflicts

Example:
```typescript
// In database.config.ts (before adding migration)
export const DATABASE_CONFIG = {
  name: 'ngomong_db',
  version: 4,
  // ...
};
export const NEXT_MIGRATION_VERSION = 5;

// In user.model.ts
import { NEXT_MIGRATION_VERSION } from '../database.config';

export const USER_MIGRATIONS: Migration[] = [
  // Existing migrations...
  {
    version: NEXT_MIGRATION_VERSION, // Will be 5
    description: 'Add login_count to users table',
    queries: [
      generateAddColumnStatement('users', 'login_count INTEGER DEFAULT 0')
    ]
  }
];

// In database.config.ts (after adding migration)
export const DATABASE_CONFIG = {
  name: 'ngomong_db',
  version: 5, // Updated to match the migration version
  // ...
};
export const NEXT_MIGRATION_VERSION = 6; // Incremented for the next migration

// In database.service.ts
// v5 migration: Add login_count
this.version(5).stores({
  users: '++id, username, email, phone_number, preferences, login_count, created_at',
  new_entities: '++id, name, description, created_at'
});
```

## Handling Migration Version Conflicts

If you accidentally create migrations with conflicting version numbers:

1. Run `validateMigrations()` to identify the conflicts
2. Fix any duplicate version numbers
3. Make sure all version numbers are sequential without gaps
4. Update `DATABASE_CONFIG.version` to match the highest migration version
5. Update `NEXT_MIGRATION_VERSION` to be one higher than the highest migration version
6. Run `validateMigrations()` again to confirm everything is fixed

## Usage Example

```typescript
// In a component or service
constructor(private userService: UserService) {}

async createUser() {
  const user = {
    username: 'johndoe',
    email: 'john@example.com',
    fullName: 'John Doe'
  };
  
  const userId = await this.userService.createUser(user);
  console.log('Created user with ID:', userId);
}

async getUsers() {
  const users = await this.userService.getAllUsers();
  console.log('All users:', users);
}
```

## Best Practices

1. Always use the model interfaces for type safety
2. Use snake_case for database columns and camelCase for model properties
3. Handle errors appropriately with try/catch
4. Keep database operations in services, not components
5. Make sure to initialize the database before using it
6. Close database connections when not needed

## Models

The base models extend `BaseModel` which includes:
- `id` (optional): Primary key
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Database Services

All database services provide standard CRUD operations:
- `create`: Create a new record
- `getById`: Get a record by ID
- `getAll`: Get all records
- `update`: Update a record
- `delete`: Delete a record

Additional methods can be added as needed.