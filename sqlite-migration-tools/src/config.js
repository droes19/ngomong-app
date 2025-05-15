/**
 * Default configuration settings for SQLite Migration Tools
 */

module.exports = {
  /**
   * Default paths for generator outputs
   */
  defaultPaths: {
    // SQLite migrations generator
    migrations: '../src/app/core/database/migrations.ts',

    // TypeScript models generator
    models: '../src/app/core/database/models',

    // Dexie.js schema generator
    dexie: '../src/app/core/database/dexie-schema.ts',

    // Service generator
    services: '../src/app/core/database/services'
  },

  /**
   * Default pattern for migration files
   */
  migrationPattern: /^V\d+__.+\.sql$/,

  /**
   * Alternative pattern for numerically prefixed migration files
   */
  numericPattern: /^\d+_.+\.sql$/
};
