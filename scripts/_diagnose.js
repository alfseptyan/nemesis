import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { openDatabase } from '../src/backend/db.js';
import { getBootstrapPayload } from '../src/backend/services/dashboard.service.js';

const db = openDatabase();

// 1. List tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables in dashboard.sqlite:', tables.map(t => t.name).join(', ') || '(none)');

// 2. Try bootstrap and catch the real error
try {
  const payload = getBootstrapPayload(db);
  console.log('Bootstrap OK — packages:', payload.summary.totalPackages);
} catch (e) {
  console.error('Bootstrap ERROR:', e.message);
}

db.close();
