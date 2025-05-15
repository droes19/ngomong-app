#!/usr/bin/env node

// SQLite Migration Tools - Run All Generators
const path = require('path');
const config = require('../src/config');
const generators = require('../src/generators');

// Command-line arguments (skipping node and script name)
const args = process.argv.slice(2);

// Default input path
let inputPath = '../migrations';
// Flag to use numeric pattern instead of V prefix pattern
let useNumericPattern = false;

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log('SQLite Migration Tools - Run All Generators');
  console.log('========================================');
  console.log('');
  console.log('Usage:');
  console.log('  sqlite-run-all [options] [input-path]');
  console.log('');
  console.log('Options:');
  console.log('  --numeric    Use numeric pattern (001_name.sql) instead of V prefix (V1__name.sql)');
  console.log('  --help, -h   Show this help message');
  console.log('');
  console.log('  Default input path if not specified:');
  console.log(`    ${inputPath}`);
  console.log('');
  console.log('Default output paths:');
  console.log(`  Migrations: ${config.defaultPaths.migrations}`);
  console.log(`  Models:     ${config.defaultPaths.models}`);
  console.log(`  Dexie:      ${config.defaultPaths.dexie}`);
  console.log(`  Services:   ${config.defaultPaths.services}`);
  console.log('');
  console.log('Examples:');
  console.log('  sqlite-run-all');
  console.log('  sqlite-run-all ./my-migrations');
  console.log('  sqlite-run-all --numeric ./migrations');
  process.exit(0);
}

// Process arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--numeric') {
    useNumericPattern = true;
  } else if (!args[i].startsWith('-')) {
    // If not an option, assume it's the input path
    inputPath = args[i];
  }
}

// Determine if input is a file or directory
const fs = require('fs');
const isDirectory = fs.existsSync(inputPath) && fs.statSync(inputPath).isDirectory();

// Select the pattern to use
const pattern = useNumericPattern ? config.numericPattern : config.migrationPattern;

// Run all generators
async function runAll() {
  console.log('SQLite Migration Tools - Running all generators');
  console.log('=============================================');
  console.log(`Input: ${inputPath}`);
  console.log(`Using pattern: ${pattern}`);
  console.log('');

  try {
    // Run SQLite migrations generator
    console.log('1. Generating SQLite migrations...');
    if (isDirectory) {
      await generators.generateSqliteMigrationsFromDir(inputPath, config.defaultPaths.migrations, pattern);
    } else {
      await generators.generateSqliteMigrationsFromFile(inputPath, config.defaultPaths.migrations);
    }
    console.log('');

    // Run TypeScript models generator
    console.log('2. Generating TypeScript models...');
    if (isDirectory) {
      await generators.processMigrationDirectory(inputPath, config.defaultPaths.models, pattern);
    } else {
      await generators.processFile(inputPath, config.defaultPaths.models);
    }
    console.log('');

    // Run Dexie.js schema generator
    console.log('3. Generating Dexie.js schema...');
    if (isDirectory) {
      await generators.generateDexieMigrationFromDir(inputPath, config.defaultPaths.dexie, pattern);
    } else {
      await generators.generateDexieMigrationFromFile(inputPath, config.defaultPaths.dexie);
    }
    console.log('');

    // Run Service generator
    console.log('4. Generating services...');
    if (isDirectory) {
      await generators.processMigrationDirectoryForServices(inputPath, config.defaultPaths.services, pattern);
    } else {
      await generators.processFileForServices(inputPath, config.defaultPaths.services);
    }
    console.log('');

    console.log('All generators completed successfully!');
    console.log('Output locations:');
    console.log(`  Migrations: ${config.defaultPaths.migrations}`);
    console.log(`  Models:     ${config.defaultPaths.models}`);
    console.log(`  Dexie:      ${config.defaultPaths.dexie}`);
    console.log(`  Services:   ${config.defaultPaths.services}`);

  } catch (error) {
    console.error('Error running generators:', error);
    process.exit(1);
  }
}

// Run all generators
runAll();
