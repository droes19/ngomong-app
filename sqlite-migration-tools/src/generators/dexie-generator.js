const path = require('path');
const utils = require('../utils');

/**
 * Generate a Dexie database class without interfaces
 * @param {Array} versions Array of version objects with tables
 * @returns {string} Generated database class content
 */
function generateDexieDatabaseClass(versions) {
  if (!versions || versions.length === 0) {
    return '';
  }

  // Use the latest version for table definitions
  const latestVersion = versions[versions.length - 1];

  let output = `\n/**\n * Dexie database class with all migrations applied\n */\n`;
  output += `export class AppDatabase extends Dexie {\n`;

  // Add table properties
  latestVersion.tables.forEach(table => {
    output += `  // Table for ${table.name}\n`;
    output += `  ${table.name}: Dexie.Table<any, number>;\n`;
  });

  // Constructor with configurable name
  output += `\n  constructor(dbName: string = 'AppDatabase') {\n`;
  output += `    super(dbName);\n\n`;

  // Group commented versions
  output += `    // Define schema versions\n`;

  // Debug: Log each version's tables to help troubleshoot
  console.log("Versions to process for Dexie schema:", versions.map(v => ({
    version: v.version,
    tables: v.tables.map(t => t.name)
  })));

  versions.forEach(version => {
    output += `    // v${version.version} migration\n`;
    output += `    this.version(${version.version}).stores({\n`;

    // Add all tables for this version
    version.tables.forEach((table, i) => {
      const isLast = i === version.tables.length - 1;

      // Generate schema string with all columns for this version
      const schemaString = utils.generateDexieSchemaString(table);

      // Debug: Log the schema string for each table
      console.log(`Version ${version.version}, Table ${table.name} schema: ${schemaString}`);
      console.log(`Columns: ${table.columns.map(c => c.name).join(', ')}`);

      output += `      ${table.name}: '${schemaString}'${isLast ? '' : ','}\n`;
    });

    output += `    });\n\n`;
  });

  // Initialize table references
  output += `    // Initialize table references\n`;
  latestVersion.tables.forEach(table => {
    output += `    this.${table.name} = this.table('${table.name}');\n`;
  });

  output += `  }\n`;
  output += `}\n\n`;

  // Export instance
  output += `// Export a database instance with default name\n`;
  output += `export const db = new AppDatabase();\n`;

  return output;
}

/**
 * Process parsed files to extract versions with proper column tracking
 * @param {Array} parsedFiles Array of parsed file information
 * @returns {Array} Array of version objects with complete schemas
 */
function processFilesToVersions(parsedFiles) {
  // This is a more careful implementation of version tracking
  const versions = [];

  // Track all tables and their columns across versions
  const allTables = {};

  // Sort by version number
  parsedFiles.sort((a, b) => a.version - b.version);

  console.log("Processing files:", parsedFiles.map(f => ({
    version: f.version,
    tables: f.tables.map(t => t.name),
    alterations: f.alterations ? f.alterations.map(a => `${a.tableName}.${a.columnName}`) : []
  })));

  // Process each file's changes
  parsedFiles.forEach(fileInfo => {
    const version = fileInfo.version;

    // Apply CREATE TABLE statements first
    fileInfo.tables.forEach(table => {
      // If this is a new table, just add it to our tracking
      if (!allTables[table.name]) {
        allTables[table.name] = structuredClone(table);
      } else {
        // If table already exists, this is a table redefinition
        // Replace the existing table definition with the new one
        allTables[table.name] = structuredClone(table);
      }
    });

    // Then apply ALTER TABLE statements
    if (fileInfo.alterations && fileInfo.alterations.length > 0) {
      fileInfo.alterations.forEach(alteration => {
        const { tableName, columnName, columnInfo } = alteration;

        if (allTables[tableName]) {
          // Check if column already exists
          const existingColumnIndex = allTables[tableName].columns.findIndex(
            col => col.name === columnName
          );

          if (existingColumnIndex >= 0) {
            // Update existing column
            allTables[tableName].columns[existingColumnIndex] = columnInfo;
          } else {
            // Add new column
            allTables[tableName].columns.push(columnInfo);
          }

          // Update indexedColumns if needed
          if (!allTables[tableName].indexedColumns) {
            allTables[tableName].indexedColumns = [];
          }

          if (columnInfo.isPrimaryKey || columnInfo.isUnique || columnName.endsWith('_id')) {
            if (!allTables[tableName].indexedColumns.includes(columnName)) {
              allTables[tableName].indexedColumns.push(columnName);
            }
          }
        } else {
          console.warn(`Warning: ALTER TABLE for non-existent table ${tableName} in version ${version}`);
        }
      });
    }

    // Create a deep copy of the current state of all tables for this version
    const versionTables = Object.values(allTables).map(table => structuredClone(table));

    versions.push({
      version,
      tables: versionTables
    });

    // Debug log
    console.log(`After version ${version} processing:`,
      Object.keys(allTables).map(tableName => ({
        name: tableName,
        columns: allTables[tableName].columns.map(c => c.name)
      }))
    );
  });

  return versions;
}

/**
 * Generate Dexie schema structure for all versions
 * @param {Array} versions Array of version objects with tables
 * @returns {string} Generated migration array content
 */
function generateDexieMigrationArray(versions) {
  let output = `// Auto-generated Dexie.js database class from SQLite migrations\n`;
  output += `// Generated on ${new Date().toISOString()}\n\n`;

  // Import Dexie for TypeScript types
  output += `import Dexie from 'dexie';\n\n`;

  // Add database class that directly uses the versions
  if (versions.length > 0) {
    output += generateDexieDatabaseClass(versions);
  }

  return output;
}

/**
 * Process SQL migration files and generate Dexie.js migration array
 * @param {string} directoryPath Path to the directory containing migration files
 * @param {string} outputPath Path where the output file will be written
 * @param {RegExp} pattern Regular expression pattern to match migration files
 * @returns {void}
 */
function generateDexieMigrationFromDir(directoryPath, outputPath, pattern = /^V\d+__.+\.sql$/) {
  try {
    // Check if directory exists
    if (!utils.checkDirExists(directoryPath)) {
      console.error(`Error: ${directoryPath} is not a valid directory.`);
      return;
    }

    console.log(`Processing migration files in ${directoryPath}...`);

    // Get all SQL files in the directory that match the pattern
    const files = utils.getSqlFilesInDirectory(directoryPath, pattern);

    if (files.length === 0) {
      console.error(`No migration files matching the pattern ${pattern} found in ${directoryPath}.`);
      return;
    }

    console.log(`Found ${files.length} migration files.`);

    // Parse each file and extract tables and alterations
    const parsedFiles = [];

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      const version = utils.extractVersionFromFileName(file);

      if (!version) {
        console.warn(`Warning: Could not extract version number from ${file}, skipping.`);
        return;
      }

      console.log(`Processing: ${file} (version ${version})`);

      const sqlContent = utils.readSqlFile(filePath);
      if (!sqlContent) return;

      // Parse CREATE TABLE statements
      const { tables, enums } = utils.parseCreateTableStatements(sqlContent, file);

      // Parse ALTER TABLE statements and get alterations
      const alterations = utils.parseAlterTableStatements(sqlContent, tables, file);

      parsedFiles.push({
        version,
        tables,
        alterations
      });
    });

    // Group tables by version with proper column tracking
    const versions = processFilesToVersions(parsedFiles);

    // Output some debug information
    versions.forEach((version) => {
      console.log(`\nVersion ${version.version} has ${version.tables.length} tables:`);
      version.tables.forEach(table => {
        console.log(`- ${table.name} with columns: ${table.columns.map(c => c.name).join(', ')}`);
      });
    });

    // Generate Dexie migration array
    const migrationContent = generateDexieMigrationArray(versions);

    // Write output file
    if (utils.writeToFile(outputPath, migrationContent)) {
      console.log(`\nSuccessfully generated Dexie migration versions.`);
      console.log(`Found ${versions.length} schema versions.`);
      console.log(`Output written to: ${outputPath}`);
    }
  } catch (error) {
    console.error('Error generating Dexie migrations:', error);
  }
}

/**
 * Process a single SQL file and generate Dexie.js migration
 * @param {string} sqlFilePath Path to the SQL file
 * @param {string} outputPath Path where the output file will be written
 * @returns {void}
 */
function generateDexieMigrationFromFile(sqlFilePath, outputPath) {
  try {
    const sqlContent = utils.readSqlFile(sqlFilePath);
    if (!sqlContent) return;

    console.log(`Processing file: ${sqlFilePath}`);

    const fileName = path.basename(sqlFilePath);

    // Parse CREATE TABLE statements
    const { tables } = utils.parseCreateTableStatements(sqlContent, fileName);

    // Parse ALTER TABLE statements
    utils.parseAlterTableStatements(sqlContent, tables, fileName);

    // Create a single version with all tables
    const versions = [
      {
        version: 1,
        tables
      }
    ];

    // Generate Dexie migration array
    const migrationContent = generateDexieMigrationArray(versions);

    // Write output file
    if (utils.writeToFile(outputPath, migrationContent)) {
      console.log(`\nSuccessfully generated Dexie migration version.`);
      console.log(`Generated schema for ${tables.length} tables.`);
      console.log(`Output written to: ${outputPath}`);
    }
  } catch (error) {
    console.error('Error generating Dexie migration:', error);
  }
}

/**
 * Command-line interface handler
 * @param {Array} args Command-line arguments
 */
function handleCommandLine(args) {
  if (args.length < 2) {
    console.log('SQLite to Dexie Migration Generator');
    console.log('==================================');
    console.log('');
    console.log('Usage:');
    console.log('  For a single file:');
    console.log('    node sqlite-to-dexie-migration.js --file <input-sql-file> <output-ts-file>');
    console.log('');
    console.log('  For a directory of migration files:');
    console.log('    node sqlite-to-dexie-migration.js --dir <migration-directory> <output-ts-file>');
    console.log('');
    console.log('Examples:');
    console.log('  node sqlite-to-dexie-migration.js --file database.sql ./src/dexie/migrations.ts');
    console.log('  node sqlite-to-dexie-migration.js --dir ./migrations ./src/dexie/migrations.ts');
    process.exit(1);
  }

  const mode = args[0];

  if (mode === '--file' && args.length >= 3) {
    const inputFile = args[1];
    const outputFile = args[2];
    generateDexieMigrationFromFile(inputFile, outputFile);
  } else if (mode === '--dir' && args.length >= 3) {
    const inputDir = args[1];
    const outputFile = args[2];
    generateDexieMigrationFromDir(inputDir, outputFile);
  } else {
    console.error('Invalid arguments. Use --file or --dir mode.');
    process.exit(1);
  }
}

// Added deep clone helper since structuredClone might not be available in older Node versions
if (typeof structuredClone !== 'function') {
  globalThis.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

// Export functions for use as a module
module.exports = {
  generateDexieMigrationFromDir,
  generateDexieMigrationFromFile,
  handleCommandLine,
  processFilesToVersions // Exposed for testing
};
