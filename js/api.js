/* ============================================================
 * API — komunikasi dengan Google Apps Script (fetch + JSON)
 * POST memakai text/plain agar tidak memicu preflight CORS.
 * ============================================================ */
/* Versi aplikasi (samakan dengan APP_VERSI di Kode.gs, sw.js, version.json, dan ?v= di index.html) */
const APP_VERSI = '3.5.0';
const BACKEND_MIN = '3.3.0';   // versi minimal server Apps Script yang dibutuhkan aplikasi ini
const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; };

const Api = {
  token: localStorage.getItem('sibyan_token') || '',
  user: JSON.parse(localStorage.getItem('sibyan_user') || 'null'),
  get configured() { return GAS_URL && GAS_URL.indexOf('ISI_DENGAN') < 0; },

  /* Konteks perangkat untuk pemantauan akses wali (tanpa data pribadi) */
  ctx() {
    try {
      const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''; let os = 'Lainnya';
      if (/android/i.test(ua)) os = 'Android'; else if (/iphone|ipad|ipod/i.test(ua)) os = 'iPhone'; else if (/windows/i.test(ua)) os = 'Windows'; else if (/mac/i.test(ua)) os = 'Mac'; else if (/linux/i.test(ua)) os = 'Linux';
      const pwa = !!((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (typeof navigator !== 'undefined' && navigator.standalone));
      return { os: os, pwa: pwa };
    } catch (e) { return {}; }
  },
  save(token, user) {
    this.token = token; this.user = user;
    localStorage.setItem('sibyan_token', token);
    localStorage.setItem('sibyan_user', JSON.stringify(user));
  },
  clear() {
    this.token = ''; this.user = null;
    localStorage.removeItem('sibyan_token'); localStorage.removeItem('sibyan_user');
  },
  onAuthFail: null,

  /* Pembacaan (list/get/laporan) aman diulang; penulisan (simpan/bayar/hapus) TIDAK diulang agar tidak ganda. */
  READ_RE: /^(list|get|report$|tunggakan$|dashboard$|sppGrid$|iuranOverview$|absensiGet$|absensiRekap$|absensiSantri$|pelanggaranList$|pelanggaranSantri$|beritaList$|bukuSpp$|matriks$|aktivitasWali$|bootstrap$|notifConfig$|notifQueue$|waAudience$|waBlastList$|waGrupDaftar$|waDevice$|crmList$|crmStats$|crmDetail$|auditList$|laporanAbsenKonfig$|public|ping$)/,
  isRead(action) { return this.READ_RE.test(action); },
  _ep() { return (typeof App !== 'undefined' && App.epoch) || 0; },
  _stale() { const e = new Error(''); e.stale = true; return e; },

  async _fetch(url, opts, tries) {
    let lastErr = null;
    for (let i = 1; i <= tries; i++) {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 55000);
      try {
        const res = await fetch(url, Object.assign({ signal: ctl.signal, redirect: 'follow' }, opts));
        const txt = await res.text(); let j = null; try { j = JSON.parse(txt); } catch (e) { j = null; }
        if (j && !(j.success === false && j.code === 'BUSY' && i < tries)) return j;     // jawaban sah (atau sibuk tapi sudah percobaan terakhir)
        lastErr = new Error(j ? (j.message || 'Server sibuk.') : 'Server Google mengirim jawaban tak terduga (biasanya sedang sibuk). Coba lagi.');
        if (j) { lastErr.code = j.code; if (i >= tries) return j; }
      } catch (e) {
        lastErr = new Error(e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } finally { clearTimeout(t); }
      if (i < tries) await new Promise(r => setTimeout(r, 700 * i + Math.random() * 400));   // jeda lalu coba lagi
    }
    throw lastErr || new Error('Tidak dapat terhubung ke server.');
  },
  _unwrap(j) {
    if (!j || j.success !== true) {
      const e = new Error((j && j.message) || 'Terjadi kesalahan pada server.');
      e.code = j && j.code;
      if (/Action tidak dikenal/.test(e.message)) e.message += ' — server Apps Script belum diperbarui. Tempel Kode.gs terbaru lalu Deploy → Manage deployments → Edit → New version.';
      if (e.code === 'AUTH' && this.onAuthFail) this.onAuthFail(e);
      throw e;
    }
    return j.data;
  },
  /* opt.keep = true: hasil tetap dipakai walau pengguna sudah pindah halaman (mis. foto, cek versi). */
  async get(action, data, opt) {
    if (!this.configured) throw new Error('GAS_URL belum diisi di js/config.js');
    const ep = this._ep(), u = GAS_URL + '?action=' + encodeURIComponent(action) + '&data=' + encodeURIComponent(JSON.stringify(data || {}));
    const r = this._unwrap(await this._fetch(u, {}, 3));
    if (!(opt && opt.keep) && ep !== this._ep()) throw this._stale();     // halaman sudah berganti: buang hasil lama agar tidak menimpa tampilan baru
    return r;
  },
  async post(action, data, opt) {
    if (!this.configured) throw new Error('GAS_URL belum diisi di js/config.js');
    const ep = this._ep(), baca = this.isRead(action);
    const r = this._unwrap(await this._fetch(GAS_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, token: this.token, data: Object.assign({}, data || {}, { _c: this.ctx() }) })
    }, baca ? 3 : 1));
    if (baca && !(opt && opt.keep) && ep !== this._ep()) throw this._stale();
    return r;
  }
};
