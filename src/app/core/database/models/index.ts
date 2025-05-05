import { USER_MIGRATIONS } from './user.model';

export * from './base.model';
export * from './user.model';

// Export all migrations from all models
export const ALL_MIGRATIONS = [
  ...USER_MIGRATIONS,
  // Add migrations from other models here as you create them
];
