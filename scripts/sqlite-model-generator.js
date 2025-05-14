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
  const enums = [];
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

    // Check for enum-like tables (simple tables with id and name/value columns)
    if (columns.length === 2 &&
      columns.some(col => col.name.toLowerCase() === 'id' && col.isPrimaryKey) &&
      columns.some(col => ['name', 'value', 'label', 'code'].includes(col.name.toLowerCase()))) {
      const nameColumn = columns.find(col =>
        ['name', 'value', 'label', 'code'].includes(col.name.toLowerCase())
      );

      // Add to enums
      enums.push({
        name: tableName,
        valueCol: nameColumn ? nameColumn.name : 'name'
      });
    }

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
      originalFile: fileName
    });
  }

  return { tables, enums };
};

/**
 * Parse ALTER TABLE statements to update existing schema
 */
const parseAlterTableStatements = (sqlContent, existingSchema, fileName) => {
  // Pattern for ALTER TABLE ADD COLUMN statements
  const addColumnRegex = /ALTER\s+TABLE\s+["'`]?(\w+)["'`]?\s+ADD(?:\s+COLUMN)?\s+["'`]?(\w+)["'`]?\s+([^;]+)/gmi;

  let match;
  while ((match = addColumnRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const columnName = match[2];
    const columnDef = match[3].trim();

    // Skip if the table doesn't exist in our schema
    if (!existingSchema.tables[tableName]) {
      console.warn(`Warning: ALTER TABLE references non-existent table "${tableName}" in file: ${fileName}`);
      continue;
    }

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

    // Add the new column to the table's schema
    existingSchema.tables[tableName].columns.push({
      name: columnName,
      sqlType: sqlType,
      tsType: tsType,
      isPrimaryKey: isPrimaryKey,
      isNullable: !isNotNull && !isPrimaryKey,
      isUnique: isUnique,
      defaultValue: defaultValue
    });

    // Update the originalFile if not set
    if (!existingSchema.tables[tableName].originalFile) {
      existingSchema.tables[tableName].originalFile = fileName;
    }
  }
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
 * Get file name from interface name
 */
const interfaceNameToFileName = (interfaceName) => {
  // Convert PascalCase to kebab-case
  return interfaceName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
};

/**
 * Generate TypeScript interface for a single table
 */
const generateTypeScriptModelForTable = (table, schema) => {
  let output = '';

  // Header
  output += `// Auto-generated TypeScript model for the ${table.name} table\n`;
  output += `// Generated on ${new Date().toISOString()}\n`;
  if (table.originalFile) {
    output += `// Originally defined in: ${table.originalFile}\n`;
  }
  output += '\n';

  // Import related models
  const imports = [];

  table.foreignKeys.forEach(fk => {
    const refInterfaceName = tableNameToInterfaceName(fk.referenceTable);

    // Only add import if the table actually exists in our schema
    // and it's not self-referencing
    if (schema.tables[fk.referenceTable] && fk.referenceTable !== table.name) {
      imports.push(`import { ${refInterfaceName} } from './${interfaceNameToFileName(refInterfaceName)}';`);
    }
  });

  // Add imports at the top if needed
  if (imports.length > 0) {
    output += imports.join('\n') + '\n\n';
  }

  // Interface documentation
  output += `/**\n * Interface for the ${table.name} table\n */\n`;

  // Interface definition
  const interfaceName = tableNameToInterfaceName(table.name);
  output += `export interface ${interfaceName} {\n`;

  // Properties
  table.columns.forEach(column => {
    const optionalFlag = column.isNullable ? '?' : '';
    const commentParts = [];

    if (column.isPrimaryKey) commentParts.push('Primary Key');
    if (column.isAutoIncrement) commentParts.push('Auto Increment');
    if (column.isUnique) commentParts.push('Unique');
    if (column.defaultValue) commentParts.push(`Default: ${column.defaultValue}`);

    // Add comments if we have any
    if (commentParts.length > 0) {
      output += `  /** ${commentParts.join(', ')} */\n`;
    }

    // Add the property
    output += `  ${column.name}${optionalFlag}: ${column.tsType};\n`;
  });

  // Add foreign key comments
  table.foreignKeys.forEach(fk => {
    const refInterfaceName = tableNameToInterfaceName(fk.referenceTable);

    output += `\n  /**\n   * Relation to ${fk.referenceTable}\n   * @see ${refInterfaceName}\n   */\n`;
    output += `  // ${fk.column} references ${fk.referenceTable}(${fk.referenceColumn})\n`;
  });

  output += `}\n`;

  return output;
};

/**
 * Generate index file that exports all models
 */
const generateIndexFile = (schema) => {
  let output = '// Auto-generated index file for SQLite migration models\n';
  output += `// Generated on ${new Date().toISOString()}\n\n`;

  // Add exports for all tables
  Object.values(schema.tables).forEach(table => {
    const interfaceName = tableNameToInterfaceName(table.name);
    const fileName = interfaceNameToFileName(interfaceName);
    output += `export { ${interfaceName} } from './${fileName}';\n`;
  });

  // Add exports for all enums
  schema.enums.forEach(enumTable => {
    const enumName = enumTable.name.replace(/s$/, ''); // Remove trailing 's' if present
    const pascalCaseName = enumName.charAt(0).toUpperCase() + enumName.slice(1);
    const fileName = interfaceNameToFileName(pascalCaseName);
    output += `export { ${pascalCaseName} } from './${fileName}';\n`;
  });

  return output;
};

/**
 * Generate TypeScript enum file
 */
const generateEnumFile = (enumTable) => {
  const enumName = enumTable.name.replace(/s$/, ''); // Remove trailing 's' if present
  const pascalCaseName = enumName.charAt(0).toUpperCase() + enumName.slice(1);

  let output = `// Auto-generated TypeScript enum for ${enumTable.name} table\n`;
  output += `// Generated on ${new Date().toISOString()}\n\n`;

  output += `/**\n * Enum for the ${enumTable.name} table\n */\n`;
  output += `export enum ${pascalCaseName} {\n`;
  output += `  // Note: You'll need to fill in enum values based on your actual data\n`;
  output += `  // Example:\n`;
  output += `  // VALUE_ONE = 'value_one',\n`;
  output += `  // VALUE_TWO = 'value_two',\n`;
  output += `}\n`;

  return output;
};

/**
 * Process a directory of migration files and generate separate model files
 */
function processMigrationDirectory(directoryPath, outputDir, pattern = /^V\d+__.+\.sql$/) {
  try {
    // Check if input directory exists
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
      console.error(`Error: ${directoryPath} is not a valid directory.`);
      return;
    }

    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    } else if (!fs.statSync(outputDir).isDirectory()) {
      console.error(`Error: ${outputDir} exists but is not a directory.`);
      return;
    }

    console.log(`Processing migration files in ${directoryPath}...`);

    // Get all SQL files in the directory
    const files = fs.readdirSync(directoryPath)
      .filter(file => pattern.test(file))
      .sort(); // Sort to process in version order

    if (files.length === 0) {
      console.error(`No migration files matching the pattern ${pattern} found in ${directoryPath}.`);
      return;
    }

    console.log(`Found ${files.length} migration files.`);

    // Initialize schema info
    const schemaInfo = {
      tables: {},
      enums: []
    };

    // Process each file in order
    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      console.log(`Processing: ${file}`);

      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // First, parse CREATE TABLE statements
      const { tables, enums } = parseCreateTableStatements(sqlContent, file);

      // Add tables to schema
      tables.forEach(table => {
        // If table already exists, this means it's being recreated or modified
        // For simplicity, we'll just replace it
        schemaInfo.tables[table.name] = table;
      });

      // Add enums
      schemaInfo.enums.push(...enums);

      // Then, parse ALTER TABLE statements to update existing tables
      parseAlterTableStatements(sqlContent, schemaInfo, file);
    });

    // Generate a file for each table
    Object.values(schemaInfo.tables).forEach(table => {
      const interfaceName = tableNameToInterfaceName(table.name);
      const fileName = interfaceNameToFileName(interfaceName);
      const filePath = path.join(outputDir, `${fileName}.ts`);

      const fileContent = generateTypeScriptModelForTable(table, schemaInfo);
      fs.writeFileSync(filePath, fileContent);
      console.log(`Generated model for ${table.name} -> ${filePath}`);
    });

    // Generate a file for each enum
    schemaInfo.enums.forEach(enumTable => {
      const enumName = enumTable.name.replace(/s$/, ''); // Remove trailing 's' if present
      const pascalCaseName = enumName.charAt(0).toUpperCase() + enumName.slice(1);
      const fileName = interfaceNameToFileName(pascalCaseName);
      const filePath = path.join(outputDir, `${fileName}.ts`);

      const fileContent = generateEnumFile(enumTable);
      fs.writeFileSync(filePath, fileContent);
      console.log(`Generated enum for ${enumTable.name} -> ${filePath}`);
    });

    // Generate an index file
    const indexFilePath = path.join(outputDir, 'index.ts');
    const indexFileContent = generateIndexFile(schemaInfo);
    fs.writeFileSync(indexFilePath, indexFileContent);
    console.log(`Generated index file -> ${indexFilePath}`);

    console.log(`\nSuccessfully generated TypeScript models.`);
    console.log(`Generated ${Object.keys(schemaInfo.tables).length} table models.`);
    console.log(`Generated ${schemaInfo.enums.length} enum models.`);
  } catch (error) {
    console.error('Error processing migration directory:', error);
  }
}

/**
 * Process a single migration file and output separate model files
 */
function processFile(sqlFilePath, outputDir) {
  try {
    console.log(`Processing file: ${sqlFilePath}`);

    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    } else if (!fs.statSync(outputDir).isDirectory()) {
      console.error(`Error: ${outputDir} exists but is not a directory.`);
      return;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const fileName = path.basename(sqlFilePath);

    // Initialize schema info
    const schemaInfo = {
      tables: {},
      enums: []
    };

    // Parse CREATE TABLE statements
    const { tables, enums } = parseCreateTableStatements(sqlContent, fileName);

    // Add tables to schema
    tables.forEach(table => {
      schemaInfo.tables[table.name] = table;
    });

    // Add enums
    schemaInfo.enums.push(...enums);

    // Parse ALTER TABLE statements
    parseAlterTableStatements(sqlContent, schemaInfo, fileName);

    // Generate a file for each table
    Object.values(schemaInfo.tables).forEach(table => {
      const interfaceName = tableNameToInterfaceName(table.name);
      const fileName = interfaceNameToFileName(interfaceName);
      const filePath = path.join(outputDir, `${fileName}.ts`);

      const fileContent = generateTypeScriptModelForTable(table, schemaInfo);
      fs.writeFileSync(filePath, fileContent);
      console.log(`Generated model for ${table.name} -> ${filePath}`);
    });

    // Generate a file for each enum
    schemaInfo.enums.forEach(enumTable => {
      const enumName = enumTable.name.replace(/s$/, ''); // Remove trailing 's' if present
      const pascalCaseName = enumName.charAt(0).toUpperCase() + enumName.slice(1);
      const fileName = interfaceNameToFileName(pascalCaseName);
      const filePath = path.join(outputDir, `${fileName}.ts`);

      const fileContent = generateEnumFile(enumTable);
      fs.writeFileSync(filePath, fileContent);
      console.log(`Generated enum for ${enumTable.name} -> ${filePath}`);
    });

    // Generate an index file
    const indexFilePath = path.join(outputDir, 'index.ts');
    const indexFileContent = generateIndexFile(schemaInfo);
    fs.writeFileSync(indexFilePath, indexFileContent);
    console.log(`Generated index file -> ${indexFilePath}`);

    console.log(`\nSuccessfully generated TypeScript models.`);
    console.log(`Generated ${Object.keys(schemaInfo.tables).length} table models.`);
    console.log(`Generated ${schemaInfo.enums.length} enum models.`);
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

// Export functions for use as a module
module.exports = {
  processMigrationDirectory,
  processFile
};

// Command-line interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('SQLite Migration to TypeScript Generator');
    console.log('======================================');
    console.log('');
    console.log('Usage:');
    console.log('  For a single file:');
    console.log('    node sqlite-to-ts-generator.js --file <input-sql-file> <output-directory>');
    console.log('');
    console.log('  For a directory of migration files:');
    console.log('    node sqlite-to-ts-generator.js --dir <migration-directory> <output-directory>');
    console.log('');
    console.log('Examples:');
    console.log('  node sqlite-to-ts-generator.js --file database.sql ./src/models');
    console.log('  node sqlite-to-ts-generator.js --dir ./migrations ./src/models');
    process.exit(1);
  }

  const mode = args[0];

  if (mode === '--file' && args.length >= 3) {
    const inputFile = args[1];
    const outputDir = args[2];
    processFile(inputFile, outputDir);
  } else if (mode === '--dir' && args.length >= 3) {
    const inputDir = args[1];
    const outputDir = args[2];
    processMigrationDirectory(inputDir, outputDir);
  } else {
    console.error('Invalid arguments. Use --file or --dir mode.');
    process.exit(1);
  }
}
