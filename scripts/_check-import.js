import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const importFile = path.join(__dirname, '..', 'data', '.import-1778657111274-19412.sqlite');

try {
  const db = new Database(importFile, { readonly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('Tables:', tables.map(t => t.name).join(', '));

  const packageCount = db.prepare('SELECT COUNT(*) as cnt FROM packages').get();
  const regionCount  = db.prepare('SELECT COUNT(*) as cnt FROM regions').get();
  const assetCount   = db.prepare('SELECT COUNT(*) as cnt FROM assets').get();

  console.log(`Packages: ${packageCount.cnt.toLocaleString()}`);
  console.log(`Regions:  ${regionCount.cnt.toLocaleString()}`);
  console.log(`Assets:   ${assetCount.cnt.toLocaleString()}`);
  db.close();
} catch (e) {
  console.error('Error:', e.message);
}
