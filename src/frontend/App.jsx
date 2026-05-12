import { useEffect } from 'preact/hooks';

export function App() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await import('./assets/js/map.js');
      if (cancelled) return;
      await import('./assets/js/app.js');
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div id="preact-wrapper">

      {/* ── Header ──────────────────────────────────────────── */}
      <div class="hdr">
        <div class="hdr-l">
          <div class="logo">AUD</div>
          <div class="hdr-t">
            <h1>Nemesis <span class="hdr-dot">·</span> Audit Pengadaan Publik</h1>
            <span>Deteksi anomali &amp; pemborosan &middot; SIRUP / INAPROC &middot; TA 2026</span>
          </div>
        </div>
        <div class="hdr-r">
          <div class="ll"><span class="ldot"></span>LIVE</div>
          <div class="yr">TA 2026</div>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────── */}
      <div class="kpi" id="kpi"></div>

      {/* ── Control Bar: Filter mode + Map toggle ───────────── */}
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

      {/* ── Main: Map + Sidebar ─────────────────────────────── */}
      <div class="ml">

        {/* Map area */}
        <div class="mc">
          <div id="map"></div>
          <div class="mlb" id="legend"></div>
        </div>

        {/* Sidebar */}
        <div class="sb">
          <div class="sbh">
            <div class="sbh-top">
              <div class="sbh-mode" id="sidebarMode">Memuat data...</div>
              <div class="sbh-hint">Klik wilayah di peta atau kartu di bawah untuk detail</div>
            </div>
            <div class="sbt" id="tabs"></div>
          </div>
          <div class="sbc" id="sbc"></div>
        </div>
      </div>

      {/* ── Detail Modal ────────────────────────────────────── */}
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
  );
}
