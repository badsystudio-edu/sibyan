/* ============================================================
 * DATA SANTRI & KTS — F3 (kelola), F4 (impor Excel), F13 (kartu), F14 (WA)
 * ============================================================ */
async function ensureFotos(list) {
  const need = list.filter(n => !(n in Foto.m));
  for (let i = 0; i < need.length; i += 12) {
    const part = need.slice(i, i + 12);
    try { const r = await Api.post('getFoto', { nisList: part }); part.forEach(n => { Foto.m[n] = r[n] || ''; }); } catch (e) { part.forEach(n => { Foto.m[n] = ''; }); }
  }
}
function waRemind(it) {
  if (!waNum(it.hpWali)) { toast('Nomor HP wali belum diisi.', 'error'); return; }
  const tpl = (App.cfg && App.cfg.settings.waTemplate) || "Assalamu'alaikum {wali}. Tunggakan SPP santri {nama} (NIS {nis}): {rincian}. Total Rp {total}. Jazakumullahu khairan.";
  const text = fillTpl(tpl, { wali: it.namaWali || 'Bapak/Ibu wali', pesantren: App.name(), nama: it.nama, nis: it.nis, rincian: (it.rincian || []).join(', ') || 'lihat portal SIBYAN', total: NUM(it.tunggakan) });
  window.open(waLink(it.hpWali, text), '_blank');
}

const San = {
  q: '', kelas: '', status: '', page: 1, size: 10, view: 'tabel', data: null,

  async page() {
    $('#view').innerHTML = '<div class="fade stack"><div class="hero"><div class="row between wrap" style="gap:1rem"><div style="max-width:560px"><div class="eyebrow">MODUL F3, F4 & F13 · MASTER RECORD</div><h1>Data Santri & KTS Digital</h1><p class="mute">Direktori pusat santri. Kelola identitas, kartu tanda santri digital, tunggakan SPP, dan pengingat WhatsApp wali.</p></div><div class="acts">' +
      '<button class="btn deep" data-act="sanAdd">' + ic('person_add') + ' Tambah Santri Baru</button><button class="btn soft" data-act="sanImport">' + ic('upload_file') + ' Impor Massal (.xlsx)</button><button class="btn soft" data-act="sanPrintAll">' + ic('print') + ' Cetak Semua KTS</button></div></div></div>' +
      '<div class="g4" id="sanStats"></div>' +
      '<div class="card tight"><div class="row wrap" style="gap:.75rem"><div class="search grow" style="min-width:200px">' + ic('search') + '<input class="inp" data-in="sanQ" placeholder="Cari NIS, nama, atau wali…" value="' + esc(this.q) + '"></div>' +
      '<select class="inp" style="width:auto" data-ch="sanKelas">' + kelasOpts(this.kelas, 'Semua kelas') + '</select><select class="inp" style="width:auto" data-ch="sanStatus"><option value="">Semua status</option>' + ['aktif', 'nonaktif', 'alumni'].map(s => '<option ' + (this.status === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select>' +
      '<div class="seg"><button data-act="sanView" data-v="tabel" class="' + (this.view === 'tabel' ? 'on' : '') + '">' + ic('table_rows', 'sm') + ' Tabel</button><button data-act="sanView" data-v="kartu" class="' + (this.view === 'kartu' ? 'on' : '') + '">' + ic('grid_view', 'sm') + ' Kartu</button></div></div></div>' +
      '<div class="card" id="sanList">' + skel(4) + '</div></div>';
    await this.load();
  },

  async load() {
    const box = $('#sanList'); if (!box) return;
    const r = this.data = await Api.post('listSantri', { q: this.q, kelas: this.kelas, status: this.status, page: this.page, pageSize: this.size });
    const st = r.stats, pct = st.totalAktif ? (st.denganTunggakan / st.totalAktif * 100).toFixed(1) : '0';
    $('#sanStats').innerHTML = [['TOTAL SANTRI AKTIF', st.totalAktif, 'Terdata di Google Sheets', 'groups', ''], ['KTS DIGITAL', st.totalAktif, 'Siap cetak · QR membuka pencarian cepat', 'badge', ''], ['SANTRI DENGAN TUNGGAKAN', st.denganTunggakan, pct + '% dari total aktif', 'assignment_late', 'e'], ['WHATSAPP WALI TERSIMPAN', st.hpTerhubung, (st.totalAktif - st.hpTerhubung) + ' belum ada nomor', 'chat', 'w']]
      .map(x => '<div class="card stat"><span class="ico ' + x[4] + '">' + ic(x[3]) + '</span><span class="lab">' + x[0] + '</span><span class="val">' + NUM(x[1]) + '</span><span class="small mute">' + x[2] + '</span></div>').join('');
    if (!r.items.length) { box.innerHTML = emptyBox('person_search', this.q || this.kelas || this.status ? 'Tidak ada santri yang cocok dengan filter.' : 'Belum ada data santri. Tambahkan santri atau impor dari Excel.'); return; }
    if (this.view === 'kartu') {
      box.innerHTML = '<div class="center">' + skel(1, 120) + '</div>';
      await ensureFotos(r.items.filter(s => s.adaFoto).map(s => s.nis));
      const cards = await Promise.all(r.items.map(async s => '<div class="stack gap-s" style="align-items:center">' + await ktsHtml(s, Foto.m[s.nis]) + '<div class="row"><button class="btn soft sm" data-act="sanDetail" data-nis="' + esc(s.nis) + '">' + ic('visibility', 'sm') + ' Detail</button><button class="btn ghost sm" data-act="sanEdit" data-nis="' + esc(s.nis) + '">' + ic('edit', 'sm') + ' Edit</button></div></div>'));
      box.innerHTML = '<div class="kgrid">' + cards.join('') + '</div>' + pager(r.page, r.total, r.pageSize, 'sanPage');
      return;
    }
    box.innerHTML = '<div class="tw"><table class="tbl"><thead><tr><th>Santri & NIS</th><th>Kelas</th><th>Tgl Masuk</th><th>Alamat</th><th>Wali / WA</th><th>Status</th><th class="r">Tunggakan</th><th class="c">Aksi</th></tr></thead><tbody>' +
      r.items.map(s => '<tr><td><div class="row" style="gap:.75rem">' + avatar(s.nama, s.nis, s.adaFoto) + '<div><b>' + esc(s.nama) + '</b><div class="small mute num">NIS: ' + esc(s.nis) + '</div></div></div></td><td>' + chip(s.kelas, 'ok') + '</td><td class="small">' + fmtTgl(s.tglMasuk) + '</td>' +
        '<td class="small">' + esc([s.dusun && 'Dsn. ' + s.dusun, (s.rt || s.rw) && 'RT ' + (s.rt || '-') + '/RW ' + (s.rw || '-'), s.desa].filter(Boolean).join(', ') || '-') + '</td><td class="small">' + (s.hpWali ? '<b class="num">' + esc(s.hpWali) + '</b>' : '<span class="mute">-</span>') + '<div class="mute">' + esc(s.namaWali) + '</div></td>' +
        '<td>' + chip(s.status, s.status === 'aktif' ? 'ok' : 'gray', s.status === 'aktif') + '</td><td class="r">' + (s.tunggakan > 0 ? '<b class="num warn">' + rp(s.tunggakan) + '</b><div class="small mute">' + s.pekanTunggak + ' pekan</div>' : '<b class="ok">Rp 0</b><div class="small mute">Lunas</div>') + '</td>' +
        '<td class="c"><div class="row" style="justify-content:center;gap:4px"><button class="btn soft icon sm" title="Detail" data-act="sanDetail" data-nis="' + esc(s.nis) + '">' + ic('visibility', 'sm') + '</button><button class="btn ghost icon sm" title="Edit" data-act="sanEdit" data-nis="' + esc(s.nis) + '">' + ic('edit', 'sm') + '</button><button class="btn ghost icon sm" title="Kartu" data-act="sanKts" data-nis="' + esc(s.nis) + '">' + ic('badge', 'sm') + '</button>' +
        (App.isSuper() ? '<button class="btn danger icon sm" title="Hapus" data-act="sanDel" data-nis="' + esc(s.nis) + '">' + ic('delete', 'sm') + '</button>' : '') + '</div></td></tr>').join('') + '</tbody></table></div>' + pager(r.page, r.total, r.pageSize, 'sanPage');
    Foto.hydrate(box);
  },
  find(nis) { return this.data && this.data.items.find(s => s.nis === nis); },

  form(s) {
    s = s || { tglMasuk: todayStr(), status: 'aktif', kecamatan: 'Rogojampi', kabupaten: 'Banyuwangi', provinsi: 'Jawa Timur' };
    const f = (n, l, v, ex) => '<div class="fg"><label class="f">' + l + '</label><input class="inp" name="' + n + '" value="' + esc(v || '') + '" ' + (ex || '') + '></div>';
    const m = Modal.open(mHead(s.id ? 'Edit Santri' : 'Tambah Santri Baru', s.id ? 'NIS ' + s.nis : 'NIS dibuat otomatis oleh sistem') +
      '<form data-form="sanSave"><input type="hidden" name="id" value="' + esc(s.id || '') + '"><div class="row" style="gap:1rem;margin-bottom:14px"><span class="avatar lg" id="fPrev">' + esc(initials(s.nama || '+')) + '</span><div class="grow"><label class="f">Foto santri (JPG/PNG)</label><input type="file" accept="image/*" data-ch="sanFoto" class="inp" style="padding:8px 12px">' + (s.adaFoto ? '<label class="small row" style="margin-top:6px"><input type="checkbox" class="ck" name="hapusFoto"> Hapus foto saat ini</label>' : '') + '</div></div>' +
      '<div class="fgrid c2">' + f('nama', 'Nama lengkap *', s.nama, 'required') + '<div class="fg"><label class="f">Kelas / jenjang *</label><select class="inp" name="kelas" required>' + kelasOpts(s.kelas, '', true) + '</select></div>' +
      f('tglMasuk', 'Tanggal masuk *', s.tglMasuk, 'type="date" required') + '<div class="fg"><label class="f">Status</label><select class="inp" name="status">' + ['aktif', 'nonaktif', 'alumni'].map(x => '<option ' + (s.status === x ? 'selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
      f('namaWali', 'Nama wali', s.namaWali) + f('hpWali', 'No. HP / WhatsApp wali', s.hpWali, 'inputmode="tel" placeholder="0812xxxxxxx"') + '<div class="full">' + f('jalan', 'Jalan / alamat', s.jalan) + '</div>' +
      f('rt', 'RT', s.rt, 'inputmode="numeric"') + f('rw', 'RW', s.rw, 'inputmode="numeric"') + f('dusun', 'Dusun', s.dusun) + f('desa', 'Desa', s.desa) + f('kecamatan', 'Kecamatan', s.kecamatan) + f('kabupaten', 'Kabupaten', s.kabupaten) + '<div class="full">' + f('provinsi', 'Provinsi', s.provinsi) + '</div></div>' +
      '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">' + ic('save') + ' Simpan</button></div></form>', 'wide');
    if (s.adaFoto && Foto.m[s.nis]) $('#fPrev', m).innerHTML = '<img src="' + Foto.m[s.nis] + '" alt="">';
    else if (s.adaFoto) ensureFotos([s.nis]).then(() => { const p = $('#fPrev'); if (p && Foto.m[s.nis]) p.innerHTML = '<img src="' + Foto.m[s.nis] + '" alt="">'; });
  },

  async detail(nis) {
    const ld = Modal.open('<div class="center" style="padding:2rem"><span class="spin"></span> Memuat profil…</div>', 'wide');
    let d; try { d = await Api.post('getSantri', { nis: nis }); } catch (e) { Modal.close(ld.closest('.overlay')); toast(e.message, 'error'); return; }
    Modal.close(ld.closest('.overlay')); await ensureFotos(d.santri.adaFoto ? [nis] : []);
    const s = d.santri, r = d.ringkas;
    const alamat = [s.jalan, s.dusun && 'Dsn. ' + s.dusun, (s.rt || s.rw) && 'RT ' + (s.rt || '-') + '/RW ' + (s.rw || '-'), s.desa, s.kecamatan, s.kabupaten, s.provinsi].filter(Boolean).join(', ') || '-';
    this.cur = { s: s, d: d };
    Modal.open(mHead('Profil Santri') + '<div class="row" style="gap:1rem;align-items:flex-start;flex-wrap:wrap">' + avatar(s.nama, s.nis, false, 'lg').replace('<span class="avatar lg">', '<span class="avatar lg">') + '<div class="grow"><h2>' + esc(s.nama) + '</h2><p class="small mute">NIS <b class="num">' + esc(s.nis) + '</b> · ' + esc(s.kelas) + ' · masuk ' + fmtTgl(s.tglMasuk) + '</p><div class="row wrap" style="margin-top:6px">' + chip(s.status, s.status === 'aktif' ? 'ok' : 'gray', true) + sppChip(r.pekanTunggak, r.tunggakan <= 0) + '</div></div></div>' +
      '<div class="fgrid c2" style="margin-top:14px"><div class="card flat tight"><div class="small mute">Alamat</div><div>' + esc(alamat) + '</div></div><div class="card flat tight"><div class="small mute">Wali</div><div><b>' + esc(s.namaWali || '-') + '</b> · ' + esc(s.hpWali || '-') + '</div></div></div>' +
      '<div class="g3" style="margin-top:12px"><div class="card flat tight stat"><span class="lab">Total tunggakan</span><span class="val ' + (r.tunggakan > 0 ? 'warn' : 'ok') + '">' + rp(r.tunggakan) + '</span></div><div class="card flat tight stat"><span class="lab">Historis</span><span class="val" style="font-size:20px">' + rp(r.historis) + '</span></div><div class="card flat tight stat"><span class="lab">Total dibayar</span><span class="val" style="font-size:20px">' + rp(d.totalDibayar) + '</span></div></div>' +
      (d.historis.length ? '<h3 style="margin:14px 0 6px">Rincian tunggakan</h3><div class="pills" style="flex-wrap:wrap">' + d.historis.slice(-12).map(h => '<span class="chip chip-warn">' + esc(ymLabel(h.periode)) + ': ' + h.pekan + ' pekan · ' + rp(h.jumlah) + '</span>').join('') + '</div>' : '') +
      '<h3 style="margin:14px 0 6px">Riwayat pembayaran terakhir</h3>' + (d.riwayat.length ? '<div class="tw"><table class="tbl" style="min-width:420px"><tbody>' + d.riwayat.slice(0, 8).map(x => '<tr><td class="small">' + fmtTgl(x.tanggal) + '</td><td>' + esc(x.judul) + '</td><td class="r"><b class="num">' + rp(x.nominal) + '</b></td><td class="c"><button class="btn soft icon sm" data-act="trxNota" data-id="' + esc(x.id) + '">' + ic('receipt', 'sm') + '</button></td></tr>').join('') + '</tbody></table></div>' : '<p class="small mute">Belum ada pembayaran.</p>') +
      '<div class="mf"><button class="btn deep" data-act="sanPay" data-nis="' + esc(s.nis) + '">' + ic('payments') + ' Catat Pembayaran</button>' + (r.tunggakan > 0 ? '<button class="btn soft" data-act="sanWa">' + ic('chat') + ' Pengingat WA</button>' : '') + '<button class="btn ghost" data-act="sanKtsCur">' + ic('badge') + ' Kartu</button><button class="btn ghost" data-act="sanEditCur">' + ic('edit') + ' Edit</button></div>', 'wide');
    Foto.paint(document);
  },

  async kts(s) {
    await ensureFotos(s.adaFoto ? [s.nis] : []);
    const html = await ktsHtml(s, Foto.m[s.nis]);
    this.curKts = html;
    Modal.open(mHead('Kartu Tanda Santri', s.nama) + '<div class="kgrid">' + html + '</div><div class="mf" style="justify-content:center"><button class="btn deep" data-act="sanPrintOne">' + ic('print') + ' Cetak</button></div><p class="hint center">Pindai QR untuk membuka pencarian cepat santri ini.</p>');
  }
};
ACT.sanAdd = () => San.form();
ACT.sanView = el => { San.view = el.dataset.v; San.page = 1; San.size = San.view === 'kartu' ? 6 : 10; App.route(); };
ACT.sanPage = el => { San.page = +el.dataset.p; San.load().then(() => $('#sanList') && $('#sanList').scrollIntoView({ behavior: 'smooth', block: 'start' })); };
INP.sanQ = debounce(el => { San.q = el.value; San.page = 1; San.load(); }, 400);
INP.sanKelas = el => { San.kelas = el.value; San.page = 1; San.load(); };
INP.sanStatus = el => { San.status = el.value; San.page = 1; San.load(); };
ACT.sanEdit = el => { const s = San.find(el.dataset.nis); if (s) San.form(s); };
ACT.sanEditCur = () => { Modal.close(); San.form(San.cur.s); };
ACT.sanDetail = el => San.detail(el.dataset.nis);
ACT.sanKts = el => { const s = San.find(el.dataset.nis); if (s) San.kts(s); };
ACT.sanKtsCur = () => San.kts(San.cur.s);
ACT.sanPrintOne = () => printHtml('<div class="kgrid">' + San.curKts + '</div>', 'cards');
ACT.sanPay = el => { Modal.closeAll(); Spp.pay(el.dataset.nis); };
ACT.sanWa = () => { const c = San.cur; waRemind({ nama: c.s.nama, nis: c.s.nis, hpWali: c.s.hpWali, namaWali: c.s.namaWali, tunggakan: c.d.ringkas.tunggakan, rincian: c.d.historis.map(h => ymLabel(h.periode) + ' (' + h.pekan + ' pekan)') }); };
ACT.sanDel = async el => {
  const s = San.find(el.dataset.nis); if (!s) return;
  if (await confirmBox('Hapus permanen <b>' + esc(s.nama) + '</b> (NIS ' + esc(s.nis) + ')? Riwayat pembayaran tetap tersimpan di laporan kas. Tindakan ini tidak dapat dibatalkan.', 'Ya, hapus', true))
    busy(null, async () => { await Api.post('deleteSantri', { id: s.id }); toast('Santri dihapus.', 'success'); San.load(); });
};
INP.sanFoto = async el => {
  const f = el.files[0]; if (!f) return;
  try { const url = await fileToDataUrl(f, 320, 'image/jpeg', .78); el.closest('form').__foto = url; $('#fPrev').innerHTML = '<img src="' + url + '" alt="">'; } catch (e) { toast(e.message, 'error'); }
};
FRM.sanSave = f => busy(f.querySelector('button[type=submit]'), async () => {
  const d = {}; ['id', 'nama', 'kelas', 'tglMasuk', 'status', 'namaWali', 'hpWali', 'jalan', 'rt', 'rw', 'dusun', 'desa', 'kecamatan', 'kabupaten', 'provinsi'].forEach(k => d[k] = f[k].value);
  if (f.__foto) d.foto = f.__foto; if (f.hapusFoto && f.hapusFoto.checked) d.hapusFoto = true;
  const s = await Api.post('saveSantri', d); delete Foto.m[s.nis];
  Modal.closeAll(); toast(d.id ? 'Data santri diperbarui.' : 'Santri ditambahkan. NIS: ' + s.nis, 'success'); San.load();
});

// ---------- Cetak semua KTS ----------
ACT.sanPrintAll = async el => busy(el, async () => {
  const r = await Api.post('listSantri', { q: San.q, kelas: San.kelas, status: San.status || 'aktif', page: 1, pageSize: 500 });
  if (!r.items.length) { toast('Tidak ada santri untuk dicetak.', 'error'); return; }
  const m = Modal.open('<div class="center" style="padding:1.5rem"><span class="spin"></span> <span id="pgTxt">Menyiapkan ' + r.items.length + ' kartu…</span></div>', 'narrow');
  const need = r.items.filter(s => s.adaFoto).map(s => s.nis);
  for (let i = 0; i < need.length; i += 12) { await ensureFotos(need.slice(i, i + 12)); const t = $('#pgTxt'); if (t) t.textContent = 'Memuat foto ' + Math.min(i + 12, need.length) + ' / ' + need.length + '…'; }
  const cards = []; for (const s of r.items) cards.push(await ktsHtml(s, Foto.m[s.nis]));
  Modal.close(m.closest('.overlay')); printHtml('<div class="kgrid">' + cards.join('') + '</div>', 'cards');
});

// ---------- Impor Excel ----------
const IMP_HEAD = ['Nama Lengkap', 'Kelas', 'Tanggal Masuk', 'Nama Wali', 'No HP Wali', 'Jalan', 'RT', 'RW', 'Dusun', 'Desa', 'Kecamatan', 'Kabupaten', 'Provinsi', 'NIS (opsional)', 'Status (opsional)'];
const IMP_MAP = { namalengkap: 'nama', nama: 'nama', kelas: 'kelas', jenjang: 'kelas', kelasjenjang: 'kelas', tanggalmasuk: 'tglMasuk', tglmasuk: 'tglMasuk', namawali: 'namaWali', wali: 'namaWali', nohpwali: 'hpWali', hpwali: 'hpWali', nohp: 'hpWali', hp: 'hpWali', jalan: 'jalan', rt: 'rt', rw: 'rw', dusun: 'dusun', desa: 'desa', kecamatan: 'kecamatan', kabupaten: 'kabupaten', provinsi: 'provinsi', nisopsional: 'nis', nis: 'nis', statusopsional: 'status', status: 'status' };
const Imp = {
  rows: [], valid: [], errors: [],
  tgl(v) {
    if (v === undefined || v === null || v === '') return '';
    if (v instanceof Date) { const d = new Date(v.getTime() + 12 * 3600e3); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    if (typeof v === 'number') { const p = XLSX.SSF.parse_date_code(v); return p ? p.y + '-' + String(p.m).padStart(2, '0') + '-' + String(p.d).padStart(2, '0') : ''; }
    const s = String(v).trim(); let m;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if ((m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s))) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    return s;
  },
  async parse(file) {
    await Lib.load('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true }), ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
    return json.map((row, i) => {
      const o = { _baris: i + 2 };
      Object.keys(row).forEach(h => { const k = IMP_MAP[String(h).toLowerCase().replace(/[^a-z]/g, '')]; if (k) o[k] = k === 'tglMasuk' ? this.tgl(row[h]) : String(row[h] instanceof Date ? '' : row[h]).trim(); });
      return o;
    }).filter(o => o.nama || o.kelas || o.tglMasuk);
  }
};
ACT.sanImport = () => {
  Imp.rows = []; Imp.valid = [];
  Modal.open(mHead('Impor Santri dari Excel', 'Unggah berkas .xlsx sesuai template, periksa ringkasan, lalu simpan.') +
    '<div class="stack"><div class="card flat tight row between wrap"><div><b>1. Unduh template</b><p class="small mute">Kolom wajib: Nama Lengkap, Kelas (harus ada di master kelas), Tanggal Masuk.</p></div><button class="btn soft" data-act="impTpl">' + ic('download') + ' Template .xlsx</button></div>' +
    '<div class="card flat tight"><b>2. Pilih berkas</b><input class="inp" type="file" accept=".xlsx,.xls,.csv" data-ch="impFile" style="margin-top:8px"></div><div id="impOut"></div></div>', 'wide');
};
ACT.impTpl = () => exportXlsx('template-impor-santri.xlsx', 'Santri', [Object.fromEntries(IMP_HEAD.map((h, i) => [h, ['Ahmad Fauzi', (App.cfg.kelas[0] || {}).nama || 'Ula', '2024-07-15', 'H. Rahmat', '081234567890', 'Jl. Mawar 1', '02', '01', 'Krajan', 'Bades', 'Rogojampi', 'Banyuwangi', 'Jawa Timur', '', 'aktif'][i]]))]).catch(e => toast(e.message, 'error'));
INP.impFile = async el => {
  const f = el.files[0], out = $('#impOut'); if (!f) return;
  out.innerHTML = '<div class="center"><span class="spin"></span> Membaca & memvalidasi…</div>';
  try {
    Imp.rows = await Imp.parse(f);
    if (!Imp.rows.length) { out.innerHTML = '<p class="err">Tidak ada baris data terbaca. Pastikan baris pertama berisi judul kolom sesuai template.</p>'; return; }
    if (Imp.rows.length > 1000) { out.innerHTML = '<p class="err">Maksimal 1000 baris per berkas. Pecah berkas Anda.</p>'; return; }
    const errs = []; for (let i = 0; i < Imp.rows.length; i += 100) { const r = await Api.post('importSantri', { rows: Imp.rows.slice(i, i + 100), commit: false }); errs.push(...r.errors); }
    Imp.errors = errs; const bad = new Set(errs.map(e => e.baris)); Imp.valid = Imp.rows.filter(r => !bad.has(r._baris));
    out.innerHTML = '<div class="g2"><div class="card flat tight stat"><span class="lab">Siap disimpan</span><span class="val ok">' + Imp.valid.length + ' baris</span></div><div class="card flat tight stat"><span class="lab">Ditolak</span><span class="val ' + (errs.length ? 'err' : '') + '">' + errs.length + ' baris</span></div></div>' +
      (errs.length ? '<div class="tw" style="max-height:200px;overflow:auto;margin-top:10px"><table class="tbl" style="min-width:0"><thead><tr><th>Baris</th><th>Alasan</th></tr></thead><tbody>' + errs.map(e => '<tr><td>' + e.baris + '</td><td class="err">' + esc(e.pesan) + '</td></tr>').join('') + '</tbody></table></div>' : '') +
      '<div class="mf"><button class="btn deep" data-act="impGo" ' + (Imp.valid.length ? '' : 'disabled') + '>' + ic('save') + ' Simpan ' + Imp.valid.length + ' baris valid</button></div>';
  } catch (e) { out.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }
};
ACT.impGo = el => busy(el, async () => {
  let n = 0; for (let i = 0; i < Imp.valid.length; i += 100) { const r = await Api.post('importSantri', { rows: Imp.valid.slice(i, i + 100), commit: true }); n += r.inserted; }
  Modal.closeAll(); toast(n + ' santri berhasil diimpor.', 'success'); San.page = 1; San.load();
});
