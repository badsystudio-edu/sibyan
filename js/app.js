/* ============================================================
 * APP — boot, router (hash), shell admin & wali, akun saya
 * ============================================================ */
const App = {
  info: null, cfg: null, shell: '', online: true,
  name() { return (this.cfg && this.cfg.settings.nama) || (this.info && this.info.nama) || APP_CFG.namaDefault; },
  alamat() { return (this.cfg && this.cfg.settings.alamat) || (this.info && this.info.alamat) || ''; },
  homeOf(u) { return u.peran === 'wali' ? '/wali/tagihan' : '/admin/dashboard'; },
  isAdm() { return Api.user && Api.user.peran !== 'wali'; },
  isSuper() { return Api.user && Api.user.peran === 'super_admin'; },

  async syncLogo(ver) {
    if (!ver) { localStorage.removeItem('sibyan_logo'); localStorage.removeItem('sibyan_logo_ver'); return; }
    if (localStorage.getItem('sibyan_logo_ver') === ver) return;
    try { const r = await Api.get('getLogo', {}); if (r.data) { localStorage.setItem('sibyan_logo', r.data); localStorage.setItem('sibyan_logo_ver', ver); } } catch (e) { }
  },
  async boot(afterLogin) {
    if (!this.info || afterLogin) {
      try { this.info = await Api.get('publicInfo', {}); await this.syncLogo(this.info.logoVer); }
      catch (e) { this.info = { nama: APP_CFG.namaDefault, alamat: '', kontak: '', kelas: [], logoVer: '' }; this.online = false; this.bootError = e.message; }
    }
    if (Api.token) {
      try { this.cfg = await Api.post('bootstrap', {}); Api.user = Object.assign(Api.user || {}, this.cfg.user); this.online = true; }
      catch (e) { if (e.code === 'AUTH') { Api.clear(); this.cfg = null; } }
    } else this.cfg = null;
  },
  async refreshCfg() { this.cfg = await Api.post('bootstrap', {}); },

  // ---------- Router ----------
  parse() {
    const h = location.hash.replace(/^#/, '') || '/', i = h.indexOf('?');
    return { path: (i < 0 ? h : h.slice(0, i)).replace(/^\/|\/$/g, ''), params: new URLSearchParams(i < 0 ? '' : h.slice(i + 1)) };
  },
  async route() {
    Modal.closeAll(); Adm.destroyCharts();
    const { path, params } = this.parse(), u = Api.user;
    const R = {
      '': () => Pub.home(params), login: () => Pub.login(),
      'admin/dashboard': () => Adm.dashboard(), 'admin/spp': () => Spp.page(), 'admin/iuran': () => Keu.page(),
      'admin/santri': () => San.page(), 'admin/laporan': () => Lap.page(), 'admin/pengaturan': () => Pgt.page(),
      'wali/tagihan': () => Wali.tagihan(), 'wali/kuitansi': () => Wali.kuitansi(), 'wali/kartu': () => Wali.kartu(), 'wali/kontak': () => Wali.kontak()
    };
    if (path === 'login' && u) return this.go(this.homeOf(u));
    const needAdm = path.indexOf('admin/') === 0, needWali = path.indexOf('wali/') === 0;
    if ((needAdm || needWali) && !u) return this.go('/login');
    if (needAdm && u.peran === 'wali') return this.go('/wali/tagihan');
    if (needWali && u.peran !== 'wali') return this.go('/admin/dashboard');
    if (path === 'admin/pengaturan' && u.peran !== 'super_admin') return this.go('/admin/dashboard');
    if (!R[path]) return this.go(u ? this.homeOf(u) : '/');
    window.scrollTo(0, 0);
    if (needWali) Wali.cache = {};
    if (needAdm || needWali) {
      this.mountShell(needAdm ? 'admin' : 'wali', path);
      $('#view').innerHTML = skel(3, 110);
      try { await R[path](); } catch (e) { if (e.code !== 'AUTH') $('#view').innerHTML = '<div class="card">' + emptyBox('error', e.message) + '<div class="center"><button class="btn ghost" onclick="App.route()">Coba lagi</button></div></div>'; }
    } else { this.shell = ''; await R[path](); }
  },
  go(p) { if (location.hash === '#' + p) this.route(); else location.hash = '#' + p; },

  // ---------- Shell ----------
  navAdmin() {
    const n = [['admin/dashboard', 'space_dashboard', 'Dasbor Keuangan', 'Dasbor'], ['admin/spp', 'event_repeat', 'SPP Mingguan (Jumat)', 'SPP'], ['admin/iuran', 'payments', 'Iuran & Pengeluaran', 'Keuangan'],
      ['admin/santri', 'badge', 'Data Santri & Kartu', 'Santri'], ['admin/laporan', 'assessment', 'Laporan & Audit', 'Laporan']];
    if (this.isSuper()) n.push(['admin/pengaturan', 'settings', 'Pengaturan', 'Setelan']);
    return n;
  },
  mountShell(kind, path) {
    const u = Api.user, initial = esc(initials(u.nama));
    if (this.shell !== kind || !$('#view')) {
      this.shell = kind;
      if (kind === 'admin') {
        const nav = this.navAdmin();
        $('#app').innerHTML = '<aside class="side"><a class="brand" href="#/admin/dashboard"><img src="' + logoSrc() + '" alt=""><div><b>SIBYAN</b><small>' + esc(App.name()) + '</small></div></a>' +
          '<nav class="nav"><a href="#/">' + ic('travel_explore') + ' Cari Santri (Publik)</a>' + nav.map(n => '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + ic(n[1]) + ' ' + n[2] + '</a>').join('') + '</nav>' +
          '<div class="srv"><span class="conn" id="conn"><i></i>Server terhubung</span><p class="mute" style="margin-top:6px">Google Apps Script · Sheets</p></div></aside>' +
          '<div class="main"><header class="topbar"><a class="brand brand-m" href="#/admin/dashboard"><img src="' + logoSrc() + '" alt="" style="width:34px;height:34px"><b style="font:700 16px var(--fh);color:var(--p900)">SIBYAN</b></a><span class="conn" id="conn2"><i></i>Terhubung</span><span class="grow"></span>' +
          '<a class="btn deep sm hide-m" href="#/admin/spp">' + ic('add_circle') + ' Catat SPP Jumat</a>' +
          '<button class="usr" data-act="userMenu"><span style="line-height:16px"><b style="font-size:13px">' + esc(u.nama) + '</b><br><small class="warn b" style="font-size:11px">' + (u.peran === 'super_admin' ? 'Super Admin' : 'Bendahara') + '</small></span><span class="avatar">' + initial + '</span></button></header>' +
          '<main class="content" id="view"></main></div>' +
          '<nav class="bnav">' + nav.slice(0, 5).map(n => '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + ic(n[1]) + '<span>' + n[3] + '</span></a>').join('') + '</nav>';
      } else {
        $('#app').innerHTML = '<div class="wali-shell"><div class="main"><header class="topbar"><a class="brand" href="#/wali/tagihan"><img src="' + logoSrc() + '" alt="" style="width:36px;height:36px"><div><b style="font-size:16px">SIBYAN WALI</b><small>' + esc(App.name()) + '</small></div></a><span class="grow"></span><button class="usr" data-act="userMenu"><span class="avatar">' + initial + '</span></button></header>' +
          '<main class="content" id="view" style="padding:1rem"></main></div>' +
          '<nav class="bnav">' + [['wali/tagihan', 'receipt_long', 'SPP & Tagihan'], ['wali/kuitansi', 'history_edu', 'Kuitansi'], ['wali/kartu', 'badge', 'KTS Digital'], ['wali/kontak', 'support_agent', 'Bendahara']].map(n => '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + ic(n[1]) + '<span>' + n[2] + '</span></a>').join('') + '</nav></div>';
      }
    }
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === path));
    const c = $$('.conn'); c.forEach(x => x.classList.toggle('off', !this.online));
  }
};
window.addEventListener('hashchange', () => App.route());
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__pwa = e; });

ACT.userMenu = el => {
  const old = $('.menu'); if (old) { old.remove(); return; }
  const m = document.createElement('div'); m.className = 'menu';
  m.innerHTML = '<button data-act="akunSaya">' + ic('manage_accounts') + ' Akun Saya</button>' + (App.isAdm() ? '<button data-act="goPub">' + ic('travel_explore') + ' Portal Publik</button>' : '') +
    (App.isSuper() ? '<button data-act="goSet">' + ic('settings') + ' Pengaturan</button>' : '') + '<button data-act="logout">' + ic('logout') + ' Keluar</button>';
  $('.topbar').appendChild(m);
};
document.addEventListener('click', e => { if (!e.target.closest('.menu') && !e.target.closest('[data-act=userMenu]')) { const m = $('.menu'); if (m) m.remove(); } });
ACT.goPub = () => { $('.menu') && $('.menu').remove(); location.hash = '#/'; };
ACT.goSet = () => { $('.menu') && $('.menu').remove(); location.hash = '#/admin/pengaturan'; };
ACT.logout = async () => { Api.clear(); App.cfg = null; App.shell = ''; Foto.m = {}; Wali.reset(); location.hash = '#/'; toast('Anda sudah keluar.'); App.route(); };
Api.onAuthFail = () => { if (Api.token) { Api.clear(); App.cfg = null; App.shell = ''; toast('Sesi berakhir. Silakan login ulang.', 'error'); location.hash = '#/login'; } };

ACT.akunSaya = () => {
  $('.menu') && $('.menu').remove(); const u = Api.user;
  Modal.open(mHead('Akun Saya', u.peran === 'wali' ? 'Wali Santri' : (u.peran === 'super_admin' ? 'Super Admin' : 'Bendahara')) +
    '<form data-form="akun"><div class="fg"><label class="f">Nama</label><input class="inp" name="nama" value="' + esc(u.nama) + '" required></div>' +
    '<div class="fg"><label class="f">Username</label><input class="inp" name="username" value="' + esc(u.username) + '" autocapitalize="none" required></div>' +
    '<div class="fg"><label class="f">Password baru (kosongkan jika tidak diganti)</label><input class="inp" name="passwordBaru" type="password" autocomplete="new-password" minlength="6"></div>' +
    '<div class="fg"><label class="f">Password lama (wajib bila mengganti username/password)</label><input class="inp" name="passwordLama" type="password" autocomplete="current-password"></div>' +
    '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Simpan</button></div></form>', 'narrow');
};
FRM.akun = f => busy(f.querySelector('button[type=submit]'), async () => {
  const r = await Api.post('updateAkun', { nama: f.nama.value, username: f.username.value, passwordBaru: f.passwordBaru.value, passwordLama: f.passwordLama.value });
  Api.save(Api.token, Object.assign({}, Api.user, r)); await App.refreshCfg(); Modal.closeAll(); App.shell = ''; App.route(); toast('Akun diperbarui.', 'success');
});

(async function init() {
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => { });
  if (!Api.configured) {
    $('#app').innerHTML = '<div class="wrap" style="max-width:560px;padding-top:3rem"><div class="card"><h2>Konfigurasi belum lengkap</h2><p class="mute" style="margin:8px 0">Buka berkas <b>js/config.js</b> lalu isi <b>GAS_URL</b> dengan URL Web App (berakhiran /exec) dari Google Apps Script, kemudian muat ulang halaman ini.</p></div></div>';
    return;
  }
  await App.boot();
  if (App.bootError) toast(App.bootError, 'error');
  App.route();
})();
