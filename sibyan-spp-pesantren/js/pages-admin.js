/* ============================================================
 * DASBOR ADMIN — F11: metrik, grafik tren, kepatuhan, transaksi terkini
 * ============================================================ */
const Adm = {
  charts: [], d: null,
  destroyCharts() { this.charts.forEach(c => { try { c.destroy(); } catch (e) { } }); this.charts = []; },

  async dashboard() {
    const d = this.d = await Api.post('dashboard', {});
    const growth = d.masukBulanLalu > 0 ? Math.round((d.masukBulan - d.masukBulanLalu) / d.masukBulanLalu * 100) : null;
    const pct = d.totalAktif ? Math.round(d.lunasPekan / d.totalAktif * 100) : 0;
    const kb = Object.keys(d.keluarBulan || {});
    $('#view').innerHTML = '<div class="fade stack">' +
      '<div class="ph"><div><div class="eyebrow">SIBYAN CORE · ' + esc(ymLabel(d.periode)) + '</div><h1>Ikhtisar Kas & SPP</h1></div><div class="chip chip-ok">' + ic('event', 'sm') + ' Periode aktif: ' + esc(ymLabel(d.periode)) + '</div></div>' +
      '<div class="hero"><div class="row between wrap" style="gap:1rem"><div><h3>Pintasan Operasional Kasir</h3><p class="small mute">Aksi cepat Bendahara untuk setoran pekanan.</p></div><div class="acts">' +
      '<a class="btn deep" href="#/admin/spp">' + ic('bolt') + ' Tandai Lunas Massal Hari Jumat</a><button class="btn soft" data-act="dbBeban">' + ic('add') + ' Catat Beban Operasional</button>' +
      '<button class="btn soft" data-act="dbWa">' + ic('send') + ' Kirim Pengingat WA Massal</button><a class="btn soft" href="#/admin/laporan">' + ic('download') + ' Ekspor Laporan (Excel/PDF)</a></div></div></div>' +
      '<div class="g4">' +
      '<div class="card stat"><span class="ico">' + ic('trending_up') + '</span><span class="lab">Pemasukan SPP & iuran</span><span class="small mute">Bulan ini (' + esc(ymLabel(d.periode)) + ')</span><span class="val">' + rp(d.masukBulan) + '</span>' + (growth === null ? '<span class="small mute">Belum ada pembanding bulan lalu</span>' : '<span class="small ' + (growth >= 0 ? 'ok' : 'err') + ' b">' + (growth >= 0 ? '↑ +' : '↓ ') + growth + '% <span class="mute" style="font-weight:400">dibanding bulan lalu (' + rp(d.masukBulanLalu) + ')</span></span>') + '</div>' +
      '<div class="card stat"><span class="ico w">' + ic('warning') + '</span><span class="lab" style="color:var(--amber-d)">Perlu penagihan</span><span class="small mute">Total tunggakan historis santri</span><span class="val warn">' + rp(d.tunggakan) + '</span><span class="small mute">' + d.tunggakSantri + ' santri · dihitung otomatis sejak masuk</span></div>' +
      '<div class="card stat"><span class="ico">' + ic('account_balance') + '</span><span class="lab">Kas tunai & bank</span><span class="small mute">Saldo kas pesantren saat ini</span><span class="val ok">' + rp(d.saldo) + '</span><span class="small mute">Pemasukan dikurangi pengeluaran</span></div>' +
      '<div class="card stat"><span class="ico">' + ic('calendar_month') + '</span><span class="lab">Jumat pekan ke-' + d.pekanKe + '</span><span class="small mute">Status lunas pekan ini</span><span class="val">' + d.lunasPekan + ' <span class="mute" style="font-size:16px;font-weight:500">/ ' + d.totalAktif + ' santri</span></span><div class="bar"><i style="width:' + pct + '%"></i></div><span class="small mute">' + pct + '% · terkumpul ' + rp(d.terkumpulPekan) + '</span></div></div>' +
      '<div class="split"><div class="card"><div class="row between wrap"><div><h2>' + ic('bar_chart') + 'Arus Kas Bulanan</h2><p class="small mute">Pemasukan SPP & iuran vs pengeluaran, 6 bulan terakhir</p></div></div><div class="chartbox" style="margin-top:12px"><canvas id="chArus"></canvas></div>' +
      (kb.length ? '<div class="row wrap" style="margin-top:10px">' + kb.map(k => '<span class="chip chip-gray">' + esc(k) + ': <b class="num">' + rp(d.keluarBulan[k]) + '</b></span>').join('') + '</div>' : '') + '</div>' +
      '<div class="card"><h2>' + ic('donut_large') + 'Kepatuhan SPP</h2><p class="small mute" style="margin-bottom:10px">Santri aktif tanpa tunggakan</p><div class="donut"><canvas id="chDon"></canvas><div class="mid"><b>' + d.totalAktif + '</b><span class="small mute">TOTAL SANTRI</span></div></div><div style="margin-top:14px">' +
      d.kelas.map(k => { const p = k.total ? Math.round(k.patuh / k.total * 100) : 0; return '<div class="bullet"><span class="b">' + esc(k.kelas) + '</span><span class="small"><b class="num">' + k.patuh + ' / ' + k.total + '</b> ' + chip(p + '%', p >= 85 ? 'ok' : 'warn') + '</span></div>'; }).join('') +
      (d.tunggakSantri ? '<div class="note" style="background:var(--warn-bg);margin-top:8px;padding:.75rem">' + ic('notifications_active', 'warn') + '<p class="small"><b>' + d.tunggakSantri + ' santri</b> memiliki tunggakan. Siap dikirim pengingat WhatsApp.</p></div>' : '') + '</div></div></div>' +
      '<div class="card"><div class="row between wrap"><div><h2>' + ic('receipt_long') + 'Arus Transaksi Terkini</h2><p class="small mute">10 pembayaran terakhir yang tercatat</p></div></div>' + this.trxTable(d.recent) + '</div></div>';
    this.drawCharts(d);
  },
  trxTable(rows) {
    if (!rows.length) return emptyBox('receipt_long', 'Belum ada transaksi tercatat.');
    return '<div class="tw"><table class="tbl"><thead><tr><th>ID / Waktu</th><th>Santri</th><th>Kategori</th><th class="r">Nominal</th><th>Petugas</th><th class="c">Nota</th></tr></thead><tbody>' +
      rows.map(t => '<tr><td><b class="num ok">' + esc(t.id) + '</b><div class="small mute">' + fmtTgl(t.tanggal) + ' ' + fmtJam(t.dibuat) + '</div></td><td><b>' + esc(t.nama) + '</b><div class="small mute">NIS ' + esc(t.nis) + ' · ' + esc(t.kelas) + '</div></td><td>' + chip(t.uraian, t.jenis === 'SPP' ? 'ok' : 'warn') + '</td><td class="r"><b class="num">' + rp(t.nominal) + '</b><div class="small ok">LUNAS · ' + esc(t.metode) + '</div></td><td>' + esc(t.petugas) + '</td><td class="c"><button class="btn soft icon sm" data-act="trxNota" data-id="' + esc(t.id) + '" aria-label="Lihat nota">' + ic('receipt') + '</button></td></tr>').join('') + '</tbody></table></div>';
  },
  async drawCharts(d) {
    try { await Lib.load('chart'); } catch (e) { toast(e.message, 'error'); return; }
    const a = $('#chArus'), b = $('#chDon'); if (!a || !b) return;
    Chart.defaults.font.family = "'Hanken Grotesk',sans-serif";
    const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '') + ' jt' : (v >= 1e3 ? Math.round(v / 1e3) + ' rb' : v);
    this.charts.push(new Chart(a, {
      data: {
        labels: d.bulan.map(x => x.label), datasets: [
          { type: 'bar', label: 'Pemasukan', data: d.bulan.map(x => x.masuk), backgroundColor: '#0f5132', borderRadius: 8, maxBarThickness: 36 },
          { type: 'bar', label: 'Pengeluaran', data: d.bulan.map(x => x.keluar), backgroundColor: '#f59e0b', borderRadius: 8, maxBarThickness: 36 },
          { type: 'line', label: 'Selisih', data: d.bulan.map(x => x.masuk - x.keluar), borderColor: '#10b981', backgroundColor: '#10b981', tension: .35, pointRadius: 3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + rp(c.parsed.y) } } }, scales: { y: { beginAtZero: true, ticks: { callback: fmt }, grid: { color: 'rgba(15,23,42,.06)' } }, x: { grid: { display: false } } } }
    }));
    const patuh = d.kelas.reduce((s, k) => s + k.patuh, 0), tot = d.kelas.reduce((s, k) => s + k.total, 0);
    this.charts.push(new Chart(b, { type: 'doughnut', data: { labels: ['Tanpa tunggakan', 'Ada tunggakan'], datasets: [{ data: [patuh, Math.max(0, tot - patuh)], backgroundColor: ['#10b981', '#f59e0b'], borderWidth: 0 }] }, options: { cutout: '72%', plugins: { legend: { display: false } } } }));
  }
};
ACT.trxNota = el => Receipt.show(el.dataset.id);
ACT.dbBeban = () => Keu.pengeluaranForm();
ACT.dbWa = () => Lap.tunggakanModal();
