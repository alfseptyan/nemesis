// Simulate what renderSidebarContent does for K/L mode
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { openDatabase } from '../src/backend/db.js';
import { getBootstrapPayload } from '../src/backend/services/dashboard.service.js';

const db = openDatabase();
const payload = getBootstrapPayload(db);

console.log('summary.totalPackages   :', payload.summary.totalPackages);
console.log('ownerLists.central.length:', payload.ownerLists.central.length);

if (payload.ownerLists.central.length > 0) {
  const top3 = payload.ownerLists.central.slice(0, 3);
  top3.forEach((o, i) => {
    console.log(`\n[${i+1}] ${o.ownerName}`);
    console.log('    totalPackages       :', o.totalPackages);
    console.log('    totalPotentialWaste :', o.totalPotentialWaste);
    console.log('    severityCounts      :', JSON.stringify(o.severityCounts));
  });
}

db.close();
