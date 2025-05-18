// Export all generators
const migrateGenerator = require('./migrate-generator');
const modelGenerator = require('./model-generator');
const dexieGenerator = require('./dexie-generator');
const queryServiceGenerator = require('./query-service-generator');

module.exports = {
  // SQLite migrations generator
  generateSqliteMigrationsFromDir: migrateGenerator.generateSqliteMigrationsFromDir,
  generateSqliteMigrationsFromFile: migrateGenerator.generateSqliteMigrationsFromFile,

  // TypeScript model generator
  processMigrationDirectory: modelGenerator.processMigrationDirectory,
  processFile: modelGenerator.processFile,

  // Dexie.js generator
  generateDexieMigrationFromDir: dexieGenerator.generateDexieMigrationFromDir,
  generateDexieMigrationFromFile: dexieGenerator.generateDexieMigrationFromFile,

  // Query service generator
  processQueryDirectory: queryServiceGenerator.processQueryDirectory,
  processQueryFile: queryServiceGenerator.processQueryFile,
};
