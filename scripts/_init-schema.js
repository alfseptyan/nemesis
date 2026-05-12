import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { openDatabase } from '../src/backend/db.js';
import { createSchema } from '../src/backend/seed.js';

const db = openDatabase();
createSchema(db);
console.log('Schema initialized at', process.env.SQLITE_PATH || 'data/dashboard.sqlite');
db.close();
