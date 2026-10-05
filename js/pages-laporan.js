/* ============================================================
 * LAPORAN (F10, F14) & PENGATURAN (F5, F15)
 * ============================================================ */
const Lap = {
  tab: 'trx', f: { tahun: '', bulan: '', jenis: 'semua', kelas: '', idIuran: '', q: '' }, data: null, tung: null, tungKelas: '',

  async page() {
    if (!this.f.tahun) { this.f.tahun = todayStr().slice(0, 4); this.f.bulan = String(+todayStr().slice(5, 7)); }
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">MODUL F10 · AUDIT</div><h1>Laporan Keuangan & Audit</h1></div><div class="seg"><button data-act="lapTab" data-t="trx" class="' + (this.tab === 'trx' ? 'on' : '') + '">Transaksi</button><button data-act="lapTab" data-t="tung" class="' + (this.tab === 'tung' ? 'on' : '') + '">Tunggakan</button>' + (App.isSuper() ? '<button data-act="lapTab" data-t="audit" class="' + (this.tab === 'audit' ? 'on' : '') + '">Log Audit</button>' : '') + '</div></div><div id="lapBody">' + skel(2) + '</div></div>';
    await this.load();
  },
  async load() {
    if (this.tab === 'trx') return this.loadTrx();
    if (this.tab === 'tung') return this.loadTung();
    return this.loadAudit();
  },

  // ----- Transaksi -----
  async loadTrx() {
    const f = this.f, box = $('#lapBody'), im = (App.cfg.iuranMaster || []);
    const filt = '<form class="card tight" data-form="lapFilter"><div class="fgrid c2" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));display:grid;gap:10px"><div><label class="f">Tahun</label><input class="inp" name="tahun" type="number" min="2000" max="2100" value="' + esc(f.tahun) + '"></div>' +
      '<div><label class="f">Bulan</label><select class="inp" name="bulan"><option value="">Setahun penuh</option>' + BLN.map((b, i) => '<option value="' + (i + 1) + '" ' + (String(f.bulan) === String(i + 1) ? 'selected' : '') + '>' + b + '</option>').join('') + '</select></div>' +
      '<div><label class="f">Jenis</label><select class="inp" name="jenis">' + [['semua', 'Semua'], ['spp', 'SPP'], ['iuran', 'Iuran'], ['pengeluaran', 'Pengeluaran']].map(x => '<option value="' + x[0] + '" ' + (f.jenis === x[0] ? 'selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
      '<div><label class="f">Kelas</label><select class="inp" name="kelas">' + kelasOpts(f.kelas, 'Semua kelas') + '</select></div>' +
      '<div><label class="f">Jenis iuran</label><select class="inp" name="idIuran"><option value="">Semua</option>' + im.map(m => '<option value="' + esc(m.id) + '" ' + (f.idIuran === m.id ? 'selected' : '') + '>' + esc(m.nama) + '</option>').join('') + '</select></div>' +
      '<div><label class="f">Nama / NIS santri</label><input class="inp" name="q" value="' + esc(f.q) + '"></div></div><div class="mf" style="justify-content:flex-start"><button class="btn deep" type="submit">' + ic('filter_alt') + ' Terapkan</button></div></form>';
    box.innerHTML = filt + '<div id="lapRes" style="margin-top:1rem">' + skel(2) + '</div>';
    const r = this.data = await Api.post('report', f), t = r.totals;
    $('#lapRes').innerHTML = '<div class="g4"><div class="card stat"><span class="lab">Pemasukan periode</span><span class="val ok">' + rp(t.masuk) + '</span></div><div class="card stat"><span class="lab">Pengeluaran periode</span><span class="val err">' + rp(t.keluar) + '</span></div><div class="card stat"><span class="lab">Selisih periode</span><span class="val">' + rp(t.selisih) + '</span></div><div class="card stat"><span class="lab">Saldo kas akhir</span><span class="val">' + rp(t.saldoKas) + '</span></div></div>' +
      '<div class="card" style="margin-top:1rem"><div class="row between wrap"><h2>' + ic('table_chart') + 'Rekap ' + esc(r.periode) + ' <span class="small mute" style="font-weight:400">(' + r.rows.length + ' baris)</span></h2><div class="acts"><button class="btn soft sm" data-act="lapXlsx">' + ic('table', 'sm') + ' Excel</button><button class="btn soft sm" data-act="lapPdf">' + ic('picture_as_pdf', 'sm') + ' PDF</button></div></div>' +
      (r.rows.length ? '<div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Tanggal</th><th>ID</th><th>Jenis</th><th>Uraian</th><th>Santri</th><th class="r">Masuk</th><th class="r">Keluar</th>' + (App.isSuper() ? '<th class="c">Aksi</th>' : '') + '</tr></thead><tbody>' +
        r.rows.map(x => '<tr><td class="small">' + fmtTgl(x.tanggal) + '</td><td class="small num">' + esc(x.id) + '</td><td>' + chip(x.jenis, x.jenis === 'SPP' ? 'ok' : (x.jenis === 'Iuran' ? 'info' : 'warn')) + '</td><td>' + esc(x.uraian) + '</td><td>' + (x.nama ? '<b>' + esc(x.nama) + '</b><div class="small mute">' + esc(x.kelas) + '</div>' : '') + '</td><td class="r num ok">' + (x.masuk ? rp(x.masuk) : '') + '</td><td class="r num err">' + (x.keluar ? rp(x.keluar) : '') + '</td>' +
          (App.isSuper() ? '<td class="c">' + (x.jenis !== 'Pengeluaran' ? '<button class="btn ghost icon sm" data-act="trxEdit" data-id="' + esc(x.id) + '">' + ic('edit', 'sm') + '</button><button class="btn danger icon sm" data-act="trxDel" data-id="' + esc(x.id) + '">' + ic('delete', 'sm') + '</button>' : '') + '</td>' : '') + '</tr>').join('') +
        '</tbody><tfoot><tr><td colspan="5" class="b">TOTAL</td><td class="r num b">' + rp(t.masuk) + '</td><td class="r num b">' + rp(t.keluar) + '</td>' + (App.isSuper() ? '<td></td>' : '') + '</tr></tfoot></table></div>' : emptyBox('inbox', 'Tidak ada transaksi pada filter ini.')) + '</div>';
  },
  rowsFlat() { return this.data.rows.map(x => ({ Tanggal: x.tanggal, 'ID Transaksi': x.id, Jenis: x.jenis, Uraian: x.uraian, Santri: x.nama, NIS: x.nis, Kelas: x.kelas, Masuk: x.masuk, Keluar: x.keluar, Metode: x.metode, Petugas: x.petugas })); },

  // ----- Tunggakan -----
  async loadTung() {
    const box = $('#lapBody');
    box.innerHTML = '<div class="card tight row between wrap"><div><label class="f">Kelas</label><select class="inp" data-ch="lapTungKelas" style="width:auto">' + kelasOpts(this.tungKelas, 'Semua kelas') + '</select></div><div class="acts"><button class="btn soft sm" data-act="tungXlsx">' + ic('table', 'sm') + ' Excel</button><button class="btn soft sm" data-act="tungPdf">' + ic('picture_as_pdf', 'sm') + ' PDF</button></div></div><div id="tungRes" style="margin-top:1rem">' + skel(2) + '</div>';
    const r = this.tung = await Api.post('tunggakan', { kelas: this.tungKelas });
    $('#tungRes').innerHTML = '<div class="g3"><div class="card stat"><span class="lab">Santri menunggak</span><span class="val">' + r.rows.length + '</span></div><div class="card stat"><span class="lab">Total tunggakan</span><span class="val warn">' + rp(r.total) + '</span></div></div><div class="card" style="margin-top:1rem">' +
      (r.rows.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Santri</th><th>Kelas</th><th>Rincian</th><th class="r">Tunggakan</th><th class="c">WA</th></tr></thead><tbody>' + r.rows.map((x, i) => '<tr><td><b>' + esc(x.nama) + '</b><div class="small mute">NIS ' + esc(x.nis) + '</div></td><td>' + esc(x.kelas) + '</td><td class="small" style="max-width:280px">' + esc(x.rincian.slice(-4).join(', ')) + (x.rincian.length > 4 ? ' …(+' + (x.rincian.length - 4) + ' bln)' : '') + '</td><td class="r"><b class="num warn">' + rp(x.tunggakan) + '</b><div class="small mute">' + x.pekanTunggak + ' pekan</div></td><td class="c"><button class="btn soft icon sm" data-act="tungWa" data-i="' + i + '" ' + (waNum(x.hpWali) ? '' : 'disabled title="Nomor HP belum ada"') + '>' + ic('chat', 'sm') + '</button></td></tr>').join('') + '</tbody></table></div>' : emptyBox('verified', 'Tidak ada tunggakan. Alhamdulillah!')) + '</div>';
  },
  async tunggakanModal(kelas, onlyNis) {
    const ld = Modal.open('<div class="center" style="padding:2rem"><span class="spin"></span> Menyiapkan daftar penerima…</div>');
    let r; try { r = await Api.post('tunggakan', { kelas: kelas || '' }); } catch (e) { Modal.close(ld.closest('.overlay')); toast(e.message, 'error'); return; }
    Modal.close(ld.closest('.overlay'));
    const rows = onlyNis ? r.rows.filter(x => onlyNis.has(x.nis)) : r.rows; this.waRows = rows;
    Modal.open(mHead('Pengingat Tunggakan via WhatsApp', rows.length + ' santri menunggak' + (kelas ? ' · ' + kelas : '')) + '<p class="small mute" style="margin-bottom:10px">WhatsApp akan terbuka dengan draf pesan. Tekan kirim di WhatsApp satu per satu.</p>' +
      (rows.length ? '<div style="max-height:55vh;overflow:auto">' + rows.map((x, i) => '<div class="bullet"><span><b>' + esc(x.nama) + '</b><span class="small mute"> · ' + esc(x.kelas) + '</span><br><span class="small warn b">' + rp(x.tunggakan) + '</span> <span class="small mute">' + x.pekanTunggak + ' pekan</span></span><button class="btn soft sm" data-act="waRow" data-i="' + i + '" ' + (waNum(x.hpWali) ? '' : 'disabled') + '>' + ic('send', 'sm') + ' ' + (waNum(x.hpWali) ? 'Kirim' : 'No HP kosong') + '</button></div>').join('') + '</div>' : emptyBox('verified', 'Tidak ada santri menunggak pada pilihan ini.')));
  },

  async loadAudit() {
    const r = await Api.post('auditList', {});
    $('#lapBody').innerHTML = '<div class="card"><h2>' + ic('shield') + 'Log Audit</h2><p class="small mute" style="margin-bottom:10px">300 aksi sensitif terakhir (hapus, ubah tarif, akun, impor).</p>' + (r.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>' + r.map(x => '<tr><td class="small num">' + esc(x.waktu) + '</td><td>' + esc(x.user) + '</td><td>' + chip(x.aksi, 'gray') + '</td><td class="small">' + esc(x.detail) + '</td></tr>').join('') + '</tbody></table></div>' : emptyBox('shield', 'Belum ada catatan.')) + '</div>';
  }
};
ACT.lapTab = el => { Lap.tab = el.dataset.t; $$('[data-act=lapTab]').forEach(b => b.classList.toggle('on', b === el)); $('#lapBody').innerHTML = skel(2); Lap.load().catch(e => toast(e.message, 'error')); };
FRM.lapFilter = f => { Object.assign(Lap.f, { tahun: f.tahun.value, bulan: f.bulan.value, jenis: f.jenis.value, kelas: f.kelas.value, idIuran: f.idIuran.value, q: f.q.value }); busy(f.querySelector('button[type=submit]'), () => Lap.loadTrx()); };
INP.lapTungKelas = el => { Lap.tungKelas = el.value; Lap.loadTung().catch(e => toast(e.message, 'error')); };
ACT.lapXlsx = el => busy(el, async () => { const r = Lap.rowsFlat(); if (!r.length) { toast('Tidak ada data untuk diekspor.', 'error'); return; } const t = Lap.data.totals; r.push({ Tanggal: 'TOTAL', Masuk: t.masuk, Keluar: t.keluar }); await exportXlsx('laporan-keuangan-' + Lap.data.periode + '.xlsx', 'Laporan', r); });
ACT.lapPdf = el => busy(el, async () => {
  const r = Lap.data; if (!r.rows.length) { toast('Tidak ada data untuk diekspor.', 'error'); return; }
  await exportPdf({ title: 'Laporan Keuangan', sub: 'Periode ' + r.periode + ' · dicetak ' + fmtTgl(todayStr()), landscape: true, filename: 'laporan-keuangan-' + r.periode + '.pdf', head: [['Tanggal', 'ID', 'Jenis', 'Uraian', 'Santri', 'Masuk', 'Keluar']], body: r.rows.map(x => [fmtTgl(x.tanggal), x.id, x.jenis, x.uraian, x.nama, x.masuk ? NUM(x.masuk) : '', x.keluar ? NUM(x.keluar) : '']), foot: [['', '', '', '', 'TOTAL', NUM(r.totals.masuk), NUM(r.totals.keluar)], ['', '', '', '', 'Saldo kas akhir', NUM(r.totals.saldoKas), '']], colStyles: { 5: { halign: 'right' }, 6: { halign: 'right' } } });
});
ACT.tungWa = el => waRemind(Lap.tung.rows[+el.dataset.i]);
ACT.waRow = el => waRemind(Lap.waRows[+el.dataset.i]);
ACT.tungXlsx = el => busy(el, async () => { const r = Lap.tung.rows; if (!r.length) { toast('Tidak ada data.', 'error'); return; } await exportXlsx('tunggakan-' + todayStr() + '.xlsx', 'Tunggakan', r.map(x => ({ NIS: x.nis, Nama: x.nama, Kelas: x.kelas, 'Nama Wali': x.namaWali, 'No HP Wali': x.hpWali, 'Pekan Tunggak': x.pekanTunggak, Tunggakan: x.tunggakan, Rincian: x.rincian.join('; ') }))); });
ACT.tungPdf = el => busy(el, async () => { const r = Lap.tung; if (!r.rows.length) { toast('Tidak ada data.', 'error'); return; } await exportPdf({ title: 'Daftar Tunggakan SPP', sub: (Lap.tungKelas || 'Semua kelas') + ' · dicetak ' + fmtTgl(todayStr()), filename: 'tunggakan-' + todayStr() + '.pdf', head: [['NIS', 'Nama', 'Kelas', 'Pekan', 'Tunggakan (Rp)']], body: r.rows.map(x => [x.nis, x.nama, x.kelas, x.pekanTunggak, NUM(x.tunggakan)]), foot: [['', '', '', 'TOTAL', NUM(r.total)]], colStyles: { 4: { halign: 'right' } } }); });
ACT.trxEdit = el => {
  const x = Lap.data.rows.find(r => r.id === el.dataset.id); if (!x) return;
  Modal.open(mHead('Ubah Transaksi', x.id + ' · ' + x.nama) + '<form data-form="trxEdit"><input type="hidden" name="id" value="' + esc(x.id) + '"><div class="fg"><label class="f">Nominal (Rp)</label><input class="inp num" type="number" name="nominal" min="1" value="' + (x.masuk || x.keluar) + '" required></div><div class="fg"><label class="f">Tanggal</label><input class="inp" type="date" name="tanggal" value="' + esc(x.tanggal) + '" required></div><div class="fg"><label class="f">Catatan alasan perubahan</label><input class="inp" name="catatan" maxlength="200"></div><p class="hint">Perubahan dicatat di Log Audit.</p><div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Simpan</button></div></form>', 'narrow');
};
FRM.trxEdit = f => busy(f.querySelector('button[type=submit]'), async () => { await Api.post('updateTransaksi', { id: f.id.value, nominal: f.nominal.value, tanggal: f.tanggal.value, catatan: f.catatan.value }); Modal.closeAll(); toast('Transaksi diubah.', 'success'); Lap.loadTrx(); });
ACT.trxDel = async el => { if (await confirmBox('Hapus transaksi <b>' + esc(el.dataset.id) + '</b>? Tunggakan santri dan saldo kas akan dihitung ulang. Tindakan dicatat di Log Audit.', 'Ya, hapus', true)) busy(null, async () => { await Api.post('deleteTransaksi', { id: el.dataset.id }); toast('Transaksi dihapus.', 'success'); Lap.loadTrx(); }); };

// ================= PENGATURAN (Super Admin) =================
const Pgt = {
  users: null,
  async page() {
    await App.refreshCfg(); const c = App.cfg, s = c.settings;
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">MODUL F5 & F15 · SUPER ADMIN</div><h1>Pengaturan</h1></div></div>' +
      '<div class="card"><h2>' + ic('domain') + 'Identitas Pesantren</h2><form data-form="pgtId" style="margin-top:12px"><div class="row" style="gap:1rem;margin-bottom:14px"><img src="' + logoSrc() + '" alt="" width="64" height="64" id="lgPrev" style="object-fit:contain"><div class="grow"><label class="f">Logo (JPG/PNG)</label><input type="file" class="inp" accept="image/*" data-ch="pgtLogo" style="padding:8px 12px"></div></div><div class="fgrid c2"><div class="fg"><label class="f">Nama pesantren</label><input class="inp" name="nama" value="' + esc(s.nama) + '" required></div><div class="fg"><label class="f">Kontak / WhatsApp Bendahara</label><input class="inp" name="kontak" value="' + esc(s.kontak) + '" inputmode="tel" placeholder="0812xxxxxxx"></div><div class="fg full"><label class="f">Alamat</label><input class="inp" name="alamat" value="' + esc(s.alamat) + '"></div>' +
      '<div class="fg"><label class="f">Saldo awal kas (Rp)</label><input class="inp num" type="number" name="saldoAwal" value="' + (s.saldoAwal || 0) + '"><p class="hint">Saldo kas sebelum aplikasi dipakai.</p></div><div class="fg full"><label class="f">Info pembayaran untuk wali</label><textarea class="inp" name="infoPembayaran">' + esc(s.infoPembayaran) + '</textarea></div><div class="fg full"><label class="f">Templat pesan pengingat WhatsApp</label><textarea class="inp" name="waTemplate">' + esc(s.waTemplate) + '</textarea><p class="hint">Variabel: {wali} {pesantren} {nama} {nis} {rincian} {total}</p></div></div><div class="mf"><button class="btn deep" type="submit">' + ic('save') + ' Simpan Identitas</button></div></form></div>' +
      '<div class="g2"><div class="card"><div class="row between"><h2>' + ic('school') + 'Master Kelas</h2><button class="btn soft sm" data-act="klsAdd">' + ic('add', 'sm') + ' Tambah</button></div><div class="tw" style="margin-top:10px"><table class="tbl" style="min-width:0"><tbody>' + c.kelas.map(k => '<tr><td><b>' + esc(k.nama) + '</b></td><td>' + chip(k.aktif === 'Y' ? 'Aktif' : 'Nonaktif', k.aktif === 'Y' ? 'ok' : 'gray') + '</td><td class="r"><button class="btn ghost icon sm" data-act="klsEdit" data-n="' + esc(k.nama) + '">' + ic('edit', 'sm') + '</button><button class="btn danger icon sm" data-act="klsDel" data-n="' + esc(k.nama) + '">' + ic('delete', 'sm') + '</button></td></tr>').join('') + '</tbody></table></div></div>' +
      '<div class="card"><div class="row between"><h2>' + ic('sell') + 'Tarif SPP per Pekan</h2><button class="btn soft sm" data-act="trfAdd">' + ic('add', 'sm') + ' Tarif Baru</button></div><p class="small mute">Tarif baru berlaku mulai tanggalnya; tagihan periode lama tetap memakai tarif lama.</p><div class="tw" style="margin-top:10px"><table class="tbl" style="min-width:0"><thead><tr><th>Kelas</th><th>Mulai</th><th class="r">Tarif</th><th></th></tr></thead><tbody>' + c.tarif.slice().sort((a, b) => a.kelas === b.kelas ? (a.mulai < b.mulai ? 1 : -1) : (a.kelas < b.kelas ? -1 : 1)).map(t => '<tr><td>' + (t.kelas === '*' ? '<i>Semua kelas</i>' : esc(t.kelas)) + '</td><td class="small">' + fmtTgl(t.mulai) + '</td><td class="r"><b class="num">' + rp(t.tarif) + '</b></td><td class="r"><button class="btn danger icon sm" data-act="trfDel" data-k="' + esc(t.kelas) + '" data-m="' + esc(t.mulai) + '">' + ic('delete', 'sm') + '</button></td></tr>').join('') + '</tbody></table></div></div></div>' +
      '<div class="card"><div class="row between wrap"><h2>' + ic('beach_access') + 'Libur & Bebas Bayar</h2><button class="btn soft sm" data-act="lbrAdd">' + ic('add', 'sm') + ' Tambah Libur</button></div><p class="small mute">Hari Jumat yang jatuh dalam rentang di bawah <b>tidak ditagih</b> (mis. bulan puasa & Idul Fitri, libur pesantren). Berlaku untuk semua kelas atau satu kelas.</p><div class="tw" style="margin-top:10px">' + ((c.libur || []).length ? '<table class="tbl" style="min-width:0"><thead><tr><th>Keterangan</th><th>Kelas</th><th>Rentang</th><th class="c">Jumat bebas</th><th></th></tr></thead><tbody>' + c.libur.slice().sort((a, b) => a.mulai < b.mulai ? 1 : -1).map(l => '<tr><td><b>' + esc(l.label) + '</b></td><td>' + (l.kelas === '*' ? '<i>Semua kelas</i>' : esc(l.kelas)) + '</td><td class="small">' + fmtTgl(l.mulai) + (l.sampai !== l.mulai ? ' – ' + fmtTgl(l.sampai) : '') + '</td><td class="c">' + chip(countJumat(l.mulai, l.sampai) + ' Jumat', 'info') + '</td><td class="r"><button class="btn ghost icon sm" data-act="lbrEdit" data-id="' + esc(l.id) + '">' + ic('edit', 'sm') + '</button><button class="btn danger icon sm" data-act="lbrDel" data-id="' + esc(l.id) + '">' + ic('delete', 'sm') + '</button></td></tr>').join('') + '</tbody></table>' : '<p class="small mute" style="padding:.5rem 0">Belum ada libur diatur.</p>') + '</div></div>' +
      '<div class="card"><div class="row between wrap"><h2>' + ic('group') + 'Akun Pengguna</h2><button class="btn deep sm" data-act="usrAdd">' + ic('person_add', 'sm') + ' Tambah Akun</button></div><div id="usrBox" style="margin-top:10px">' + skel(2, 48) + '</div></div></div>';
    this.loadUsers();
  },
  async loadUsers() {
    const u = this.users = await Api.post('listUsers', {}), box = $('#usrBox'); if (!box) return;
    box.innerHTML = '<div class="tw"><table class="tbl"><thead><tr><th>Nama / Username</th><th>Peran</th><th>Santri terkait</th><th>Status</th><th></th></tr></thead><tbody>' + u.map(x => '<tr><td><b>' + esc(x.nama) + '</b><div class="small mute">' + esc(x.username) + '</div></td><td>' + chip(x.peran.replace('_', ' '), x.peran === 'super_admin' ? 'info' : (x.peran === 'bendahara' ? 'warn' : 'ok')) + '</td><td class="small">' + esc(x.anak.join(', ') || '-') + '</td><td>' + chip(x.aktif ? 'Aktif' : 'Nonaktif', x.aktif ? 'ok' : 'gray', x.aktif) + '</td><td class="r"><button class="btn ghost icon sm" data-act="usrEdit" data-id="' + esc(x.id) + '">' + ic('edit', 'sm') + '</button></td></tr>').join('') + '</tbody></table></div>';
  }
};
INP.pgtLogo = async el => { const f = el.files[0]; if (!f) return; try { const url = await fileToDataUrl(f, 256, 'image/png'); el.closest('form').__logo = url; $('#lgPrev').src = url; } catch (e) { toast(e.message, 'error'); } };
FRM.pgtId = f => busy(f.querySelector('button[type=submit]'), async () => {
  const d = { nama: f.nama.value, alamat: f.alamat.value, kontak: f.kontak.value, saldoAwal: f.saldoAwal.value, infoPembayaran: f.infoPembayaran.value, waTemplate: f.waTemplate.value };
  if (f.__logo) d.logo = f.__logo;
  const r = await Api.post('saveSettings', d);
  if (d.logo) { localStorage.setItem('sibyan_logo', d.logo); localStorage.setItem('sibyan_logo_ver', r.logoVer); }
  await App.refreshCfg(); App.info = null; await App.boot(); App.shell = ''; toast('Identitas disimpan.', 'success'); App.route();
});
const klsForm = k => { k = k || {}; Modal.open(mHead(k.nama ? 'Ubah Kelas' : 'Tambah Kelas') + '<form data-form="klsSave"><input type="hidden" name="lama" value="' + esc(k.nama || '') + '"><div class="fg"><label class="f">Nama kelas / jenjang</label><input class="inp" name="nama" value="' + esc(k.nama || '') + '" required></div><div class="fg"><label class="f">Urutan</label><input class="inp" type="number" name="urut" value="' + (k.urut || '') + '"></div><label class="row small"><input type="checkbox" class="ck" name="aktif" ' + (k.aktif !== 'N' ? 'checked' : '') + '> Aktif (muncul di pilihan)</label><p class="hint">Kelas baru memakai tarif "Semua kelas" kecuali Anda atur tarif khusus. Mengubah nama otomatis memperbarui santri & tarif yang memakainya.</p><div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Simpan</button></div></form>', 'narrow'); };
ACT.klsAdd = () => klsForm();
ACT.klsEdit = el => klsForm(App.cfg.kelas.find(k => k.nama === el.dataset.n));
FRM.klsSave = f => busy(f.querySelector('button[type=submit]'), async () => {
  await Api.post('kelasSave', { namaLama: f.lama.value, nama: f.nama.value, urut: f.urut.value, aktif: f.aktif.checked });
  await App.refreshCfg(); Modal.close(f.closest('.overlay')); toast('Kelas "' + f.nama.value + '" disimpan.', 'success');
  if (App.parse().path === 'admin/pengaturan') Pgt.page();
  else $$('select[name=kelas]').forEach(sel => { if (sel.closest('[data-form=sanSave]')) { sel.innerHTML = kelasOpts(f.nama.value, '', true); sel.value = f.nama.value; } });
});
ACT.klsQuick = () => klsForm();
ACT.klsDel = async el => { if (await confirmBox('Hapus kelas <b>' + esc(el.dataset.n) + '</b>? (Gagal bila masih dipakai santri.)', 'Ya, hapus', true)) busy(null, async () => { await Api.post('kelasDelete', { nama: el.dataset.n }); toast('Kelas dihapus.', 'success'); Pgt.page(); }); };
ACT.trfAdd = () => Modal.open(mHead('Tarif SPP Baru') + '<form data-form="trfSave"><div class="fg"><label class="f">Kelas</label><select class="inp" name="kelas"><option value="*">Semua kelas</option>' + kelasOpts('', '', false) + '</select></div><div class="fg"><label class="f">Tarif per pekan (Rp)</label><input class="inp num" type="number" name="tarif" min="1" required></div><div class="fg"><label class="f">Berlaku mulai</label><input class="inp" type="date" name="mulai" value="' + todayStr() + '" required><p class="hint">Gunakan tanggal awal bulan agar rapi (mis. 1 bulan depan).</p></div><div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Simpan</button></div></form>', 'narrow');
FRM.trfSave = f => busy(f.querySelector('button[type=submit]'), async () => { await Api.post('tarifSave', { kelas: f.kelas.value, tarif: f.tarif.value, mulai: f.mulai.value }); Modal.closeAll(); toast('Tarif disimpan.', 'success'); Pgt.page(); });
ACT.trfDel = async el => { if (await confirmBox('Hapus tarif ini? Tagihan akan dihitung ulang memakai tarif yang tersisa.', 'Ya, hapus', true)) busy(null, async () => { await Api.post('tarifDelete', { kelas: el.dataset.k, mulai: el.dataset.m }); toast('Tarif dihapus.', 'success'); Pgt.page(); }); };
const usrForm = u => {
  u = u || {}; Modal.open(mHead(u.id ? 'Ubah Akun' : 'Tambah Akun') + '<form data-form="usrSave"><input type="hidden" name="id" value="' + esc(u.id || '') + '"><div class="fgrid c2"><div class="fg"><label class="f">Nama</label><input class="inp" name="nama" value="' + esc(u.nama || '') + '" required></div><div class="fg"><label class="f">Username / No. WA</label><input class="inp" name="username" value="' + esc(u.username || '') + '" autocapitalize="none" required></div>' +
    '<div class="fg"><label class="f">Peran</label><select class="inp" name="peran" data-ch="usrPeran">' + [['wali', 'Wali Santri'], ['bendahara', 'Bendahara'], ['super_admin', 'Super Admin']].map(p => '<option value="' + p[0] + '" ' + ((u.peran || 'wali') === p[0] ? 'selected' : '') + '>' + p[1] + '</option>').join('') + '</select></div><div class="fg"><label class="f">' + (u.id ? 'Reset password (opsional)' : 'Password awal') + '</label><input class="inp" name="password" type="text" autocomplete="off" minlength="6" ' + (u.id ? '' : 'required') + '></div>' +
    '<div class="fg full" id="usrNis" ' + ((u.peran || 'wali') === 'wali' ? '' : 'hidden') + '><label class="f">NIS santri (pisahkan koma jika kakak-adik)</label><input class="inp" name="nisList" value="' + esc((u.nisList || []).join(', ')) + '" placeholder="20240001, 20240002"><p class="hint">NIS ada di menu Data Santri.</p></div></div>' + (u.id ? '<label class="row small"><input type="checkbox" class="ck" name="aktif" ' + (u.aktif ? 'checked' : '') + '> Akun aktif</label>' : '') +
    '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Simpan</button></div></form>', 'wide');
};
ACT.usrAdd = () => usrForm();
ACT.usrEdit = el => usrForm(Pgt.users.find(u => u.id === el.dataset.id));
INP.usrPeran = el => { $('#usrNis').hidden = el.value !== 'wali'; };
FRM.usrSave = f => busy(f.querySelector('button[type=submit]'), async () => { await Api.post('saveUser', { id: f.id.value, nama: f.nama.value, username: f.username.value, peran: f.peran.value, password: f.password.value, nisList: f.nisList.value, aktif: f.aktif ? f.aktif.checked : true }); Modal.closeAll(); toast('Akun disimpan.', 'success'); Pgt.loadUsers(); });

// ---------- Libur / bebas bayar ----------
function countJumat(a, b) {
  let n = 0, d = new Date(a + 'T00:00:00Z'); const e = new Date(b + 'T00:00:00Z');
  for (let i = 0; d <= e && i < 800; i++, d = new Date(d.getTime() + 864e5)) if (d.getUTCDay() === 5) n++;
  return n;
}
const lbrForm = l => {
  l = l || {}; const t = todayStr();
  Modal.open(mHead(l.id ? 'Ubah Libur / Bebas Bayar' : 'Tambah Libur / Bebas Bayar') + '<form data-form="lbrSave"><input type="hidden" name="id" value="' + esc(l.id || '') + '">' +
    '<div class="fg"><label class="f">Keterangan *</label><input class="inp" name="label" value="' + esc(l.label || '') + '" required maxlength="100" placeholder="mis. Libur Ramadhan & Idul Fitri"></div>' +
    '<div class="fg"><label class="f">Berlaku untuk</label><select class="inp" name="kelas"><option value="*">Semua kelas</option>' + kelasOpts(l.kelas, '', false) + '</select></div>' +
    '<div class="fg"><label class="f">Pintasan: pilih satu bulan penuh</label><input class="inp" type="month" data-ch="lbrBulan"><p class="hint">Mengisi tanggal mulai & sampai otomatis. Untuk rentang lintas bulan (mis. 1 Ramadhan s.d. Idul Fitri), isi tanggalnya langsung di bawah.</p></div>' +
    '<div class="fgrid c2"><div class="fg"><label class="f">Mulai</label><input class="inp" type="date" name="mulai" value="' + esc(l.mulai || t) + '" required></div><div class="fg"><label class="f">Sampai</label><input class="inp" type="date" name="sampai" value="' + esc(l.sampai || l.mulai || t) + '" required></div></div>' +
    '<p class="hint">Cukup satu hari (mulai = sampai) untuk libur satu Jumat. Hanya <b>hari Jumat</b> dalam rentang yang dibebaskan.</p><div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Simpan</button></div></form>', 'narrow');
};
ACT.lbrAdd = () => lbrForm();
ACT.lbrEdit = el => lbrForm(App.cfg.libur.find(l => l.id === el.dataset.id));
INP.lbrBulan = el => {
  if (!/^\d{4}-\d{2}$/.test(el.value)) return; const y = +el.value.slice(0, 4), m = +el.value.slice(5, 7), f = el.closest('form');
  f.mulai.value = el.value + '-01'; f.sampai.value = el.value + '-' + String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0');
};
FRM.lbrSave = f => busy(f.querySelector('button[type=submit]'), async () => {
  await Api.post('liburSave', { id: f.id.value, label: f.label.value, kelas: f.kelas.value, mulai: f.mulai.value, sampai: f.sampai.value });
  Modal.closeAll(); toast('Libur disimpan. Tagihan dihitung ulang otomatis.', 'success'); Pgt.page();
});
ACT.lbrDel = async el => { if (await confirmBox('Hapus libur ini? Hari Jumat dalam rentang tersebut akan kembali ditagih dan tunggakan dihitung ulang.', 'Ya, hapus', true)) busy(null, async () => { await Api.post('liburDelete', { id: el.dataset.id }); toast('Libur dihapus.', 'success'); Pgt.page(); }); };
