#!/usr/bin/env node

// SQLite Migrations Generator CLI
const path = require('path');
const { generateSqliteMigrationsFromDir, generateSqliteMigrationsFromFile } = require('../src/generators');
const config = require('../src/config');

// Command-line arguments (skipping node and script name)
const args = process.argv.slice(2);

// Get default output path
const defaultOutputPath = config.defaultPaths.migrations;

if (args.length === 0) {
  // No arguments provided, show help
  console.log('SQLite Migrations Array Generator');
  console.log('================================');
  console.log('');
  console.log('Usage:');
  console.log('  For a single file:');
  console.log('    sqlite-migrate --file <input-sql-file> [output-ts-file]');
  console.log('');
  console.log('  For a directory of migration files:');
  console.log('    sqlite-migrate --dir <migration-directory> [output-ts-file]');
  console.log('');
  console.log('  Default output path if not specified:');
  console.log(`    ${defaultOutputPath}`);
  console.log('');
  console.log('Examples:');
  console.log('  sqlite-migrate --file database.sql');
  console.log('  sqlite-migrate --dir ./migrations ./src/custom/migrations.ts');
  process.exit(1);
}

const mode = args[0];

if (mode === '--file' && args.length >= 2) {
  const inputFile = args[1];
  const outputFile = args.length >= 3 ? args[2] : defaultOutputPath;
  generateSqliteMigrationsFromFile(inputFile, outputFile);
} else if (mode === '--dir' && args.length >= 2) {
  const inputDir = args[1];
  const outputFile = args.length >= 3 ? args[2] : defaultOutputPath;
  generateSqliteMigrationsFromDir(inputDir, outputFile);
} else {
  console.error('Invalid arguments. Use --file or --dir mode.');
  process.exit(1);
}
