/**
 * Helper functions for migrations
 */
import { ALL_MIGRATIONS } from './migrations';

/**
 * Validate migration versions to ensure they're sequential and have unique version numbers
 */
export function validateMigrations() {
  const versions = ALL_MIGRATIONS.map(m => m.version);
  const errors: string[] = [];

  // Check for unique versions
  const uniqueVersions = new Set(versions);
  if (uniqueVersions.size !== versions.length) {
    errors.push('Duplicate version numbers found in migrations');
  }

  // Check for sequential versions starting from 1
  for (let i = 1; i <= versions.length; i++) {
    if (!versions.includes(i)) {
      errors.push(`Missing migration version ${i}`);
    }
  }

  // Check for versions higher than expected
  const max = Math.max(...versions);
  if (max > versions.length) {
    errors.push(`Highest version (${max}) is greater than the number of migrations (${versions.length})`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
