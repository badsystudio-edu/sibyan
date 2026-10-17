/* ============================================================
 * API — komunikasi dengan Google Apps Script (fetch + JSON)
 * POST memakai text/plain agar tidak memicu preflight CORS.
 * ============================================================ */
const Api = {
  token: localStorage.getItem('sibyan_token') || '',
  user: JSON.parse(localStorage.getItem('sibyan_user') || 'null'),
  get configured() { return GAS_URL && GAS_URL.indexOf('ISI_DENGAN') < 0; },

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

  async _fetch(url, opts, tries) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 55000);
    try {
      const res = await fetch(url, Object.assign({ signal: ctl.signal, redirect: 'follow' }, opts));
      return await res.json();
    } catch (e) {
      if (tries > 1 && !opts.method) return this._fetch(url, opts, tries - 1);   // GET aman diulang; POST tidak
      throw new Error(e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally { clearTimeout(t); }
  },
  _unwrap(j) {
    if (!j || j.success !== true) {
      const e = new Error((j && j.message) || 'Terjadi kesalahan pada server.');
      e.code = j && j.code;
      if (e.code === 'AUTH' && this.onAuthFail) this.onAuthFail(e);
      throw e;
    }
    return j.data;
  },
  async get(action, data) {
    if (!this.configured) throw new Error('GAS_URL belum diisi di js/config.js');
    const u = GAS_URL + '?action=' + encodeURIComponent(action) + '&data=' + encodeURIComponent(JSON.stringify(data || {}));
    return this._unwrap(await this._fetch(u, {}, 2));
  },
  async post(action, data) {
    if (!this.configured) throw new Error('GAS_URL belum diisi di js/config.js');
    return this._unwrap(await this._fetch(GAS_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, token: this.token, data: data || {} })
    }, 1));
  }
};
