// Auto-generated TypeScript base model with common fields
// Generated on 2025-05-17T23:51:52.003Z

/**
 * Base interface with common fields for all models
 */
export interface BaseModel<IDType = number> {
  /** Primary Key */
  id: IDType;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Base interface with snake_case fields for database tables
 */
export interface BaseTable<IDType = number> {
  /** Primary Key */
  id: IDType;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}
