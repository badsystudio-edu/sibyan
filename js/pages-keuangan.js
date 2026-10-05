/* ============================================================
 * KEUANGAN — F6 SPP mingguan, F8 iuran, F9 pengeluaran
 * ============================================================ */
const shortRp = n => n >= 1000 ? Math.round(n / 1000) + 'k' : String(n);
const KAT = ['Listrik', 'Air', 'Kebersihan', 'Pemeliharaan', 'Konsumsi', 'Honor/Insentif', 'Perlengkapan', 'Kegiatan', 'Lainnya'];

async function refreshView() {
  const p = App.parse().path;
  if (p === 'admin/spp') await Spp.load(); else if (p === 'admin/dashboard') { Adm.destroyCharts(); await Adm.dashboard(); } else if (p === 'admin/santri') await San.load(); else if (p === 'admin/iuran') await Keu.load();
}
const payFields = (metode) => '<div class="fgrid c2"><div class="fg"><label class="f">Tanggal bayar</label><input class="inp" type="date" name="tanggal" value="' + todayStr() + '" required></div><div class="fg"><label class="f">Metode</label><select class="inp" name="metode">' + ['Tunai', 'Transfer', 'QRIS'].map(m => '<option ' + (m === metode ? 'selected' : '') + '>' + m + '</option>').join('') + '</select></div></div><div class="fg"><label class="f">Catatan (opsional)</label><input class="inp" name="catatan" maxlength="200"></div>';

// pemilih santri (autocomplete)
const pickerHtml = () => '<div class="picker fg"><label class="f">Santri *</label><input class="inp" data-in="pick" placeholder="Ketik nama atau NIS…" autocomplete="off"><input type="hidden" name="nis"><div class="pick-res" style="margin-top:6px"></div></div>';
INP.pick = debounce(async el => {
  const p = el.closest('.picker'), q = el.value.trim(), box = p.querySelector('.pick-res'); p.querySelector('[name=nis]').value = '';
  if (q.length < 2) { box.innerHTML = ''; return; }
  try {
    const r = await Api.post('listSantri', { q: q, pageSize: 6, status: 'aktif' });
    box.innerHTML = r.items.map(s => '<button type="button" class="bullet" style="width:100%;border:0;text-align:left;cursor:pointer" data-act="pickSel" data-nis="' + esc(s.nis) + '" data-nama="' + esc(s.nama) + '"><span><b>' + esc(s.nama) + '</b><span class="small mute"> · ' + esc(s.kelas) + '</span></span><span class="small num">' + esc(s.nis) + '</span></button>').join('') || '<p class="hint">Santri aktif tidak ditemukan.</p>';
  } catch (e) { box.innerHTML = ''; }
}, 350);
ACT.pickSel = el => { const p = el.closest('.picker'); p.querySelector('[name=nis]').value = el.dataset.nis; p.querySelector('[data-in=pick]').value = el.dataset.nama + ' (' + el.dataset.nis + ')'; p.querySelector('.pick-res').innerHTML = ''; };

// ---------------- SPP MINGGUAN ----------------
const Spp = {
  kelas: '', periode: '', k: 0, q: '', page: 1, size: 12, sel: new Set(), data: null,

  async page_() { },
  async page() {
    if (!this.periode) this.periode = todayStr().slice(0, 7);
    if (!this.kelas) this.kelas = ((App.cfg.kelas || []).filter(k => k.aktif === 'Y')[0] || {}).nama || '';
    await this.load(true);
  },
  async load(first) {
    const d = this.data = await Api.post('sppGrid', { kelas: this.kelas, periode: this.periode });
    if (!this.k || first) this.k = d.periode === d.today.slice(0, 7) ? d.currentK : 1;
    this.render();
  },
  filtered() { const q = this.q.toLowerCase(); return this.data.rows.filter(r => !q || r.nama.toLowerCase().indexOf(q) >= 0 || r.nis.indexOf(q) >= 0); },
  cellOpen(c) { return c.tarif > 0 && c.status !== 'lunas' && c.status !== 'na'; },

  render() {
    const d = this.data, k = this.k, st = d.stats[k - 1], rows = this.filtered(), tot = rows.length, pg = rows.slice((this.page - 1) * this.size, this.page * this.size);
    const fd = d.fridays[k - 1];
    $('#view').innerHTML = '<div class="fade stack"><div class="hero"><div class="row between wrap" style="gap:1rem"><div style="max-width:620px"><span class="chip chip-ok">' + ic('event_repeat', 'sm') + ' Siklus mingguan wajib santri</span><h1 style="margin-top:8px">Pencatatan SPP Mingguan</h1><p class="mute">Penerimaan rutin berkah hari <b class="ok">Jum\'at</b> (4 angsuran per bulan). Gunakan <b>Tandai Lunas Sekaligus</b> untuk satu kelas penuh, lalu cetak nota.</p></div>' +
      '<div class="card tight row" style="gap:1.25rem"><div><div class="eyebrow">Target pekan ' + k + '</div><div class="num b" style="font-size:22px">' + st.lunas + ' / ' + st.total + ' <span class="small mute">santri</span></div></div><div><div class="eyebrow">Terkumpul</div><div class="num b ok" style="font-size:22px">' + rp(st.terkumpul) + '</div></div></div></div></div>' +
      '<div class="card tight"><div class="row wrap" style="gap:.75rem"><div><label class="f">Jenjang / kelas</label><select class="inp" data-ch="sppKelas" style="width:auto">' + kelasOpts(this.kelas, 'Semua kelas') + '</select></div><div><label class="f">Bulan</label><input class="inp" type="month" data-ch="sppBulan" value="' + this.periode + '" style="width:auto"></div>' +
      '<div class="search grow" style="min-width:180px;align-self:flex-end">' + ic('search') + '<input class="inp" data-in="sppQ" placeholder="Cari santri atau NIS…" value="' + esc(this.q) + '"></div></div>' +
      '<div class="pills" style="margin-top:10px">' + [1, 2, 3, 4].map(i => '<button class="pill ' + (i === k ? 'on' : '') + (d.periode === d.today.slice(0, 7) && i === d.currentK ? ' now' : '') + '" data-act="sppWeek" data-k="' + i + '">Pekan ' + i + ' · ' + fmtTgl(d.fridays[i - 1]).slice(0, -5) + '</button>').join('') + '</div></div>' +
      '<div class="selbar"><label class="row b" style="gap:.5rem"><input type="checkbox" class="ck" data-ch="sppAll"> Pilih semua yang belum lunas (pekan ' + k + ')</label><span class="small mute" id="selCnt"></span><div class="acts"><button class="btn deep" data-act="sppBulk" id="bulkBtn">' + ic('bolt') + ' Tandai Lunas Sekaligus</button><button class="btn soft" data-act="sppWa">' + ic('chat') + ' Pengingat WhatsApp</button><button class="btn ghost" data-act="sppPrint">' + ic('print') + ' Cetak Rekap</button></div></div>' +
      '<div class="card"><div class="row between wrap"><h2>' + ic('list_alt') + 'Daftar Setoran Pekanan</h2>' + chip('Pekan ' + k + ': ' + fmtTgl(fd), 'ok') + '</div><p class="small mute" style="margin-bottom:10px">' + esc(ymLabel(d.periode)) + ' · ' + esc(d.kelas || 'Semua kelas') + ' (' + tot + ' santri)</p>' +
      (tot ? '<div class="tw"><table class="tbl"><thead><tr><th style="width:36px"></th><th>Santri & NIS</th>' + [1, 2, 3, 4].map(i => '<th class="c ' + (i === k ? 'now' : '') + '">Pekan ' + i + '<br><span style="text-transform:none;font-weight:400">' + fmtTgl(d.fridays[i - 1]).slice(0, -5) + '</span></th>').join('') + '<th class="r">Tunggakan</th><th class="c">Aksi</th></tr></thead><tbody>' +
        pg.map(r => '<tr class="' + (r.pekanTunggak > 0 ? 'tung' : '') + '"><td><input type="checkbox" class="ck" data-ch="sppSel" data-nis="' + esc(r.nis) + '" ' + (this.sel.has(r.nis) ? 'checked' : '') + '></td><td><div class="row" style="gap:.6rem">' + avatar(r.nama, r.nis, r.adaFoto) + '<div><b>' + esc(r.nama) + '</b><div class="small mute num">NIS ' + esc(r.nis) + '</div></div></div></td>' +
          r.cells.map(c => '<td class="c ' + (c.k === k ? 'now' : '') + '">' + this.cell(r, c) + '</td>').join('') + '<td class="r">' + (r.tunggakan > 0 ? '<b class="num err">' + rp(r.tunggakan) + '</b><div class="small mute">' + r.pekanTunggak + ' pekan</div>' : '<span class="ok b">Lunas</span>') + '</td>' +
          '<td class="c"><button class="btn soft sm" data-act="sppPay" data-nis="' + esc(r.nis) + '">' + ic('payments', 'sm') + ' Bayar</button></td></tr>').join('') + '</tbody></table></div>' + pager(this.page, tot, this.size, 'sppPage') : emptyBox('groups', 'Tidak ada santri aktif pada filter ini.')) + '</div></div>';
    this.updSel(); Foto.hydrate($('#view'));
  },
  cell(r, c) {
    const a = 'data-act="sppCell" data-nis="' + esc(r.nis) + '" data-k="' + c.k + '"';
    if (c.status === 'na') return '<span class="mute">—</span>';
    if (c.status === 'libur') return '<span class="cellbtn libur" title="' + esc(c.libur) + '">' + ic('beach_access', 'sm') + ' Libur</span>';
    if (c.status === 'lunas') return '<span class="cellbtn lunas">' + ic('check_circle', 'sm') + ' Lunas</span>';
    if (c.status === 'tunggak') return '<button class="cellbtn tunggak" ' + a + '>Tunggak</button>';
    if (c.status === 'sekarang') return '<button class="cellbtn sekarang" ' + a + '>Bayar ' + shortRp(c.deficit) + '</button>';
    if (c.status === 'sebagian') return '<button class="cellbtn sebagian" ' + a + '>Sisa ' + shortRp(c.deficit) + '</button>';
    return '<button class="cellbtn belum" ' + a + '>Belum</button>';
  },
  updSel() {
    const n = this.sel.size, e = $('#selCnt'), b = $('#bulkBtn'); if (!e) return;
    e.textContent = n + ' santri terpilih'; b.innerHTML = ic('bolt') + ' Tandai Lunas Sekaligus' + (n ? ' (' + n + ')' : ''); b.disabled = !n;
  },
  async pay(nis, preset) {
    const ld = Modal.open('<div class="center" style="padding:2rem"><span class="spin"></span> Memuat…</div>');
    let d; try { d = await Api.post('getSantri', { nis: nis }); } catch (e) { Modal.close(ld.closest('.overlay')); toast(e.message, 'error'); return; }
    Modal.close(ld.closest('.overlay'));
    const s = d.santri, r = d.ringkas, opts = d.belumLunas;
    let sel = '0|'; if (preset) sel = preset.periode + '|' + preset.k; else if (opts.length && !(r.tunggakan > 0)) sel = opts[0].periode + '|' + opts[0].k;
    const first = sel === '0|' ? null : opts.find(o => o.periode + '|' + o.k === sel);
    const m = Modal.open(mHead('Catat Pembayaran SPP', s.nama + ' · NIS ' + s.nis + ' · ' + s.kelas) +
      '<div class="selbar" style="margin-bottom:12px"><span>Total tunggakan</span><b class="num ' + (r.tunggakan > 0 ? 'err' : 'ok') + '">' + rp(r.tunggakan) + '</b></div>' +
      '<form data-form="sppPay"><input type="hidden" name="nis" value="' + esc(s.nis) + '"><div class="fg"><label class="f">Untuk pembayaran</label><select class="inp" name="slot" data-ch="sppSlot"><option value="0|" data-def="' + (r.tunggakan > 0 ? r.tunggakan : (opts[0] ? opts[0].deficit : 25000)) + '">Bayar bebas (dialokasikan ke tunggakan terlama)</option>' +
      opts.map(o => '<option value="' + o.periode + '|' + o.k + '" data-def="' + o.deficit + '" ' + (o.periode + '|' + o.k === sel ? 'selected' : '') + '>Pekan ' + o.k + ' ' + ymLabel(o.periode) + ' — ' + rp(o.deficit) + '</option>').join('') + '</select></div>' +
      '<div class="fg"><label class="f">Nominal (Rp)</label><input class="inp num" name="nominal" type="number" inputmode="numeric" min="1000" step="500" required value="' + (first ? first.deficit : (r.tunggakan > 0 ? r.tunggakan : (opts[0] ? opts[0].deficit : 25000))) + '"></div>' + payFields('Tunai') +
      '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">' + ic('check') + ' Simpan & Cetak Nota</button></div></form>', 'narrow');
  }
};
ACT.sppWeek = el => { Spp.k = +el.dataset.k; Spp.render(); };
INP.sppKelas = el => { Spp.kelas = el.value; Spp.page = 1; Spp.sel.clear(); Spp.load(true); };
INP.sppBulk = null;
INP.sppBulan = el => { if (!/^\d{4}-\d{2}$/.test(el.value)) return; Spp.periode = el.value; Spp.page = 1; Spp.sel.clear(); Spp.load(true); };
INP.sppQ = debounce(el => { Spp.q = el.value; Spp.page = 1; Spp.render(); const i = $('[data-in=sppQ]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 350);
ACT.sppPage = el => { Spp.page = +el.dataset.p; Spp.render(); };
INP.sppSel = el => { el.checked ? Spp.sel.add(el.dataset.nis) : Spp.sel.delete(el.dataset.nis); Spp.updSel(); };
INP.sppAll = el => {
  Spp.sel.clear();
  if (el.checked) Spp.filtered().forEach(r => { if (Spp.cellOpen(r.cells[Spp.k - 1])) Spp.sel.add(r.nis); });
  $$('[data-ch=sppSel]').forEach(c => c.checked = Spp.sel.has(c.dataset.nis)); Spp.updSel();
};
ACT.sppCell = el => Spp.pay(el.dataset.nis, { periode: Spp.data.periode, k: +el.dataset.k });
ACT.sppPay = el => Spp.pay(el.dataset.nis);
INP.sppSlot = el => { const o = el.options[el.selectedIndex]; el.closest('form').nominal.value = o.dataset.def; };
FRM.sppPay = f => busy(f.querySelector('button[type=submit]'), async () => {
  const p = f.slot.value.split('|');
  const r = await Api.post('paySpp', { nis: f.nis.value, periode: p[0] === '0' ? '' : p[1] ? p[0] : '', angsuran: p[0] === '0' ? 0 : +p[1], nominal: f.nominal.value, tanggal: f.tanggal.value, metode: f.metode.value, catatan: f.catatan.value });
  Modal.closeAll(); await refreshView(); toast(r.duplikat ? 'Transaksi identik baru saja dicatat; tidak dobel.' : 'Pembayaran tercatat: ' + r.id, 'success'); Receipt.show(r.receipt);
});
ACT.sppBulk = async el => {
  const k = Spp.k, per = Spp.data.periode, list = [...Spp.sel];
  if (!list.length) return;
  if (!await confirmBox('Tandai <b>lunas</b> SPP <b>Pekan ' + k + ' ' + esc(ymLabel(per)) + '</b> untuk <b>' + list.length + ' santri</b>? Hanya sisa yang belum lunas yang dicatat; yang sudah lunas dilewati otomatis.', 'Ya, tandai lunas')) return;
  busy(el, async () => {
    const ok = [], skip = [];
    for (let i = 0; i < list.length; i += 50) { const r = await Api.post('payBulk', { periode: per, angsuran: k, nisList: list.slice(i, i + 50), tanggal: todayStr(), metode: 'Tunai' }); ok.push(...r.berhasil); skip.push(...r.dilewati); }
    Spp.sel.clear(); await Spp.load();
    Modal.open(mHead('Hasil Tandai Lunas') + '<div class="g2"><div class="card flat tight stat"><span class="lab">Berhasil dicatat</span><span class="val ok">' + ok.length + ' santri</span><span class="small mute">' + rp(ok.reduce((s, x) => s + x.nominal, 0)) + '</span></div><div class="card flat tight stat"><span class="lab">Dilewati</span><span class="val">' + skip.length + '</span></div></div>' +
      (skip.length ? '<div class="tw" style="max-height:180px;overflow:auto;margin-top:10px"><table class="tbl" style="min-width:0"><tbody>' + skip.map(x => '<tr><td class="num">' + esc(x.nis) + '</td><td>' + esc(x.alasan) + '</td></tr>').join('') + '</tbody></table></div>' : '') + '<div class="mf"><button class="btn deep" data-act="close">Selesai</button></div>', 'narrow');
  });
};
ACT.sppWa = () => Lap.tunggakanModal(Spp.kelas, Spp.sel.size ? Spp.sel : null);
ACT.sppPrint = () => {
  const d = Spp.data, lbl = { lunas: 'Lunas', tunggak: 'Tunggak', sekarang: 'Belum', belum: '-', sebagian: 'Sebagian', libur: 'Libur', na: '-' };
  printHtml('<div class="ptitle">Rekap SPP Mingguan — ' + esc(ymLabel(d.periode)) + ' · ' + esc(d.kelas || 'Semua kelas') + '</div><p class="small">' + esc(App.name()) + ' · dicetak ' + fmtTgl(todayStr()) + '</p><table class="tbl"><thead><tr><th>No</th><th>Nama</th><th>NIS</th>' + [1, 2, 3, 4].map(i => '<th>P' + i + '</th>').join('') + '<th>Tunggakan</th></tr></thead><tbody>' +
    Spp.filtered().map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(r.nama) + '</td><td>' + esc(r.nis) + '</td>' + r.cells.map(c => '<td>' + lbl[c.status] + '</td>').join('') + '<td>' + (r.tunggakan > 0 ? rp(r.tunggakan) : '-') + '</td></tr>').join('') + '</tbody></table>', 'page');
};

// ---------------- IURAN & PENGELUARAN ----------------
const Keu = {
  tab: 'iuran', periode: '', ov: null, ex: null,
  async page() {
    if (!this.periode) this.periode = todayStr().slice(0, 7);
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">MODUL F8 & F9</div><h1>Iuran & Pengeluaran</h1></div><div class="seg"><button data-act="keuTab" data-t="iuran" class="' + (this.tab === 'iuran' ? 'on' : '') + '">Iuran Tambahan</button><button data-act="keuTab" data-t="keluar" class="' + (this.tab === 'keluar' ? 'on' : '') + '">Pengeluaran</button></div></div><div id="keuBody">' + skel(3) + '</div></div>';
    await this.load();
  },
  async load() {
    const box = $('#keuBody'); if (!box) return;
    if (this.tab === 'iuran') {
      const o = this.ov = await Api.post('iuranOverview', {});
      box.innerHTML = '<div class="row between wrap" style="margin-bottom:12px"><p class="mute">Iuran non-SPP (kitab, infaq, kegiatan, dll). Riwayat tampil terpisah dari SPP.</p>' + (App.isSuper() ? '<button class="btn deep" data-act="iuranAdd">' + ic('add') + ' Jenis Iuran Baru</button>' : '') + '</div>' +
        (o.master.length ? '<div class="g3">' + o.master.map(m => '<div class="card stat"><div class="row between"><b class="eyebrow">' + esc(m.id) + '</b>' + chip(m.aktif === 'Y' ? 'Aktif' : 'Nonaktif', m.aktif === 'Y' ? 'ok' : 'gray', true) + '</div><h3>' + esc(m.nama) + '</h3><p class="small mute">' + esc(m.deskripsi || '') + '</p><div class="small mute">Nominal acuan</div><div class="num b" style="font-size:20px">' + rp(m.nominal) + '</div><div class="small mute">Terkumpul <b class="num ok">' + rp(m.terkumpul) + '</b> · ' + m.pembayar + ' santri</div><div class="row" style="margin-top:6px"><button class="btn deep sm" data-act="iuranPay" data-id="' + esc(m.id) + '">' + ic('payments', 'sm') + ' Catat Bayar</button>' + (App.isSuper() ? '<button class="btn ghost sm" data-act="iuranEdit" data-id="' + esc(m.id) + '">' + ic('edit', 'sm') + ' Edit</button>' : '') + '</div></div>').join('') + '</div>' : '<div class="card">' + emptyBox('payments', 'Belum ada jenis iuran. ' + (App.isSuper() ? 'Buat yang pertama dengan tombol di atas.' : 'Minta Super Admin membuatnya.')) + '</div>') +
        '<div class="card" style="margin-top:1rem"><h2>' + ic('history') + 'Pembayaran Iuran Terbaru</h2>' + (o.recent.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Tanggal</th><th>Santri</th><th>Iuran</th><th class="r">Nominal</th><th>Petugas</th><th class="c">Nota</th></tr></thead><tbody>' + o.recent.map(x => '<tr><td class="small">' + fmtTgl(x.tanggal) + '</td><td><b>' + esc(x.nama) + '</b><div class="small mute">' + esc(x.nis) + '</div></td><td>' + esc(x.iuran) + '</td><td class="r"><b class="num">' + rp(x.nominal) + '</b></td><td>' + esc(x.petugas) + '</td><td class="c"><button class="btn soft icon sm" data-act="trxNota" data-id="' + esc(x.id) + '">' + ic('receipt', 'sm') + '</button></td></tr>').join('') + '</tbody></table></div>' : emptyBox('receipt_long', 'Belum ada pembayaran iuran.')) + '</div>';
    } else {
      const e = this.ex = await Api.post('listPengeluaran', { periode: this.periode });
      box.innerHTML = '<div class="card tight row between wrap"><div class="row" style="gap:.75rem"><div><label class="f">Bulan</label><input class="inp" type="month" data-ch="keuBulan" value="' + this.periode + '" style="width:auto"></div><div><div class="small mute">Total pengeluaran</div><div class="num b err" style="font-size:22px">' + rp(e.total) + '</div></div></div><button class="btn deep" data-act="keuExAdd">' + ic('add') + ' Catat Pengeluaran</button></div>' +
        '<div class="row wrap" style="margin:12px 0">' + Object.keys(e.perKategori).map(k => '<span class="chip chip-gray">' + esc(k) + ': <b class="num">' + rp(e.perKategori[k]) + '</b></span>').join('') + '</div>' +
        '<div class="card">' + (e.rows.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th class="r">Nominal</th><th>Petugas</th>' + (App.isSuper() ? '<th class="c">Hapus</th>' : '') + '</tr></thead><tbody>' +
          e.rows.map(x => '<tr><td class="small">' + fmtTgl(x.tanggal) + '</td><td>' + chip(x.kategori, 'warn') + '</td><td>' + esc(x.keterangan) + '</td><td class="r"><b class="num">' + rp(x.nominal) + '</b></td><td>' + esc(x.petugas) + '</td>' + (App.isSuper() ? '<td class="c"><button class="btn danger icon sm" data-act="exDel" data-id="' + esc(x.id) + '">' + ic('delete', 'sm') + '</button></td>' : '') + '</tr>').join('') + '</tbody></table></div>' : emptyBox('payments', 'Belum ada pengeluaran pada bulan ini.')) + '</div>';
    }
  },
  pengeluaranForm() {
    Modal.open(mHead('Catat Pengeluaran', 'Masuk ke laporan dan mengurangi saldo kas') + '<form data-form="exSave"><div class="fgrid c2"><div class="fg"><label class="f">Tanggal</label><input class="inp" type="date" name="tanggal" value="' + todayStr() + '" required></div><div class="fg"><label class="f">Kategori</label><select class="inp" name="kategori">' + KAT.map(k => '<option>' + k + '</option>').join('') + '</select></div></div>' +
      '<div class="fg"><label class="f">Nominal (Rp)</label><input class="inp num" type="number" name="nominal" min="1" inputmode="numeric" required></div><div class="fg"><label class="f">Keterangan</label><input class="inp" name="keterangan" maxlength="200" placeholder="mis. Token listrik musholla"></div>' +
      '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">' + ic('save') + ' Simpan</button></div></form>', 'narrow');
  }
};
ACT.keuTab = el => { Keu.tab = el.dataset.t; $$('[data-act=keuTab]').forEach(b => b.classList.toggle('on', b === el)); $('#keuBody').innerHTML = skel(3); Keu.load().catch(e => toast(e.message, 'error')); };
INP.keuBulan = el => { if (/^\d{4}-\d{2}$/.test(el.value)) { Keu.periode = el.value; Keu.load(); } };
ACT.keuExAdd = () => Keu.pengeluaranForm();
FRM.exSave = f => busy(f.querySelector('button[type=submit]'), async () => {
  await Api.post('savePengeluaran', { tanggal: f.tanggal.value, kategori: f.kategori.value, nominal: f.nominal.value, keterangan: f.keterangan.value });
  Modal.closeAll(); toast('Pengeluaran dicatat.', 'success'); await refreshView(); if (App.parse().path === 'admin/iuran' && Keu.tab === 'keluar') Keu.load();
});
ACT.exDel = async el => { if (await confirmBox('Hapus catatan pengeluaran ini? Saldo kas akan menyesuaikan.', 'Ya, hapus', true)) busy(null, async () => { await Api.post('deletePengeluaran', { id: el.dataset.id }); toast('Dihapus.', 'success'); Keu.load(); }); };
const iuranForm = m => {
  m = m || {}; Modal.open(mHead(m.id ? 'Edit Jenis Iuran' : 'Jenis Iuran Baru') + '<form data-form="iuranSave"><input type="hidden" name="id" value="' + esc(m.id || '') + '"><div class="fg"><label class="f">Nama iuran *</label><input class="inp" name="nama" value="' + esc(m.nama || '') + '" required placeholder="mis. Iuran Kitab Kuning Ramadhan"></div><div class="fg"><label class="f">Nominal acuan per santri (Rp)</label><input class="inp num" type="number" name="nominal" min="0" value="' + (m.nominal || '') + '"></div><div class="fg"><label class="f">Deskripsi</label><input class="inp" name="deskripsi" value="' + esc(m.deskripsi || '') + '"></div>' +
    (m.id ? '<label class="row small"><input type="checkbox" class="ck" name="aktif" ' + (m.aktif === 'Y' ? 'checked' : '') + '> Iuran aktif</label>' : '') + '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Simpan</button></div></form>', 'narrow');
};
ACT.iuranAdd = () => iuranForm();
ACT.iuranEdit = el => iuranForm(Keu.ov.master.find(m => m.id === el.dataset.id));
FRM.iuranSave = f => busy(f.querySelector('button[type=submit]'), async () => {
  await Api.post('saveIuranMaster', { id: f.id.value, nama: f.nama.value, nominal: f.nominal.value, deskripsi: f.deskripsi.value, aktif: f.aktif ? f.aktif.checked : true });
  await App.refreshCfg(); Modal.closeAll(); toast('Jenis iuran disimpan.', 'success'); Keu.load();
});
ACT.iuranPay = el => {
  const m = Keu.ov.master.find(x => x.id === el.dataset.id);
  Modal.open(mHead('Catat Pembayaran Iuran', m.nama) + '<form data-form="iuranPay"><input type="hidden" name="idIuran" value="' + esc(m.id) + '">' + pickerHtml() + '<div class="fg"><label class="f">Nominal (Rp)</label><input class="inp num" type="number" name="nominal" min="1" value="' + (m.nominal || '') + '" required><p class="hint">Boleh dicicil; sisa dihitung dari nominal acuan ' + rp(m.nominal) + '.</p></div>' + payFields('Tunai') +
    '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">' + ic('check') + ' Simpan & Nota</button></div></form>', 'narrow');
};
FRM.iuranPay = f => {
  if (!f.nis.value) { toast('Pilih santri dari daftar hasil pencarian.', 'error'); return; }
  return busy(f.querySelector('button[type=submit]'), async () => {
    const r = await Api.post('payIuran', { nis: f.nis.value, idIuran: f.idIuran.value, nominal: f.nominal.value, tanggal: f.tanggal.value, metode: f.metode.value, catatan: f.catatan.value });
    Modal.closeAll(); await refreshView(); toast('Pembayaran iuran tercatat: ' + r.id, 'success'); Receipt.show(r.receipt);
  });
};
