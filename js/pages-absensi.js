/* ============================================================
 * ABSENSI SANTRI & CATATAN PELANGGARAN
 * ============================================================ */
const STAT_AB = { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpa' };

const Abs = {
  tab: 'input', tanggal: '', sesi: '', kelas: '', d: null, st: {},
  sesiList() { return String((App.cfg.settings.sesiAbsensi) || 'Harian').split(',').map(x => x.trim()).filter(Boolean); },

  async page() {
    if (!this.tanggal) this.tanggal = todayStr();
    if (!this.kelas) this.kelas = ((App.cfg.kelas || []).filter(k => k.aktif === 'Y')[0] || {}).nama || '';
    if (!this.sesi) this.sesi = this.sesiList()[0];
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">MODUL ABSENSI</div><h1>Absensi Santri</h1></div><div class="seg"><button data-act="absTab" data-t="input" class="' + (this.tab === 'input' ? 'on' : '') + '">Input Harian</button><button data-act="absTab" data-t="rekap" class="' + (this.tab === 'rekap' ? 'on' : '') + '">Rekap</button></div></div><div id="absBody">' + skel(2) + '</div></div>';
    await this.load();
  },
  load() { return this.tab === 'input' ? this.loadInput() : this.loadRekap(); },

  // ----- input harian -----
  async loadInput() {
    const box = $('#absBody'); if (!this.kelas) { box.innerHTML = '<div class="card">' + emptyBox('school', 'Belum ada kelas. Tambahkan kelas di Pengaturan.') + '</div>'; return; }
    const d = this.d = await Api.post('absensiGet', { tanggal: this.tanggal, sesi: this.sesi, kelas: this.kelas });
    this.st = {}; d.rows.forEach(r => { this.st[r.nis] = r.status; });
    box.innerHTML = '<div class="card tight"><div class="row wrap" style="gap:.75rem"><div><label class="f">Tanggal</label><input class="inp" type="date" max="' + todayStr() + '" value="' + this.tanggal + '" data-ch="absTgl" style="width:auto"></div><div><label class="f">Sesi / kegiatan</label><select class="inp" data-ch="absSesi" style="width:auto">' + this.sesiList().map(s => '<option ' + (s === this.sesi ? 'selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></div><div><label class="f">Kelas</label><select class="inp" data-ch="absKelas" style="width:auto">' + kelasOpts(this.kelas, '', true) + '</select></div></div></div>' +
      '<div class="card" style="margin-top:1rem"><div class="row between wrap" style="margin-bottom:8px"><div id="absCnt" class="row wrap"></div><div class="acts">' + (d.tersimpan ? chip('Tersimpan · ' + esc(d.petugas), 'ok', true) : chip('Belum disimpan', 'warn')) + '<button class="btn soft sm" data-act="absAll">' + ic('done_all', 'sm') + ' Semua Hadir</button><button class="btn deep sm" data-act="absSave">' + ic('save', 'sm') + ' Simpan Absensi</button></div></div><div id="absList"></div></div>';
    this.draw();
  },
  draw() {
    const d = this.d, c = { H: 0, I: 0, S: 0, A: 0 };
    d.rows.forEach(r => c[this.st[r.nis]]++);
    $('#absCnt').innerHTML = Object.keys(STAT_AB).map(k => '<span class="chip ' + ({ H: 'chip-ok', I: 'chip-info', S: 'chip-warn', A: 'chip-err' })[k] + '">' + STAT_AB[k] + ': <b>' + c[k] + '</b></span>').join('');
    $('#absList').innerHTML = d.rows.length ? d.rows.map(r => '<div class="abrow"><div class="row" style="gap:.6rem;min-width:0">' + avatar(r.nama, r.nis, r.adaFoto) + '<div style="min-width:0"><b>' + esc(r.nama) + '</b><div class="small mute num">' + esc(r.nis) + '</div></div></div><div class="abbtns">' +
      Object.keys(STAT_AB).map(k => '<button class="ab ' + k + (this.st[r.nis] === k ? ' on' : '') + '" data-act="absSet" data-nis="' + esc(r.nis) + '" data-s="' + k + '" title="' + STAT_AB[k] + '">' + k + '</button>').join('') + '</div></div>').join('') + '<p class="hint" style="margin-top:10px">H = Hadir · I = Izin · S = Sakit · A = Alpa. Santri yang tidak diubah dianggap hadir.</p>' : emptyBox('groups', 'Tidak ada santri aktif di kelas ini.');
    Foto.hydrate($('#absList'));
  },

  // ----- rekap -----
  rk: { bulan: '', kelas: '', sesi: '' },
  async loadRekap() {
    const rk = this.rk, box = $('#absBody'); if (!rk.bulan) rk.bulan = todayStr().slice(0, 7);
    box.innerHTML = '<div class="card tight"><div class="row wrap" style="gap:.75rem"><div><label class="f">Bulan</label><input class="inp" type="month" value="' + rk.bulan + '" data-ch="rkBulan" style="width:auto"></div><div><label class="f">Kelas</label><select class="inp" data-ch="rkKelas" style="width:auto">' + kelasOpts(rk.kelas, 'Semua kelas', true) + '</select></div><div><label class="f">Sesi</label><select class="inp" data-ch="rkSesi" style="width:auto"><option value="">Semua sesi</option>' + this.sesiList().map(s => '<option ' + (s === rk.sesi ? 'selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></div></div></div><div id="rkRes" style="margin-top:1rem">' + skel(2) + '</div>';
    const y = +rk.bulan.slice(0, 4), m = +rk.bulan.slice(5, 7), last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const r = this.rkData = await Api.post('absensiRekap', { dari: rk.bulan + '-01', sampai: rk.bulan + '-' + String(last).padStart(2, '0'), kelas: rk.kelas, sesi: rk.sesi });
    $('#rkRes').innerHTML = '<div class="card"><div class="row between wrap"><div><h2>' + ic('fact_check') + 'Rekap ' + esc(ymLabel(rk.bulan)) + '</h2><p class="small mute">' + r.jumlahSesi + ' sesi tercatat</p></div><button class="btn soft sm" data-act="rkXlsx">' + ic('table', 'sm') + ' Excel</button></div>' +
      (r.rows.length ? '<div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Santri</th><th>Kelas</th><th class="c">Hadir</th><th class="c">Izin</th><th class="c">Sakit</th><th class="c">Alpa</th><th class="c">Total</th><th class="r">% Hadir</th></tr></thead><tbody>' +
        r.rows.map(x => '<tr><td><b>' + esc(x.nama) + '</b><div class="small mute">' + esc(x.nis) + '</div></td><td>' + esc(x.kelas) + '</td><td class="c ok b">' + x.H + '</td><td class="c">' + x.I + '</td><td class="c warn">' + x.S + '</td><td class="c ' + (x.A ? 'err b' : '') + '">' + x.A + '</td><td class="c">' + x.total + '</td><td class="r">' + (x.persen === null ? '<span class="mute">-</span>' : chip(x.persen + '%', x.persen >= 90 ? 'ok' : (x.persen >= 75 ? 'warn' : 'err'))) + '</td></tr>').join('') + '</tbody></table></div>' : emptyBox('fact_check', 'Belum ada data absensi pada filter ini.')) + '</div>';
  }
};
ACT.absTab = el => { Abs.tab = el.dataset.t; $$('[data-act=absTab]').forEach(b => b.classList.toggle('on', b === el)); $('#absBody').innerHTML = skel(2); Abs.load().catch(e => toast(e.message, 'error')); };
INP.absTgl = el => { if (el.value) { Abs.tanggal = el.value; Abs.loadInput().catch(e => toast(e.message, 'error')); } };
INP.absSesi = el => { Abs.sesi = el.value; Abs.loadInput().catch(e => toast(e.message, 'error')); };
INP.absKelas = el => { Abs.kelas = el.value; Abs.loadInput().catch(e => toast(e.message, 'error')); };
ACT.absSet = el => { Abs.st[el.dataset.nis] = el.dataset.s; Abs.draw(); };
ACT.absAll = () => { Object.keys(Abs.st).forEach(n => { Abs.st[n] = 'H'; }); Abs.draw(); };
ACT.absSave = el => busy(el, async () => {
  const data = {}; Object.keys(Abs.st).forEach(n => { if (Abs.st[n] !== 'H') data[n] = Abs.st[n]; });
  const r = await Api.post('absensiSave', { tanggal: Abs.tanggal, sesi: Abs.sesi, kelas: Abs.kelas, data: data });
  toast('Absensi tersimpan. Hadir ' + r.hitung.H + ' · Izin ' + r.hitung.I + ' · Sakit ' + r.hitung.S + ' · Alpa ' + r.hitung.A + (r.notif ? ' · notifikasi alpa dikirim ke ' + r.notif + ' wali' : ''), 'success');
  kickNotif(r.notif); await Abs.loadInput();
});
INP.rkBulan = el => { if (el.value) { Abs.rk.bulan = el.value; Abs.loadRekap(); } };
INP.rkKelas = el => { Abs.rk.kelas = el.value; Abs.loadRekap(); };
INP.rkSesi = el => { Abs.rk.sesi = el.value; Abs.loadRekap(); };
ACT.rkXlsx = el => busy(el, async () => { const r = Abs.rkData; if (!r.rows.length) { toast('Tidak ada data.', 'error'); return; } await exportXlsx('rekap-absensi-' + Abs.rk.bulan + '.xlsx', 'Absensi', r.rows.map(x => ({ NIS: x.nis, Nama: x.nama, Kelas: x.kelas, Hadir: x.H, Izin: x.I, Sakit: x.S, Alpa: x.A, Total: x.total, '% Hadir': x.persen === null ? '' : x.persen }))); });

// ================= CATATAN PELANGGARAN =================
const TINGKAT_LBL = { ringan: ['Ringan', 'warn'], sedang: ['Sedang', 'info'], berat: ['Berat', 'err'] };
const JENIS_PLG = ['Terlambat / tidak mengikuti kegiatan', 'Keluar pondok tanpa izin', 'Berkelahi / bullying', 'Merusak fasilitas', 'Membawa barang terlarang', 'Tidak berseragam / tidak rapi', 'Berbicara kasar / tidak sopan', 'Lainnya'];
const Dis = {
  f: { q: '', kelas: '', tingkat: '', dari: '', sampai: '' }, page_: 1, data: null,
  async page() {
    const f = this.f;
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">KEDISIPLINAN</div><h1>Catatan Pelanggaran Santri</h1></div><button class="btn deep" data-act="plgAdd">' + ic('add') + ' Catat Pelanggaran</button></div><div class="g4" id="plgStats"></div>' +
      '<div class="card tight"><div class="row wrap" style="gap:.75rem"><div class="search grow" style="min-width:180px">' + ic('search') + '<input class="inp" data-in="plgQ" placeholder="Cari nama, NIS, atau jenis…" value="' + esc(f.q) + '"></div><select class="inp" style="width:auto" data-ch="plgKelas">' + kelasOpts(f.kelas, 'Semua kelas') + '</select><select class="inp" style="width:auto" data-ch="plgTingkat"><option value="">Semua tingkat</option>' + Object.keys(TINGKAT_LBL).map(t => '<option value="' + t + '" ' + (f.tingkat === t ? 'selected' : '') + '>' + TINGKAT_LBL[t][0] + '</option>').join('') + '</select>' +
      '<input class="inp" type="date" style="width:auto" title="Dari" data-ch="plgDari" value="' + f.dari + '"><input class="inp" type="date" style="width:auto" title="Sampai" data-ch="plgSampai" value="' + f.sampai + '"></div></div><div class="card" id="plgList">' + skel(3) + '</div></div>';
    await this.load();
  },
  async load() {
    const r = this.data = await Api.post('pelanggaranList', Object.assign({ page: this.page_, pageSize: 15 }, this.f)), s = r.stats;
    $('#plgStats').innerHTML = [['Total catatan', s.total, 'assignment', ''], ['Ringan', s.ringan, 'info', 'w'], ['Sedang', s.sedang, 'warning', 'w'], ['Berat', s.berat, 'gpp_bad', 'e']].map(x => '<div class="card stat"><span class="ico ' + x[3] + '">' + ic(x[2]) + '</span><span class="lab">' + x[0] + '</span><span class="val">' + NUM(x[1]) + '</span>' + (x[0] === 'Total catatan' ? '<span class="small mute">' + NUM(s.poin) + ' poin terkumpul</span>' : '') + '</div>').join('');
    $('#plgList').innerHTML = r.items.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Tanggal</th><th>Santri</th><th>Pelanggaran</th><th>Tingkat</th><th class="r">Poin</th><th>Sanksi</th><th class="c">Aksi</th></tr></thead><tbody>' +
      r.items.map(x => '<tr><td class="small">' + fmtTgl(x.tanggal) + '</td><td><b>' + esc(x.nama) + '</b><div class="small mute">' + esc(x.kelas) + ' · ' + esc(x.nis) + '</div></td><td><b>' + esc(x.jenis) + '</b><div class="small mute" style="max-width:260px">' + esc(x.uraian) + '</div></td><td>' + chip(TINGKAT_LBL[x.tingkat][0], TINGKAT_LBL[x.tingkat][1]) + '</td><td class="r num b">' + x.poin + '</td><td class="small">' + esc(x.sanksi || '-') + '</td><td class="c"><button class="btn ghost icon sm" data-act="plgEdit" data-id="' + esc(x.id) + '">' + ic('edit', 'sm') + '</button>' + (App.isSuper() ? '<button class="btn danger icon sm" data-act="plgDel" data-id="' + esc(x.id) + '">' + ic('delete', 'sm') + '</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>' + pager(r.page, r.total, r.pageSize, 'plgPage') : emptyBox('verified', 'Tidak ada catatan pelanggaran. Alhamdulillah.');
  },
  form(x, nisAwal) {
    x = x || {};
    Modal.open(mHead(x.id ? 'Ubah Catatan Pelanggaran' : 'Catat Pelanggaran') + '<form data-form="plgSave"><input type="hidden" name="id" value="' + esc(x.id || '') + '">' +
      (x.id ? '<input type="hidden" name="nis" value="' + esc(x.nis) + '"><div class="selbar" style="margin-bottom:12px"><b>' + esc(x.nama) + '</b><span class="small mute">' + esc(x.kelas) + ' · ' + esc(x.nis) + '</span></div>' : pickerHtml()) +
      '<div class="fgrid c2"><div class="fg"><label class="f">Tanggal</label><input class="inp" type="date" name="tanggal" value="' + esc(x.tanggal || todayStr()) + '" required></div><div class="fg"><label class="f">Tingkat</label><select class="inp" name="tingkat" data-ch="plgTk">' + Object.keys(TINGKAT_LBL).map(t => '<option value="' + t + '" ' + (x.tingkat === t ? 'selected' : '') + '>' + TINGKAT_LBL[t][0] + ' (±' + ({ ringan: 5, sedang: 10, berat: 25 })[t] + ' poin)</option>').join('') + '</select></div></div>' +
      '<div class="fg"><label class="f">Jenis pelanggaran *</label><input class="inp" name="jenis" list="jenisPlg" value="' + esc(x.jenis || '') + '" required maxlength="100"><datalist id="jenisPlg">' + JENIS_PLG.map(j => '<option value="' + esc(j) + '">').join('') + '</datalist></div>' +
      '<div class="fg"><label class="f">Uraian kejadian</label><textarea class="inp" name="uraian" maxlength="500">' + esc(x.uraian || '') + '</textarea></div><div class="fgrid c2"><div class="fg"><label class="f">Sanksi / pembinaan</label><input class="inp" name="sanksi" value="' + esc(x.sanksi || '') + '" maxlength="300"></div><div class="fg"><label class="f">Poin</label><input class="inp num" type="number" min="0" name="poin" value="' + (x.id ? x.poin : '') + '" placeholder="otomatis sesuai tingkat"></div></div>' +
      '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">' + ic('save') + ' Simpan</button></div></form>', 'wide');
  }
};
ACT.plgAdd = () => Dis.form();
ACT.plgEdit = el => Dis.form(Dis.data.items.find(x => x.id === el.dataset.id));
ACT.plgPage = el => { Dis.page_ = +el.dataset.p; Dis.load(); };
INP.plgQ = debounce(el => { Dis.f.q = el.value; Dis.page_ = 1; Dis.load(); }, 400);
INP.plgKelas = el => { Dis.f.kelas = el.value; Dis.page_ = 1; Dis.load(); };
INP.plgTingkat = el => { Dis.f.tingkat = el.value; Dis.page_ = 1; Dis.load(); };
INP.plgDari = el => { Dis.f.dari = el.value; Dis.page_ = 1; Dis.load(); };
INP.plgSampai = el => { Dis.f.sampai = el.value; Dis.page_ = 1; Dis.load(); };
INP.plgTk = null;
FRM.plgSave = f => {
  if (!f.nis.value) { toast('Pilih santri dari hasil pencarian.', 'error'); return; }
  return busy(f.querySelector('button[type=submit]'), async () => {
    const r = await Api.post('pelanggaranSave', { id: f.id.value, nis: f.nis.value, tanggal: f.tanggal.value, tingkat: f.tingkat.value, jenis: f.jenis.value, uraian: f.uraian.value, sanksi: f.sanksi.value, poin: f.poin.value });
    Modal.closeAll(); toast('Catatan disimpan.', 'success'); if (App.parse().path === 'admin/disiplin') Dis.load();
  });
};
ACT.plgDel = async el => { if (await confirmBox('Hapus catatan pelanggaran ini? Tindakan dicatat di Log Audit.', 'Ya, hapus', true)) busy(null, async () => { await Api.post('pelanggaranDelete', { id: el.dataset.id }); toast('Dihapus.', 'success'); Dis.load(); }); };
