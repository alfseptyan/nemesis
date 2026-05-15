import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Database from 'better-sqlite3';
const db = new Database('data/dashboard.sqlite', { readonly: true });

// Check region_type values
const types = db.prepare(`
  SELECT region_type, COUNT(*) as cnt
  FROM regions
  GROUP BY region_type
  ORDER BY cnt DESC
`).all();

console.log('Region types in DB:');
types.forEach(r => console.log(`  "${r.region_type}" → ${r.cnt} records`));

// Check a few Kota samples
const kotas = db.prepare(`
  SELECT region_key, display_name, region_type
  FROM regions
  WHERE region_type LIKE '%ota%'
  LIMIT 5
`).all();
console.log('\nSample "Kota" regions:');
kotas.forEach(r => console.log(`  [${r.region_type}] ${r.display_name} (${r.region_key})`));

// Check region_metrics for Kota
const kotaMetrics = db.prepare(`
  SELECT r.display_name, rm.total_packages, rm.total_potential_waste
  FROM regions r
  JOIN region_metrics rm ON r.region_key = rm.region_key
  WHERE r.region_type LIKE '%ota%'
  LIMIT 5
`).all();
console.log('\nKota with metrics:');
kotaMetrics.forEach(r => console.log(`  ${r.display_name}: ${r.total_packages} paket, pemborosan ${r.total_potential_waste}`));

db.close();
