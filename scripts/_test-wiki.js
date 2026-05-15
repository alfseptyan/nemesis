// Test Wikipedia search untuk beberapa sample region
const BASE    = 'https://id.wikipedia.org';
const API_URL = `${BASE}/w/api.php`;

async function searchTitles(query, limit = 5) {
  const params = new URLSearchParams({
    action: 'query', list: 'search',
    srsearch: query, srlimit: String(limit),
    format: 'json', origin: '*',
  });
  const resp = await fetch(`${API_URL}?${params}`);
  const data = await resp.json();
  return (data?.query?.search ?? []).map(h => ({ title: h.title, snippet: h.snippet.replace(/<[^>]+>/g,'').slice(0,60) }));
}

const testCases = [
  { name: 'Kota Bandung',      mode: 'kabkota' },
  { name: 'Kota Jakarta Pusat', mode: 'kabkota' },
  { name: 'Jawa Barat',        mode: 'province' },
  { name: 'Kabupaten Karawang', mode: 'kabkota' },
  { name: 'Bogor',             mode: 'kabkota' },
  { name: 'Kementerian Pertahanan', mode: 'central' },
];

for (const tc of testCases) {
  let query;
  if (tc.mode === 'province') {
    query = `Gubernur ${tc.name}`;
  } else if (tc.mode === 'central') {
    query = `Menteri ${tc.name.replace(/^Kementerian\s+/i,'').trim()} Indonesia`;
  } else {
    if (/^kota\s/i.test(tc.name)) query = `Wali Kota ${tc.name.replace(/^kota\s+/i,'').trim()}`;
    else query = `Bupati ${tc.name.replace(/^kabupaten\s+/i,'').trim()}`;
  }
  const results = await searchTitles(query, 5);
  console.log(`\n[${tc.name}] → query: "${query}"`);
  results.forEach((r,i) => console.log(`  ${i+1}. ${r.title}`));
}
