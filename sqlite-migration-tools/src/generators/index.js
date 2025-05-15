// Export all generators
const migrateGenerator = require('./migrate-generator');
const modelGenerator = require('./model-generator');
const dexieGenerator = require('./dexie-generator');
const serviceGenerator = require('./service-generator');

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

  // Service generator
  processMigrationDirectoryForServices: serviceGenerator.processMigrationDirectoryForServices,
  processFileForServices: serviceGenerator.processFileForServices
};
