import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const BACKUP_DIR = join(DATA_DIR, 'backups');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

function getFilePath(collection) {
  return join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  const file = getFilePath(collection);
  if (!existsSync(file)) return {};
  try {
    const content = readFileSync(file, 'utf-8');
    if (!content.trim()) return {};
    return JSON.parse(content);
  } catch {
    // Try to restore from backup
    const backupFile = join(BACKUP_DIR, `${collection}.backup.json`);
    if (existsSync(backupFile)) {
      try {
        console.log(`[DB] Restoring ${collection} from backup`);
        const backup = readFileSync(backupFile, 'utf-8');
        writeFileSync(file, backup);
        return JSON.parse(backup);
      } catch {}
    }
    return {};
  }
}

function writeCollection(collection, data) {
  const file = getFilePath(collection);
  const content = JSON.stringify(data, null, 2);

  // Create backup before writing
  if (existsSync(file)) {
    const backupFile = join(BACKUP_DIR, `${collection}.backup.json`);
    try {
      copyFileSync(file, backupFile);
    } catch {}
  }

  writeFileSync(file, content);
}

// CRUD operations
export function dbGet(collection, id) {
  const data = readCollection(collection);
  return data[id] || null;
}

export function dbSet(collection, id, value) {
  const data = readCollection(collection);
  data[id] = value;
  writeCollection(collection, data);
  return value;
}

export function dbDelete(collection, id) {
  const data = readCollection(collection);
  delete data[id];
  writeCollection(collection, data);
}

export function dbList(collection, filterFn) {
  const data = readCollection(collection);
  let items = Object.values(data);
  if (filterFn) items = items.filter(filterFn);
  return items;
}

export function dbAll(collection) {
  return readCollection(collection);
}
