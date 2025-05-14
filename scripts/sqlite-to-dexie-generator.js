const fs = require('fs');
const path = require('path');

/**
 * SQLite to TypeScript type mapping
 */
const sqliteToTypeScriptType = (sqlType) => {
  // Convert to lowercase for case-insensitive matching
  const type = sqlType.toLowerCase().trim();

  // Handle common SQLite types
  if (type.includes('int') || type.includes('numeric') || type.includes('real') ||
    type.includes('decimal') || type.includes('double') || type.includes('float')) {
    return 'number';
  } else if (type.includes('char') || type.includes('text') || type.includes('clob') ||
    type.includes('varchar')) {
    return 'string';
  } else if (type.includes('blob')) {
    return 'Buffer';
  } else if (type.includes('boolean') || type.includes('bool')) {
    return 'boolean';
  } else if (type.includes('date') || type.includes('time')) {
    return 'Date';
  } else {
    // Default to any for unknown types
    return 'any';
  }
};

/**
 * Parse CREATE TABLE statements
 */
const parseCreateTableStatements = (sqlContent, fileName) => {
  const tables = [];
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(([\s\S]*?)\)/gmi;

  let match;
  while ((match = createTableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const tableContentStr = match[2];

    // Parse columns
    const columns = [];
    const columnMatches = tableContentStr.split(',');

    // For the foreign keys list
    const foreignKeys = [];

    // For tracking primary keys defined within column definitions
    const primaryKeyColumns = [];

    // For tracking indexed columns (for Dexie schema)
    const indexedColumns = [];

    columnMatches.forEach(columnStr => {
      columnStr = columnStr.trim();

      // Skip if empty
      if (!columnStr) return;

      // Handle FOREIGN KEY constraints
      if (columnStr.toUpperCase().startsWith('FOREIGN KEY')) {
        const fkMatch = columnStr.match(/FOREIGN\s+KEY\s*\(\s*["'`]?(\w+)["'`]?\s*\)\s*REFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/i);
        if (fkMatch) {
          foreignKeys.push({
            column: fkMatch[1],
            referenceTable: fkMatch[2],
            referenceColumn: fkMatch[3]
          });
          // Foreign key columns should be indexed in Dexie
          if (!indexedColumns.includes(fkMatch[1])) {
            indexedColumns.push(fkMatch[1]);
          }
        }
        return;
      }

      // Handle PRIMARY KEY constraints
      if (columnStr.toUpperCase().startsWith('PRIMARY KEY')) {
        const pkMatch = columnStr.match(/PRIMARY\s+KEY\s*\(\s*(.*?)\s*\)/i);
        if (pkMatch) {
          const pkColumns = pkMatch[1].split(',').map(col =>
            col.trim().replace(/["'`]/g, '')
          );
          primaryKeyColumns.push(...pkColumns);
        }
        return;
      }

      // Skip other constraints that aren't column definitions
      if (columnStr.toUpperCase().startsWith('CONSTRAINT') ||
        columnStr.toUpperCase().startsWith('UNIQUE') ||
        columnStr.toUpperCase().startsWith('CHECK')) {
        return;
      }

      // Parse regular column definitions
      const colMatch = columnStr.match(/["'`]?(\w+)["'`]?\s+([^,]+)/);
      if (colMatch) {
        const columnName = colMatch[1];
        const columnDef = colMatch[2].trim();

        const typeParts = columnDef.split(' ');
        const sqlType = typeParts[0];

        const tsType = sqliteToTypeScriptType(sqlType);
        const isPrimaryKey = columnDef.toUpperCase().includes('PRIMARY KEY');
        const isNotNull = columnDef.toUpperCase().includes('NOT NULL');
        const isUnique = columnDef.toUpperCase().includes('UNIQUE');
        const isAutoIncrement = columnDef.toUpperCase().includes('AUTOINCREMENT');

        // In Dexie, PRIMARY KEY columns and UNIQUE columns should be indexed
        if (isPrimaryKey || isUnique) {
          if (!indexedColumns.includes(columnName)) {
            indexedColumns.push(columnName);
          }
        }

        // Also add foreign key-like columns (ending with _id) to indexedColumns
        if (columnName.endsWith('_id') && !indexedColumns.includes(columnName)) {
          indexedColumns.push(columnName);
        }

        // Look for DEFAULT value
        let defaultValue;
        const defaultMatch = columnDef.match(/DEFAULT\s+([^,\s]+)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }

        if (isPrimaryKey) {
          primaryKeyColumns.push(columnName);
        }

        columns.push({
          name: columnName,
          sqlType: sqlType,
          tsType: tsType,
          isPrimaryKey: isPrimaryKey,
          isNullable: !isNotNull && !isPrimaryKey,
          isUnique: isUnique,
          isAutoIncrement: isAutoIncrement,
          defaultValue: defaultValue
        });
      }
    });

    // Set the primary key flag for columns that are in the PRIMARY KEY constraint
    columns.forEach(col => {
      if (primaryKeyColumns.includes(col.name)) {
        col.isPrimaryKey = true;
      }
    });

    tables.push({
      name: tableName,
      columns: columns,
      foreignKeys: foreignKeys,
      indexedColumns: indexedColumns,
      originalFile: fileName
    });
  }

  return tables;
};

/**
 * Parse ALTER TABLE statements to update existing schema
 */
const parseAlterTableStatements = (sqlContent, existingTables, fileName) => {
  // Pattern for ALTER TABLE ADD COLUMN statements
  const addColumnRegex = /ALTER\s+TABLE\s+["'`]?(\w+)["'`]?\s+ADD(?:\s+COLUMN)?\s+["'`]?(\w+)["'`]?\s+([^;]+)/gmi;

  const alterations = [];

  let match;
  while ((match = addColumnRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const columnName = match[2];
    const columnDef = match[3].trim();

    const typeParts = columnDef.split(' ');
    const sqlType = typeParts[0];

    const tsType = sqliteToTypeScriptType(sqlType);
    const isPrimaryKey = columnDef.toUpperCase().includes('PRIMARY KEY');
    const isNotNull = columnDef.toUpperCase().includes('NOT NULL');
    const isUnique = columnDef.toUpperCase().includes('UNIQUE');

    // Look for DEFAULT value
    let defaultValue;
    const defaultMatch = columnDef.match(/DEFAULT\s+([^,\s]+)/i);
    if (defaultMatch) {
      defaultValue = defaultMatch[1];
    }

    // Create column info
    const columnInfo = {
      name: columnName,
      sqlType: sqlType,
      tsType: tsType,
      isPrimaryKey: isPrimaryKey,
      isNullable: !isNotNull && !isPrimaryKey,
      isUnique: isUnique,
      defaultValue: defaultValue
    };

    // Store the alteration for later processing
    alterations.push({
      tableName,
      columnName,
      columnInfo
    });

    console.log(`Found ALTER TABLE: Add column ${columnName} to table ${tableName} in file ${fileName}`);

    // Find the table in existing tables to apply immediately for compatibility
    const table = existingTables.find(t => t.name === tableName);

    // Skip if the table doesn't exist in our schema
    if (!table) {
      console.warn(`Warning: ALTER TABLE references table "${tableName}" which was not found in the current file. This will be applied in version processing if the table exists in a previous version.`);
      continue;
    }

    // In Dexie, PRIMARY KEY columns and UNIQUE columns should be indexed
    if (isPrimaryKey || isUnique) {
      if (!table.indexedColumns.includes(columnName)) {
        table.indexedColumns.push(columnName);
      }
    }

    // Also add foreign key-like columns (ending with _id) to indexedColumns
    if (columnName.endsWith('_id') && !table.indexedColumns.includes(columnName)) {
      table.indexedColumns.push(columnName);
    }

    // Add the new column to the table's schema
    table.columns.push(columnInfo);
  }

  return alterations;
};

/**
 * Extract version number from migration filename
 * Assumes format: Vx__name.sql where x is the version number
 */
const extractVersionFromFileName = (fileName) => {
  const match = fileName.match(/^V(\d+)__/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
};

/**
 * Convert a table name to a TypeScript interface name
 */
const tableNameToInterfaceName = (tableName) => {
  // Handle common naming patterns
  let interfaceName = tableName;

  if (interfaceName.endsWith('ies')) {
    interfaceName = interfaceName.replace(/ies$/, 'y');
  } else if (interfaceName.endsWith('s')) {
    interfaceName = interfaceName.slice(0, -1);
  }

  // Convert to PascalCase
  return interfaceName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

/**
 * Group tables by version based on migration filenames
 */
const groupTablesByVersion = (parsedFiles) => {
  const versions = [];

  // Sort parsedFiles by version number
  parsedFiles.sort((a, b) => a.version - b.version);

  // Track which tables we've seen in previous versions
  const allTablesSeenSoFar = {};

  // For each version, include all tables seen so far
  parsedFiles.forEach(fileInfo => {
    const version = fileInfo.version;
    const tables = fileInfo.tables;
    const alterations = fileInfo.alterations || [];

    // Add/update tables to our tracking object
    tables.forEach(table => {
      allTablesSeenSoFar[table.name] = table;
    });

    // Apply any alterations to existing tables
    alterations.forEach(alteration => {
      const { tableName, columnName, columnInfo } = alteration;

      if (allTablesSeenSoFar[tableName]) {
        // Add column to the table
        allTablesSeenSoFar[tableName].columns.push(columnInfo);

        // Add to indexed columns if needed
        if (columnInfo.isPrimaryKey || columnInfo.isUnique || columnName.endsWith('_id')) {
          if (!allTablesSeenSoFar[tableName].indexedColumns.includes(columnName)) {
            allTablesSeenSoFar[tableName].indexedColumns.push(columnName);
          }
        }

        console.log(`Applied alteration: Added column ${columnName} to table ${tableName} in version ${version}`);
      } else {
        console.warn(`Warning: Could not apply alteration to non-existent table ${tableName} in version ${version}`);
      }
    });

    // Create a version entry with all tables seen so far
    versions.push({
      version: version,
      // Create a deep copy of all tables seen so far
      tables: Object.values(allTablesSeenSoFar).map(t => JSON.parse(JSON.stringify(t)))
    });
  });

  return versions;
};

/**
 * Generate Dexie schema string for a table
 */
const generateDexieSchemaString = (table) => {
  // Get primary key
  const primaryKey = table.columns.find(col => col.isPrimaryKey);
  let schemaString = '';

  if (primaryKey) {
    // If it's auto-increment, prefix with ++
    if (primaryKey.isAutoIncrement) {
      schemaString = `++${primaryKey.name}`;
    } else {
      schemaString = primaryKey.name;
    }
  } else {
    // If no primary key, use auto-incrementing id
    schemaString = '++id';
  }

  // For debugging
  console.log(`Table ${table.name} has ${table.columns.length} columns:`,
    table.columns.map(c => c.name).join(', '));
  console.log(`Table ${table.name} has indexedColumns:`, table.indexedColumns);

  // Add all indexed columns and column names that should be indexed
  const indexedColumns = new Set();

  // Add explicitly indexed columns
  if (Array.isArray(table.indexedColumns)) {
    table.indexedColumns.forEach(col => indexedColumns.add(col));
  }

  // Add columns that should be indexed based on their properties
  table.columns.forEach(col => {
    // Index any columns with special properties
    if (col.isUnique || col.name.endsWith('_id') ||
      col.name === 'email' || col.name === 'username' ||
      col.name === 'phone_number') {
      indexedColumns.add(col.name);
    }
  });

  // Remove the primary key from indexed columns
  if (primaryKey) {
    indexedColumns.delete(primaryKey.name);
  }

  // Convert Set to sorted array for consistent output
  const sortedIndexedColumns = Array.from(indexedColumns).sort();

  if (sortedIndexedColumns.length > 0) {
    schemaString += ', ' + sortedIndexedColumns.join(', ');
  }

  return schemaString;
};

/**
 * Generate a Dexie database class (without interfaces)
 */
const generateDexieDatabaseClass = (versions) => {
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
  versions.forEach(version => {
    output += `    // v${version.version} migration\n`;
    output += `    this.version(${version.version}).stores({\n`;

    // Add all tables for this version
    version.tables.forEach((table, i) => {
      const isLast = i === version.tables.length - 1;
      const schemaString = generateDexieSchemaString(table);
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
};

/**
 * Generate Dexie schema structure for all versions
 */
const generateDexieMigrationArray = (versions) => {
  let output = `// Auto-generated Dexie.js database class from SQLite migrations\n`;
  output += `// Generated on ${new Date().toISOString()}\n\n`;

  // Import Dexie for TypeScript types
  output += `import Dexie from 'dexie';\n\n`;

  // Add database class that directly uses the versions
  if (versions.length > 0) {
    output += generateDexieDatabaseClass(versions);
  }

  return output;
};

/**
 * Process SQL migration files and generate Dexie.js migration array
 */
function generateDexieMigrationFromDir(directoryPath, outputPath, pattern = /^V\d+__.+\.sql$/) {
  try {
    // Check if directory exists
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
      console.error(`Error: ${directoryPath} is not a valid directory.`);
      return;
    }

    console.log(`Processing migration files in ${directoryPath}...`);

    // Get all SQL files in the directory that match the pattern
    const files = fs.readdirSync(directoryPath)
      .filter(file => pattern.test(file))
      .sort(); // Sort to process in version order

    if (files.length === 0) {
      console.error(`No migration files matching the pattern ${pattern} found in ${directoryPath}.`);
      return;
    }

    console.log(`Found ${files.length} migration files.`);

    // Parse each file and extract tables and alterations
    const parsedFiles = [];

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      const version = extractVersionFromFileName(file);

      if (!version) {
        console.warn(`Warning: Could not extract version number from ${file}, skipping.`);
        return;
      }

      console.log(`Processing: ${file} (version ${version})`);

      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Parse CREATE TABLE statements
      const tables = parseCreateTableStatements(sqlContent, file);

      // Parse ALTER TABLE statements and get alterations
      const alterations = parseAlterTableStatements(sqlContent, tables, file);

      parsedFiles.push({
        version,
        tables,
        alterations
      });
    });

    // Group tables by version
    const versions = groupTablesByVersion(parsedFiles);

    // Output some debug information
    versions.forEach((version, index) => {
      console.log(`\nVersion ${version.version} has ${version.tables.length} tables:`);
      version.tables.forEach(table => {
        console.log(`- ${table.name} with columns: ${table.columns.map(c => c.name).join(', ')}`);
      });
    });

    // Generate Dexie migration array
    const migrationContent = generateDexieMigrationArray(versions);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output file
    fs.writeFileSync(outputPath, migrationContent);

    console.log(`\nSuccessfully generated Dexie migration versions.`);
    console.log(`Found ${versions.length} schema versions.`);
    console.log(`Output written to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating Dexie migrations:', error);
  }
}

/**
 * Process a single SQL file and generate Dexie.js migration
 */
function generateDexieMigrationFromFile(sqlFilePath, outputPath) {
  try {
    // Check if file exists
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Error: ${sqlFilePath} does not exist.`);
      return;
    }

    console.log(`Processing file: ${sqlFilePath}`);

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const fileName = path.basename(sqlFilePath);

    // Parse CREATE TABLE statements
    const tables = parseCreateTableStatements(sqlContent, fileName);

    // Parse ALTER TABLE statements
    const alterations = parseAlterTableStatements(sqlContent, tables, fileName);

    // Create a single version with all tables
    const versions = [
      {
        version: 1,
        tables
      }
    ];

    // Generate Dexie migration array
    const migrationContent = generateDexieMigrationArray(versions);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output file
    fs.writeFileSync(outputPath, migrationContent);

    console.log(`\nSuccessfully generated Dexie migration version.`);
    console.log(`Generated schema for ${tables.length} tables.`);
    console.log(`Output written to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating Dexie migration:', error);
  }
}

// Export functions for use as a module
module.exports = {
  generateDexieMigrationFromDir,
  generateDexieMigrationFromFile
};

// Command-line interface
if (require.main === module) {
  const args = process.argv.slice(2);

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
