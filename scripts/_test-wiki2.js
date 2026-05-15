const BASE    = 'https://id.wikipedia.org';
const API_URL = `${BASE}/w/api.php`;

const NON_PERSON_STARTS = [
  'daftar ', 'pemilihan ', 'kota ', 'kabupaten ', 'provinsi ',
  'kementerian ', 'badan ', 'komisi ', 'dewan ', 'lembaga ',
  'menteri ', 'bupati ', 'gubernur ', 'wali kota ', 'walikota ',
  'staf ', 'gedung ', 'sejarah ', 'biro ', 'direktorat ', 'sekretariat ',
  'persib ', 'persija ',
];
function looksLikePerson(title) {
  const low = title.toLowerCase().trim();
  if (NON_PERSON_STARTS.some(p => low.startsWith(p))) return false;
  if (low.endsWith(' indonesia') || low.endsWith(' ri') || low.endsWith(' republik indonesia')) return false;
  if (low.includes('pemilihan umum') || low.includes('administrasi') || low.includes('wakil ')) return false;
  const words = title.trim().split(/\s+/);
  if (words.length < 2 || words.length > 7) return false;
  return true;
}

async function searchTitles(query, limit = 10) {
  const p = new URLSearchParams({ action:'query', list:'search', srsearch:query, srlimit:String(limit), format:'json', origin:'*' });
  const r = await fetch(`${API_URL}?${p}`);
  const d = await r.json();
  return (d?.query?.search ?? []).map(h => h.title);
}

const tests = [
  { q: 'Wali Kota Bandung' },
  { q: 'Bupati Bogor' },
  { q: 'Gubernur Jawa Barat' },
  { q: 'Bupati Karawang' },
  { q: 'Menteri Pertahanan Indonesia' },
  { q: 'Wali Kota Administrasi Jakarta Pusat' },
];

for (const t of tests) {
  const titles = await searchTitles(t.q, 10);
  const persons = titles.filter(looksLikePerson);
  console.log(`\nQuery: "${t.q}"`);
  console.log('  ALL:', titles.slice(0,5).join(' | '));
  console.log('  PERSON FILTER:', persons.slice(0,3).join(' | ') || '(tidak ada)');
}
