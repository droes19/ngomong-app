const fs = require('fs');
const path = require('path');

/**
 * Check if a file exists and is readable
 * @param {string} filePath Path to the file to check
 * @returns {boolean} True if file exists and is readable
 */
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory exists and is a directory
 * @param {string} dirPath Path to the directory to check
 * @returns {boolean} True if directory exists
 */
function checkDirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath Path to create
 * @returns {boolean} True if successful
 */
function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    return false;
  }
}

/**
 * Read SQL file content
 * @param {string} filePath Path to the SQL file
 * @returns {string|null} File content or null if error
 */
function readSqlFile(filePath) {
  try {
    if (!checkFileExists(filePath)) {
      console.error(`Error: ${filePath} does not exist.`);
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Write content to file, creating directories if needed
 * @param {string} filePath Path to write to
 * @param {string} content Content to write
 * @returns {boolean} True if successful
 */
function writeToFile(filePath, content) {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(filePath);
    ensureDir(outputDir);

    // Write output file
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    return false;
  }
}

/**
 * Get all SQL files in a directory matching a pattern
 * @param {string} dirPath Directory to search
 * @param {RegExp} pattern Regular expression pattern to match
 * @returns {string[]} Array of matching file names
 */
function getSqlFilesInDirectory(dirPath, pattern = /\.sql$/i) {
  try {
    if (!checkDirExists(dirPath)) {
      console.error(`Error: ${dirPath} is not a valid directory.`);
      return [];
    }

    return fs.readdirSync(dirPath)
      .filter(file => pattern.test(file))
      .sort(); // Sort alphabetically
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

module.exports = {
  checkFileExists,
  checkDirExists,
  ensureDir,
  readSqlFile,
  writeToFile,
  getSqlFilesInDirectory
};
