/* ============================================================
 * HALAMAN PUBLIK — beranda pencarian & login
 * Pencarian publik hanya menampilkan nama, NIS, kelas, status SPP ringkas.
 * ============================================================ */
const Pub = {
  q: '', kelas: '', res: null, loading: false,

  header() {
    const u = Api.user;
    return '<header class="pub-head"><div class="in"><a class="brand" href="#/"><img src="' + logoSrc() + '" alt=""><div><b>SIBYAN</b><small>' + esc(App.name()) + '</small></div></a><span class="grow"></span>' +
      (u ? '<a class="btn deep sm" href="#' + App.homeOf(u) + '">' + ic('dashboard') + ' Dasbor</a>' : '<a class="btn deep sm" href="#/login">' + ic('person') + ' Masuk Portal</a>') + '</div></header>';
  },

  loginForm() {
    return '<form data-form="login" autocomplete="on"><div class="fg"><label class="f" for="lg-u">Username / No. WhatsApp</label><input class="inp" id="lg-u" name="username" autocomplete="username" autocapitalize="none" required placeholder="mis. admin atau 0812xxxx"></div>' +
      '<div class="fg"><label class="f" for="lg-p">Password</label><input class="inp" id="lg-p" name="password" type="password" autocomplete="current-password" required placeholder="Password akun"></div>' +
      '<button class="btn deep block" type="submit">' + ic('login') + ' Masuk</button><p class="hint center" style="margin-top:10px">Akun wali dibuat oleh pengurus pesantren. Lupa password? Hubungi Bendahara.</p></form>';
  },

  async home(params) {
    const kelas = (App.info && App.info.kelas) || [];
    $('#app').innerHTML = this.header() +
      '<section class="pub-hero"><div class="wrap" style="padding-top:0;padding-bottom:0"><span class="chip chip-ok">' + ic('verified_user', 'sm') + ' Portal resmi · transparansi publik</span>' +
      '<h1>Ahlan wa Sahlan di <span>Portal SIBYAN</span></h1><p class="mute" style="max-width:640px">Transparansi administrasi dan status SPP santri ' + esc(App.name()) + ', secara mandiri, akurat, dan aman.</p>' +
      '<form class="searchbox" data-form="pubSearch"><div class="search">' + ic('search') + '<input class="inp" id="pq" name="q" placeholder="Ketik nama santri atau NIS lengkap…" autocomplete="off" value="' + esc(this.q) + '"></div><button class="btn deep" style="padding:13px 26px" type="submit">Periksa Data ' + ic('arrow_forward', 'sm') + '</button>' +
      '<div class="chips row wrap"><span class="small mute b">FILTER JENJANG:</span><button type="button" class="pill ' + (!this.kelas ? 'on' : '') + '" data-act="pubKelas" data-k="">Semua Santri</button>' +
      kelas.map(k => '<button type="button" class="pill ' + (this.kelas === k ? 'on' : '') + '" data-act="pubKelas" data-k="' + esc(k) + '">' + esc(k) + '</button>').join('') + '</div></form></div></section>' +
      '<div class="wrap"><div class="pub-grid"><div class="stack"><div class="note"><div class="ico">' + ic('lock') + '</div><div><h3>Protokol Keamanan Data Santri (Mode Tamu)</h3><p class="small mute" style="margin-top:4px">Untuk melindungi privasi keluarga santri, <b>nominal rupiah, riwayat transaksi, alamat, nomor kontak wali, dan foto</b> hanya dapat diakses melalui login Wali Santri resmi.</p></div></div>' +
      '<div id="pubRes"></div></div>' +
      '<aside class="stack">' + (Api.user ? '<div class="card"><h3>' + ic('verified_user') + ' Anda sudah masuk</h3><p class="small mute" style="margin:6px 0 12px">Sebagai ' + esc(Api.user.nama) + '.</p><a class="btn deep block" href="#' + App.homeOf(Api.user) + '">Buka Dasbor</a></div>' : '<div class="card"><h3>' + ic('key') + ' Akses Masuk</h3><p class="small mute" style="margin:6px 0 14px">Wali santri, Bendahara, dan Super Admin masuk di sini untuk melihat rincian lengkap.</p>' + this.loginForm() + '</div>') +
      '<div class="card tight row" style="gap:.75rem"><span class="avatar">' + ic('install_mobile') + '</span><div class="grow"><b>Pasang sebagai aplikasi di HP</b><p class="small mute">Ringan dan hemat memori, tanpa Play Store.</p></div><button class="btn soft sm" data-act="pwa">Pasang</button></div>' +
      '<div class="card tight row" style="gap:.75rem"><span class="avatar">' + ic('event_repeat') + '</span><div><b>SPP Rutin Setiap Hari Jumat</b><p class="small mute">Iuran mingguan berkah ba\'da sholat Jumat di kantor Musholla.</p></div></div>' +
      '<div class="card tight row" style="gap:.75rem"><span class="avatar">' + ic('chat') + '</span><div><b>Pengingat via WhatsApp</b><p class="small mute">Bendahara dapat mengirim rincian tunggakan langsung ke WhatsApp wali.</p></div></div>' +
      (App.info && App.info.alamat ? '<div class="note" style="background:var(--info-bg)"><div><b>' + esc(App.name()) + '</b><p class="small mute">' + esc(App.info.alamat) + '</p></div></div>' : '') + '</aside></div></div>' +
      '<div class="hadith"><div class="ar" lang="ar" dir="rtl">خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ</div><p class="small mute" style="margin-top:6px"><i>"Sebaik-baik manusia adalah yang paling bermanfaat bagi sesamanya."</i></p></div>' +
      '<footer class="foot">© ' + new Date().getFullYear() + ' ' + esc(App.name()) + '. Sistem Informasi Bayar dan Administrasi Santri.</footer>';
    if (params && params.get('nis')) { this.q = params.get('nis'); $('#pq').value = this.q; this.search(); }
    else if (this.res) this.renderRes();
  },

  async search() {
    const q = this.q.trim();
    if (q.length < 3) { toast('Ketik minimal 3 huruf nama, atau NIS lengkap.', 'error'); return; }
    $('#pubRes').innerHTML = '<h2 style="margin-bottom:12px">Hasil Pencarian</h2>' + skel(2, 84);
    try { this.res = await Api.get('publicSearch', { q: q, kelas: this.kelas }); this.renderRes(); }
    catch (e) { $('#pubRes').innerHTML = '<div class="card">' + emptyBox('error', e.message) + '</div>'; }
  },
  renderRes() {
    const r = this.res, box = $('#pubRes'); if (!box) return;
    if (!r.items.length) { box.innerHTML = '<div class="card">' + emptyBox('person_search', 'Santri tidak ditemukan. Periksa ejaan nama atau NIS.') + '</div>'; return; }
    box.innerHTML = '<div class="row between" style="margin-bottom:12px"><h2>Hasil Pencarian <span class="small mute" style="font-weight:400">(' + r.total + ' data)</span></h2>' + chip('Publik terproteksi', 'warn') + '</div>' +
      r.items.map(s => '<div class="card tight fade" style="margin-bottom:12px"><div class="result"><div class="row" style="gap:.75rem;align-items:flex-start"><span class="avatar">' + ic('school') + '</span><div><div class="row wrap"><h3>' + esc(s.nama) + '</h3>' + chip('Aktif', 'ok', true) + '</div><p class="small mute">NIS: <span class="num">' + esc(s.nis) + '</span> · ' + esc(s.kelas) + '</p></div></div><div>' + sppChip(s.pekanTunggak, s.lunas) + '</div></div></div>').join('') +
      (r.total > r.items.length ? '<p class="hint">Menampilkan ' + r.items.length + ' dari ' + r.total + ' hasil. Persempit pencarian dengan nama lengkap atau NIS.</p>' : '') +
      '<p class="hint">Rincian nominal, riwayat, dan foto tersedia setelah login.</p>';
  },

  async login() {
    $('#app').innerHTML = this.header() + '<div class="wrap" style="max-width:440px;padding-top:2rem"><div class="card"><div class="center" style="margin-bottom:1rem"><img src="' + logoSrc() + '" alt="" width="72" height="72"><h1 style="font-size:24px;margin-top:8px">Masuk ke SIBYAN</h1><p class="small mute">' + esc(App.name()) + '</p></div>' + this.loginForm() + '</div></div>';
  }
};
ACT.pubKelas = el => { Pub.kelas = el.dataset.k; $$('[data-act=pubKelas]').forEach(b => b.classList.toggle('on', b === el)); if (Pub.q.trim().length >= 3) Pub.search(); };
FRM.pubSearch = f => { Pub.q = f.q.value; Pub.search(); };
INP.pq = null;
ACT.pwa = () => {
  if (window.__pwa) { window.__pwa.prompt(); window.__pwa = null; }
  else toast('Buka menu peramban (⋮ atau Bagikan) lalu pilih "Tambahkan ke layar utama".');
};
FRM.login = f => busy(f.querySelector('button[type=submit]'), async () => {
  const r = await Api.post('login', { username: f.username.value, password: f.password.value });
  Api.save(r.token, r.user);
  await App.boot(true);
  location.hash = '#' + App.homeOf(r.user);
  toast('Selamat datang, ' + r.user.nama, 'success');
});
