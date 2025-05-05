export const DATABASE_CONFIG = {
  name: 'ngomong_db',
  version: 2, // Should match the highest version number in ALL_MIGRATIONS
  encryption: false,
  mode: 'no-encryption' as const
};

// Keep track of the next available migration version
// IMPORTANT: Always increment this when adding new migrations
export const NEXT_MIGRATION_VERSION = 3;
