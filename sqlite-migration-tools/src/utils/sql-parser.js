const { sqliteToTypeScriptType } = require('./type-mapping');

/**
 * Clean up a SQL query by removing excessive whitespace and normalizing indentation
 * @param {string} query SQL query to format
 * @returns {string} Formatted SQL query
 */
const formatSqlQuery = (query) => {
  return query
    .trim()                        // Remove leading/trailing whitespace
    .replace(/\n\s+/g, '\n  ')     // Normalize indentation to 2 spaces
    .replace(/\s+/g, ' ')          // Replace multiple spaces with a single space
    .replace(/\s*\(\s*/g, ' (')    // Normalize spacing around parentheses
    .replace(/\s*\)\s*/g, ') ')
    .replace(/\s*,\s*/g, ', ')     // Normalize spacing around commas
    .replace(/\s+/g, ' ')          // Final cleanup of any remaining multiple spaces
    .trim();                        // Final trim
};

/**
 * Extract SQL queries from a migration file
 * @param {string} content SQL file content
 * @returns {string[]} Array of SQL queries
 */
const extractQueriesFromContent = (content) => {
  if (!content) return [];

  // Split content by semicolons to get individual queries
  // Then filter out empty queries and comments
  const queries = content
    .split(';')
    .map(query => query.trim())
    .filter(query => {
      // Filter out empty queries
      if (!query) return false;

      // Filter out comment-only queries
      const withoutComments = query
        .replace(/--.*$/gm, '')  // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
        .trim();

      return withoutComments.length > 0;
    })
    .map(query => formatSqlQuery(query));

  return queries;
};

/**
 * Parse CREATE TABLE statements from SQL content
 * @param {string} sqlContent SQL content to parse
 * @param {string} fileName Name of the source file (for reference)
 * @returns {object} Object containing tables and enums arrays
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

    tables.push({
      name: tableName,
      columns: columns,
      foreignKeys: foreignKeys,
      indexedColumns: indexedColumns,
      originalFile: fileName
    });
  }

  return { tables, enums };
};

/**
 * Parse ALTER TABLE statements from SQL content
 * @param {string} sqlContent SQL content to parse
 * @param {Array} existingTables Array of existing table definitions
 * @param {string} fileName Name of the source file (for reference)
 * @returns {Array} Array of alteration objects
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
    const isAutoIncrement = columnDef.toUpperCase().includes('AUTOINCREMENT');

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
      isAutoIncrement: isAutoIncrement,
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
    let table = null;

    if (Array.isArray(existingTables)) {
      table = existingTables.find(t => t.name === tableName);
    } else if (existingTables && existingTables.tables && existingTables.tables[tableName]) {
      table = existingTables.tables[tableName];
    }

    // Skip if the table doesn't exist in our schema
    if (!table) {
      console.warn(`Warning: ALTER TABLE references table "${tableName}" which was not found in the current file. This will be applied in version processing if the table exists in a previous version.`);
      continue;
    }

    // In Dexie, PRIMARY KEY columns and UNIQUE columns should be indexed
    if (isPrimaryKey || isUnique) {
      if (!table.indexedColumns) {
        table.indexedColumns = [];
      }

      if (!table.indexedColumns.includes(columnName)) {
        table.indexedColumns.push(columnName);
      }
    }

    // Also add foreign key-like columns (ending with _id) to indexedColumns
    if (columnName.endsWith('_id')) {
      if (!table.indexedColumns) {
        table.indexedColumns = [];
      }

      if (!table.indexedColumns.includes(columnName)) {
        table.indexedColumns.push(columnName);
      }
    }

    // Add the new column to the table's schema
    table.columns.push(columnInfo);
  }

  return alterations;
};

/**
 * Convert a table name to a TypeScript interface name
 * @param {string} tableName Table name to convert
 * @returns {string} TypeScript interface name in PascalCase
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
 * @param {string} interfaceName Interface name to convert
 * @returns {string} File name in kebab-case
 */
const interfaceNameToFileName = (interfaceName) => {
  // Convert PascalCase to kebab-case
  return interfaceName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
};

/**
 * Generate Dexie schema string for a table
 * @param {object} table Table definition
 * @returns {string} Dexie schema string
 */
function generateDexieSchemaString(table) {
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
  console.log(`Generating Dexie schema for table ${table.name}`);
  console.log(`Table columns: ${table.columns.map(c => c.name).join(', ')}`);
  
  // Add all indexed columns and column names that should be indexed
  const indexedColumns = new Set();

  // Add explicitly indexed columns
  if (Array.isArray(table.indexedColumns)) {
    table.indexedColumns.forEach(col => indexedColumns.add(col));
  }

  // Common fields that typically don't need indexing
  const commonFields = new Set([
    'created_at', 
    'updated_at', 
    'created_by',
    'updated_by',
    'deleted_at', 
    'description',
    'content',
    'notes',
    'comments'
  ]);

  // Add all columns except common fields
  table.columns.forEach(col => {
    // Skip primary key (already handled above)
    if (col.isPrimaryKey) {
      return;
    }
    
    // Skip common fields that typically don't need indexing
    if (commonFields.has(col.name)) {
      return;
    }
    
    // Always index fields that:
    // 1. Are marked as unique
    // 2. End with _id (likely foreign keys)
    // 3. Have common indexable names (email, username, etc.)
    // 4. Are not large text fields (likely to be queried)
    const isUnique = col.isUnique;
    const isForeignKey = col.name.endsWith('_id');
    const isCommonIndexable = ['email', 'username', 'phone_number', 'private_key', 'api_key', 'code', 'status'].includes(col.name);
    const isLargeTextField = col.tsType === 'string' && (
      col.name.includes('description') || 
      col.name.includes('content') || 
      col.name.includes('text') || 
      col.name.includes('body')
    );
    
    if (isUnique || isForeignKey || isCommonIndexable || !isLargeTextField) {
      indexedColumns.add(col.name);
    }
  });

  // Remove the primary key from indexed columns
  if (primaryKey) {
    indexedColumns.delete(primaryKey.name);
  }

  // Convert Set to sorted array for consistent output
  const sortedIndexedColumns = Array.from(indexedColumns).sort();

  console.log(`Indexed columns for ${table.name}: ${sortedIndexedColumns.join(', ')}`);

  if (sortedIndexedColumns.length > 0) {
    schemaString += ', ' + sortedIndexedColumns.join(', ');
  }

  return schemaString;
}

module.exports = {
  formatSqlQuery,
  extractQueriesFromContent,
  parseCreateTableStatements,
  parseAlterTableStatements,
  tableNameToInterfaceName,
  interfaceNameToFileName,
  generateDexieSchemaString
};
