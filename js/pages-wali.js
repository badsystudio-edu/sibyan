/* ============================================================
 * DASBOR WALI (F12) — hanya data anak sendiri (dibatasi di server)
 * ============================================================ */
const Wali = {
  nis: sessionStorage.getItem('sibyan_wali_nis') || '', cache: {}, filter: 'semua',
  reset() { this.nis = ''; this.cache = {}; sessionStorage.removeItem('sibyan_wali_nis'); },
  children() { return (Api.user && Api.user.children) || []; },
  cur() { const c = this.children(); if (!c.length) return null; if (!c.some(x => x.nis === this.nis)) this.nis = c[0].nis; return c.find(x => x.nis === this.nis); },
  async data(force) {
    const c = this.cur(); if (!c) return null;
    if (force || !this.cache[c.nis]) this.cache[c.nis] = await Api.post('getSantri', { nis: c.nis });
    return this.cache[c.nis];
  },
  switcher() {
    const ch = this.children(), c = this.cur();
    if (!c) return '';
    if (ch.length < 2) return '<div class="card tight row" style="gap:.6rem;margin-bottom:12px">' + ic('school') + '<span>Santri: <b class="ok">' + esc(c.nama) + '</b></span></div>';
    return '<div class="pills" style="margin-bottom:12px">' + ch.map(x => '<button class="pill ' + (x.nis === c.nis ? 'on' : '') + '" data-act="waliPick" data-nis="' + esc(x.nis) + '">' + esc(x.nama.split(' ').slice(0, 2).join(' ')) + ' · ' + esc(x.kelas) + '</button>').join('') + '</div>';
  },
  empty() { return '<div class="card">' + emptyBox('link_off', 'Akun Anda belum terhubung ke data santri. Hubungi Bendahara pesantren.') + '</div>'; },

  async tagihan() {
    const d = await this.data(); if (!d) { $('#view').innerHTML = this.empty(); return; }
    const r = d.ringkas, s = d.santri, today = todayStr();
    const upcoming = d.bulanIni.filter(x => x.due >= today && x.status !== 'lunas')[0];
    const lbl = x => {
      if (x.status === 'lunas') return ['lunas', 'check', chip('Lunas', 'ok'), ''];
      if (x.status === 'tunggak') return ['tunggak', 'priority_high', chip('Terlewat', 'err'), 'Jatuh tempo'];
      if (x.status === 'sebagian') return ['sebagian', 'timelapse', chip('Sebagian', 'warn'), 'Sisa ' + rp(x.deficit)];
      if (upcoming && x.k === upcoming.k) return ['sekarang', 'schedule', chip('Pekan ini', 'warn'), 'Siap setor'];
      return ['belum', 'hourglass_empty', chip('Mendatang', 'info'), 'Belum aktif'];
    };
    $('#view').innerHTML = '<div class="fade">' + this.switcher() +
      '<div class="card" style="border-radius:1.75rem;background:linear-gradient(160deg,#fff,#ecfdf5)"><div class="row between">' + (r.tunggakan > 0 ? chip('Tunggakan ' + r.pekanTunggak + ' pekan', 'warn') : chip('Tidak ada tunggakan', 'ok', true)) + '<span class="small mute">' + esc(ymLabel(today.slice(0, 7))) + '</span></div>' +
      '<div class="small mute" style="margin-top:12px">TOTAL TAGIHAN SAAT INI</div><div class="num ' + (r.tunggakan > 0 ? '' : 'ok') + '" style="font-size:40px;line-height:46px;font-weight:700">' + rp(r.tunggakan) + '</div>' +
      '<div class="g2" style="margin-top:12px;gap:.5rem"><div class="card flat tight"><div class="small mute">SPP berjalan</div><b class="num">' + rp(r.berjalan) + '</b></div><div class="card flat tight"><div class="small mute">Tunggakan historis</div><b class="num ' + (r.historis > 0 ? 'warn' : 'ok') + '">' + rp(r.historis) + '</b></div></div>' +
      '<a class="btn deep block" style="margin-top:12px" data-act="waliWa">' + ic('chat') + ' Konfirmasi / Tanya Bendahara</a></div>' +
      (d.historis.length ? '<div class="card" style="margin-top:12px"><h3>' + ic('history') + 'Rincian tunggakan</h3><div style="margin-top:8px">' + d.historis.slice(-8).map(h => '<div class="bullet"><span>' + esc(ymLabel(h.periode)) + ' <span class="small mute">· ' + h.pekan + ' pekan</span></span><b class="num warn">' + rp(h.jumlah) + '</b></div>').join('') + '</div></div>' : '') +
      '<h2 style="margin:18px 0 8px">' + ic('event_repeat') + 'SPP Rutin Jumat (' + esc(ymLabel(today.slice(0, 7))) + ')</h2>' +
      d.bulanIni.map(x => { const l = lbl(x); return '<div class="wk ' + l[0] + '"><span class="dot">' + ic(l[1]) + '</span><div class="grow"><b>Pekan ' + x.k + '</b> ' + l[2] + '<div class="small mute">Jumat, ' + fmtTgl(x.due) + '</div></div><div class="right"><b class="num ' + (l[0] === 'tunggak' ? 'err' : '') + '">' + rp(x.tarif) + '</b><div class="small mute">' + esc(l[3]) + '</div></div></div>'; }).join('') +
      '<h2 style="margin:18px 0 8px">' + ic('volunteer_activism') + 'Iuran Program & Tahunan</h2>' +
      (d.iuran.length ? d.iuran.map(i => { const p = i.target > 0 ? Math.min(100, Math.round(i.dibayar / i.target * 100)) : (i.dibayar > 0 ? 100 : 0); return '<div class="card tight" style="margin-bottom:10px"><div class="row between">' + chip(i.status === 'lunas' ? 'Lunas' : (i.status === 'sebagian' ? 'Sebagian' : 'Belum dibayar'), i.status === 'lunas' ? 'ok' : (i.status === 'sebagian' ? 'warn' : 'gray')) + '<b class="num">' + rp(i.target) + '</b></div><h3 style="margin:6px 0 2px">' + esc(i.nama) + '</h3><p class="small mute">' + esc(i.deskripsi || '') + '</p><div class="bar" style="margin:8px 0"><i style="width:' + p + '%"></i></div><div class="row between small"><span class="mute">Dibayar ' + rp(i.dibayar) + '</span><b class="num ' + (i.target > i.dibayar ? 'warn' : 'ok') + '">' + (i.target > i.dibayar ? 'Sisa ' + rp(i.target - i.dibayar) : 'Tuntas') + '</b></div></div>'; }).join('') : '<div class="card tight small mute">Belum ada iuran program.</div>') +
      '<div class="note" style="margin-top:16px;flex-direction:column"><div class="row" style="gap:.5rem"><span class="avatar" style="background:var(--deep);color:#fff">' + ic('account_balance') + '</span><b>SOP Kasir Jumat & Validasi</b></div><p class="small">' + esc((App.cfg.settings.infoPembayaran || 'Pembayaran dilayani setiap hari Jumat di kantor Musholla.')) + '</p></div></div>';
  },

  async kuitansi() {
    const d = await this.data(); if (!d) { $('#view').innerHTML = this.empty(); return; }
    const ym = todayStr().slice(0, 7); let list = d.riwayat;
    if (this.filter === 'bulan') list = list.filter(x => x.tanggal.slice(0, 7) === ym); else if (this.filter === 'spp') list = list.filter(x => x.jenis === 'SPP'); else if (this.filter === 'iuran') list = list.filter(x => x.jenis === 'Iuran');
    const groups = {}; list.forEach(x => { (groups[x.tanggal.slice(0, 7)] = groups[x.tanggal.slice(0, 7)] || []).push(x); });
    $('#view').innerHTML = '<div class="fade">' + this.switcher() + '<div class="wali-hero"><div class="small" style="opacity:.85">' + ic('verified', 'sm') + ' Total setoran terverifikasi</div><div class="big">' + rp(d.totalDibayar) + '</div><div class="row between small" style="opacity:.9;border-top:1px solid rgba(255,255,255,.2);margin-top:10px;padding-top:8px"><span>Tercatat di buku kas pesantren</span><b>' + d.riwayat.length + ' transaksi</b></div></div>' +
      '<div class="card tight row between" style="margin:12px 0"><div class="row" style="gap:.6rem"><span class="avatar">' + ic('picture_as_pdf') + '</span><div><b>Rekap Kuitansi Tahunan</b><div class="small mute">Unduh PDF tahun ' + todayStr().slice(0, 4) + '</div></div></div><button class="btn deep sm" data-act="waliPdf">' + ic('download', 'sm') + ' PDF</button></div>' +
      '<div class="pills" style="margin-bottom:12px">' + [['semua', 'Semua'], ['bulan', 'Bulan ini'], ['spp', 'SPP Mingguan'], ['iuran', 'Iuran']].map(p => '<button class="pill ' + (this.filter === p[0] ? 'on' : '') + '" data-act="waliFilter" data-f="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>' +
      (list.length ? Object.keys(groups).sort().reverse().map(g => '<div class="row between small mute b" style="margin:14px 2px 6px"><span style="letter-spacing:.06em">' + esc(ymLabel(g).toUpperCase()) + '</span><span>' + groups[g].length + ' transaksi</span></div>' + groups[g].map(x => '<div class="card trx" style="margin-bottom:10px;padding:1rem"><div class="row" style="gap:.75rem;align-items:flex-start"><span class="avatar" style="background:' + (x.jenis === 'SPP' ? '#e0e7ff;color:#4338ca' : '#ffedd5;color:#c2410c') + '">' + ic(x.jenis === 'SPP' ? 'calendar_today' : 'menu_book') + '</span><div class="grow"><b>' + esc(x.judul) + '</b><div class="small mute">' + fmtTgl(x.tanggal) + ' ' + fmtJam(x.dibuat).replace(' WIB', '') + ' · ' + esc(x.metode) + '</div></div><div class="right"><b class="num" style="font-size:16px">' + rp(x.nominal) + '</b><div>' + chip('Lunas', 'ok', true) + '</div></div></div><button class="btn soft block sm" style="margin-top:10px" data-act="trxNota" data-id="' + esc(x.id) + '">' + ic('receipt_long', 'sm') + ' Lihat Struk</button></div>').join('')).join('') : '<div class="card">' + emptyBox('receipt_long', 'Belum ada transaksi pada filter ini.') + '</div>') +
      '<div class="note" style="margin-top:12px">' + ic('shield') + '<p class="small">Setiap transaksi terekam otomatis pada buku besar digital pesantren dan disahkan oleh Bendahara.</p></div></div>';
  },

  async kartu() {
    const d = await this.data(); if (!d) { $('#view').innerHTML = this.empty(); return; }
    await ensureFotos(d.santri.adaFoto ? [d.santri.nis] : []);
    const html = await ktsHtml(d.santri, Foto.m[d.santri.nis]); this.ktsHtml = html;
    $('#view').innerHTML = '<div class="fade">' + this.switcher() + '<h2 style="margin-bottom:12px">' + ic('badge') + 'Kartu Tanda Santri Digital</h2><div class="kgrid">' + html + '</div><div class="center" style="margin-top:14px"><button class="btn deep" data-act="waliPrintKts">' + ic('print') + ' Cetak Kartu</button></div><p class="hint center" style="margin-top:8px">QR pada kartu membuka pencarian cepat status santri di portal.</p></div>';
  },

  kontak() {
    const s = App.cfg.settings;
    $('#view').innerHTML = '<div class="fade stack"><div class="card center"><img src="' + logoSrc() + '" alt="" width="72" height="72"><h2 style="margin:8px 0 2px">' + esc(s.nama) + '</h2><p class="mute">' + esc(s.alamat || '') + '</p>' + (waNum(s.kontak) ? '<a class="btn deep block" style="margin-top:14px" data-act="waliWa">' + ic('chat') + ' Hubungi Bendahara via WhatsApp</a>' : '<p class="small mute" style="margin-top:12px">Kontak Bendahara belum diatur. Silakan datang langsung pada hari Jumat.</p>') + '</div>' +
      '<div class="card"><h3>' + ic('manage_accounts') + 'Akun</h3><p class="small mute" style="margin:6px 0 12px">Masuk sebagai <b>' + esc(Api.user.nama) + '</b> (' + esc(Api.user.username) + ')</p><div class="row wrap"><button class="btn soft" data-act="akunSaya">' + ic('key') + ' Ubah password</button><button class="btn danger" data-act="logout">' + ic('logout') + ' Keluar</button></div></div>' +
      '<div class="card tight"><div class="row" style="gap:.6rem"><span class="avatar">' + ic('install_mobile') + '</span><div class="grow"><b>Pasang di layar utama</b><p class="small mute">Buka SIBYAN seperti aplikasi biasa.</p></div><button class="btn soft sm" data-act="pwa">Pasang</button></div></div></div>';
  }
};
ACT.waliPick = el => { Wali.nis = el.dataset.nis; sessionStorage.setItem('sibyan_wali_nis', Wali.nis); App.route(); };
ACT.waliFilter = el => { Wali.filter = el.dataset.f; Wali.kuitansi(); };
ACT.waliWa = () => {
  const s = App.cfg.settings, c = Wali.cur(), d = c && Wali.cache[c.nis];
  if (!waNum(s.kontak)) { toast('Kontak Bendahara belum diatur.', 'error'); return; }
  window.open(waLink(s.kontak, "Assalamu'alaikum Ustadz. Saya wali dari " + (c ? c.nama : '') + (c ? ' (NIS ' + c.nis + ')' : '') + (d ? '. Tunggakan SPP tertera ' + rp(d.ringkas.tunggakan) : '') + '. Mohon konfirmasi pembayaran. Jazakumullahu khairan.'), '_blank');
};
ACT.waliPrintKts = () => printHtml('<div class="kgrid">' + Wali.ktsHtml + '</div>', 'cards');
ACT.waliPdf = el => busy(el, async () => {
  const d = await Wali.data(), th = todayStr().slice(0, 4), rows = d.riwayat.filter(x => x.tanggal.slice(0, 4) === th).slice().reverse();
  if (!rows.length) { toast('Belum ada transaksi pada tahun ini.', 'error'); return; }
  await exportPdf({ title: 'Rekap Kuitansi ' + th, sub: d.santri.nama + ' · NIS ' + d.santri.nis + ' · ' + d.santri.kelas, filename: 'rekap-kuitansi-' + d.santri.nis + '-' + th + '.pdf', head: [['Tanggal', 'No. Transaksi', 'Uraian', 'Metode', 'Nominal (Rp)']], body: rows.map(x => [fmtTgl(x.tanggal), x.id, x.judul, x.metode, NUM(x.nominal)]), foot: [['', '', '', 'TOTAL', NUM(rows.reduce((s, x) => s + x.nominal, 0))]], colStyles: { 4: { halign: 'right' } } });
});
