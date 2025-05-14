const fs = require('fs');
const path = require('path');

/**
 * Extract version number from migration filename
 * Assumes format: Vx__description.sql where x is the version number
 */
const extractVersionInfo = (fileName) => {
  // Pattern to match Vx__description.sql format
  const versionMatch = fileName.match(/^V(\d+)__(.+)\.sql$/);

  if (versionMatch && versionMatch.length >= 3) {
    const version = parseInt(versionMatch[1], 10);

    // Convert the filename to a readable description
    let description = versionMatch[2]
      .replace(/-/g, ' ')          // Replace hyphens with spaces
      .replace(/_/g, ' ')          // Replace underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // Convert camelCase to spaces
      .toLowerCase();

    // Capitalize first letter of each word
    description = description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return { version, description };
  }

  return null;
};

/**
 * Clean up a SQL query by removing excessive whitespace and normalizing indentation
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
 */
const extractQueriesFromFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');

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
 * Generate SQLite migrations array from a directory of migration files
 */
function generateSqliteMigrationsFromDir(directoryPath, outputPath, pattern = /^V\d+__.+\.sql$/) {
  try {
    // Check if directory exists
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
      console.error(`Error: ${directoryPath} is not a valid directory.`);
      return;
    }

    console.log(`Processing migration files in ${directoryPath}...`);

    // Get all SQL files in the directory that match the pattern
    const files = fs.readdirSync(directoryPath)
      .filter(file => pattern.test(file))
      .sort(); // Sort to process in version order

    if (files.length === 0) {
      console.error(`No migration files matching the pattern ${pattern} found in ${directoryPath}.`);
      return;
    }

    console.log(`Found ${files.length} migration files.`);

    // Process each file
    const migrations = [];

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      const versionInfo = extractVersionInfo(file);

      if (!versionInfo) {
        console.warn(`Warning: Could not extract version information from ${file}, skipping.`);
        return;
      }

      console.log(`Processing: ${file} (version ${versionInfo.version} - ${versionInfo.description})`);

      const queries = extractQueriesFromFile(filePath);

      if (queries.length === 0) {
        console.warn(`Warning: No valid SQL queries found in ${file}, skipping.`);
        return;
      }

      migrations.push({
        version: versionInfo.version,
        description: versionInfo.description,
        queries: queries
      });
    });

    // Sort migrations by version
    migrations.sort((a, b) => a.version - b.version);

    // Generate output content
    const output = generateMigrationsArrayContent(migrations);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output file
    fs.writeFileSync(outputPath, output);

    console.log(`\nSuccessfully generated SQLite migrations array.`);
    console.log(`Generated ${migrations.length} migration versions.`);
    console.log(`Output written to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating SQLite migrations array:', error);
  }
}

/**
 * Generate SQLite migrations array from a single file with multiple queries
 */
function generateSqliteMigrationsFromFile(sqlFilePath, outputPath) {
  try {
    // Check if file exists
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Error: ${sqlFilePath} does not exist.`);
      return;
    }

    console.log(`Processing file: ${sqlFilePath}`);

    const fileName = path.basename(sqlFilePath);
    const versionInfo = extractVersionInfo(fileName);

    // If can't extract version from filename, use version 1 and generic description
    const version = versionInfo ? versionInfo.version : 1;
    const description = versionInfo ? versionInfo.description : 'Initial Schema';

    const queries = extractQueriesFromFile(sqlFilePath);

    if (queries.length === 0) {
      console.error(`Error: No valid SQL queries found in ${sqlFilePath}.`);
      return;
    }

    const migrations = [
      {
        version: version,
        description: description,
        queries: queries
      }
    ];

    // Generate output content
    const output = generateMigrationsArrayContent(migrations);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output file
    fs.writeFileSync(outputPath, output);

    console.log(`\nSuccessfully generated SQLite migrations array.`);
    console.log(`Generated 1 migration version with ${queries.length} queries.`);
    console.log(`Output written to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating SQLite migrations array:', error);
  }
}

/**
 * Generate the content of the migrations array
 */
function generateMigrationsArrayContent(migrations) {
  let output = `// Auto-generated SQLite migrations array from SQL files\n`;
  output += `// Generated on ${new Date().toISOString()}\n\n`;

  output += `/**\n * SQLite migration definition\n */\n`;
  output += `export interface Migration {\n`;
  output += `  /** Version number of this migration */\n`;
  output += `  version: number;\n`;
  output += `  /** Human-readable description of what this migration does */\n`;
  output += `  description: string;\n`;
  output += `  /** Array of SQL queries to execute for this migration */\n`;
  output += `  queries: string[];\n`;
  output += `}\n\n`;

  // Add the migrations array
  output += `/**\n * Array of all SQLite migrations to apply\n */\n`;
  output += `export const ALL_MIGRATIONS: Migration[] = [\n`;

  // Add each migration
  migrations.forEach((migration, index) => {
    const isLast = index === migrations.length - 1;

    output += `  {\n`;
    output += `    version: ${migration.version},\n`;
    output += `    description: '${migration.description.replace(/'/g, "\\'")}',\n`;
    output += `    queries: [\n`;

    // Add each query with proper formatting
    migration.queries.forEach((query, queryIndex) => {
      const isLastQuery = queryIndex === migration.queries.length - 1;

      // Format SQL string with consistent indentation
      output += `      \`${query}\`${isLastQuery ? '' : ','}\n`;
    });

    output += `    ]\n`;
    output += `  }${isLast ? '' : ','}\n`;
  });

  output += `];\n\n`;

  // Add migration setup helper for Capacitor SQLite
  output += `/**\n * Prepare migration statements for Capacitor SQLite\n * @returns Upgrade statements for Capacitor SQLite\n */\n`;
  output += `export function prepareMigrations() {\n`;
  output += `  // Create migrations table first\n`;
  output += `  const createMigrationsTable = \`\n`;
  output += `    CREATE TABLE IF NOT EXISTS migrations (\n`;
  output += `      version INTEGER PRIMARY KEY,\n`;
  output += `      description TEXT NOT NULL,\n`;
  output += `      executed_at TEXT NOT NULL\n`;
  output += `    )\n`;
  output += `  \`;\n\n`;

  output += `  // Prepare upgrade statements for each version\n`;
  output += `  const upgradeStatements = [];\n\n`;

  output += `  // Add upgrade statement for each migration\n`;
  output += `  for (const migration of ALL_MIGRATIONS) {\n`;
  output += `    upgradeStatements.push({\n`;
  output += `      toVersion: migration.version,\n`;
  output += `      statements: [createMigrationsTable, ...migration.queries]\n`;
  output += `    });\n`;
  output += `  }\n\n`;

  output += `  return upgradeStatements;\n`;
  output += `}\n`;

  return output;
};

// Export functions for use as a module
module.exports = {
  generateSqliteMigrationsFromDir,
  generateSqliteMigrationsFromFile
};

// Command-line interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('SQLite Migrations Array Generator');
    console.log('================================');
    console.log('');
    console.log('Usage:');
    console.log('  For a single file:');
    console.log('    node sqlite-migrations-generator.js --file <input-sql-file> <output-ts-file>');
    console.log('');
    console.log('  For a directory of migration files:');
    console.log('    node sqlite-migrations-generator.js --dir <migration-directory> <output-ts-file>');
    console.log('');
    console.log('Examples:');
    console.log('  node sqlite-migrations-generator.js --file database.sql ./src/migrations.ts');
    console.log('  node sqlite-migrations-generator.js --dir ./migrations ./src/migrations.ts');
    process.exit(1);
  }

  const mode = args[0];

  if (mode === '--file' && args.length >= 3) {
    const inputFile = args[1];
    const outputFile = args[2];
    generateSqliteMigrationsFromFile(inputFile, outputFile);
  } else if (mode === '--dir' && args.length >= 3) {
    const inputDir = args[1];
    const outputFile = args[2];
    generateSqliteMigrationsFromDir(inputDir, outputFile);
  } else {
    console.error('Invalid arguments. Use --file or --dir mode.');
    process.exit(1);
  }
}
