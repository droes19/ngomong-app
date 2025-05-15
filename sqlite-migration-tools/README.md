# SQLite Migration Tools

A collection of tools for working with SQLite migrations, generating TypeScript models, creating Dexie.js schemas, and generating Angular services.

## Features

- Generate SQLite migrations array from SQL files
- Generate TypeScript models from SQLite schema
- Generate Dexie.js database schema from SQLite schema
- Generate Angular services for database operations
- Command-line tools for all generators
- Run all generators with a single command
- Default output paths for easy integration
- Support for both V-prefixed and numerically prefixed migration files
- Reusable JavaScript API

## Installation

```bash
npm install sqlite-migration-tools
```

## Command-line Usage

All commands support running with default output paths if you don't specify an output path.

### SQLite Migrations Generator

Generate a TypeScript file with SQLite migrations array from SQL files.

```bash
# From a directory of migration files with default output path
sqlite-migrate --dir ./migrations

# With custom output path
sqlite-migrate --dir ./migrations ./src/generated/migrations.ts

# From a single file
sqlite-migrate --file database.sql ./src/generated/migrations.ts
```

### TypeScript Models Generator

Generate TypeScript model interfaces from SQLite schema.

```bash
# From a directory of migration files with default output path
sqlite-to-models --dir ./migrations

# With custom output path
sqlite-to-models --dir ./migrations ./src/generated/models

# From a single file
sqlite-to-models --file database.sql ./src/generated/models
```

### Dexie.js Schema Generator

Generate Dexie.js database schema from SQLite schema.

```bash
# From a directory of migration files with default output path
sqlite-to-dexie --dir ./migrations

# With custom output path
sqlite-to-dexie --dir ./migrations ./src/generated/dexie-schema.ts

# From a single file
sqlite-to-dexie --file database.sql ./src/generated/dexie-schema.ts
```

### Angular Services Generator

Generate Angular services for database operations based on the SQLite schema.

```bash
# From a directory of migration files with default output path
sqlite-to-services --dir ./migrations

# With custom output path
sqlite-to-services --dir ./migrations ./src/generated/services

# From a single file
sqlite-to-services --file database.sql ./src/generated/services
```

### Run All Generators

Run all generators with a single command.

```bash
# Use default input and output paths
sqlite-run-all

# Specify a custom input path
sqlite-run-all ./my-migrations

# Use numeric pattern (001_name.sql) instead of V prefix (V1__name.sql)
sqlite-run-all --numeric ./migrations
```

## Default Output Paths

The tools use the following default output paths:

- **Migrations**: `./src/app/core/database/migrations.ts`
- **Models**: `./src/app/core/database/models`
- **Dexie Schema**: `./src/app/core/database/dexie-schema.ts`
- **Services**: `./src/app/core/database/services`

## JavaScript API

You can also use the tools programmatically in your JavaScript code:

```javascript
const sqliteTools = require('sqlite-migration-tools');

// SQLite migrations generator
sqliteTools.generateSqliteMigrationsFromDir(
  './migrations', 
  './src/generated/migrations.ts'
);

// TypeScript models generator
sqliteTools.processMigrationDirectory(
  './migrations', 
  './src/generated/models'
);

// Dexie.js generator
sqliteTools.generateDexieMigrationFromDir(
  './migrations', 
  './src/generated/dexie-schema.ts'
);

// Angular services generator
sqliteTools.processMigrationDirectoryForServices(
  './migrations', 
  './src/generated/services'
);

// Access utility functions
const { utils } = sqliteTools;
```

## Migration File Format

The tools support two migration file naming conventions:

### V-prefix (Default)

```
V<version>__<description>.sql
```

Example:
```
V1__initial_schema.sql
V2__add_users_table.sql
V3__add_email_column.sql
```

### Numeric prefix

```
<number>_<description>.sql
```

Example:
```
001_initial_schema.sql
002_add_users_table.sql
003_add_email_column.sql
```

To use the numeric prefix format, add the `--numeric` flag to the `sqlite-run-all` command or modify the pattern in the API calls.

## Generated Files

### Models

For each table in your schema, a TypeScript interface will be generated:

```typescript
// Auto-generated TypeScript model for the users table

/**
 * Interface for the users table
 */
export interface User {
  /** Primary Key, Auto Increment */
  id: number;
  /** Unique */
  email: string;
  nickname: string;
  pin: string;
  created_at: string;
  updated_at: string;
  phone_number?: string;
  private_key?: string;
}

/**
 * Table interface (snake_case) for the users table
 */
export interface UserTable {
  id: number;
  email: string;
  nickname: string;
  pin: string;
  created_at: string;
  updated_at: string;
  phone_number?: string;
  private_key?: string;
}
```

### Services

For each table, a TypeScript service will be generated with CRUD operations:

```typescript
import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { User, UserTable } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private databaseService: DatabaseService) {}

  // CRUD operations for User
  async create(user: User): Promise<number | undefined> {
    // Implementation...
  }

  async getById(id: number): Promise<User | null> {
    // Implementation...
  }

  async getAll(): Promise<User[]> {
    // Implementation...
  }

  async update(id: number, updates: Partial<User>): Promise<boolean> {
    // Implementation...
  }

  async delete(id: number): Promise<boolean> {
    // Implementation...
  }

  private mapTableToModel(tableRow: UserTable): User {
    // Implementation...
  }
}
```

## License

MIT
