const path = require('path');
const utils = require('../utils');

/**
 * Generate TypeScript method for a named query
 * @param {string} queryName Name of the query
 * @param {string} query SQL query
 * @param {object} queryInfo Analysis of the query
 * @param {string} modelName Name of the model
 * @returns {string} Generated TypeScript method
 */
function generateQueryMethod(queryName, query, queryInfo, modelName, tableNameMap = {}, defaultTableName = '') {
  const interfaceName = modelName;
  const tableInterfaceName = `${modelName}Table`;

  let methodName = queryName;
  let methodParams = '';
  let methodBody = '';
  let returnType = '';
  let paramNames = [];

  // Determine return type based on query type
  if (queryInfo.type === 'select') {
    if (queryInfo.returnsMultiple) {
      returnType = `Promise<${interfaceName}[]>`;
    } else {
      returnType = `Promise<${interfaceName} | null>`;
    }
  } else if (queryInfo.type === 'insert') {
    returnType = 'Promise<number | undefined>';
  } else {
    returnType = 'Promise<boolean>';
  }

  // Special case for COUNT or aggregates
  if (queryInfo.type === 'select' && query.toUpperCase().includes('COUNT(')) {
    returnType = 'Promise<any[]>';
  }

  // Build method parameters with better names
  if (queryInfo.namedParams.length > 0) {
    // Use named parameters
    methodParams = queryInfo.namedParams
      .map(param => `${param}: any`)
      .join(', ');
  } else if (queryInfo.positionalParams > 0) {
    // Check if WHERE clause contains columns we can use for naming
    const whereClause = query.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/is);
    if (whereClause) {
      const conditions = whereClause[1].split(/\s+AND\s+/i);
      conditions.forEach(condition => {
        // Try to extract column names from conditions
        const colMatch = condition.match(/(\w+)\s*(?:=|LIKE|>|<|>=|<=|<>|!=)\s*(?:\?|:\w+)/i);
        if (colMatch) {
          paramNames.push(colMatch[1]);
        }
      });
    }

    // Check SET clause for UPDATE queries
    if (queryInfo.type === 'update') {
      const setClause = query.match(/SET\s+(.*?)(?:WHERE|$)/is);
      if (setClause) {
        const setParts = setClause[1].split(',');
        setParts.forEach(part => {
          const colMatch = part.match(/(\w+)\s*=\s*(?:\?|:\w+)/i);
          if (colMatch) {
            paramNames.push(colMatch[1]);
          }
        });
      }
    }

    // If we couldn't determine names from the query, use generic but typed names
    if (paramNames.length < queryInfo.positionalParams) {
      // Fill in remaining parameters with generic names
      for (let i = paramNames.length; i < queryInfo.positionalParams; i++) {
        paramNames.push(`param${i + 1}`);
      }
    }

    methodParams = paramNames
      .map((name, i) => `${name}: any`)
      .join(', ');
  }

  // Build method documentation
  let documentation = `  /**\n`;
  documentation += `   * ${queryName} - Custom query\n`;
  documentation += `   *\n`;
  if (methodParams) {
    documentation += `   * @param ${methodParams.replace(/: any/g, '')} Parameters for the query\n`;
  }
  documentation += `   * @returns ${queryInfo.returnsMultiple ? 'Array of entities' : queryInfo.type === 'select' ? 'Entity or null' : queryInfo.type === 'insert' ? 'ID of inserted record' : 'Success indicator'}\n`;
  documentation += `   */\n`;

  // Build method implementation
  methodBody = `    try {\n`;
  methodBody += `      if (this.databaseService.isNativeDatabase()) {\n`;
  methodBody += `        // SQLite implementation\n`;
  methodBody += `        const result = await this.databaseService.${queryInfo.type === 'select' ? 'executeQuery' : 'executeCommand'}(\n`;
  methodBody += `          \`${query}\`,\n`;

  // Parameters for the query
  if (queryInfo.namedParams.length > 0) {
    methodBody += `          [${queryInfo.namedParams.join(', ')}]\n`;
  } else if (queryInfo.positionalParams > 0) {
    methodBody += `          [${paramNames.join(', ')}]\n`;
  } else {
    methodBody += `          []\n`;
  }

  methodBody += `        );\n\n`;

  // Return based on query type
  if (queryInfo.type === 'select') {
    // Special case for COUNT or aggregates
    if (query.toUpperCase().includes('COUNT(')) {
      methodBody += `        if (result.values && result.values.length > 0) {\n`;
      methodBody += `          return result.values;\n`;
      methodBody += `        }\n`;
      methodBody += `        return [{ total: 0 }];\n`;
    } else if (queryInfo.returnsMultiple) {
      methodBody += `        if (result.values && result.values.length > 0) {\n`;
      methodBody += `          return result.values.map((entity: ${tableInterfaceName}) => this.mapTableToModel(entity));\n`;
      methodBody += `        }\n`;
      methodBody += `        return [];\n`;
    } else {
      methodBody += `        if (result.values && result.values.length > 0) {\n`;
      methodBody += `          return this.mapTableToModel(result.values[0]);\n`;
      methodBody += `        }\n`;
      methodBody += `        return null;\n`;
    }
  } else if (queryInfo.type === 'insert') {
    methodBody += `        return result.changes?.lastId;\n`;
  } else {
    methodBody += `        return result.changes?.changes > 0;\n`;
  }

  methodBody += `      } else {\n`;
  methodBody += `        // Dexie implementation\n`;
  methodBody += `        const dexie = this.databaseService.getDexieInstance();\n`;
  methodBody += `        if (!dexie) throw new Error('Dexie database not initialized');\n\n`;

  // Get the correct table name for Dexie - use the mapped table name or default to the actual schema table
  const dexieTableName = queryInfo.tableName || defaultTableName;

  // Dexie implementation based on query type
  if (queryInfo.type === 'select') {
    // Special case for COUNT or aggregates
    if (query.toUpperCase().includes('COUNT(')) {
      methodBody += `        const count = await dexie.${dexieTableName}.count();\n`;
      methodBody += `        return [{ total: count }];\n`;
    } else {
      // For Dexie, we need to use collection API based on what's in the query
      // This is a simplified approach - in real world, you'd need more sophisticated parsing
      let dexieQuery = '';
      let whereClause = query.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/is);

      if (whereClause) {
        dexieQuery = `dexie.${dexieTableName}`;

        // Try to extract conditions - this is simplified and doesn't handle complex WHERE clauses
        const conditions = whereClause[1].split(/\s+AND\s+/i);
        conditions.forEach((condition, index) => {
          // Try to handle basic equality conditions
          const eqMatch = condition.match(/(\w+)\s*=\s*(?::(\w+)|\?)/i);
          if (eqMatch) {
            const column = eqMatch[1];
            const param = eqMatch[2] || paramNames[index];
            dexieQuery += `.where('${column}').equals(${param})`;
          }
        });

        if (queryInfo.returnsMultiple) {
          dexieQuery += `.toArray()`;
        } else {
          dexieQuery += `.first()`;
        }
      } else {
        // Fallback if we can't parse WHERE clause
        dexieQuery = `dexie.${dexieTableName}.toArray()`;
      }

      if (queryInfo.returnsMultiple) {
        methodBody += `        const entities = await ${dexieQuery};\n`;
        methodBody += `        return entities.map((entity: ${tableInterfaceName}) => this.mapTableToModel(entity));\n`;
      } else {
        methodBody += `        const entity = await ${dexieQuery};\n`;
        methodBody += `        return entity ? this.mapTableToModel(entity) : null;\n`;
      }
    }
  } else {
    // For other operations, warn that translation to Dexie isn't automatic
    methodBody += `        // TODO: Implement Dexie equivalent for this custom query\n`;
    methodBody += `        throw new Error('Custom ${queryInfo.type} operation not implemented for Dexie');\n`;
  }

  methodBody += `      }\n`;
  methodBody += `    } catch (error) {\n`;
  methodBody += `      console.error('Error executing ${queryName}:', error);\n`;
  methodBody += `      throw error;\n`;
  methodBody += `    }\n`;

  return documentation + `  async ${methodName}(${methodParams}): ${returnType} {\n${methodBody}  }\n`;
}

/**
 * Generate a TypeScript service file for database access with custom queries
 * @param {string} modelName The model name (pascal case)
 * @param {object} tableInfo Table information from the SQL parser
 * @param {object} namedQueries Named queries extracted from SQL file
 * @param {string} outputPath Path where the service file will be written
 * @param {object} tableNameMap Mapping between query table names and schema table names
 * @returns {string} Generated service content
 */
function generateServiceContent(modelName, tableInfo, namedQueries, outputPath, tableNameMap = {}) {
  const tableName = tableInfo.name;
  const interfaceName = modelName;
  const tableInterfaceName = `${modelName}Table`;
  const serviceClassName = `${modelName}Service`;
  const fileName = utils.interfaceNameToFileName(interfaceName);

  // Get list of fields for mapping between model and table
  const fields = tableInfo.columns
    .map(col => {
      // Convert snake_case to camelCase for JS properties
      const camelCaseName = col.name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

      return {
        name: col.name,
        camelCase: camelCaseName,
        type: col.tsType,
        isPrimaryKey: col.isPrimaryKey,
        isNullable: col.isNullable
      };
    })
    .filter(field => utils.isValidFieldName(field.name));

  // Track columns referenced in queries but missing from schema
  const missingColumns = new Set();
  const missingColumnToCamelCase = {};

  // Analyze all queries to find missing columns
  Object.entries(namedQueries).forEach(([queryName, query]) => {
    // Basic column extraction from various parts of the query
    let columnMatches = [];

    // Handle SELECT statements
    if (query.toUpperCase().startsWith('SELECT')) {
      // Extract column names from SELECT clause
      const selectClause = query.match(/SELECT\s+(.*?)\s+FROM/i);
      if (selectClause && selectClause[1] !== '*') {
        const selectColumns = selectClause[1].split(',')
          .map(col => col.trim().split(/\s+AS\s+|\s+/i)[0].trim())
          .filter(col => col !== '*');

        // Handle table aliases in columns (e.g., u.name)
        selectColumns.forEach(col => {
          const parts = col.split('.');
          if (parts.length === 2) {
            columnMatches.push(parts[1]); // Add just the column name without alias
          } else if (parts.length === 1 && col !== '*') {
            columnMatches.push(col);
          }
        });
      }
    }

    // Extract column names from WHERE clauses
    const whereClause = query.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/is);
    if (whereClause) {
      const conditions = whereClause[1].split(/\s+AND\s+|\s+OR\s+/i);
      conditions.forEach(condition => {
        const colMatch = condition.match(/(\w+)(?:\.|:|\s)\s*(?:=|LIKE|>|<|>=|<=|<>|!=)/i);
        if (colMatch) {
          columnMatches.push(colMatch[1]);
        }
      });
    }

    // Extract column names from UPDATE and SET clauses
    if (query.toUpperCase().startsWith('UPDATE')) {
      const setClause = query.match(/SET\s+(.*?)(?:WHERE|$)/is);
      if (setClause) {
        const setParts = setClause[1].split(',');
        setParts.forEach(part => {
          const colMatch = part.match(/(\w+)\s*=/i);
          if (colMatch) {
            columnMatches.push(colMatch[1]);
          }
        });
      }
    }

    // Extract column names from ORDER BY clauses
    const orderByClause = query.match(/ORDER\s+BY\s+(.*?)(?:LIMIT|$)/is);
    if (orderByClause) {
      const orderParts = orderByClause[1].split(',');
      orderParts.forEach(part => {
        const colMatch = part.match(/(\w+)(?:\s+ASC|\s+DESC|\s*$)/i);
        if (colMatch) {
          columnMatches.push(colMatch[1]);
        }
      });
    }

    // Filter out SQL functions and special characters from detected columns
    columnMatches = columnMatches.filter(colName => utils.isValidFieldName(colName));

    // Check which columns exist in the schema and which don't
    columnMatches.forEach(colName => {
      const exists = tableInfo.columns.some(col => col.name === colName);
      if (!exists && !missingColumns.has(colName) && utils.isValidFieldName(colName)) {
        missingColumns.add(colName);
        // Store camelCase version for use in generated code
        missingColumnToCamelCase[colName] = colName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      }
    });
  });

  // Log warning about missing columns
  if (missingColumns.size > 0) {
    console.warn(`Warning: The following columns are referenced in queries but missing from the table schema: ${Array.from(missingColumns).join(', ')}`);
    console.warn(`Consider adding these columns to your schema to ensure proper type safety.`);

    // Add missing columns to our fields list with unknown type - but only if they're valid field names
    Array.from(missingColumns).forEach(colName => {
      if (utils.isValidFieldName(colName)) {
        fields.push({
          name: colName,
          camelCase: missingColumnToCamelCase[colName],
          type: 'any', // Use any as we don't know the type
          isPrimaryKey: false,
          isNullable: true
        });
      }
    });
  }

  // Determine the primary key field
  const primaryKey = fields.find(f => f.isPrimaryKey) || { name: 'id', camelCase: 'id', type: 'number' };

  // Create the content
  let output = `// Auto-generated TypeScript service for the ${tableName} table\n`;
  output += `// Generated on ${new Date().toISOString()}\n`;
  if (tableInfo.originalFile) {
    output += `// Originally defined in: ${tableInfo.originalFile}\n`;
  }
  if (Object.keys(namedQueries).length > 0) {
    output += `// Custom queries from SQL files\n`;
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

  // Generate table row mapping for SQLite - ONLY include valid fields
  fields.forEach(field => {
    if (utils.isValidFieldName(field.name)) { // Add this check
      if (field.name === field.camelCase) {
        output += `          ${field.name}: entityToInsert.${field.camelCase}${(field.name === primaryKey.name && field.type === 'number') ? ' || 0' : ''},\n`;
      } else {
        output += `          ${field.name}: entityToInsert.${field.camelCase},\n`;
      }
    }
  });

  output += `        };\n\n`;
  output += `        // SQLite implementation\n`;
  output += `        const result = await this.databaseService.executeCommand(\n`;
  output += `          \`INSERT INTO ${tableName} (\n`;

  // Generate insert fields (skipping primary key if auto-increment and invalid fields)
  const insertFields = fields
    .filter(f => utils.isValidFieldName(f.name)) // Add this filter
    .filter(f => !f.isPrimaryKey || !tableInfo.columns.find(col => col.name === f.name)?.isAutoIncrement);

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

  // Generate table row mapping for Dexie - ONLY include valid fields
  fields.forEach(field => {
    if (utils.isValidFieldName(field.name)) { // Add this check
      if (field.name === field.camelCase) {
        output += `          ${field.name}: entityToInsert.${field.camelCase}${(field.name === primaryKey.name && field.type === 'number') ? ' || 0' : ''},\n`;
      } else {
        output += `          ${field.name}: entityToInsert.${field.camelCase},\n`;
      }
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

  // Create field mappings - ONLY include valid fields
  fields.forEach(field => {
    if (utils.isValidFieldName(field.name)) { // Add this check
      output += `          ${field.camelCase}: '${field.name}',\n`;
    }
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

  // Create field mappings - ONLY include valid fields
  fields.forEach(field => {
    if (utils.isValidFieldName(field.name)) { // Add this check
      output += `          ${field.camelCase}: '${field.name}',\n`;
    }
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

  // Add custom query methods from SQL file
  if (Object.keys(namedQueries).length > 0) {
    output += `  // Custom queries from SQL file\n`;

    // Sort queries alphabetically for consistency
    const sortedQueries = Object.entries(namedQueries).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [queryName, query] of sortedQueries) {
      const queryInfo = utils.analyzeQuery(query);

      // Map table name if needed
      if (queryInfo.tableName && tableNameMap[queryInfo.tableName]) {
        queryInfo.tableName = tableNameMap[queryInfo.tableName];
      } else {
        // If not in the mapping, use the schema table name as default for Dexie
        queryInfo.tableName = tableName;
      }

      // For select queries that don't explicitly have LIMIT 1 but appear to return a single result,
      // adjust the returnsMultiple flag
      if (queryInfo.type === 'select' && queryInfo.returnsMultiple) {
        // These common prefixes usually indicate single-item queries
        if (queryName.startsWith('findBy') || queryName.startsWith('getBy')) {
          queryInfo.returnsMultiple = false;
          console.log(`Adjusted query '${queryName}' to return a single item based on naming convention`);
        }
      }

      output += generateQueryMethod(queryName, query, queryInfo, interfaceName, tableNameMap, tableName) + '\n';
    }
  }

  // Map method
  output += `  /**\n`;
  output += `   * Map database entity object to model\n`;
  output += `   */\n`;
  output += `  private mapTableToModel(tableRow: ${tableInterfaceName}): ${interfaceName} {\n`;
  output += `    // Filter out any undefined fields or SQL functions\n`;
  output += `    const model: any = {};\n\n`;

  // Create mapping from table (snake_case) to model (camelCase)
  // Make sure we're not duplicating fields and handling only valid fields
  const processedFields = new Set();
  fields.forEach(field => {
    // Skip if already processed or not a valid field name
    if (processedFields.has(field.camelCase) || !utils.isValidFieldName(field.name)) {
      return;
    }

    processedFields.add(field.camelCase);

    output += `    if (tableRow.${field.name} !== undefined) {\n`;
    if (field.name === field.camelCase) {
      output += `      model.${field.camelCase} = tableRow.${field.name};\n`;
    } else {
      output += `      model.${field.camelCase} = tableRow.${field.name};\n`;
    }
    output += `    }\n`;
  });

  output += `    return model as ${interfaceName};\n`;
  output += `  }\n`;
  output += `}\n`;

  return output;
}

/**
 * Process a directory of query files and generate service files
 * @param {string} queriesDir Path to directory containing query files
 * @param {string} migrationsDir Path to directory containing migration files
 * @param {string} outputDir Path to output directory for generated services
 * @param {RegExp} pattern Regular expression pattern to match migration files
 */
function processQueryDirectory(queriesDir, migrationsDir, outputDir, pattern = /^V\d+__.+\.sql$/) {
  try {
    // Check if directories exist
    if (!utils.checkDirExists(queriesDir)) {
      console.error(`Error: Queries directory ${queriesDir} is not a valid directory.`);
      return;
    }

    if (!utils.checkDirExists(migrationsDir)) {
      console.error(`Error: Migrations directory ${migrationsDir} is not a valid directory.`);
      return;
    }

    // Create output directory if it doesn't exist
    if (!utils.ensureDir(outputDir)) {
      console.error(`Error: Could not create output directory ${outputDir}.`);
      return;
    }

    console.log(`Processing query files in ${queriesDir}...`);

    // Get all SQL files in the queries directory
    const queryFiles = utils.getSqlFilesInDirectory(queriesDir);

    if (queryFiles.length === 0) {
      console.error(`No SQL files found in ${queriesDir}.`);
      return;
    }

    console.log(`Found ${queryFiles.length} query files.`);

    // Parse migration files to get table definitions
    const schemaInfo = {
      tables: {},
      enums: []
    };

    const migrationFiles = utils.getSqlFilesInDirectory(migrationsDir, pattern);
    console.log(`Found ${migrationFiles.length} migration files.`);

    migrationFiles.forEach(file => {
      const filePath = path.join(migrationsDir, file);
      console.log(`Processing migration file: ${file}`);
      const sqlContent = utils.readSqlFile(filePath);
      if (!sqlContent) return;

      // Parse tables
      const { tables, enums } = utils.parseCreateTableStatements(sqlContent, file);

      // Add tables to schema
      tables.forEach(table => {
        schemaInfo.tables[table.name] = table;
      });

      // Add enums
      schemaInfo.enums.push(...enums);

      // Process ALTER TABLE statements
      utils.parseAlterTableStatements(sqlContent, schemaInfo, file);
    });

    // Create a mapping between query table names and actual schema table names
    const tableNameMap = {};

    // Build all possible variations of table names for matching
    const tableVariations = {};
    Object.keys(schemaInfo.tables).forEach(tableName => {
      // Store original name
      tableVariations[tableName] = tableName;

      // Add singular form if plural
      if (tableName.endsWith('s')) {
        const singularName = tableName.slice(0, -1);
        tableVariations[singularName] = tableName;
      }
      // Add plural form if singular
      else {
        const pluralName = `${tableName}s`;
        tableVariations[pluralName] = tableName;
      }

      // Handle special cases like 'y' -> 'ies'
      if (tableName.endsWith('y')) {
        const pluralIesName = `${tableName.slice(0, -1)}ies`;
        tableVariations[pluralIesName] = tableName;
      }
    });

    console.log('Table name variations:', tableVariations);

    // Scan all query files to build the table name mapping
    queryFiles.forEach(queryFile => {
      const filePath = path.join(queriesDir, queryFile);
      const sqlContent = utils.readSqlFile(filePath);
      if (!sqlContent) return;

      const namedQueries = utils.extractNamedQueries(sqlContent);

      // Extract table names from queries
      Object.values(namedQueries).forEach(query => {
        const queryInfo = utils.analyzeQuery(query);
        if (queryInfo.tableName && queryInfo.tableName.length > 0) {
          // Map the query table name to a schema table name
          if (!tableNameMap[queryInfo.tableName]) {
            const matchedTable = tableVariations[queryInfo.tableName];
            if (matchedTable) {
              tableNameMap[queryInfo.tableName] = matchedTable;
              console.log(`Mapped query table '${queryInfo.tableName}' to schema table '${matchedTable}'`);
            } else {
              console.warn(`Warning: Could not find matching schema table for query table '${queryInfo.tableName}'`);
            }
          }
        }
      });
    });

    // Process each query file
    queryFiles.forEach(queryFile => {
      const filePath = path.join(queriesDir, queryFile);
      console.log(`Processing query file: ${queryFile}`);

      // Extract table name from file name (e.g., user.sql -> user/users)
      const baseTableName = path.basename(queryFile, '.sql');

      // Try to find the table in our schema using the variations map
      let tableInfo = null;
      let tableName = '';

      // First check if the base name matches directly
      if (schemaInfo.tables[baseTableName]) {
        tableInfo = schemaInfo.tables[baseTableName];
        tableName = baseTableName;
      }
      // Then check if it's in our variations map
      else if (tableVariations[baseTableName]) {
        const mappedName = tableVariations[baseTableName];
        tableInfo = schemaInfo.tables[mappedName];
        tableName = mappedName;
      }
      // If still not found, try to extract from queries
      if (!tableInfo) {
        // Read the SQL file content
        const sqlContent = utils.readSqlFile(filePath);
        if (!sqlContent) return;

        // Extract named queries
        const namedQueries = utils.extractNamedQueries(sqlContent);

        // Try to determine the table from the first query
        if (Object.keys(namedQueries).length > 0) {
          const firstQuery = namedQueries[Object.keys(namedQueries)[0]];
          const queryInfo = utils.analyzeQuery(firstQuery);

          // If the query has a table name, try to find it in schema
          if (queryInfo.tableName) {
            // Check direct match
            if (schemaInfo.tables[queryInfo.tableName]) {
              tableInfo = schemaInfo.tables[queryInfo.tableName];
              tableName = queryInfo.tableName;
            }
            // Check mapped table
            else if (tableNameMap[queryInfo.tableName]) {
              const mappedName = tableNameMap[queryInfo.tableName];
              tableInfo = schemaInfo.tables[mappedName];
              tableName = mappedName;
            }
          }
        }
      }

      if (!tableInfo) {
        console.warn(`Warning: Could not find table for query file ${queryFile}. Skipping.`);
        return;
      }

      console.log(`Found table ${tableName} for query file ${queryFile}`);

      // Read the SQL file and extract named queries
      const sqlContent = utils.readSqlFile(filePath);
      if (!sqlContent) return;

      const namedQueries = utils.extractNamedQueries(sqlContent);

      if (Object.keys(namedQueries).length === 0) {
        console.warn(`Warning: No named queries found in ${queryFile}. Skipping.`);
        return;
      }

      console.log(`Found ${Object.keys(namedQueries).length} named queries in ${queryFile}.`);

      // Transform queries to use correct table names
      const processedQueries = {};
      Object.entries(namedQueries).forEach(([queryName, query]) => {
        const queryInfo = utils.analyzeQuery(query);

        // Replace table name in query if it's mapped
        if (queryInfo.tableName && tableNameMap[queryInfo.tableName]) {
          const correctTableName = tableNameMap[queryInfo.tableName];
          const updatedQuery = query.replace(
            new RegExp(`\\b${queryInfo.tableName}\\b`, 'g'),
            correctTableName
          );
          processedQueries[queryName] = updatedQuery;

          // Log the transformation
          if (updatedQuery !== query) {
            console.log(`Transformed query '${queryName}' to use correct table name '${correctTableName}'`);
          } else {
            processedQueries[queryName] = query;
          }
        } else {
          processedQueries[queryName] = query;
        }
      });

      // Generate service file
      const interfaceName = utils.tableNameToInterfaceName(tableName);
      const serviceFileName = `${utils.interfaceNameToFileName(interfaceName)}.service.ts`;
      const outputPath = path.join(outputDir, serviceFileName);

      // Generate service content
      const serviceContent = generateServiceContent(
        interfaceName,
        tableInfo,
        processedQueries,
        outputPath,
        tableNameMap
      );

      // Write the file
      if (utils.writeToFile(outputPath, serviceContent)) {
        console.log(`Generated service for ${tableName} with custom queries -> ${outputPath}`);
      }
    });

    console.log(`\nSuccessfully generated service files with custom queries in ${outputDir}`);
  } catch (error) {
    console.error('Error processing query directory:', error);
  }
}

/**
 * Process a single query file and generate a service file
 * @param {string} queryFilePath Path to the query file
 * @param {string} migrationsDir Path to directory containing migration files
 * @param {string} outputDir Path to output directory for generated services
 * @param {RegExp} pattern Regular expression pattern to match migration files
 */
function processQueryFile(queryFilePath, migrationsDir, outputDir, pattern = /^V\d+__.+\.sql$/) {
  try {
    // Check if file exists
    if (!utils.checkFileExists(queryFilePath)) {
      console.error(`Error: Query file ${queryFilePath} does not exist.`);
      return;
    }

    if (!utils.checkDirExists(migrationsDir)) {
      console.error(`Error: Migrations directory ${migrationsDir} is not a valid directory.`);
      return;
    }

    // Create output directory if it doesn't exist
    if (!utils.ensureDir(outputDir)) {
      console.error(`Error: Could not create output directory ${outputDir}.`);
      return;
    }

    console.log(`Processing query file: ${queryFilePath}`);

    // Parse migration files to get table definitions
    const schemaInfo = {
      tables: {},
      enums: []
    };

    const migrationFiles = utils.getSqlFilesInDirectory(migrationsDir, pattern);

    migrationFiles.forEach(file => {
      const filePath = path.join(migrationsDir, file);
      const sqlContent = utils.readSqlFile(filePath);
      if (!sqlContent) return;

      // Parse tables
      const { tables, enums } = utils.parseCreateTableStatements(sqlContent, file);

      // Add tables to schema
      tables.forEach(table => {
        schemaInfo.tables[table.name] = table;
      });

      // Add enums
      schemaInfo.enums.push(...enums);

      // Process ALTER TABLE statements
      utils.parseAlterTableStatements(sqlContent, schemaInfo, file);
    });

    // Create a mapping between query table names and actual schema table names
    const tableNameMap = {};

    // Build all possible variations of table names for matching
    const tableVariations = {};
    Object.keys(schemaInfo.tables).forEach(tableName => {
      // Store original name
      tableVariations[tableName] = tableName;

      // Add singular form if plural
      if (tableName.endsWith('s')) {
        const singularName = tableName.slice(0, -1);
        tableVariations[singularName] = tableName;
      }
      // Add plural form if singular
      else {
        const pluralName = `${tableName}s`;
        tableVariations[pluralName] = tableName;
      }

      // Handle special cases like 'y' -> 'ies'
      if (tableName.endsWith('y')) {
        const pluralIesName = `${tableName.slice(0, -1)}ies`;
        tableVariations[pluralIesName] = tableName;
      }
    });

    console.log('Table name variations:', tableVariations);

    // Extract table name from file name (e.g., user.sql -> users)
    const queryFileName = path.basename(queryFilePath);
    const baseTableName = path.basename(queryFilePath, '.sql');

    // Try to find the table in our schema using the variations map
    let tableInfo = null;
    let tableName = '';

    // First check if the base name matches directly
    if (schemaInfo.tables[baseTableName]) {
      tableInfo = schemaInfo.tables[baseTableName];
      tableName = baseTableName;
    }
    // Then check if it's in our variations map
    else if (tableVariations[baseTableName]) {
      const mappedName = tableVariations[baseTableName];
      tableInfo = schemaInfo.tables[mappedName];
      tableName = mappedName;
    }

    // If no matching table found, try to extract from queries
    if (!tableInfo) {
      // Read the SQL file content
      const sqlContent = utils.readSqlFile(queryFilePath);
      if (!sqlContent) return;

      // Extract named queries
      const namedQueries = utils.extractNamedQueries(sqlContent);

      // Scan all queries to build the table name mapping
      Object.values(namedQueries).forEach(query => {
        const queryInfo = utils.analyzeQuery(query);
        if (queryInfo.tableName && queryInfo.tableName.length > 0) {
          // Map the query table name to a schema table name
          if (!tableNameMap[queryInfo.tableName]) {
            const matchedTable = tableVariations[queryInfo.tableName];
            if (matchedTable) {
              tableNameMap[queryInfo.tableName] = matchedTable;
              console.log(`Mapped query table '${queryInfo.tableName}' to schema table '${matchedTable}'`);
            } else {
              console.warn(`Warning: Could not find matching schema table for query table '${queryInfo.tableName}'`);
            }
          }
        }
      });

      // Try to determine the table from the first query
      if (Object.keys(namedQueries).length > 0) {
        const firstQuery = namedQueries[Object.keys(namedQueries)[0]];
        const queryInfo = utils.analyzeQuery(firstQuery);

        // If the query has a table name, try to find it in schema
        if (queryInfo.tableName) {
          // Check direct match
          if (schemaInfo.tables[queryInfo.tableName]) {
            tableInfo = schemaInfo.tables[queryInfo.tableName];
            tableName = queryInfo.tableName;
          }
          // Check mapped table
          else if (tableNameMap[queryInfo.tableName]) {
            const mappedName = tableNameMap[queryInfo.tableName];
            tableInfo = schemaInfo.tables[mappedName];
            tableName = mappedName;
          }
        }
      }
    }

    if (!tableInfo) {
      console.error(`Error: Could not find table for query file ${queryFileName}. Please specify table name.`);
      return;
    }

    console.log(`Found table ${tableName} for query file ${queryFileName}`);

    // Read the SQL file and extract named queries
    const sqlContent = utils.readSqlFile(queryFilePath);
    if (!sqlContent) return;

    const namedQueries = utils.extractNamedQueries(sqlContent);

    if (Object.keys(namedQueries).length === 0) {
      console.warn(`Warning: No named queries found in ${queryFileName}. Skipping.`);
      return;
    }

    console.log(`Found ${Object.keys(namedQueries).length} named queries in ${queryFileName}.`);

    // Transform queries to use correct table names
    const processedQueries = {};
    Object.entries(namedQueries).forEach(([queryName, query]) => {
      const queryInfo = utils.analyzeQuery(query);

      // Replace table name in query if it's mapped
      if (queryInfo.tableName && tableNameMap[queryInfo.tableName]) {
        const correctTableName = tableNameMap[queryInfo.tableName];
        const updatedQuery = query.replace(
          new RegExp(`\\b${queryInfo.tableName}\\b`, 'g'),
          correctTableName
        );
        processedQueries[queryName] = updatedQuery;

        // Log the transformation
        if (updatedQuery !== query) {
          console.log(`Transformed query '${queryName}' to use correct table name '${correctTableName}'`);
        } else {
          processedQueries[queryName] = query;
        }
      } else {
        processedQueries[queryName] = query;
      }
    });

    // Generate service file
    const interfaceName = utils.tableNameToInterfaceName(tableName);
    const serviceFileName = `${utils.interfaceNameToFileName(interfaceName)}.service.ts`;
    const outputPath = path.join(outputDir, serviceFileName);

    // Generate service content
    const serviceContent = generateServiceContent(
      interfaceName,
      tableInfo,
      processedQueries,
      outputPath,
      tableNameMap
    );

    // Write the file
    if (utils.writeToFile(outputPath, serviceContent)) {
      console.log(`Generated service for ${tableName} with custom queries -> ${outputPath}`);
    }

    console.log(`\nSuccessfully generated service file with custom queries in ${outputDir}`);
  } catch (error) {
    console.error('Error processing query file:', error);
  }
}

/**
 * Command-line interface handler
 * @param {Array} args Command-line arguments
 */
function handleCommandLine(args) {
  if (args.length < 3) {
    console.log('SQLite Queries to Service Generator');
    console.log('=================================');
    console.log('');
    console.log('Usage:');
    console.log('  For a single query file:');
    console.log('    node sqlite-to-services.js --file <query-sql-file> <migrations-directory> <output-directory>');
    console.log('');
    console.log('  For a directory of query files:');
    console.log('    node sqlite-to-services.js --dir <queries-directory> <migrations-directory> <output-directory>');
    console.log('');
    console.log('Examples:');
    console.log('  node sqlite-to-services.js --file queries/user.sql ./migrations ./src/app/core/database/services');
    console.log('  node sqlite-to-services.js --dir ./queries ./migrations ./src/app/core/database/services');
    process.exit(1);
  }

  const mode = args[0];

  if (mode === '--file' && args.length >= 4) {
    const queryFile = args[1];
    const migrationsDir = args[2];
    const outputDir = args[3];
    processQueryFile(queryFile, migrationsDir, outputDir);
  } else if (mode === '--dir' && args.length >= 4) {
    const queriesDir = args[1];
    const migrationsDir = args[2];
    const outputDir = args[3];
    processQueryDirectory(queriesDir, migrationsDir, outputDir);
  } else {
    console.error('Invalid arguments. Use --file or --dir mode with appropriate paths.');
    process.exit(1);
  }
}

// Export functions for use as a module
module.exports = {
  generateQueryMethod,
  generateServiceContent,
  processQueryDirectory,
  processQueryFile,
  handleCommandLine
};

// Command-line interface
if (require.main === module) {
  handleCommandLine(process.argv.slice(2));
}
