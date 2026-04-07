import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function getFilePath(collection) {
  return join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  const file = getFilePath(collection);
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}

function writeCollection(collection, data) {
  writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2));
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
