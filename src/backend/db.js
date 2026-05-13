import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DATA_DIR, DB_PATH } from './config.js';

const SQLITE_EXTENSIONS = new Set(['.sqlite', '.sqlite3', '.db']);
const REQUIRED_SCHEMA_TABLES = ['packages', 'regions'];

function isSqliteFile(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return SQLITE_EXTENSIONS.has(extension);
}

function listExistingSqliteFiles(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isSqliteFile(entry.name))
    .map((entry) => path.resolve(directoryPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function hasApplicationSchema(filePath) {
  let db;

  try {
    db = new Database(filePath, { readonly: true, fileMustExist: true });

    return REQUIRED_SCHEMA_TABLES.every((tableName) =>
      db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)
    );
  } catch {
    return false;
  } finally {
    if (db) {
      db.close();
    }
  }
}

function resolveRuntimeDbPath() {
  const configuredPath = path.resolve(DB_PATH);
  const configuredFileName = path.basename(configuredPath).toLowerCase();
  const existingDatabases = listExistingSqliteFiles(DATA_DIR);

  if (!existingDatabases.length) {
    return configuredPath;
  }

  const schemaDatabases = existingDatabases.filter(hasApplicationSchema);
  const preferredDatabases = schemaDatabases.length ? schemaDatabases : existingDatabases;
  const configuredMatch = preferredDatabases.find(
    (filePath) => path.basename(filePath).toLowerCase() === configuredFileName
  );

  return configuredMatch || preferredDatabases[0];
}

function ensureDataDirectory() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function initializeDatabase(db, filePath) {
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  try {
    const journalMode = db.pragma('journal_mode = WAL', { simple: true });
    if (String(journalMode).toLowerCase() !== 'wal') {
      console.warn(`[DB] WAL was not enabled for ${filePath}; current mode: ${journalMode}`);
    }
  } catch (error) {
    const message = String(error?.message || error);
    if (error?.code === 'SQLITE_BUSY' || message.toLowerCase().includes('locked')) {
      console.warn(`[DB] ${filePath} is busy, continuing without forcing WAL: ${message}`);
      return;
    }

    throw error;
  }
}

function openCandidateDatabase(filePath) {
  const db = new Database(filePath);

  try {
    initializeDatabase(db, filePath);
    return db;
  } catch (error) {
    try {
      db.close();
    } catch {
      // Ignore close errors during fallback.
    }

    throw error;
  }
}

function openDatabase() {
  ensureDataDirectory();
  const runtimeDbPath = resolveRuntimeDbPath();
  const candidatePaths = Array.from(
    new Set([runtimeDbPath, ...listExistingSqliteFiles(DATA_DIR)])
  );

  let lastError = null;

  for (const filePath of candidatePaths) {
    try {
      return openCandidateDatabase(filePath);
    } catch (error) {
      lastError = error;
      console.warn(`[DB] Failed to open ${filePath}: ${error.message}`);
    }
  }

  throw lastError || new Error('Unable to open any SQLite database candidate.');
}

export {
  DB_PATH,
  hasApplicationSchema,
  listExistingSqliteFiles,
  openDatabase,
  resolveRuntimeDbPath,
};
