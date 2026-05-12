import { useEffect, useMemo, useState } from 'preact/hooks';

const API_BASE_URL = (window['DASHBOARD_API_BASE_URL'] || '/api').replace(/\/$/, '');

function formatCompactCurrency(value) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  if (abs >= 1e12) return `${(amount / 1e12).toFixed(amount % 1e12 === 0 ? 0 : 1)} T`;
  if (abs >= 1e9) return `${(amount / 1e9).toFixed(amount % 1e9 === 0 ? 0 : 1)} B`;
  if (abs >= 1e6) return `${(amount / 1e6).toFixed(amount % 1e6 === 0 ? 0 : 1)} M`;
  if (abs >= 1e3) return `${(amount / 1e3).toFixed(amount % 1e3 === 0 ? 0 : 1)} K`;
  return `${amount.toFixed(0)}`;
}

function formatNumber(value) {
  const number = Math.round(Number(value) || 0);
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatPercentage(value) {
  const amount = Number(value) || 0;
  return amount.toFixed(1).replace('.', ',');
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const saved = window.localStorage.getItem('nemesis-theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (error) {
    // Ignore storage access issues and fall back to default theme.
  }

  return 'light';
}

function buildWasteRankingEntries(data, mode) {
  if (!data) {
    return {
      entries: [],
      excludedCount: 0,
      sourceCount: 0,
      modeLabel: mode === 'province' ? 'Provinsi' : 'Kab/Kota',
    };
  }

  const source =
    mode === 'province'
      ? (data.provinceView && data.provinceView.provinces) || []
      : (data.regions || []).filter((area) => area.regionType === 'Kabupaten' || area.regionType === 'Kota');

  const entries = [];
  let excludedCount = 0;

  for (const area of source) {
    const totalBudget = Number(area.totalBudget) || 0;
    const totalPotentialWaste = Number(area.totalPotentialWaste) || 0;

    if (totalBudget <= 0) {
      excludedCount += 1;
      continue;
    }

    entries.push({
      displayName: area.displayName,
      totalBudget,
      totalPotentialWaste,
      percentage: (totalPotentialWaste / totalBudget) * 100,
    });
  }

  entries.sort((left, right) => {
    if (right.percentage !== left.percentage) {
      return right.percentage - left.percentage;
    }

    if (right.totalPotentialWaste !== left.totalPotentialWaste) {
      return right.totalPotentialWaste - left.totalPotentialWaste;
    }

    return left.displayName.localeCompare(right.displayName, 'id');
  });

  return {
    entries: entries.slice(0, 10),
    excludedCount,
    sourceCount: source.length,
    modeLabel: mode === 'province' ? 'Provinsi' : 'Kab/Kota',
  };
}

function RankingPage({ active, data, loading, error, mode, onModeChange, onBack, theme, onToggleTheme }) {
  const ranking = useMemo(() => buildWasteRankingEntries(data, mode), [data, mode]);
  const isProvinceMode = mode === 'province';
  const maxPercentage = ranking.entries.length
    ? Math.max(...ranking.entries.map((entry) => entry.percentage))
    : 0;

  const content = (() => {
    if (error) {
      return <div class="ranking-state error">{error}</div>;
    }

    if (loading) {
      return (
        <LoadingScene
          title="Menyiapkan halaman ranking"
          subtitle="Agregasi persentase pemborosan sedang diproses."
          note="Daftar ranking baru bisa dipilih setelah data selesai dimuat."
        />
      );
    }

    if (!ranking.entries.length) {
      return (
        <div class="ranking-state">
          Tidak ada daerah dengan pagu positif untuk mode {ranking.modeLabel} saat ini.
        </div>
      );
    }

    return (
      <div class="ranking-list">
        {ranking.entries.map((entry, index) => {
          const barWidth = maxPercentage > 0 ? Math.max(6, Math.round((entry.percentage / maxPercentage) * 100)) : 6;

          return (
            <article class="ranking-item">
              <div class="ranking-top">
                <div class="ranking-rank">#{index + 1}</div>
                <div class="ranking-name">{entry.displayName}</div>
                <div class="ranking-pct">{formatPercentage(entry.percentage)}%</div>
              </div>
              <div class="ranking-meta">
                Rp {formatCompactCurrency(entry.totalPotentialWaste)} pemborosan &middot; Rp{' '}
                {formatCompactCurrency(entry.totalBudget)} pagu
              </div>
              <div class="ranking-bar">
                <div class="ranking-bar-fill" style={{ width: `${barWidth}%` }}></div>
              </div>
            </article>
          );
        })}
      </div>
    );
  })();

  return (
    <div class={`ranking-shell${active ? ' is-active' : ''}`} aria-hidden={active ? 'false' : 'true'}>
      <div class="ranking-page">
        <div class="hdr ranking-hdr">
          <div class="hdr-l">
            <div class="logo ranking-logo">RKG</div>
            <div class="hdr-t">
              <h1>Ranking Persentase Pemborosan</h1>
              <span>Top 10 daerah dengan persentase pemborosan terbesar</span>
            </div>
          </div>
          <div class="hdr-r">
            <div class="yr">Ranking</div>
            <PageNav activeView="ranking" onOpenDashboard={onBack} onOpenRanking={onBack} />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>

        <div class="ranking-body">
          <div class="ranking-hero">
            <div>
              <div class="ranking-kicker">Leaderboard</div>
              <h2>Daerah dengan persentase pemborosan terbesar</h2>
              <p>
                Persentase dihitung dari total potensi pemborosan dibagi total pagu. Hanya daerah dengan
                pagu positif yang dihitung.
              </p>
            </div>
            <div class="ranking-hero-actions">
              <div class="ranking-toggle">
                <button
                  class={`ranking-toggle-btn${isProvinceMode ? ' a' : ''}`}
                  type="button"
                  onClick={() => onModeChange('province')}
                >
                  Provinsi
                </button>
                <button
                  class={`ranking-toggle-btn${!isProvinceMode ? ' a' : ''}`}
                  type="button"
                  onClick={() => onModeChange('kabkota')}
                >
                  Kab/Kota
                </button>
              </div>
              <div class="ranking-note">
                {ranking.entries.length} dari {ranking.sourceCount} daerah ditampilkan
                {ranking.excludedCount > 0 ? ` · ${ranking.excludedCount} daerah dengan pagu nol/tidak valid dilewati` : ''}
              </div>
            </div>
          </div>

          <div class="ranking-summary">
            <div class="ranking-summary-card">
              <span>Mode aktif</span>
              <strong>{ranking.modeLabel}</strong>
            </div>
            <div class="ranking-summary-card">
              <span>Ditampilkan</span>
              <strong>{formatNumber(ranking.entries.length)}</strong>
            </div>
            <div class="ranking-summary-card">
              <span>Total sumber</span>
              <strong>{formatNumber(ranking.sourceCount)}</strong>
            </div>
          </div>

          {content}
        </div>
      </div>
    </div>
  );
}

function PageNav({ activeView, onOpenDashboard, onOpenRanking }) {
  return (
    <div class="page-nav" role="navigation" aria-label="Pilih halaman">
      <button
        class={`page-nav-btn${activeView === 'dashboard' ? ' a' : ''}`}
        type="button"
        disabled={activeView === 'dashboard'}
        aria-current={activeView === 'dashboard' ? 'page' : undefined}
        onClick={onOpenDashboard}
      >
        Dashboard
      </button>
      <button
        class={`page-nav-btn${activeView === 'ranking' ? ' a' : ''}`}
        type="button"
        disabled={activeView === 'ranking'}
        aria-current={activeView === 'ranking' ? 'page' : undefined}
        onClick={onOpenRanking}
      >
        Ranking
      </button>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  const nextLabel = isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap';

  return (
    <button
      class={`theme-toggle-btn${isDark ? ' a' : ''}`}
      type="button"
      onClick={onToggle}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <span class="theme-toggle-icon" aria-hidden="true">
        {isDark ? (
          <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
            <path d="M12 3a1 1 0 0 1 1 1v1.2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 15.8a1 1 0 0 1 1 1V21a1 1 0 1 1-2 0v-1.2a1 1 0 0 1 1-1ZM4.2 11a1 1 0 0 1 0 2H3a1 1 0 1 1 0-2h1.2Zm17 0a1 1 0 0 1 0 2H20a1 1 0 1 1 0-2h1.2ZM6.05 6.05a1 1 0 0 1 1.41 0l.85.85A1 1 0 1 1 6.9 8.31l-.85-.85a1 1 0 0 1 0-1.41Zm9.64 9.64a1 1 0 0 1 1.41 0l.85.85a1 1 0 0 1-1.41 1.41l-.85-.85a1 1 0 0 1 0-1.41Zm0-9.64a1 1 0 0 1 0 1.41l-.85.85a1 1 0 1 1-1.41-1.41l.85-.85a1 1 0 0 1 1.41 0ZM7.31 15.09a1 1 0 0 1 0 1.41l-.85.85a1 1 0 0 1-1.41-1.41l.85-.85a1 1 0 0 1 1.41 0ZM12 7.25A4.75 4.75 0 1 1 7.25 12 4.76 4.76 0 0 1 12 7.25Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
            <path d="M20.2 14.4A8.7 8.7 0 0 1 9.6 3.8a1 1 0 0 0-1.2-1.22A10.8 10.8 0 1 0 21.42 15.6a1 1 0 0 0-1.22-1.2ZM12 21a9 9 0 0 1-6.64-15.06A10.7 10.7 0 0 0 15.1 18.78 8.98 8.98 0 0 1 12 21Z" />
          </svg>
        )}
      </span>
    </button>
  );
}

function LoadingScene({ title, subtitle, note }) {
  return (
    <div class="loading-scene" role="status" aria-live="polite">
      <div class="loading-scene-card">
        <div class="loading-scene-spinner" aria-hidden="true"></div>
        <div class="loading-scene-kicker">Memuat data</div>
        <div class="loading-scene-title">{title}</div>
        <div class="loading-scene-sub">{subtitle}</div>
        {note ? <div class="loading-scene-note">{note}</div> : null}
        <div class="loading-scene-bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [view, setView] = useState(() => (window.location.hash === '#ranking' ? 'ranking' : 'dashboard'));
  const [theme, setTheme] = useState(getInitialTheme);
  const [rankingMode, setRankingMode] = useState('kabkota');
  const [bootstrapData, setBootstrapData] = useState(null);
  const [bootstrapError, setBootstrapError] = useState('');

  useEffect(() => {
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem('nemesis-theme', theme);
    } catch (error) {
      // Ignore storage issues.
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bootstrap`);
        if (!response.ok) {
          throw new Error(`Gagal memuat data ranking: ${response.status}`);
        }

        const payload = await response.json();
        if (!cancelled) {
          setBootstrapData(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setBootstrapError(error instanceof Error ? error.message : String(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncView = () => {
      setView(window.location.hash === '#ranking' ? 'ranking' : 'dashboard');
    };

    syncView();
    window.addEventListener('hashchange', syncView);
    return () => window.removeEventListener('hashchange', syncView);
  }, []);

  useEffect(() => {
    document.title =
      view === 'ranking'
        ? 'Ranking Persentase Pemborosan - LKPP 2026'
        : 'Audit Pengadaan Kab/Kota - LKPP 2026';
  }, [view]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await import('./assets/js/map.js');
      if (cancelled) return;
      await import('./assets/js/app.js');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const openRanking = () => {
    if (window.location.hash !== '#ranking') {
      window.location.hash = '#ranking';
      return;
    }

    setView('ranking');
  };

  const openDashboard = () => {
    if (window.location.hash !== '#dashboard') {
      window.location.hash = '#dashboard';
      return;
    }

    setView('dashboard');
  };

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const isBootstrapLoading = !bootstrapData && !bootstrapError;

  return (
    <div id="preact-wrapper" class={view === 'ranking' ? 'view-ranking' : 'view-dashboard'}>
      <div class={`dashboard-shell${view === 'ranking' ? ' is-hidden' : ''}`}>
        {isBootstrapLoading ? (
          <LoadingScene
            title="Menyiapkan dashboard audit"
            subtitle="Data KPI, peta, dan sidebar kanan sedang dimuat."
            note="Jika tombol sidebar belum bisa dipencet, tunggu sampai scene loading ini hilang dan lihat alasan akses di bawah."
          />
        ) : null}
        <div class="hdr">
          <div class="hdr-l">
            <div class="logo">AUD</div>
            <div class="hdr-t">
              <h1>Audit Pengadaan Publik</h1>
              <span>Deteksi anomali &amp; pemborosan &middot; SIRUP / INAPROC &middot; TA 2026</span>
            </div>
          </div>
          <div class="hdr-r">
            <div class="ll"><span class="ldot"></span>LIVE</div>
            <div class="yr">TA 2026</div>
            <PageNav activeView={view} onOpenDashboard={openDashboard} onOpenRanking={openRanking} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>

        <div class="kpi" id="kpi"></div>

        <div class="kpi-modal-overlay" id="kpiModalOverlay" aria-hidden="true">
          <div class="kpi-modal" role="dialog" aria-modal="true" aria-labelledby="kpiModalTitle">
            <div class="kpi-modal-top">
              <div>
                <div class="kpi-modal-kicker">Keterangan KPI</div>
                <h2 id="kpiModalTitle"></h2>
                <div class="kpi-modal-sub" id="kpiModalSub"></div>
              </div>
              <button class="kpi-modal-close" id="kpiModalClose" type="button">
                Tutup
              </button>
            </div>
            <div class="kpi-modal-body" id="kpiModalBody"></div>
          </div>
        </div>

        <div class="ctrl-bar">
          <div class="ctrl-left">
            <span class="ctrl-label">Tampilkan</span>
            <div id="mf" class="ctrl-chips"></div>
          </div>
          <button
            class="map-toggle-btn"
            id="toggleMapBtn"
            onClick={() => window['dashboardActions'] && window['dashboardActions'].toggleMap()}
          >
            <span class="map-toggle-icon">⊞</span>
            Sembunyikan Peta
          </button>
        </div>

        <div class="ml">
          <div class="mc">
            <div id="map"></div>
            <div class="mlb" id="legend"></div>
          </div>

          <div class="sb">
            <div class="sbh">
            <div class="sbh-top">
              <div class="sbh-mode" id="sidebarMode">Memuat data...</div>
              <div class="sbh-hint">Klik wilayah di peta atau kartu di bawah untuk detail</div>
              <div class="sbh-note" id="sidebarAccessHint"></div>
            </div>
            <div class="sbt" id="tabs"></div>
          </div>
            <div class="sbc" id="sbc"></div>
          </div>
        </div>

        <div class="modal-overlay" id="rupModal">
          <div class="modal">
            <div class="modal-top" id="modalTop"></div>
            <div class="modal-body" id="modalBody"></div>
            <div class="modal-footer">
              Map memakai agregasi penuh untuk paket multi-lokasi &middot; KPI nasional tidak menduplikasi paket multi-lokasi
            </div>
          </div>
        </div>
      </div>

      <RankingPage
        active={view === 'ranking'}
        data={bootstrapData}
        loading={!bootstrapData && !bootstrapError}
        error={bootstrapError}
        mode={rankingMode}
        onModeChange={setRankingMode}
        onBack={openDashboard}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
