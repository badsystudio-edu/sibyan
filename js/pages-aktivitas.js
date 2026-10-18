/* ============================================================
 * AKTIVITAS WALI — pantau siapa yang sudah login dan mengecek tagihan/kuitansi
 * Dicatat server saat wali login atau membuka halaman (maks. 1x/10 menit per jenis).
 * Pengunjung beranda publik bersifat anonim dan tidak tercatat.
 * ============================================================ */
const AKSI_LBL = { login: ['Login', 'info'], cek_tagihan: ['Membuka tagihan', 'ok'], cek_kuitansi: ['Membuka kuitansi', 'ok'], cek_santri: ['Membuka data santri', 'gray'] };
const relHari = t => {
  if (!t) return null;
  const a = Date.UTC(+todayStr().slice(0, 4), +todayStr().slice(5, 7) - 1, +todayStr().slice(8, 10)), b = Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10)), n = Math.round((a - b) / 864e5);
  return n <= 0 ? 'Hari ini ' + t.slice(11, 16) : (n === 1 ? 'Kemarin ' + t.slice(11, 16) : n + ' hari lalu');
};
const Akt = {
  f: { kelas: '', status: '', q: '', urut: 'prioritas' }, d: null,
  async page() {
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">PEMANTAUAN AKSES</div><h1>Aktivitas Wali</h1><p class="mute">Lihat siapa yang sudah login dan mengecek tagihan anaknya, lalu ingatkan yang belum.</p></div><div class="acts"><button class="btn soft sm" data-act="aktBlast" data-s="belum_login">' + ic('campaign', 'sm') + ' Ajak yang belum login (Blast)</button><button class="btn soft sm" data-act="aktBlast" data-s="belum_cek">' + ic('notifications_active', 'sm') + ' Ingatkan yang menunggak & belum cek</button></div></div><div class="g4" id="aktKpi"></div>' +
      '<div class="card tight"><div class="row wrap" style="gap:.75rem"><div class="search grow" style="min-width:180px">' + ic('search') + '<input class="inp" data-in="aktQ" placeholder="Cari wali, username, atau nama santri…" value="' + esc(this.f.q) + '"></div><select class="inp" style="width:auto" data-ch="aktKelas">' + kelasOpts(this.f.kelas, 'Semua kelas') + '</select><select class="inp" style="width:auto" data-ch="aktStatus"><option value="">Semua status</option><option value="belum">Belum pernah login</option><option value="lama">Tidak aktif &gt; 14 hari</option><option value="aktif">Aktif</option><option value="perlu">Menunggak &amp; belum cek 7 hari</option></select><select class="inp" style="width:auto" data-ch="aktUrut"><option value="prioritas">Urut: prioritas penagihan</option><option value="aktif">Urut: terakhir aktif</option><option value="nama">Urut: nama</option></select></div></div>' +
      '<div class="card" id="aktList">' + skel(3) + '</div><div class="card"><h2>' + ic('history') + 'Aktivitas Terbaru</h2><div id="aktFeed" style="margin-top:8px"></div><p class="hint">Pembukaan berulang dalam 10 menit dihitung satu kali. Pengunjung beranda publik anonim, jadi tidak muncul di sini.</p></div></div>';
    await this.load();
  },
  async load() {
    const d = this.d = await Api.post('aktivitasWali', { kelas: this.f.kelas }), s = d.stats, k = (l, v, i, c, f) => '<div class="card stat" data-act="aktFilter" data-f="' + f + '" style="cursor:pointer"><span class="ico ' + c + '">' + ic(i) + '</span><span class="lab">' + l + '</span><span class="val">' + NUM(v) + '</span></div>';
    $('#aktKpi').innerHTML = k('Akun wali aktif', s.total, 'groups', '', '') + k('Sudah pernah login', s.pernahLogin + ' / ' + s.total, 'login', '', 'aktif') + k('Belum pernah login', s.belumLogin, 'person_off', 'e', 'belum') + k('Cek tagihan 7 hari', s.cek7, 'visibility', '', 'cek') + k('Menunggak & belum cek', s.perluDiingatkan, 'notifications_active', 'w', 'perlu') + k('Memasang aplikasi', s.pwa, 'install_mobile', '', 'pwa');
    this.draw();
    $('#aktFeed').innerHTML = d.recent.length ? '<div class="tw" style="max-height:300px;overflow:auto"><table class="tbl" style="min-width:0"><tbody>' + d.recent.map(x => { const l = AKSI_LBL[x.aksi] || [x.aksi, 'gray']; return '<tr><td class="small num" style="white-space:nowrap">' + esc(x.waktu.slice(5, 16)) + '</td><td><b>' + esc(x.nama) + '</b></td><td>' + chip(l[0], l[1]) + '</td><td class="small mute">' + esc(x.perangkat) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="small mute">Belum ada aktivitas wali tercatat. Aktivitas muncul setelah wali login.</p>';
  },
  draw() {
    const f = this.f, q = f.q.toLowerCase(); let rows = this.d.rows.filter(r => r.aktif);
    if (f.status === 'perlu') rows = rows.filter(r => r.tunggakan > 0 && (r.hariSejakCek === null || r.hariSejakCek > 7));
    else if (f.status === 'cek') rows = rows.filter(r => r.hariSejakCek !== null && r.hariSejakCek <= 7);
    else if (f.status === 'pwa') rows = rows.filter(r => r.pwa);
    else if (f.status) rows = rows.filter(r => r.status === f.status);
    if (q) rows = rows.filter(r => r.nama.toLowerCase().indexOf(q) >= 0 || r.username.toLowerCase().indexOf(q) >= 0 || r.anak.some(a => a.nama.toLowerCase().indexOf(q) >= 0));
    const prio = r => (r.tunggakan > 0 ? 2 : 0) + (r.hariSejakCek === null ? 1 : 0);
    rows.sort((a, b) => f.urut === 'nama' ? a.nama.localeCompare(b.nama) : (f.urut === 'aktif' ? (b.aktifTerakhir || '').localeCompare(a.aktifTerakhir || '') : (prio(b) - prio(a) || b.tunggakan - a.tunggakan)));
    this.rows = rows;
    $('#aktList').innerHTML = rows.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Wali</th><th>Anak</th><th class="r">Tunggakan</th><th>Terakhir login</th><th>Terakhir cek tagihan</th><th>Perangkat</th><th class="c">Ingatkan</th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr class="' + (r.tunggakan > 0 && (r.hariSejakCek === null || r.hariSejakCek > 7) ? 'tung' : '') + '"><td><b>' + esc(r.nama) + '</b><div class="small mute">' + esc(r.username) + '</div></td><td class="small">' + r.anak.map(a => esc(a.nama) + ' <span class="mute">(' + esc(a.kelas) + ')</span>').join('<br>') + '</td><td class="r">' + (r.tunggakan > 0 ? '<b class="num warn">' + rp(r.tunggakan) + '</b>' : '<span class="ok b">Lunas</span>') + '</td>' +
        '<td class="small">' + (r.loginTerakhir ? esc(relHari(r.loginTerakhir)) + '<div class="mute">' + r.jumlahLogin + 'x login</div>' : chip('Belum pernah', 'err')) + '</td>' +
        '<td class="small">' + (r.cekTagihan ? chip(relHari(r.cekTagihan), r.hariSejakCek <= 7 ? 'ok' : 'warn') + '<div class="mute">' + r.jumlahCek + 'x membuka</div>' : (r.loginTerakhir ? chip('Belum membuka tagihan', 'warn') : '<span class="mute">-</span>')) + '</td>' +
        '<td class="small">' + (r.perangkat ? esc(r.perangkat) : '<span class="mute">-</span>') + (r.pwa ? ' ' + chip('Aplikasi', 'ok') : '') + '</td><td class="c"><button class="btn soft icon sm" data-act="aktWa" data-i="' + i + '" ' + (waNum(r.hp) ? '' : 'disabled title="Nomor HP wali belum ada"') + '>' + ic('chat', 'sm') + '</button></td></tr>').join('') + '</tbody></table></div>' : emptyBox('visibility_off', 'Tidak ada akun wali pada filter ini.');
  }
};
INP.aktQ = debounce(el => { Akt.f.q = el.value; Akt.draw(); }, 300);
INP.aktKelas = el => { Akt.f.kelas = el.value; Akt.load(); };
INP.aktStatus = el => { Akt.f.status = el.value; Akt.draw(); };
INP.aktUrut = el => { Akt.f.urut = el.value; Akt.draw(); };
ACT.aktFilter = el => { Akt.f.status = el.dataset.f; const s = $('[data-ch=aktStatus]'); if (s) s.value = el.dataset.f; Akt.draw(); };
ACT.aktWa = el => {
  const r = Akt.rows[+el.dataset.i], link = location.origin + location.pathname;
  const t = !r.loginPertama
    ? "Assalamu'alaikum " + r.nama + ". Dari " + App.name() + ". Kini status SPP dan kuitansi ananda " + r.anak.map(a => a.nama).join(', ') + " bisa dicek langsung lewat aplikasi SIBYAN: " + link + "\nUsername Anda: " + r.username + "\nBila belum tahu password, silakan hubungi Bendahara. Jazakumullahu khairan."
    : "Assalamu'alaikum " + r.nama + ". Kami mengingatkan, tagihan SPP ananda " + r.anak.map(a => a.nama).join(', ') + (r.tunggakan > 0 ? " saat ini Rp " + NUM(r.tunggakan) : '') + " dapat dicek di aplikasi SIBYAN: " + link + " (username: " + r.username + "). Jazakumullahu khairan.";
  window.open(waLink(r.hp, t), '_blank');
};
ACT.aktBlast = el => { WA.tab = 'blast'; WA.preset = el.dataset.s; location.hash = '#/admin/wa'; };
