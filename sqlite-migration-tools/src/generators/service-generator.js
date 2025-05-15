const fs = require('fs');
const path = require('path');
const utils = require('../utils');

/**
 * Generate a TypeScript service file for database access
 * @param {string} modelName The model name (pascal case)
 * @param {object} tableInfo Table information from the SQL parser
 * @param {string} outputPath Path where the service file will be written
 * @returns {string} Generated service content
 */
function generateServiceContent(modelName, tableInfo, outputPath) {
  const tableName = tableInfo.name;
  const interfaceName = utils.tableNameToInterfaceName(tableName);
  const tableInterfaceName = `${interfaceName}Table`;
  const serviceClassName = `${interfaceName}Service`;
  const fileName = utils.interfaceNameToFileName(interfaceName);

  // Get list of fields for mapping between model and table
  const fields = tableInfo.columns.map(col => {
    // Convert snake_case to camelCase for JS properties
    const camelCaseName = col.name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    return {
      name: col.name,
      camelCase: camelCaseName,
      type: col.tsType,
      isPrimaryKey: col.isPrimaryKey,
      isNullable: col.isNullable
    };
  });

  // Determine the primary key field
  const primaryKey = fields.find(f => f.isPrimaryKey) || { name: 'id', camelCase: 'id', type: 'number' };

  // Create the content
  let output = `// Auto-generated TypeScript service for the ${tableName} table\n`;
  output += `// Generated on ${new Date().toISOString()}\n`;
  if (tableInfo.originalFile) {
    output += `// Originally defined in: ${tableInfo.originalFile}\n`;
  }
  output += `\n`;

  output += `import { Injectable } from '@angular/core';\n`;
  output += `import { DatabaseService } from './database.service';\n`;
  output += `import { ${interfaceName}, ${tableInterfaceName} } from '../models/${fileName}';\n\n`;

  output += `@Injectable({\n`;
  output += `  providedIn: 'root'\n`;
  output += `})\n`;
  output += `export class ${serviceClassName} {\n`;
  output += `  constructor(private databaseService: DatabaseService) {}\n\n`;

  // CREATE method
  output += `  /**\n`;
  output += `   * Create a new ${interfaceName.toLowerCase()}\n`;
  output += `   */\n`;
  output += `  async create(${interfaceName.toLowerCase()}: ${interfaceName}): Promise<${primaryKey.type} | undefined> {\n`;
  output += `    const now = new Date().toISOString();\n`;
  output += `    const entityToInsert = {\n`;
  output += `      ...${interfaceName.toLowerCase()},\n`;
  output += `      createdAt: now,\n`;
  output += `      updatedAt: now\n`;
  output += `    };\n\n`;

  output += `    try {\n`;
  output += `      if (this.databaseService.isNativeDatabase()) {\n`;
  output += `        // Convert model to snake_case for SQL database\n`;
  output += `        const tableRow: ${tableInterfaceName} = {\n`;

  // Generate table row mapping for SQLite
  fields.forEach(field => {
    if (field.name === field.camelCase) {
      output += `          ${field.name}: entityToInsert.${field.camelCase}${(field.name === primaryKey.name) ? ' || 0' : ''},\n`;
    } else {
      output += `          ${field.name}: entityToInsert.${field.camelCase},\n`;
    }
  });

  output += `        };\n\n`;
  output += `        // SQLite implementation\n`;
  output += `        const result = await this.databaseService.executeCommand(\n`;
  output += `          \`INSERT INTO ${tableName} (\n`;

  // Generate insert fields (skipping primary key if auto-increment)
  const insertFields = fields.filter(f => !f.isPrimaryKey || !tableInfo.columns.find(col => col.name === f.name)?.isAutoIncrement);
  output += insertFields.map(f => `            ${f.name}`).join(',\n');
  output += `\n          ) VALUES (${insertFields.map(() => '?').join(', ')})\`,\n`;
  output += `          [\n`;

  // Generate values array
  insertFields.forEach((field, index) => {
    const isLast = index === insertFields.length - 1;
    const nullCheck = field.isNullable ? ` || null` : '';
    output += `            tableRow.${field.name}${nullCheck}${isLast ? '' : ','}\n`;
  });

  output += `          ]\n`;
  output += `        );\n\n`;
  output += `        return result.changes?.lastId;\n`;
  output += `      } else {\n`;
  output += `        // Dexie implementation\n`;
  output += `        const dexie = this.databaseService.getDexieInstance();\n`;
  output += `        if (!dexie) throw new Error('Dexie database not initialized');\n\n`;

  output += `        // Convert model to table format for storage\n`;
  output += `        const tableRow: ${tableInterfaceName} = {\n`;

  // Generate table row mapping for Dexie
  fields.forEach(field => {
    if (field.name === field.camelCase) {
      output += `          ${field.name}: entityToInsert.${field.camelCase}${field.name === primaryKey.name ? ' || 0' : ''},\n`;
    } else {
      output += `          ${field.name}: entityToInsert.${field.camelCase},\n`;
    }
  });

  output += `        };\n\n`;
  output += `        const id = await dexie.${tableName}.add(tableRow);\n`;
  output += `        return id;\n`;
  output += `      }\n`;
  output += `    } catch (error) {\n`;
  output += `      console.error('Error creating ${interfaceName.toLowerCase()}:', error);\n`;
  output += `      throw error;\n`;
  output += `    }\n`;
  output += `  }\n\n`;

  // GET BY ID method
  output += `  /**\n`;
  output += `   * Get ${interfaceName.toLowerCase()} by ID\n`;
  output += `   */\n`;
  output += `  async getById(id: ${primaryKey.type}): Promise<${interfaceName} | null> {\n`;
  output += `    try {\n`;
  output += `      if (this.databaseService.isNativeDatabase()) {\n`;
  output += `        // SQLite implementation\n`;
  output += `        const result = await this.databaseService.executeQuery(\n`;
  output += `          'SELECT * FROM ${tableName} WHERE ${primaryKey.name} = ?',\n`;
  output += `          [id]\n`;
  output += `        );\n`;
  output += `        \n`;
  output += `        if (result.values && result.values.length > 0) {\n`;
  output += `          return this.mapTableToModel(result.values[0]);\n`;
  output += `        }\n`;
  output += `        return null;\n`;
  output += `      } else {\n`;
  output += `        // Dexie implementation\n`;
  output += `        const dexie = this.databaseService.getDexieInstance();\n`;
  output += `        if (!dexie) throw new Error('Dexie database not initialized');\n`;
  output += `        \n`;
  output += `        const entity = await dexie.${tableName}.get(id);\n`;
  output += `        return entity ? this.mapTableToModel(entity) : null;\n`;
  output += `      }\n`;
  output += `    } catch (error) {\n`;
  output += `      console.error(\`Error getting ${interfaceName.toLowerCase()} by ID \${id}:\`, error);\n`;
  output += `      throw error;\n`;
  output += `    }\n`;
  output += `  }\n\n`;

  // GET ALL method
  output += `  /**\n`;
  output += `   * Get all ${tableName}\n`;
  output += `   */\n`;
  output += `  async getAll(): Promise<${interfaceName}[]> {\n`;
  output += `    try {\n`;
  output += `      if (this.databaseService.isNativeDatabase()) {\n`;
  output += `        // SQLite implementation\n`;
  output += `        const result = await this.databaseService.executeQuery('SELECT * FROM ${tableName}');\n`;
  output += `        \n`;
  output += `        if (result.values && result.values.length > 0) {\n`;
  output += `          return result.values.map((entity: ${tableInterfaceName}) => this.mapTableToModel(entity));\n`;
  output += `        }\n`;
  output += `        return [];\n`;
  output += `      } else {\n`;
  output += `        // Dexie implementation\n`;
  output += `        const dexie = this.databaseService.getDexieInstance();\n`;
  output += `        if (!dexie) throw new Error('Dexie database not initialized');\n`;
  output += `        \n`;
  output += `        const entities = await dexie.${tableName}.toArray();\n`;
  output += `        return entities.map((entity: ${tableInterfaceName}) => this.mapTableToModel(entity));\n`;
  output += `      }\n`;
  output += `    } catch (error) {\n`;
  output += `      console.error('Error getting all ${tableName}:', error);\n`;
  output += `      throw error;\n`;
  output += `    }\n`;
  output += `  }\n\n`;

  // UPDATE method
  output += `  /**\n`;
  output += `   * Update ${interfaceName.toLowerCase()}\n`;
  output += `   */\n`;
  output += `  async update(id: ${primaryKey.type}, updates: Partial<${interfaceName}>): Promise<boolean> {\n`;
  output += `    try {\n`;
  output += `      const now = new Date().toISOString();\n`;
  output += `      const updatedEntity = {\n`;
  output += `        ...updates,\n`;
  output += `        updatedAt: now\n`;
  output += `      };\n\n`;

  output += `      if (this.databaseService.isNativeDatabase()) {\n`;
  output += `        // Dynamically build the update query based on the provided fields\n`;
  output += `        const updateFields: string[] = [];\n`;
  output += `        const updateValues: any[] = [];\n\n`;

  output += `        // Map of camelCase property names to database snake_case column names\n`;
  output += `        const fieldMappings: Record<string, string> = {\n`;

  // Create field mappings
  fields.forEach(field => {
    output += `          ${field.camelCase}: '${field.name}',\n`;
  });

  output += `        };\n\n`;

  output += `        for (const [key, value] of Object.entries(updatedEntity)) {\n`;
  output += `          if (key === '${primaryKey.camelCase}') continue; // Skip the ID field\n\n`;
  output += `          // Get the snake_case column name or convert camelCase to snake_case\n`;
  output += `          const sqlKey = fieldMappings[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();\n`;
  output += `          updateFields.push(\`\${sqlKey} = ?\`);\n`;
  output += `          updateValues.push(value);\n`;
  output += `        }\n\n`;

  output += `        // Add the WHERE clause parameter\n`;
  output += `        updateValues.push(id);\n\n`;

  output += `        // Execute the update query\n`;
  output += `        const result = await this.databaseService.executeCommand(\n`;
  output += `          \`UPDATE ${tableName} SET \${updateFields.join(', ')} WHERE ${primaryKey.name} = ?\`,\n`;
  output += `          updateValues\n`;
  output += `        );\n\n`;

  output += `        return result.changes?.changes > 0;\n`;
  output += `      } else {\n`;
  output += `        // Dexie implementation\n`;
  output += `        const dexie = this.databaseService.getDexieInstance();\n`;
  output += `        if (!dexie) throw new Error('Dexie database not initialized');\n\n`;

  output += `        // Map of camelCase property names to database snake_case column names\n`;
  output += `        const fieldMappings: Record<string, string> = {\n`;

  // Create field mappings
  fields.forEach(field => {
    output += `          ${field.camelCase}: '${field.name}',\n`;
  });

  output += `        };\n\n`;

  output += `        // Transform to snake_case for consistent field names\n`;
  output += `        const dexieUpdates: any = {};\n`;
  output += `        for (const [key, value] of Object.entries(updatedEntity)) {\n`;
  output += `          if (key === '${primaryKey.camelCase}') continue; // Skip the ID\n\n`;
  output += `          // Get the snake_case column name or convert camelCase to snake_case\n`;
  output += `          const dbKey = fieldMappings[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();\n`;
  output += `          dexieUpdates[dbKey] = value;\n`;
  output += `        }\n\n`;

  output += `        // Update the record\n`;
  output += `        await dexie.${tableName}.update(id, dexieUpdates);\n`;
  output += `        return true;\n`;
  output += `      }\n`;
  output += `    } catch (error) {\n`;
  output += `      console.error(\`Error updating ${interfaceName.toLowerCase()} \${id}:\`, error);\n`;
  output += `      throw error;\n`;
  output += `    }\n`;
  output += `  }\n\n`;

  // DELETE method
  output += `  /**\n`;
  output += `   * Delete ${interfaceName.toLowerCase()}\n`;
  output += `   */\n`;
  output += `  async delete(id: ${primaryKey.type}): Promise<boolean> {\n`;
  output += `    try {\n`;
  output += `      if (this.databaseService.isNativeDatabase()) {\n`;
  output += `        // SQLite implementation\n`;
  output += `        const result = await this.databaseService.executeCommand(\n`;
  output += `          'DELETE FROM ${tableName} WHERE ${primaryKey.name} = ?',\n`;
  output += `          [id]\n`;
  output += `        );\n`;
  output += `        \n`;
  output += `        return result.changes?.changes > 0;\n`;
  output += `      } else {\n`;
  output += `        // Dexie implementation\n`;
  output += `        const dexie = this.databaseService.getDexieInstance();\n`;
  output += `        if (!dexie) throw new Error('Dexie database not initialized');\n`;
  output += `        \n`;
  output += `        await dexie.${tableName}.delete(id);\n`;
  output += `        return true;\n`;
  output += `      }\n`;
  output += `    } catch (error) {\n`;
  output += `      console.error(\`Error deleting ${interfaceName.toLowerCase()} \${id}:\`, error);\n`;
  output += `      throw error;\n`;
  output += `    }\n`;
  output += `  }\n\n`;

  // Map method
  output += `  /**\n`;
  output += `   * Map database entity object to model\n`;
  output += `   */\n`;
  output += `  private mapTableToModel(tableRow: ${tableInterfaceName}): ${interfaceName} {\n`;
  output += `    return {\n`;

  // Create mapping from table (snake_case) to model (camelCase)
  fields.forEach(field => {
    if (field.name === field.camelCase) {
      output += `      ${field.camelCase}: tableRow.${field.name},\n`;
    } else {
      output += `      ${field.camelCase}: tableRow.${field.name},\n`;
    }
  });

  output += `    };\n`;
  output += `  }\n`;
  output += `}\n`;

  return output;
}

/**
 * Generate TypeScript service files for each table in the schema
 * @param {object} schema Schema information containing tables
 * @param {string} outputDir Path to the output directory for generated files
 * @returns {void}
 */
function generateServices(schema, outputDir) {
  if (!schema || !schema.tables || Object.keys(schema.tables).length === 0) {
    console.error('No tables found in schema');
    return;
  }

  // Ensure output directory exists
  utils.ensureDir(outputDir);

  // Generate a service file for each table
  Object.values(schema.tables).forEach(table => {
    const interfaceName = utils.tableNameToInterfaceName(table.name);
    const fileName = utils.interfaceNameToFileName(interfaceName);
    const filePath = path.join(outputDir, `${fileName}.service.ts`);

    const serviceContent = generateServiceContent(interfaceName, table, filePath);

    // Write the file
    if (utils.writeToFile(filePath, serviceContent)) {
      console.log(`Generated service for ${table.name} -> ${filePath}`);
    }
  });

  console.log(`\nSuccessfully generated service files in ${outputDir}`);
}

/**
 * Process a directory of migration files and generate service files
 * @param {string} directoryPath Path to the directory containing migration files
 * @param {string} outputDir Path to the output directory for generated files
 * @param {RegExp} pattern Regular expression pattern to match migration files
 * @returns {void}
 */
function processMigrationDirectoryForServices(directoryPath, outputDir, pattern = /^V\d+__.+\.sql$/) {
  try {
    // Check if input directory exists
    if (!utils.checkDirExists(directoryPath)) {
      console.error(`Error: ${directoryPath} is not a valid directory.`);
      return;
    }

    // Create the output directory if it doesn't exist
    if (!utils.ensureDir(outputDir)) {
      console.error(`Error: Could not create output directory ${outputDir}.`);
      return;
    }

    console.log(`Processing migration files in ${directoryPath}...`);

    // Get all SQL files in the directory
    const files = utils.getSqlFilesInDirectory(directoryPath, pattern);

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

      const sqlContent = utils.readSqlFile(filePath);
      if (!sqlContent) return;

      // First, parse CREATE TABLE statements
      const { tables, enums } = utils.parseCreateTableStatements(sqlContent, file);

      // Add tables to schema
      tables.forEach(table => {
        // If table already exists, this means it's being recreated or modified
        // For simplicity, we'll just replace it
        schemaInfo.tables[table.name] = table;
      });

      // Add enums
      schemaInfo.enums.push(...enums);

      // Then, parse ALTER TABLE statements to update existing tables
      utils.parseAlterTableStatements(sqlContent, schemaInfo, file);
    });

    // Generate service files
    generateServices(schemaInfo, outputDir);

  } catch (error) {
    console.error('Error processing migration directory for services:', error);
  }
}

/**
 * Process a single migration file and generate service files
 * @param {string} sqlFilePath Path to the SQL file
 * @param {string} outputDir Path to the output directory for generated files
 * @returns {void}
 */
function processFileForServices(sqlFilePath, outputDir) {
  try {
    const sqlContent = utils.readSqlFile(sqlFilePath);
    if (!sqlContent) return;

    console.log(`Processing file: ${sqlFilePath}`);

    // Create the output directory if it doesn't exist
    if (!utils.ensureDir(outputDir)) {
      console.error(`Error: Could not create output directory ${outputDir}.`);
      return;
    }

    const fileName = path.basename(sqlFilePath);

    // Initialize schema info
    const schemaInfo = {
      tables: {},
      enums: []
    };

    // Parse CREATE TABLE statements
    const { tables, enums } = utils.parseCreateTableStatements(sqlContent, fileName);

    // Add tables to schema
    tables.forEach(table => {
      schemaInfo.tables[table.name] = table;
    });

    // Add enums
    schemaInfo.enums.push(...enums);

    // Parse ALTER TABLE statements
    utils.parseAlterTableStatements(sqlContent, schemaInfo, fileName);

    // Generate service files
    generateServices(schemaInfo, outputDir);

  } catch (error) {
    console.error('Error processing file for services:', error);
  }
}

/**
 * Command-line interface handler
 * @param {Array} args Command-line arguments
 */
function handleCommandLine(args) {
  if (args.length < 2) {
    console.log('SQLite Migration to Service Generator');
    console.log('=================================');
    console.log('');
    console.log('Usage:');
    console.log('  For a single file:');
    console.log('    node sqlite-to-services.js --file <input-sql-file> <output-directory>');
    console.log('');
    console.log('  For a directory of migration files:');
    console.log('    node sqlite-to-services.js --dir <migration-directory> <output-directory>');
    console.log('');
    console.log('Examples:');
    console.log('  node sqlite-to-services.js --file database.sql ./src/app/core/database/services');
    console.log('  node sqlite-to-services.js --dir ./migrations ./src/app/core/database/services');
    process.exit(1);
  }

  const mode = args[0];

  if (mode === '--file' && args.length >= 3) {
    const inputFile = args[1];
    const outputDir = args[2];
    processFileForServices(inputFile, outputDir);
  } else if (mode === '--dir' && args.length >= 3) {
    const inputDir = args[1];
    const outputDir = args[2];
    processMigrationDirectoryForServices(inputDir, outputDir);
  } else {
    console.error('Invalid arguments. Use --file or --dir mode.');
    process.exit(1);
  }
}

// Export functions for use as a module
module.exports = {
  processMigrationDirectoryForServices,
  processFileForServices,
  handleCommandLine
};

// Command-line interface
if (require.main === module) {
  handleCommandLine(process.argv.slice(2));
}
