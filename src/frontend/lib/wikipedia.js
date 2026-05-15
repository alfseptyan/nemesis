const BASE    = 'https://id.wikipedia.org';
const API_URL = `${BASE}/w/api.php`;

const cache = new Map();

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').trim();
}

/**
 * Heuristic: apakah judul artikel kemungkinan merupakan nama orang?
 * Menyaring "Daftar Bupati Bandung", "Pemilihan umum...", "Kota Bandung", dll.
 */
const NON_PERSON_STARTS = [
  'daftar ', 'pemilihan ', 'kota ', 'kabupaten ', 'provinsi ',
  'kementerian ', 'badan ', 'komisi ', 'dewan ', 'lembaga ',
  'menteri ', 'bupati ', 'gubernur ', 'wali kota ', 'walikota ',
  'staf ', 'gedung ', 'sejarah ', 'biro ', 'direktorat ', 'sekretariat ',
  'persib ', 'persija ', 'persis ', 'psis ',   // olahraga
  'jawa ', 'sumatera ', 'kalimantan ', 'sulawesi ', 'papua ', 'nusa ',
  'maluku ', 'gorontalo ', 'riau ', 'jambi ', 'aceh ', 'bali ',
  'daerah ', 'universitas ', 'sekolah ', 'institut ', 'partai ',
  'organisasi ', 'tentara ', 'polisi ', 'kepolisian ',
];
const NON_PERSON_CONTAINS = [
  'pemilihan umum', 'administrasi', 'wakil kepala', 'undang-undang',
  'ibukota', 'ketenagakerjaan', 'perpajakan', 'anggaran', 'pemerintah',
];
function looksLikePerson(title) {
  const low = title.toLowerCase().trim();
  if (NON_PERSON_STARTS.some((p) => low.startsWith(p))) return false;
  if (NON_PERSON_CONTAINS.some((k) => low.includes(k))) return false;
  if (low.endsWith(' indonesia') || low.endsWith(' ri') ||
      low.endsWith(' republik indonesia')) return false;
  const words = title.trim().split(/\s+/);
  if (words.length < 2 || words.length > 7) return false;
  return true;
}

async function fetchSummary(title) {
  try {
    const r = await fetch(`${BASE}/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!r.ok) return null;
    const s = await r.json();
    if (!s || s.type === 'disambiguation') return null;
    return {
      name:       stripHtml(s.displaytitle) || s.title || title,
      extract:    s.extract || '',
      imageUrl:   s.thumbnail?.source  ?? null,
      imageWidth:  s.thumbnail?.width  ?? 0,
      imageHeight: s.thumbnail?.height ?? 0,
      isPortrait: (s.thumbnail?.height ?? 0) > (s.thumbnail?.width ?? 0),
      articleUrl: s.content_urls?.desktop?.page ?? `${BASE}/wiki/${encodeURIComponent(title)}`,
    };
  } catch { return null; }
}

async function searchTitles(query, limit = 8) {
  try {
    const p = new URLSearchParams({
      action: 'query', list: 'search',
      srsearch: query, srlimit: String(limit),
      format: 'json', origin: '*',
    });
    const r = await fetch(`${API_URL}?${p}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d?.query?.search ?? []).map((h) => h.title);
  } catch { return []; }
}

/**
 * Coba beberapa query. Untuk setiap query, prioritaskan artikel yang terlihat
 * seperti nama orang (bukan daftar/institusi). Fallback ke foto apapun.
 */
async function tryQueries(queries) {
  for (const query of queries) {
    const titles = await searchTitles(query, 10);
    if (!titles.length) continue;

    // Pisahkan: artikel yang terlihat seperti nama orang vs lainnya
    const personTitles = titles.filter(looksLikePerson);
    const otherTitles  = titles.filter((t) => !looksLikePerson(t));

    // Fetch summary untuk person titles dulu (maks 5)
    const candidateTitles = [...personTitles, ...otherTitles].slice(0, 5);
    const summaries = await Promise.all(candidateTitles.map(fetchSummary));
    const valid = summaries.filter(Boolean);

    // Prioritas 1: ada foto & portrait (kemungkinan besar foto orang)
    const withPortrait = valid.find((s) => s.imageUrl && s.isPortrait);
    if (withPortrait) return { ...withPortrait, query };

    // Prioritas 2: ada foto apapun
    const withPhoto = valid.find((s) => s.imageUrl);
    if (withPhoto) return { ...withPhoto, query };

    // Prioritas 3: hasil valid pertama (walau tidak ada foto)
    if (valid.length) return { ...valid[0], query };
  }
  return null;
}

// ── Query builders ────────────────────────────────────────────────────────────

function buildCentralQueries(displayName) {
  const clean = displayName
    .replace(/\s+Republik Indonesia\s*$/i, '')
    .replace(/\s+RI\s*$/i, '')
    .trim();

  if (/^kementerian\s+koordinator/i.test(clean)) {
    const bid = clean.replace(/^kementerian\s+koordinator\s+(bidang\s+)?/i, '').trim();
    return [
      `Menteri Koordinator Bidang ${bid}`,
      `Menko ${bid}`,
      clean,
    ];
  }
  if (/^kementerian/i.test(clean)) {
    const bid = clean.replace(/^kementerian\s+/i, '').trim();
    return [
      `Menteri ${bid} Indonesia`,
      `Menteri ${bid}`,
      clean,
    ];
  }
  if (/dewan\s+perwakilan\s+rakyat/i.test(clean) && !/daerah/i.test(clean)) {
    return ['Ketua Dewan Perwakilan Rakyat Indonesia', 'Puan Maharani', 'Ketua DPR'];
  }
  if (/dewan\s+perwakilan\s+daerah/i.test(clean)) {
    return ['Ketua Dewan Perwakilan Daerah Indonesia', 'Ketua DPD'];
  }
  if (/^badan\s+nasional/i.test(clean)) {
    return [`Kepala ${clean}`, clean];
  }
  if (/^badan/i.test(clean)) {
    return [`Kepala ${clean}`, clean];
  }
  if (/^komisi/i.test(clean)) {
    return [`Ketua ${clean}`, clean];
  }
  if (/^mahkamah/i.test(clean)) {
    return [`Ketua ${clean}`, clean];
  }
  return [clean];
}

function buildKabkotaQueries(displayName) {
  // Jakarta → pakai "Wali Kota Administrasi"
  if (/^kota\s+jakarta/i.test(displayName)) {
    const name = displayName.replace(/^kota\s+/i, '').trim();
    return [
      `Wali Kota Administrasi ${name}`,
      `Kepala Kota Administrasi ${name}`,
    ];
  }
  if (/^kota\s/i.test(displayName)) {
    const name = displayName.replace(/^kota\s+/i, '').trim();
    return [
      `Wali Kota ${name}`,
      `Walikota ${name}`,
    ];
  }
  const name = displayName.replace(/^kabupaten\s+/i, '').trim();
  return [
    `Bupati ${name}`,
    `Bupati Kabupaten ${name}`,
  ];
}

function buildProvinceQueries(displayName) {
  const name = displayName.replace(/^Provinsi\s+/i, '').trim();
  return [
    `Gubernur ${name}`,
    `Gubernur Provinsi ${name}`,
  ];
}

function buildRoleLabel(query, mode) {
  if (!query) {
    return mode === 'province' ? 'Gubernur'
         : mode === 'central'  ? 'Pimpinan'
         : 'Kepala Daerah';
  }
  const q = query.trim();
  if (/^Menteri\s+Koordinator/i.test(q)) return 'Menteri Koordinator';
  if (/^Menko/i.test(q))   return 'Menteri Koordinator';
  if (/^Menteri/i.test(q)) return 'Menteri';
  if (/^Kepala/i.test(q))  return 'Kepala';
  if (/^Ketua/i.test(q))   return 'Ketua';
  if (/^Gubernur/i.test(q)) return 'Gubernur';
  if (/^Wali\s+Kota/i.test(q) || /^Walikota/i.test(q)) return 'Wali Kota';
  if (/^Bupati/i.test(q))  return 'Bupati';
  return 'Pimpinan';
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchKepalaDAerah(displayName, mode) {
  const cacheKey = `${mode}:${displayName}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const queries =
    mode === 'province' ? buildProvinceQueries(displayName)
  : mode === 'central'  ? buildCentralQueries(displayName)
  :                       buildKabkotaQueries(displayName);

  const result = await tryQueries(queries);
  if (result) result.role = buildRoleLabel(result.query, mode);

  cache.set(cacheKey, result);
  return result;
}

export function clearWikipediaCache() {
  cache.clear();
}
