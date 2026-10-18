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
    Modal.closeAll(); Adm.destroyCharts(); if (typeof WA !== 'undefined') clearInterval(WA.timer);
    const { path, params } = this.parse(), u = Api.user;
    const R = {
      '': () => Pub.home(params), login: () => Pub.login(),
      'admin/dashboard': () => Adm.dashboard(), 'admin/spp': () => Spp.page(), 'admin/iuran': () => Keu.page(),
      'admin/santri': () => San.page(), 'admin/laporan': () => Lap.page(), 'admin/pengaturan': () => Pgt.page(),
      'admin/absensi': () => Abs.page(), 'admin/disiplin': () => Dis.page(), 'admin/berita': () => Brt.page(), 'admin/wa': () => WA.page(), 'admin/crm': () => Crm.page(), 'admin/aktivitas': () => Akt.page(),
      'wali/tagihan': () => Wali.tagihan(), 'wali/kuitansi': () => Wali.kuitansi(), 'wali/santri': () => Wali.santri(), 'wali/kartu': () => Wali.santri(), 'wali/berita': () => Wali.berita(), 'wali/kontak': () => Wali.kontak()
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
      try { await R[path](); if (needWali) setTimeout(() => this.promptPwa(), 1200); } catch (e) { if (e.code !== 'AUTH') $('#view').innerHTML = '<div class="card">' + emptyBox('error', e.message) + '<div class="center"><button class="btn ghost" onclick="App.route()">Coba lagi</button></div></div>'; }
    } else { this.shell = ''; await R[path](); }
  },
  go(p) { if (location.hash === '#' + p) this.route(); else location.hash = '#' + p; },

  // ---------- Shell ----------
  navAdmin() {
    const n = [['admin/dashboard', 'space_dashboard', 'Dasbor Keuangan', 'Dasbor'], ['admin/spp', 'event_repeat', 'SPP Mingguan (Jumat)', 'SPP'], ['admin/iuran', 'payments', 'Iuran & Pengeluaran', 'Keuangan'],
      ['admin/santri', 'badge', 'Data Santri & Kartu', 'Santri'], ['admin/absensi', 'fact_check', 'Absensi Santri', 'Absensi'], ['admin/disiplin', 'gavel', 'Catatan Pelanggaran', 'Disiplin'],
      ['admin/berita', 'newspaper', 'Berita & Pengumuman', 'Berita'], ['admin/aktivitas', 'monitoring', 'Aktivitas Wali', 'Aktivitas'], ['admin/laporan', 'assessment', 'Laporan & Audit', 'Laporan'], ['admin/wa', 'chat', 'WhatsApp & Notifikasi', 'WA'], ['admin/crm', 'contacts', 'CRM Kontak', 'CRM']];
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
          '<div class="srv"><span class="conn" id="conn"><i></i>Server terhubung</span><p class="mute" style="margin-top:6px">Aplikasi v' + APP_VERSI + ' · Server v<span id="srvVer">' + esc(App.backendVersi || '…') + '</span><br><a href="cek.html" target="_blank">Cek versi & pembaruan</a></p></div></aside>' +
          '<div class="main"><header class="topbar"><a class="brand brand-m" href="#/admin/dashboard"><img src="' + logoSrc() + '" alt="" style="width:34px;height:34px"><b style="font:700 16px var(--fh);color:var(--p900)">SIBYAN</b></a><span class="conn" id="conn2"><i></i>Terhubung</span><span class="grow"></span>' +
          '<a class="btn deep sm hide-m" href="#/admin/spp">' + ic('add_circle') + ' Catat SPP Jumat</a>' +
          '<button class="usr" data-act="userMenu"><span style="line-height:16px"><b style="font-size:13px">' + esc(u.nama) + '</b><br><small class="warn b" style="font-size:11px">' + (u.peran === 'super_admin' ? 'Super Admin' : 'Bendahara') + '</small></span><span class="avatar">' + initial + '</span></button></header>' +
          '<div id="verBanner"></div><main class="content" id="view"></main></div>' +
          '<nav class="bnav">' + nav.filter(n => ['admin/dashboard', 'admin/spp', 'admin/santri', 'admin/absensi'].indexOf(n[0]) >= 0).map(n => '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + ic(n[1]) + '<span>' + n[3] + '</span></a>').join('') + '<a href="#" data-act="navMore">' + ic('apps') + '<span>Lainnya</span></a></nav>';
      } else {
        $('#app').innerHTML = '<div class="wali-shell"><div class="main"><header class="topbar"><a class="brand" href="#/wali/tagihan"><img src="' + logoSrc() + '" alt="" style="width:36px;height:36px"><div><b style="font-size:16px">SIBYAN WALI</b><small>' + esc(App.name()) + '</small></div></a><span class="grow"></span><button class="usr" data-act="userMenu"><span class="avatar">' + initial + '</span></button></header>' +
          '<main class="content" id="view" style="padding:1rem"></main></div>' +
          '<nav class="bnav">' + [['wali/tagihan', 'receipt_long', 'SPP & Tagihan'], ['wali/kuitansi', 'history_edu', 'Kuitansi'], ['wali/santri', 'badge', 'Santri'], ['wali/berita', 'newspaper', 'Berita'], ['wali/kontak', 'support_agent', 'Bendahara']].map(n => '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + ic(n[1]) + '<span>' + n[2] + '</span></a>').join('') + '</nav></div>';
      }
    }
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === path));
    this.paintBanner();
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
ACT.navMore = () => {
  Modal.open(mHead('Menu Lainnya') + '<div class="nav">' + App.navAdmin().map(n => '<a href="#/' + n[0] + '">' + ic(n[1]) + ' ' + n[2] + '</a>').join('') + '<a href="#/">' + ic('travel_explore') + ' Cari Santri (Publik)</a></div>', 'narrow');
};
ACT.goPub = () => { $('.menu') && $('.menu').remove(); location.hash = '#/'; };
ACT.goSet = () => { $('.menu') && $('.menu').remove(); location.hash = '#/admin/pengaturan'; };
ACT.logout = async () => { Api.clear(); App.cfg = null; App.shell = ''; Foto.m = {}; Wali.reset(); location.hash = '#/'; toast('Anda sudah keluar.'); App.route(); };
Api.onAuthFail = () => { if (Api.token) { Api.clear(); App.cfg = null; App.shell = ''; toast('Sesi berakhir. Silakan login ulang.', 'error'); location.hash = '#/login'; } };

ACT.akunSaya = () => {
  $('.menu') && $('.menu').remove(); const u = Api.user;
  Modal.open(mHead('Akun Saya', u.peran === 'wali' ? 'Wali Santri' : (u.peran === 'super_admin' ? 'Super Admin' : 'Bendahara')) +
    '<form data-form="akun"><div class="fg"><label class="f">Nama</label><input class="inp" name="nama" value="' + esc(u.nama) + '" required></div>' +
    '<div class="fg"><label class="f">Username</label><input class="inp" name="username" value="' + esc(u.username) + '" autocapitalize="none" required></div>' +
    '<div class="fg"><label class="f">Password baru (kosongkan jika tidak diganti)</label>' + pwHtml('passwordBaru', 'autocomplete="new-password" minlength="6"') + '</div>' +
    '<div class="fg"><label class="f">Password lama (wajib bila mengganti username/password)</label>' + pwHtml('passwordLama', 'autocomplete="current-password"') + '</div>' +
    '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Simpan</button></div></form>', 'narrow');
};
FRM.akun = f => busy(f.querySelector('button[type=submit]'), async () => {
  const r = await Api.post('updateAkun', { nama: f.nama.value, username: f.username.value, passwordBaru: f.passwordBaru.value, passwordLama: f.passwordLama.value });
  Api.save(Api.token, Object.assign({}, Api.user, r)); await App.refreshCfg(); Modal.closeAll(); App.shell = ''; App.route(); toast('Akun diperbarui.', 'success');
});


// ---------- Versi, pembaruan, dan ajakan memasang aplikasi ----------
App.isStandalone = function () { try { return !!((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone); } catch (e) { return false; } };
App.backendVersi = '';
App.cekVersi = async function () {
  if (Api.token) try { const p = await Api.get('ping', {}); this.backendVersi = p.versi || 'lama'; const e = $('#srvVer'); if (e) e.textContent = this.backendVersi; if (p.versi !== APP_VERSI) this.versiMsg = 'Server Apps Script masih versi <b>' + esc(this.backendVersi) + '</b> sedangkan aplikasi <b>v' + APP_VERSI + '</b>. Fitur baru bisa error sampai <b>Kode.gs</b> terbaru ditempel lalu <b>Deploy → Manage deployments → Edit → New version</b>.'; } catch (e) { }
  try { const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }), v = await r.json(); if (v.versi && v.versi !== APP_VERSI) this.updateMsg = 'Versi aplikasi <b>v' + esc(v.versi) + '</b> tersedia.'; } catch (e) { }
  this.paintBanner();
};
App.paintBanner = function () {
  const b = $('#verBanner'); if (!b) return;
  const adm = this.isAdm && this.isAdm();
  b.innerHTML = (this.updateMsg ? '<div class="vbanner">' + ic('system_update', 'sm') + '<span>' + this.updateMsg + '</span><button class="btn sm" data-act="appReload">Muat ulang sekarang</button></div>' : '') + (adm && this.versiMsg ? '<div class="vbanner warn">' + ic('warning', 'sm') + '<span>' + this.versiMsg + '</span><a class="btn ghost sm" href="cek.html" target="_blank">Cek</a></div>' : '');
};
ACT.appReload = async () => {
  try { if ('serviceWorker' in navigator) (await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister()); if (window.caches) (await caches.keys()).forEach(k => caches.delete(k)); } catch (e) { }
  location.reload();
};
window.addEventListener('appinstalled', () => { localStorage.setItem('sibyan_pwa_tolak', '1'); toast('Aplikasi SIBYAN terpasang di layar utama.', 'success'); });

App.promptPwa = function () {
  const u = Api.user;
  if (!u || u.peran !== 'wali' || this.isStandalone() || sessionStorage.getItem('sibyan_pwa_tampil')) return;
  const t = localStorage.getItem('sibyan_pwa_tolak');
  if (t === '1' || (t && Date.now() - Number(t) < 7 * 864e5)) return;
  sessionStorage.setItem('sibyan_pwa_tampil', '1');
  const os = (Api.ctx() || {}).os;
  Modal.open('<div class="center"><img src="' + logoSrc() + '" alt="" width="64" height="64"><h2 style="margin:8px 0 4px">Pasang SIBYAN di HP Anda</h2><p class="mute">Lebih mudah mengecek tagihan dan kuitansi ananda kapan saja.</p></div>' +
    '<div style="margin:14px 0"><div class="bullet"><span>' + ic('bolt', 'sm') + ' Terbuka sekali ketuk dari layar utama</span></div><div class="bullet"><span>' + ic('receipt_long', 'sm') + ' Cek tagihan & kuitansi tanpa mengetik alamat</span></div><div class="bullet"><span>' + ic('data_saver_on', 'sm') + ' Gratis, tanpa Play Store, hemat memori</span></div></div>' +
    '<div id="pwaSteps" class="small mute hide" style="margin-bottom:10px"></div>' +
    '<div class="stack gap-s"><button class="btn deep block" data-act="pwaPasang">' + ic('install_mobile') + ' Pasang Sekarang</button><div class="row" style="gap:.5rem"><button class="btn ghost block" data-act="pwaNanti">Nanti saja</button><button class="btn ghost block" data-act="pwaTolak">Jangan tampilkan lagi</button></div></div>', 'narrow');
  this.pwaOs = os;
};
ACT.pwaPasang = async () => {
  if (window.__pwa) { try { window.__pwa.prompt(); const r = await window.__pwa.userChoice; window.__pwa = null; if (r && r.outcome === 'accepted') { Modal.closeAll(); return; } } catch (e) { } }
  const os = App.pwaOs, el = $('#pwaSteps'); el.classList.remove('hide');
  el.innerHTML = os === 'iPhone' ? '<b>iPhone / iPad (Safari):</b><br>1. Buka halaman ini di <b>Safari</b>.<br>2. Ketuk ikon <b>Bagikan</b> (kotak dengan panah ke atas).<br>3. Pilih <b>Tambah ke Layar Utama</b>, lalu ketuk <b>Tambah</b>.' :
    (os === 'Android' ? '<b>Android (Chrome):</b><br>1. Ketuk menu <b>⋮</b> di pojok kanan atas.<br>2. Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.<br>3. Ketuk <b>Instal</b>.' : '<b>Komputer:</b> klik ikon <b>pasang</b> di sebelah kanan kolom alamat peramban, atau menu ⋮ → <b>Instal SIBYAN</b>.');
};
ACT.pwaNanti = () => { localStorage.setItem('sibyan_pwa_tolak', String(Date.now())); Modal.closeAll(); };
ACT.pwaTolak = () => { localStorage.setItem('sibyan_pwa_tolak', '1'); Modal.closeAll(); };

(async function init() {
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    const had = !!navigator.serviceWorker.controller; let done = false;
    navigator.serviceWorker.register('sw.js?v=' + APP_VERSI).catch(() => { });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !done) { done = true; location.reload(); } });   // pembaruan aplikasi dimuat otomatis
  }
  if (!Api.configured) {
    $('#app').innerHTML = '<div class="wrap" style="max-width:560px;padding-top:3rem"><div class="card"><h2>Konfigurasi belum lengkap</h2><p class="mute" style="margin:8px 0">Buka berkas <b>js/config.js</b> lalu isi <b>GAS_URL</b> dengan URL Web App (berakhiran /exec) dari Google Apps Script, kemudian muat ulang halaman ini.</p></div></div>';
    return;
  }
  await App.boot();
  if (App.bootError) toast(App.bootError, 'error');
  App.route();
  App.cekVersi();
})();
