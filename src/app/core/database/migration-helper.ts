import { ALL_MIGRATIONS } from './models';
import { DATABASE_CONFIG, NEXT_MIGRATION_VERSION } from './database.config';

/**
 * Validates that migration versions are sequential and non-duplicated
 * Call this during development to check for migration issues
 */
export function validateMigrations(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const versionSet = new Set<number>();

  // Check for duplicate versions
  for (const migration of ALL_MIGRATIONS) {
    if (versionSet.has(migration.version)) {
      errors.push(`Duplicate migration version: ${migration.version} (${migration.description})`);
    } else {
      versionSet.add(migration.version);
    }
  }

  // Check for gaps in version numbers
  const versions = [...versionSet].sort((a, b) => a - b);
  for (let i = 1; i < versions.length; i++) {
    if (versions[i] !== versions[i - 1] + 1) {
      errors.push(`Gap in migration versions between ${versions[i - 1]} and ${versions[i]}`);
    }
  }

  // Check if DATABASE_CONFIG.version matches highest migration version
  const highestVersion = versions.length > 0 ? versions[versions.length - 1] : 0;
  if (DATABASE_CONFIG.version !== highestVersion) {
    errors.push(`DATABASE_CONFIG.version (${DATABASE_CONFIG.version}) doesn't match highest migration version (${highestVersion})`);
  }

  // Check if NEXT_MIGRATION_VERSION is correct
  if (NEXT_MIGRATION_VERSION !== highestVersion + 1) {
    errors.push(`NEXT_MIGRATION_VERSION (${NEXT_MIGRATION_VERSION}) should be ${highestVersion + 1}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gets the next available migration version
 * (Should match NEXT_MIGRATION_VERSION in database.config.ts)
 */
export function getNextMigrationVersion(): number {
  // Find the highest migration version
  const highestVersion = ALL_MIGRATIONS.reduce(
    (max, migration) => Math.max(max, migration.version),
    0
  );

  // Return the next version number
  return highestVersion + 1;
}

/**
 * Prints migration information for debugging
 */
export function printMigrationInfo(): void {
  const validationResult = validateMigrations();
  const sortedMigrations = [...ALL_MIGRATIONS].sort((a, b) => a.version - b.version);

  console.group('Database Migration Info');
  console.log(`Current database version: ${DATABASE_CONFIG.version}`);
  console.log(`Next migration version: ${NEXT_MIGRATION_VERSION}`);
  console.log(`Total migrations: ${ALL_MIGRATIONS.length}`);
  console.log(`Validation: ${validationResult.valid ? 'PASSED ✓' : 'FAILED ✗'}`);

  if (!validationResult.valid) {
    console.group('Validation Errors:');
    validationResult.errors.forEach(err => console.error(`- ${err}`));
    console.groupEnd();
  }

  console.group('Migrations:');
  sortedMigrations.forEach(migration => {
    console.log(`${migration.version}: ${migration.description}`);
  });
  console.groupEnd();

  console.groupEnd();
}
