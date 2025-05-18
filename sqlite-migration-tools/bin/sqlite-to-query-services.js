#!/usr/bin/env node

// SQLite Queries to Service Generator CLI
const path = require('path');
const { processQueryDirectory, processQueryFile } = require('../src/generators/query-service-generator');
const config = require('../src/config');

// Command-line arguments (skipping node and script name)
const args = process.argv.slice(2);

// Get default paths
const defaultQueriesDir = '../queries';
const defaultMigrationsDir = '../migrations';
const defaultOutputDir = config.defaultPaths.services;

if (args.length === 0) {
  // No arguments provided, show help
  console.log('SQLite Queries to Service Generator');
  console.log('=================================');
  console.log('');
  console.log('Usage:');
  console.log('  For a single query file:');
  console.log('    sqlite-to-query-services --file <query-sql-file> [migrations-directory] [output-directory]');
  console.log('');
  console.log('  For a directory of query files:');
  console.log('    sqlite-to-query-services --dir [queries-directory] [migrations-directory] [output-directory]');
  console.log('');
  console.log('  Default paths if not specified:');
  console.log(`    Queries directory: ${defaultQueriesDir}`);
  console.log(`    Migrations directory: ${defaultMigrationsDir}`);
  console.log(`    Output directory: ${defaultOutputDir}`);
  console.log('');
  console.log('Examples:');
  console.log('  sqlite-to-query-services --file queries/user.sql');
  console.log('  sqlite-to-query-services --dir');
  console.log('  sqlite-to-query-services --dir ./custom-queries ./migrations ./src/app/services');
  process.exit(1);
}

const mode = args[0];

if (mode === '--file') {
  const queryFile = args.length >= 2 ? args[1] : path.join(defaultQueriesDir, 'user.sql');
  const migrationsDir = args.length >= 3 ? args[2] : defaultMigrationsDir;
  const outputDir = args.length >= 4 ? args[3] : defaultOutputDir;
  processQueryFile(queryFile, migrationsDir, outputDir);
} else if (mode === '--dir') {
  const queriesDir = args.length >= 2 ? args[1] : defaultQueriesDir;
  const migrationsDir = args.length >= 3 ? args[2] : defaultMigrationsDir;
  const outputDir = args.length >= 4 ? args[3] : defaultOutputDir;
  processQueryDirectory(queriesDir, migrationsDir, outputDir);
} else {
  console.error('Invalid arguments. Use --file or --dir mode.');
  process.exit(1);
}
