#!/usr/bin/env node

// SQLite to Dexie.js Generator CLI
const path = require('path');
const { generateDexieMigrationFromDir, generateDexieMigrationFromFile } = require('../src/generators');
const config = require('../src/config');

// Command-line arguments (skipping node and script name)
const args = process.argv.slice(2);

// Get default output path
const defaultOutputPath = config.defaultPaths.dexie;

if (args.length === 0) {
  // No arguments provided, show help
  console.log('SQLite to Dexie Migration Generator');
  console.log('==================================');
  console.log('');
  console.log('Usage:');
  console.log('  For a single file:');
  console.log('    sqlite-to-dexie --file <input-sql-file> [output-ts-file]');
  console.log('');
  console.log('  For a directory of migration files:');
  console.log('    sqlite-to-dexie --dir <migration-directory> [output-ts-file]');
  console.log('');
  console.log('  Default output path if not specified:');
  console.log(`    ${defaultOutputPath}`);
  console.log('');
  console.log('Examples:');
  console.log('  sqlite-to-dexie --file database.sql');
  console.log('  sqlite-to-dexie --dir ./migrations ./src/custom/dexie-schema.ts');
  process.exit(1);
}

const mode = args[0];

if (mode === '--file' && args.length >= 2) {
  const inputFile = args[1];
  const outputFile = args.length >= 3 ? args[2] : defaultOutputPath;
  generateDexieMigrationFromFile(inputFile, outputFile);
} else if (mode === '--dir' && args.length >= 2) {
  const inputDir = args[1];
  const outputFile = args.length >= 3 ? args[2] : defaultOutputPath;
  generateDexieMigrationFromDir(inputDir, outputFile);
} else {
  console.error('Invalid arguments. Use --file or --dir mode.');
  process.exit(1);
}
