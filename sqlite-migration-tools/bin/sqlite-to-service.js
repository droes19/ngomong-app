#!/usr/bin/env node

// SQLite to TypeScript Services Generator CLI
const path = require('path');
const { processMigrationDirectoryForServices, processFileForServices } = require('../src/generators');
const config = require('../src/config');

// Command-line arguments (skipping node and script name)
const args = process.argv.slice(2);

// Get default output path
const defaultOutputDir = config.defaultPaths.services;

if (args.length === 0) {
  // No arguments provided, show help
  console.log('SQLite Migration to Service Generator');
  console.log('=================================');
  console.log('');
  console.log('Usage:');
  console.log('  For a single file:');
  console.log('    sqlite-to-services --file <input-sql-file> [output-directory]');
  console.log('');
  console.log('  For a directory of migration files:');
  console.log('    sqlite-to-services --dir <migration-directory> [output-directory]');
  console.log('');
  console.log('  Default output directory if not specified:');
  console.log(`    ${defaultOutputDir}`);
  console.log('');
  console.log('Examples:');
  console.log('  sqlite-to-services --file database.sql');
  console.log('  sqlite-to-services --dir ./migrations ./src/custom/services');
  process.exit(1);
}

const mode = args[0];

if (mode === '--file' && args.length >= 2) {
  const inputFile = args[1];
  const outputDir = args.length >= 3 ? args[2] : defaultOutputDir;
  processFileForServices(inputFile, outputDir);
} else if (mode === '--dir' && args.length >= 2) {
  const inputDir = args[1];
  const outputDir = args.length >= 3 ? args[2] : defaultOutputDir;
  processMigrationDirectoryForServices(inputDir, outputDir);
} else {
  console.error('Invalid arguments. Use --file or --dir mode.');
  process.exit(1);
}
