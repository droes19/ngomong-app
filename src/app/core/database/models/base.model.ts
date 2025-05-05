/**
 * Base interface for all models with common fields
 */
export interface BaseModel {
  id?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Base database table structure with snake_case field names
 */
export interface BaseTable {
  id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Migration interface for database changes
 */
export interface Migration {
  version: number;
  queries: string[];
  description: string;
}

/**
 * Helper function to generate a table creation statement
 * @param tableName The name of the table
 * @param columns Array of column definitions (without id and timestamps)
 * @returns A SQL CREATE TABLE statement
 */
export const generateTableSchema = (tableName: string, columns: string[]): string => {
  return `
CREATE TABLE IF NOT EXISTS ${tableName} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ${columns.join(',\n  ')},
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;
};

/**
 * Helper function to generate an ALTER TABLE statement to add a column
 * @param tableName The name of the table
 * @param columnDefinition The column definition (name and type)
 * @returns An ALTER TABLE statement
 */
export const generateAddColumnStatement = (tableName: string, columnDefinition: string): string => {
  return `ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`;
};

/**
 * Helper function to get current timestamp as ISO string
 * @returns Current date/time as ISO string
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};