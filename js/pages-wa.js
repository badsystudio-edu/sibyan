/* ============================================================
 * WHATSAPP & NOTIFIKASI (Fonnte) + CRM KONTAK — pola skill gas-notifikasi-wa-crm
 * ============================================================ */
const WA = {
  tab: 'blast', rows: [], sel: new Set(), batch: 20, auto: null, timer: null, cfg: null,
  VARS: ['nama', 'nama_santri', 'nis', 'kelas', 'total', 'rincian', 'institusi', 'username', 'link'],
  preset: '',
  PRESET_PESAN: { belum_login: "Assalamu'alaikum {nama}. Dari {institusi}. Status SPP dan kuitansi ananda {nama_santri} kini bisa dicek langsung lewat aplikasi SIBYAN: {link}\nUsername Anda: {username}\nBila belum tahu password, silakan hubungi Bendahara. Jazakumullahu khairan.", belum_cek: "Assalamu'alaikum {nama}. Kami mengingatkan, tagihan SPP ananda {nama_santri} saat ini Rp {total}. Rincian dan kuitansi bisa dicek di {link} (username: {username}). Jazakumullahu khairan.", lama_tidak_aktif: "Assalamu'alaikum {nama}. Dari {institusi}. Jangan lupa cek tagihan dan kuitansi ananda {nama_santri} di aplikasi SIBYAN: {link} (username: {username}). Jazakumullahu khairan." },
  defPesan: "Assalamu'alaikum {nama}. Kami dari {institusi} menginformasikan tunggakan SPP santri {nama_santri}: {rincian}. Total Rp {total}. Mohon dilunasi pada Jumat terdekat. Jazakumullahu khairan.",

  async page() {
    clearInterval(this.timer); this.timer = null;
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">FONNTE · ANTREAN OTOMATIS</div><h1>WhatsApp & Notifikasi</h1></div><div class="seg"><button data-act="waTab" data-t="blast" class="' + (this.tab === 'blast' ? 'on' : '') + '">Blast</button><button data-act="waTab" data-t="antrean" class="' + (this.tab === 'antrean' ? 'on' : '') + '">Antrean</button>' + (App.isSuper() ? '<button data-act="waTab" data-t="konfig" class="' + (this.tab === 'konfig' ? 'on' : '') + '">Konfigurasi</button>' : '') + '</div></div><div id="waBody">' + skel(2) + '</div></div>';
    await this.load();
  },
  load() { return this.tab === 'blast' ? this.blast() : (this.tab === 'antrean' ? this.antrean() : this.konfig()); },

  // ---------- Blast ----------
  async blast() {
    const box = $('#waBody'), cfgBatch = Number(App.cfg.settings.batch) || 20;
    box.innerHTML = '<div id="waActive"></div><div class="split" style="margin-top:1rem"><div class="card"><h2>' + ic('groups') + '1. Pilih Sasaran</h2><div class="fgrid c2" style="margin-top:10px"><div class="fg"><label class="f">Sumber penerima</label><select class="inp" id="waSumber" data-ch="waSumber"><option value="menunggak">Wali santri yang menunggak</option><option value="wali">Semua wali santri</option><option value="belum_login">Wali yang belum pernah login</option><option value="lama_tidak_aktif">Wali tidak aktif &gt; 14 hari</option><option value="belum_cek">Wali menunggak yang belum cek tagihan (7 hari)</option><option value="crm">Kontak CRM (segmen / tag)</option></select></div>' +
      '<div class="fg" id="waKelasBox"><label class="f">Kelas</label><select class="inp" id="waKelas">' + kelasOpts('', 'Semua kelas', true) + '</select></div><div class="fg hide" id="waSegBox"><label class="f">Segmen</label><input class="inp" id="waSeg" placeholder="mis. Wali / Ustadz"></div><div class="fg hide" id="waTagBox"><label class="f">Tag</label><input class="inp" id="waTag" placeholder="mis. donatur"></div></div>' +
      '<div class="acts"><button class="btn deep sm" data-act="waLoad">' + ic('groups', 'sm') + ' Muat Penerima</button><button class="btn soft sm" data-act="waDetect">' + ic('smartphone', 'sm') + ' Deteksi Nomor WA</button></div><div id="waSum" class="row wrap" style="margin:12px 0"></div><label class="row small hide" id="waOnlyBox"><input type="checkbox" class="ck" id="waOnly" data-ch="waOnly"> Kirim hanya ke nomor terdeteksi WhatsApp</label><div id="waRows" style="margin-top:8px"></div></div>' +
      '<div class="card"><h2>' + ic('edit_note') + '2. Tulis Pesan</h2><div class="fg" style="margin-top:10px"><label class="f">Judul (internal)</label><input class="inp" id="waJudul" placeholder="mis. Pengingat SPP Oktober"></div><div class="fg"><label class="f">Isi pesan</label><div class="row wrap" style="gap:4px;margin-bottom:6px">' + this.VARS.map(v => '<button type="button" class="vbtn" data-act="waVar" data-v="' + v + '">{' + v + '}</button>').join('') + '</div><textarea class="inp" id="waPesan" data-in="waPrev" style="min-height:130px">' + esc(this.defPesan) + '</textarea></div><div class="fg"><label class="f">Pratinjau (penerima pertama)</label><div class="wa-bubble" id="waPrev"></div></div>' +
      '<h3 style="margin:8px 0">3. Ukuran batch & jeda</h3><div class="row wrap" style="gap:1rem"><div class="seg" id="waBatchSeg">' + [10, 20, 50].map(n => '<button data-act="waBatch" data-n="' + n + '" class="' + (n === cfgBatch ? 'on' : '') + '">' + n + '</button>').join('') + '</div><div><input class="inp" id="waJeda" value="' + esc(App.cfg.settings.jeda || '5') + '" style="width:90px" title="detik, mis. 5 atau 3-8"></div><span class="small mute">detik antar pesan</span></div><p class="hint" id="waEst"></p><button class="btn deep block" style="margin-top:10px" data-act="waStart" id="waStartBtn">' + ic('rocket_launch') + ' Mulai Blast</button><p class="hint">Server tetap mengirim 1 batch per menit walau halaman ditutup. Tips anti-blokir: mulai batch 10, jeda ≥ 5 detik, hindari tautan yang sama ke ratusan nomor sekaligus.</p></div></div>' +
      '<div class="card" style="margin-top:1rem"><h2>' + ic('history') + 'Riwayat Blast</h2><div id="waHist">' + skel(1, 60) + '</div></div>';
    this.batch = cfgBatch; this.rows = []; this.sel = new Set();
    if (this.preset) { $('#waSumber').value = this.preset; $('#waPesan').value = this.PRESET_PESAN[this.preset] || this.defPesan; $('#waJudul').value = this.preset === 'belum_login' ? 'Ajakan login aplikasi SIBYAN' : (this.preset === 'belum_cek' ? 'Pengingat cek tagihan' : 'Pengingat membuka aplikasi'); this.preset = ''; }
    this.prev(); this.hist();
  },
  async hist() {
    let l; try { l = await Api.post('waBlastList', {}); } catch (e) { return; }
    const run = l.filter(b => b.status === 'Berjalan'), a = $('#waActive'), h = $('#waHist'); if (!a || !h) return;
    a.innerHTML = run.map(b => '<div class="card" style="border:2px solid var(--primary);margin-bottom:1rem"><div class="row between wrap"><div><b>' + esc(b.judul) + '</b> ' + chip('Berjalan', 'ok', true) + '<div class="small mute">' + esc(b.sasaran) + ' · batch ' + b.ukuranBatch + ' · jeda ' + esc(b.jeda) + ' dtk</div></div><div class="acts"><button class="btn deep sm" data-act="waNext" data-id="' + esc(b.id) + '">' + ic('play_arrow', 'sm') + ' Kirim Batch Berikutnya</button><label class="row small"><span class="switch" style="transform:scale(.8)"><input type="checkbox" data-ch="waAuto" data-id="' + esc(b.id) + '" ' + (this.auto === b.id ? 'checked' : '') + '><i></i></span> Otomatis</label><button class="btn danger sm" data-act="waStop" data-id="' + esc(b.id) + '">' + ic('stop', 'sm') + ' Hentikan</button></div></div><div class="bar" style="margin:10px 0"><i style="width:' + b.persen + '%"></i></div><div class="row wrap small"><span>Terkirim <b class="ok">' + b.terkirim + '</b></span><span>Gagal <b class="err">' + b.gagal + '</b></span><span>Sisa <b>' + b.sisa + '</b></span><span class="mute">dari ' + b.total + '</span></div></div>').join('');
    h.innerHTML = l.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Judul</th><th>Sasaran</th><th>Batch</th><th class="r">Progres</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>' + l.map(b => '<tr><td><b>' + esc(b.judul) + '</b></td><td class="small">' + esc(b.sasaran) + '</td><td>' + b.ukuranBatch + ' / ' + esc(b.jeda) + 's</td><td class="r"><b class="num">' + b.terkirim + '</b>/' + b.total + (b.gagal ? ' <span class="err small">(' + b.gagal + ' gagal)</span>' : '') + '</td><td>' + chip(b.status, b.status === 'Selesai' ? 'ok' : (b.status === 'Berjalan' ? 'warn' : 'gray')) + '</td><td class="small">' + esc(b.tanggal.slice(0, 16)) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="small mute">Belum ada blast.</p>';
  },
  prev() {
    const t = $('#waPesan'), p = $('#waPrev'); if (!t || !p) return;
    const first = this.rows.find(r => this.sel.has(r.hp)), v = Object.assign({ institusi: App.name(), nama: 'Bapak/Ibu', nama_santri: 'Ahmad', nis: '20260001', kelas: 'Ula', total: '50.000', rincian: 'Maret 2026 (2 pekan)' }, first ? first.vars : {});
    p.textContent = fillTpl(t.value, v);
    const n = this.sel.size, b = this.batch, j = String($('#waJeda') ? $('#waJeda').value : '5').split('-').map(Number), avg = j.reduce((a, c) => a + c, 0) / j.length || 5;
    const e = $('#waEst'); if (e) e.textContent = n ? n + ' penerima → ' + Math.ceil(n / b) + ' batch · ±' + Math.max(1, Math.round(Math.ceil(n / b) * Math.max(1, b * avg / 60))) + ' menit' : 'Muat penerima terlebih dahulu.';
    const s = $('#waStartBtn'); if (s) s.innerHTML = ic('rocket_launch') + ' Mulai Blast' + (n ? ' (' + n + ' nomor)' : '');
  },
  drawRows() {
    const r = this.rows, only = $('#waOnly') && $('#waOnly').checked;
    const badge = s => s === 'Terdaftar' ? '<span class="wab ya">✓ WA</span>' : (s === 'Tidak Terdaftar' ? '<span class="wab tidak">✕ bukan WA</span>' : '<span class="wab belum">? belum dicek</span>');
    $('#waRows').innerHTML = r.length ? '<div class="tw" style="max-height:340px;overflow:auto"><table class="tbl" style="min-width:420px"><tbody>' + r.slice(0, 300).map(x => { const ok = x.valid && !x.ganda && !x.optOut; return '<tr style="' + (ok ? '' : 'opacity:.45') + '"><td style="width:32px"><input type="checkbox" class="ck" data-ch="waSel" data-hp="' + esc(x.hp) + '" ' + (this.sel.has(x.hp) ? 'checked' : '') + ' ' + (ok ? '' : 'disabled') + '></td><td><b>' + esc(x.nama) + '</b>' + (x.optOut ? ' ' + chip('opt-out', 'gray') : '') + (x.ganda ? ' ' + chip('ganda', 'gray') : '') + '<div class="small mute num">' + esc(x.hp) + '</div></td><td class="r">' + badge(x.statusWA) + '</td></tr>'; }).join('') + '</tbody></table></div>' + (r.length > 300 ? '<p class="hint">Menampilkan 300 dari ' + r.length + ' (semua tetap ikut terkirim bila tercentang).</p>' : '') : '';
    this.prev();
  },
  async detect(btn) {
    const todo = this.rows.filter(r => r.valid && !r.statusWA).map(r => r.hp);
    if (!todo.length) { toast('Semua nomor sudah dicek.'); return; }
    for (let i = 0; i < todo.length; i += 50) {
      toast('Mengecek ' + Math.min(i + 50, todo.length) + '/' + todo.length + '…');
      const m = await Api.post('waValidate', { nomor: todo.slice(i, i + 50) });
      this.rows.forEach(r => { if (m[r.hp]) r.statusWA = m[r.hp]; });
    }
    $('#waOnlyBox').classList.remove('hide'); this.drawRows(); toast('Deteksi nomor WhatsApp selesai.', 'success');
  },

  // ---------- Antrean ----------
  qf: { status: '' },
  async antrean() {
    const q = await Api.post('notifQueue', { status: this.qf.status }), c = q.ringkas, cf = q.config;
    $('#waBody').innerHTML = (!cf.adaToken ? '<div class="note" style="background:var(--warn-bg);margin-bottom:1rem">' + ic('warning', 'warn') + '<p class="small"><b>Token Fonnte belum diisi.</b> Notifikasi tidak akan terkirim. ' + (App.isSuper() ? 'Buka tab Konfigurasi.' : 'Minta Super Admin mengisinya.') + '</p></div>' : '') +
      (cf.adaToken && !cf.triggerAktif ? '<div class="note" style="background:var(--warn-bg);margin-bottom:1rem">' + ic('warning', 'warn') + '<p class="small"><b>Trigger 1 menit belum terpasang.</b> Pesan tetap dikirim saat ada pembayaran, tetapi percobaan ulang & blast batch berikutnya memerlukan trigger. Jalankan fungsi <b>pasangTrigger</b> dari editor Apps Script.</p></div>' : '') +
      '<div class="g4"><div class="card stat"><span class="lab">Menunggu</span><span class="val warn">' + c.Antri + '</span></div><div class="card stat"><span class="lab">Terkirim</span><span class="val ok">' + c.Terkirim + '</span></div><div class="card stat"><span class="lab">Gagal</span><span class="val err">' + c.Gagal + '</span></div><div class="card stat"><span class="lab">Dibatalkan</span><span class="val">' + c.Batal + '</span></div></div>' +
      '<div class="card" style="margin-top:1rem"><div class="row between wrap"><select class="inp" style="width:auto" data-ch="waQs"><option value="">Semua status</option>' + ['Antri', 'Terkirim', 'Gagal', 'Batal'].map(s => '<option ' + (this.qf.status === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select><div class="acts"><button class="btn soft sm" data-act="waProses">' + ic('play_arrow', 'sm') + ' Proses Sekarang</button>' + (App.isSuper() ? '<button class="btn ghost sm" data-act="waRetry">' + ic('replay', 'sm') + ' Ulangi yang Gagal</button>' : '') + '</div></div>' +
      (q.rows.length ? '<div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Waktu</th><th>Tujuan</th><th>Event</th><th>Pesan</th><th>Status</th></tr></thead><tbody>' + q.rows.map(r => '<tr><td class="small num">' + esc((r.dikirim || r.dibuat).slice(5, 16)) + '</td><td><b>' + esc(r.nama || '-') + '</b><div class="small mute num">' + esc(r.tujuan) + '</div></td><td>' + chip(r.event, 'gray') + '</td><td class="small" style="max-width:300px">' + esc(r.pesan) + '</td><td>' + chip(r.status, r.status === 'Terkirim' ? 'ok' : (r.status === 'Gagal' ? 'err' : (r.status === 'Antri' ? 'warn' : 'gray'))) + (r.status === 'Gagal' ? '<div class="small err">' + esc(r.respon) + '</div>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : emptyBox('mark_chat_read', 'Antrean masih kosong.')) + '</div>';
  },

  // ---------- Konfigurasi (Super Admin) ----------
  async konfig() {
    const c = this.cfg = await Api.post('notifConfig', {});
    const chk = (ok, t, id) => '<div class="chk ' + (ok ? 'ok' : '') + '"' + (id ? ' id="' + id + '"' : '') + '>' + ic(ok ? 'check_circle' : 'radio_button_unchecked') + '<span>' + t + '</span></div>';
    $('#waBody').innerHTML = '<div class="stack"><div class="card"><h2>' + ic('checklist') + 'Kesiapan Notifikasi WhatsApp</h2><div style="margin-top:10px">' + chk(c.adaToken, 'Token Fonnte terisi') + chk(true, 'Perangkat Fonnte terhubung (klik <b>Cek Perangkat</b> di bawah)', 'chkDev').replace('check_circle', 'help').replace('chk ok', 'chk') + chk(c.triggerAktif, 'Trigger pengirim antrean 1 menit aktif') + chk(c.waAktif, 'Saklar notifikasi otomatis AKTIF') + '</div><p class="small mute" style="margin-top:6px">Terkirim hari ini: <b>' + c.kirimHariIni + '</b> dari batas ' + c.batasHarian + ' pesan</p><details class="help"><summary>Panduan menghubungkan Fonnte langkah demi langkah</summary><ol><li>Buka <b>fonnte.com</b>, daftar lalu masuk ke dasbor.</li><li>Menu <b>Device</b> → <b>Add Device</b>, isi nama perangkat dan nomor WhatsApp pesantren (disarankan nomor khusus, bukan nomor pribadi).</li><li>Klik <b>Connect</b>. Di HP: WhatsApp → <b>Perangkat tertaut</b> → <b>Tautkan perangkat</b> → pindai kode QR di layar (seperti WhatsApp Web).</li><li>Di daftar device, klik <b>Token</b> pada perangkat tersebut (otomatis tersalin). Gunakan <b>token perangkat</b>, bukan token akun.</li><li>Tempel di kolom <b>Token Fonnte</b> di bawah → <b>Simpan Konfigurasi</b> → <b>Cek Perangkat</b> (harus <i>connect</i>) → <b>Kirim Tes WA</b> ke nomor Anda.</li><li>Pasang trigger (tombol <b>Pasang Trigger 1 Menit</b>), lalu geser saklar <b>AKTIF</b>.</li></ol><p class="hint">Setiap pesan memakai 1 kuota paket Fonnte (cek paket & kuota di fonnte.com). HP/nomor harus tetap tertaut. Token = kunci pengirim pesan: jangan dibagikan.</p></details></div>' +
      '<div class="card"><div class="row between wrap"><div><h2>' + ic('chat') + 'Notifikasi WhatsApp (Fonnte)</h2><p class="small mute">Pesan otomatis ke wali saat ada pembayaran, tanpa memperlambat kasir (diantre lalu dikirim).</p></div><label class="row"><b class="small" id="waSwTxt">' + (c.waAktif ? 'AKTIF' : 'NONAKTIF') + '</b><span class="switch"><input type="checkbox" id="cfAktif" data-ch="cfAktif" ' + (c.waAktif ? 'checked' : '') + '><i></i></span></label></div>' +
      '<div class="fgrid c2" style="margin-top:12px"><div class="fg"><label class="f">Token Fonnte</label>' + pwHtml('token', 'id="cfToken" autocomplete="off" placeholder="' + (c.adaToken ? c.tokenMask + ' (biarkan kosong = tidak diubah)' : 'Tempel token dari fonnte.com') + '"') + '<p class="hint">Token disimpan aman di server (Script Properties), tidak pernah ditampilkan lagi.</p></div><div class="fg"><label class="f">Jeda antarpesan (detik)</label><input class="inp" id="cfJeda" value="' + esc(c.jeda) + '" placeholder="5 atau 3-8"></div>' +
      '<div class="fg"><label class="f">Ukuran batch bawaan blast</label><select class="inp" id="cfBatch">' + [10, 20, 50].map(n => '<option ' + (c.batchDefault === n ? 'selected' : '') + '>' + n + '</option>').join('') + '</select></div><div class="fg"><label class="f">Alamat aplikasi (untuk {link})</label><input class="inp" id="cfUrl" value="' + esc(c.appUrl || location.origin + location.pathname) + '"></div>' +
      '<div class="fg"><label class="f">Jam kirim — mulai</label><input class="inp" type="time" id="cfJamM" value="' + esc(c.jamMulai) + '"></div><div class="fg"><label class="f">Jam kirim — selesai</label><input class="inp" type="time" id="cfJamS" value="' + esc(c.jamSelesai) + '"><p class="hint">Di luar jam ini, blast & notifikasi absensi/pelanggaran ditunda. <b>Notifikasi pembayaran tetap dikirim kapan saja.</b></p></div><div class="fg"><label class="f">Batas pesan per hari</label><input class="inp num" type="number" id="cfBatas" min="20" max="5000" value="' + c.batasHarian + '"><p class="hint">Pengaman agar nomor tidak dikirimi terlalu banyak sekaligus (20–5000).</p></div></div>' +
      '<label class="row small"><input type="checkbox" class="ck" id="cfDet" ' + (c.deteksiOtomatis ? 'checked' : '') + '> Deteksi otomatis nomor kontak baru terdaftar WhatsApp</label>' +
      '<div class="acts" style="margin-top:12px"><button class="btn soft sm" data-act="cfDevice">' + ic('router', 'sm') + ' Cek Perangkat</button><button class="btn soft sm" data-act="cfTest">' + ic('send', 'sm') + ' Kirim Tes WA</button><button class="btn soft sm" data-act="cfTrig">' + ic('schedule', 'sm') + ' Pasang Trigger 1 Menit</button>' + chip(c.triggerAktif ? 'Trigger aktif' : 'Trigger belum aktif', c.triggerAktif ? 'ok' : 'warn', true) + '</div><div id="cfInfo" class="small" style="margin-top:8px"></div></div>' +
      '<div class="card"><h2>' + ic('rule') + 'Matriks Notifikasi Otomatis</h2><div class="tw" style="margin-top:10px"><table class="tbl" style="min-width:0"><thead><tr><th>Kejadian</th><th class="c">Kirim WA</th><th></th></tr></thead><tbody>' + c.matriks.map(m => '<tr><td><b>' + esc(m.label) + '</b><div class="small mute">' + esc(m.kode) + '</div></td><td class="c"><span class="switch"><input type="checkbox" data-ch="cfEv" data-k="' + esc(m.kode) + '" ' + (m.wa ? 'checked' : '') + '><i></i></span></td><td class="r"><button class="btn ghost sm" data-act="cfMsg" data-k="' + esc(m.kode) + '">' + ic('edit', 'sm') + ' Ubah pesan</button></td></tr>').join('') + '</tbody></table></div><p class="hint">Notifikasi absensi alpa dan pelanggaran bersifat sensitif, jadi bawaannya mati. Aktifkan sesuai kebijakan pesantren.</p></div>' +
      '<button class="btn deep block" data-act="cfSave">' + ic('save') + ' Simpan Konfigurasi</button></div>';
    this.mx = {}; c.matriks.forEach(m => { this.mx[m.kode] = { wa: m.wa, pesan: m.pesan }; });
  },
  async simpan(btn) {
    const body = { waAktif: $('#cfAktif').checked, token: $('#cfToken').value, jeda: $('#cfJeda').value, batchDefault: Number($('#cfBatch').value), appUrl: $('#cfUrl').value, deteksiOtomatis: $('#cfDet').checked, jamMulai: $('#cfJamM').value, jamSelesai: $('#cfJamS').value, batasHarian: Number($('#cfBatas').value), matriks: this.mx };
    const r = await Api.post('notifConfigSave', body); await App.refreshCfg(); toast('Konfigurasi disimpan.', 'success'); this.cfg = r; await this.konfig();
  }
};
ACT.waTab = el => { WA.tab = el.dataset.t; clearInterval(WA.timer); $$('[data-act=waTab]').forEach(b => b.classList.toggle('on', b === el)); $('#waBody').innerHTML = skel(2); WA.load().catch(e => toast(e.message, 'error')); };
INP.waSumber = el => { const v = el.value; $('#waKelasBox').classList.toggle('hide', v === 'crm'); $('#waSegBox').classList.toggle('hide', v !== 'crm'); $('#waTagBox').classList.toggle('hide', v !== 'crm'); };
ACT.waLoad = el => busy(el, async () => {
  const r = await Api.post('waAudience', { sumber: $('#waSumber').value, kelas: $('#waKelas').value, segmen: $('#waSeg').value, tag: $('#waTag').value });
  WA.rows = r.rows; WA.sel = new Set(r.rows.filter(x => x.valid && !x.ganda && !x.optOut).map(x => x.hp)); const s = r.ringkas;
  $('#waSum').innerHTML = [['Total', s.total, 'gray'], ['Valid', s.valid, 'ok'], ['Tidak valid', s.tidakValid, 'err'], ['Ganda', s.ganda, 'gray'], ['Opt-out', s.optOut, 'gray'], ['Terdaftar WA', s.terdaftarWA, 'ok']].map(x => '<span class="chip chip-' + x[2] + '">' + x[0] + ': <b>' + x[1] + '</b></span>').join('');
  $('#waOnlyBox').classList.toggle('hide', !(s.terdaftarWA + s.tidakTerdaftarWA)); WA.drawRows();
  if (!r.rows.length) toast('Tidak ada penerima pada pilihan ini.', 'error');
});
ACT.waDetect = el => busy(el, () => WA.detect());
INP.waOnly = el => { WA.rows.forEach(r => { if (r.valid && !r.ganda && !r.optOut) { if (el.checked && r.statusWA !== 'Terdaftar') WA.sel.delete(r.hp); else WA.sel.add(r.hp); } }); WA.drawRows(); };
INP.waSel = el => { el.checked ? WA.sel.add(el.dataset.hp) : WA.sel.delete(el.dataset.hp); WA.prev(); };
INP.waPrev = () => WA.prev();
ACT.waVar = el => { const t = $('#waPesan'), v = '{' + el.dataset.v + '}', a = t.selectionStart || t.value.length; t.value = t.value.slice(0, a) + v + t.value.slice(t.selectionEnd || a); t.focus(); WA.prev(); };
ACT.waBatch = el => { WA.batch = +el.dataset.n; $$('#waBatchSeg button').forEach(b => b.classList.toggle('on', b === el)); WA.prev(); };
ACT.waStart = async el => {
  const pen = WA.rows.filter(r => WA.sel.has(r.hp)).map(r => ({ nama: r.nama, hp: r.hp, vars: r.vars }));
  if (!pen.length) { toast('Pilih minimal satu penerima.', 'error'); return; }
  if (!$('#waJudul').value.trim()) { toast('Isi judul blast.', 'error'); return; }
  if (!await confirmBox('Mulai blast WhatsApp ke <b>' + pen.length + ' nomor</b> (batch ' + WA.batch + ')? Pesan yang sudah terkirim tidak dapat ditarik.', 'Ya, mulai')) return;
  busy(el, async () => {
    const r = await Api.post('waBlastCreate', { judul: $('#waJudul').value, pesan: $('#waPesan').value, ukuranBatch: WA.batch, jeda: $('#waJeda').value, penerima: pen, sasaran: $('#waSumber').selectedOptions ? $('#waSumber').selectedOptions[0].text : '' });
    const d = r.dibuang; toast('Blast dibuat: ' + r.blast.total + ' penerima' + (d.ganda + d.tidakValid + d.optOut ? ' (dibuang: ' + (d.ganda + d.tidakValid + d.optOut) + ')' : ''), 'success');
    await Api.post('waBlastProcess', { blastId: r.blast.id }).catch(() => { }); WA.hist();
  });
};
ACT.waNext = el => busy(el, async () => { const r = await Api.post('waBlastProcess', { blastId: el.dataset.id }); toast('Batch diproses: ' + (r.proses.terkirim || 0) + ' terkirim, ' + (r.proses.gagal || 0) + ' gagal.', 'success'); WA.hist(); });
INP.waAuto = el => {
  clearInterval(WA.timer); WA.auto = el.checked ? el.dataset.id : null;
  if (el.checked) WA.timer = setInterval(async () => { if (!$('#waActive')) { clearInterval(WA.timer); return; } try { await Api.post('waBlastProcess', { blastId: WA.auto }); await WA.hist(); } catch (e) { clearInterval(WA.timer); } }, 35000);
};
ACT.waStop = async el => { if (await confirmBox('Hentikan blast ini? Pesan yang belum terkirim akan dibatalkan.', 'Ya, hentikan', true)) busy(null, async () => { const r = await Api.post('waBlastStop', { blastId: el.dataset.id }); clearInterval(WA.timer); WA.auto = null; toast(r.dibatalkan + ' pesan dibatalkan.', 'success'); WA.hist(); }); };
INP.waQs = el => { WA.qf.status = el.value; WA.antrean(); };
ACT.waProses = el => busy(el, async () => { const r = await Api.post('notifProses', { semua: true }); toast((r.terkirim || 0) + ' terkirim, ' + (r.gagal || 0) + ' gagal.' + (r.info ? ' ' + r.info : ''), 'success'); WA.antrean(); });
ACT.waRetry = el => busy(el, async () => { const r = await Api.post('notifRetry', {}); toast(r.diulang + ' pesan diantre ulang.', 'success'); WA.antrean(); });
INP.cfAktif = el => { $('#waSwTxt').textContent = el.checked ? 'AKTIF' : 'NONAKTIF'; };
INP.cfEv = el => { WA.mx[el.dataset.k].wa = el.checked; };
ACT.cfSave = el => busy(el, () => WA.simpan());
ACT.cfTrig = el => busy(el, async () => { const r = await Api.post('notifTrigger', {}); toast(r.triggerAktif ? 'Trigger aktif.' : 'Trigger belum aktif. Jalankan pasangTrigger dari editor Apps Script.', r.triggerAktif ? 'success' : 'error'); WA.konfig(); }).catch(() => { });
ACT.cfDevice = el => busy(el, async () => { const r = await Api.post('waDevice', {}); const cd = $('#chkDev'); if (cd) { const on = r.ok && String(r.status).toLowerCase() === 'connect'; cd.className = 'chk ' + (on ? 'ok' : ''); cd.innerHTML = ic(on ? 'check_circle' : 'cancel') + '<span>' + (on ? 'Perangkat Fonnte terhubung (' + esc(r.nomor) + ')' : 'Perangkat belum terhubung: ' + esc(r.reason || r.status)) + '</span>'; } $('#cfInfo').innerHTML = r.ok ? '<span class="chip chip-ok"><i></i>' + esc(r.status) + '</span> Nomor <b>' + esc(r.nomor) + '</b> · paket ' + esc(r.paket) + ' · kuota ' + esc(r.kuota) + (r.kedaluwarsa ? ' · berlaku s.d. ' + esc(r.kedaluwarsa) : '') : '<span class="err">' + esc(r.reason) + '</span>'; });
ACT.cfTest = () => {
  Modal.open(mHead('Kirim Tes WhatsApp') + '<form data-form="cfTest"><div class="fg"><label class="f">Nomor tujuan</label><input class="inp" name="nomor" inputmode="tel" placeholder="0812xxxxxxx" required></div><div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">Kirim</button></div></form>', 'narrow');
};
FRM.cfTest = f => busy(f.querySelector('button[type=submit]'), async () => { const r = await Api.post('waTest', { nomor: f.nomor.value }); Modal.closeAll(); toast(r.ok ? 'Pesan tes terkirim.' : 'Gagal: ' + r.respon, r.ok ? 'success' : 'error'); });
ACT.cfMsg = el => {
  const k = el.dataset.k, m = WA.cfg.matriks.find(x => x.kode === k);
  Modal.open(mHead('Ubah Pesan', m.label) + '<form data-form="cfMsg"><input type="hidden" name="k" value="' + esc(k) + '"><div class="fg"><textarea class="inp" name="pesan" style="min-height:200px">' + esc(WA.mx[k].pesan) + '</textarea><p class="hint">Variabel: {nama} {nama_santri} {nis} {kelas} {uraian} {jumlah} {tanggal} {trx} {sisa} {sesi} {tingkat} {jenis} {sanksi} {institusi} {link}</p></div><div class="mf"><button type="button" class="btn ghost" data-act="cfMsgReset" data-k="' + esc(k) + '">Kembalikan bawaan</button><button class="btn deep" type="submit">Terapkan</button></div></form>');
};
FRM.cfMsg = f => { WA.mx[f.k.value].pesan = f.pesan.value; Modal.close(f.closest('.overlay')); toast('Pesan diperbarui. Klik Simpan Konfigurasi untuk menyimpan.'); };
ACT.cfMsgReset = el => { const m = WA.cfg.matriks.find(x => x.kode === el.dataset.k); el.closest('form').pesan.value = m.pesanDefault; };

// ================= CRM KONTAK =================
const Crm = {
  f: { q: '', segmen: '', statusWA: '', tag: '', optOut: false, duplikat: false, bermasalah: false }, halaman: 1, sel: new Set(), data: null, stats: null,
  async page() {
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">NAMA · WHATSAPP · EMAIL</div><h1>CRM Kontak</h1><p class="mute">Satu layar untuk memantau semua kontak wali dan kontak lain: kualitas nomor, status WhatsApp, riwayat dihubungi.</p></div><div class="acts"><button class="btn soft sm" data-act="crmSync">' + ic('sync', 'sm') + ' Sinkron Sekarang</button><button class="btn soft sm" data-act="crmImpor">' + ic('upload_file', 'sm') + ' Impor</button>' + (App.isSuper() ? '<button class="btn soft sm" data-act="crmExport">' + ic('download', 'sm') + ' Ekspor</button>' : '') + '</div></div><div class="g4" id="crmKpi"></div><div id="crmSeg" class="pills"></div>' +
      '<div class="card tight"><div class="row wrap" style="gap:.75rem"><div class="search grow" style="min-width:180px">' + ic('search') + '<input class="inp" data-in="crmQ" placeholder="Cari nama, nomor, atau email…" value="' + esc(this.f.q) + '"></div><select class="inp" style="width:auto" data-ch="crmSt"><option value="">Semua status WA</option><option value="Terdaftar">Terdaftar WA</option><option value="Tidak Terdaftar">Bukan WA</option><option value="belum">Belum dicek</option></select><input class="inp" style="width:130px" placeholder="Tag…" data-in="crmTag" value="' + esc(this.f.tag) + '"></div></div>' +
      '<div class="selbar hide" id="crmBar"><span id="crmBarTxt" class="b"></span><div class="acts"><button class="btn soft sm" data-act="crmB" data-a="deteksiWA">' + ic('smartphone', 'sm') + ' Deteksi WA</button><button class="btn soft sm" data-act="crmB" data-a="tag">' + ic('sell', 'sm') + ' Beri Tag</button><button class="btn soft sm" data-act="crmB" data-a="optout">' + ic('block', 'sm') + ' Opt-out</button><button class="btn ghost sm" data-act="crmB" data-a="optin">Opt-in</button><button class="btn danger sm" data-act="crmB" data-a="hapusManual">' + ic('delete', 'sm') + ' Hapus (manual)</button><button class="btn ghost sm" data-act="crmMerge">' + ic('merge', 'sm') + ' Gabungkan</button></div></div><div class="card" id="crmList">' + skel(3) + '</div></div>';
    await Promise.all([this.loadStats(), this.load()]);
  },
  async loadStats() {
    const s = this.stats = await Api.post('crmStats', {}), k = (l, v, ic_, cls, f) => '<div class="card stat" ' + (f ? 'data-act="crmFilter" data-f="' + f + '" style="cursor:pointer"' : '') + '><span class="ico ' + cls + '">' + ic(ic_) + '</span><span class="lab">' + l + '</span><span class="val">' + NUM(v) + '</span></div>';
    const e = $('#crmKpi'); if (!e) return;
    e.innerHTML = k('Total kontak', s.total, 'contacts', '', 'all') + k('WA terverifikasi', s.terdaftarWA, 'verified', '', 'wa') + k('Belum dicek WA', s.belumDicek, 'help', 'w', 'belum') + k('Opt-out', s.optOut, 'block', 'e', 'optout') + k('Duplikat', s.duplikat, 'content_copy', 'w', 'dup') + k('Tidak bisa dihubungi', s.tidakBisa, 'phone_disabled', 'e', 'bermasalah');
  },
  async load() {
    const f = this.f, r = this.data = await Api.post('crmList', Object.assign({}, f, { halaman: this.halaman, per: 50 })), box = $('#crmList'); if (!box) return;
    const seg = $('#crmSeg'); if (seg) seg.innerHTML = '<button class="pill ' + (!f.segmen ? 'on' : '') + '" data-act="crmSegPick" data-s="">Semua</button>' + Object.keys(r.facet.segmen).map(s => '<button class="pill ' + (f.segmen === s ? 'on' : '') + '" data-act="crmSegPick" data-s="' + esc(s) + '">' + esc(s) + ' ' + r.facet.segmen[s] + '</button>').join('');
    const wab = s => s === 'Terdaftar' ? '<span class="wab ya">✓ WA</span>' : (s === 'Tidak Terdaftar' ? '<span class="wab tidak">✕</span>' : '<span class="wab belum">?</span>');
    box.innerHTML = r.rows.length ? '<div class="tw"><table class="tbl"><thead><tr><th style="width:30px"><input type="checkbox" class="ck" data-ch="crmAll"></th><th>Nama</th><th>WhatsApp</th><th>Email</th><th>Tag</th><th class="c">Pesan</th><th></th></tr></thead><tbody>' + r.rows.map(k => '<tr style="' + (k.duplikat || !k.waValid ? 'background:var(--warn-bg)' : '') + '"><td><input type="checkbox" class="ck" data-ch="crmSel" data-id="' + esc(k.id) + '" ' + (this.sel.has(k.id) ? 'checked' : '') + '></td><td><div class="row" style="gap:.6rem"><span class="avatar">' + esc(initials(k.nama)) + '</span><div><b>' + esc(k.nama) + '</b> ' + (k.optOut === 'YA' ? chip('opt-out', 'gray') : '') + '<div class="small mute">' + esc(k.segmen) + (k.info.santri ? ' · ' + esc(k.info.santri.slice(0, 2).join(', ')) + (k.info.santri.length > 2 ? '…' : '') : '') + '</div></div></div></td><td>' + (k.noWA ? '<span class="num">' + esc(k.noWA) + '</span> ' + wab(k.statusWA) : '<span class="mute">-</span>') + '</td><td class="small">' + (k.email ? esc(k.email) + (k.emailValid ? ' ✓' : ' ⚠') : '<span class="mute">-</span>') + '</td><td class="small">' + esc(k.tag || '') + '</td><td class="c small">' + k.jumlahPesan + '</td><td class="r"><button class="btn soft icon sm" data-act="crmDetail" data-id="' + esc(k.id) + '">' + ic('visibility', 'sm') + '</button></td></tr>').join('') + '</tbody></table></div>' + pager(r.halaman, r.total, r.per, 'crmPage') : emptyBox('contacts', 'Belum ada kontak. Klik Sinkron Sekarang untuk mengambil nomor wali dari data santri.');
    this.bar();
  },
  bar() { const n = this.sel.size, b = $('#crmBar'); if (!b) return; b.classList.toggle('hide', !n); $('#crmBarTxt').textContent = n + ' kontak dipilih'; }
};
INP.crmQ = debounce(el => { Crm.f.q = el.value; Crm.halaman = 1; Crm.load(); }, 350);
INP.crmTag = debounce(el => { Crm.f.tag = el.value; Crm.halaman = 1; Crm.load(); }, 350);
INP.crmSt = el => { Crm.f.statusWA = el.value; Crm.halaman = 1; Crm.load(); };
ACT.crmSegPick = el => { Crm.f.segmen = el.dataset.s; Crm.halaman = 1; Crm.load(); };
ACT.crmPage = el => { Crm.halaman = +el.dataset.p; Crm.load(); };
ACT.crmFilter = el => { const m = el.dataset.f, f = Crm.f; Object.assign(f, { statusWA: '', optOut: false, duplikat: false, bermasalah: false }); if (m === 'wa') f.statusWA = 'Terdaftar'; else if (m === 'belum') f.statusWA = 'belum'; else if (m === 'optout') f.optOut = true; else if (m === 'dup') f.duplikat = true; else if (m === 'bermasalah') f.bermasalah = true; Crm.halaman = 1; Crm.load(); };
INP.crmSel = el => { el.checked ? Crm.sel.add(el.dataset.id) : Crm.sel.delete(el.dataset.id); Crm.bar(); };
INP.crmAll = el => { Crm.data.rows.forEach(k => { el.checked ? Crm.sel.add(k.id) : Crm.sel.delete(k.id); }); $$('[data-ch=crmSel]').forEach(c => c.checked = el.checked); Crm.bar(); };
ACT.crmSync = el => busy(el, async () => { const r = await Api.post('crmSync', {}); toast('Sinkron selesai: ' + r.ditambah + ' kontak baru, total ' + r.total + '.', 'success'); Crm.page(); });
ACT.crmB = async el => {
  const a = el.dataset.a, ids = [...Crm.sel]; let nilai = '';
  if (a === 'tag') { nilai = (prompt('Tag yang akan ditambahkan:') || '').trim(); if (!nilai) return; }
  if (a === 'hapusManual' && !await confirmBox('Hapus kontak <b>manual</b> yang dipilih? Kontak dari data santri tidak ikut terhapus.', 'Ya, hapus', true)) return;
  busy(el, async () => { const r = await Api.post('crmBulk', { ids: ids, aksi: a, nilai: nilai }); toast(r.diproses + ' kontak diproses.', 'success'); Crm.sel.clear(); Crm.page(); });
};
ACT.crmMerge = async el => {
  if (Crm.sel.size < 2) { toast('Pilih minimal dua kontak.', 'error'); return; }
  const ids = [...Crm.sel]; if (await confirmBox('Gabungkan <b>' + ids.length + ' kontak</b> ke kontak pertama yang dipilih? Tag, catatan, dan jumlah pesan digabung.', 'Ya, gabungkan'))
    busy(el, async () => { await Api.post('crmMerge', { utama: ids[0], gabung: ids.slice(1) }); toast('Kontak digabung.', 'success'); Crm.sel.clear(); Crm.page(); });
};
ACT.crmDetail = async el => {
  const ld = Modal.open('<div class="center" style="padding:2rem"><span class="spin"></span></div>', 'wide'), id = el.dataset.id;
  let r; try { r = await Api.post('crmDetail', { id: id }); } catch (e) { Modal.close(ld.closest('.overlay')); toast(e.message, 'error'); return; }
  Modal.close(ld.closest('.overlay')); const k = r.kontak; Crm.cur = k;
  Modal.open(mHead(k.nama, k.segmen + ' · ' + k.sumber) + '<div class="row wrap" style="margin-bottom:10px">' + (k.noWA ? '<a class="btn soft sm" target="_blank" href="' + waLink(k.noWA, '') + '">' + ic('chat', 'sm') + ' Buka WhatsApp</a>' : '') + (k.email ? '<a class="btn soft sm" href="mailto:' + esc(k.email) + '">' + ic('mail', 'sm') + ' Email</a>' : '') + '</div>' +
    '<form data-form="crmSave"><input type="hidden" name="id" value="' + esc(k.id) + '"><div class="fgrid c2"><div class="fg"><label class="f">Nama</label><input class="inp" name="nama" value="' + esc(k.nama) + '"></div><div class="fg"><label class="f">WhatsApp</label><input class="inp" name="noWA" value="' + esc(k.noWA) + '" inputmode="tel"></div><div class="fg"><label class="f">Email</label><input class="inp" name="email" value="' + esc(k.email) + '"></div><div class="fg"><label class="f">Tag (pisahkan koma)</label><input class="inp" name="tag" value="' + esc(k.tag) + '"></div></div>' +
    (k.sumber === 'wali' ? '<p class="hint" style="margin:-6px 0 10px">Perubahan nama/nomor kontak wali ditulis balik ke data santri terkait.</p>' : '') + '<div class="fg"><label class="f">Catatan</label><textarea class="inp" name="catatan" maxlength="500">' + esc(k.catatan) + '</textarea></div><label class="row small"><input type="checkbox" class="ck" name="optOut" ' + (k.optOut === 'YA' ? 'checked' : '') + '> Opt-out (tidak menerima blast; notifikasi transaksi tetap dikirim)</label>' +
    (k.info.santri ? '<div class="small mute" style="margin-top:8px">Wali dari: <b>' + esc(k.info.santri.join(', ')) + '</b></div>' : '') + '<div class="mf" style="justify-content:flex-start"><button class="btn deep" type="submit">Simpan</button></div></form>' +
    '<h3 style="margin:14px 0 6px">Catat interaksi</h3><form data-form="crmInter" class="row wrap"><input type="hidden" name="id" value="' + esc(k.id) + '"><select class="inp" name="kanal" style="width:auto"><option>Telepon</option><option>WA Manual</option><option>Kunjungan</option><option>Catatan</option></select><input class="inp grow" name="ringkasan" placeholder="Ringkasan…" required maxlength="400"><button class="btn soft sm" type="submit">Tambah</button></form>' +
    '<h3 style="margin:14px 0 6px">Riwayat</h3>' + (r.timeline.length ? '<div class="tw" style="max-height:220px;overflow:auto"><table class="tbl" style="min-width:0"><tbody>' + r.timeline.map(x => '<tr><td class="small num" style="white-space:nowrap">' + esc((x.waktu || '').slice(0, 16)) + '</td><td>' + chip(x.jenis, 'gray') + '</td><td class="small">' + esc(x.ringkas) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="small mute">Belum ada riwayat.</p>'), 'wide');
};
FRM.crmSave = f => busy(f.querySelector('button[type=submit]'), async () => { await Api.post('crmSave', { id: f.id.value, nama: f.nama.value, noWA: f.noWA.value, email: f.email.value, tag: f.tag.value, catatan: f.catatan.value, optOut: f.optOut.checked }); Modal.closeAll(); toast('Kontak disimpan.', 'success'); Crm.page(); });
FRM.crmInter = f => busy(f.querySelector('button[type=submit]'), async () => { await Api.post('crmInteraksi', { id: f.id.value, kanal: f.kanal.value, ringkasan: f.ringkasan.value }); toast('Interaksi dicatat.', 'success'); f.ringkasan.value = ''; });
ACT.crmImpor = () => {
  Modal.open(mHead('Impor Kontak Manual', 'Untuk kontak di luar data santri (ustadz, donatur, dll.)') + '<div class="stack"><div class="card flat tight row between wrap"><div><b>1. Unduh template</b><p class="small mute">Kolom: Nama, WhatsApp, Email, Segmen, Tag.</p></div><button class="btn soft sm" data-act="crmTpl">' + ic('download', 'sm') + ' Template .xlsx</button></div><div class="card flat tight"><b>2. Pilih berkas (.xlsx / .csv)</b><input class="inp" type="file" accept=".xlsx,.xls,.csv" data-ch="crmFile" style="margin-top:8px"></div><div id="crmImpOut"></div></div>', 'wide');
};
ACT.crmTpl = () => exportXlsx('template-kontak.xlsx', 'Kontak', [{ Nama: 'Ust. Ali', WhatsApp: '081234567890', Email: '', Segmen: 'Ustadz', Tag: 'pengajar' }]).catch(e => toast(e.message, 'error'));
INP.crmFile = async el => {
  const f = el.files[0], out = $('#crmImpOut'); if (!f) return; out.innerHTML = '<span class="spin"></span> Membaca…';
  try {
    await Lib.load('xlsx'); const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }), j = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const pick = (o, ...ks) => { for (const k of Object.keys(o)) if (ks.indexOf(k.toLowerCase().replace(/[^a-z]/g, '')) >= 0) return String(o[k]).trim(); return ''; };
    const rows = j.map(o => ({ nama: pick(o, 'nama', 'namalengkap'), wa: pick(o, 'whatsapp', 'wa', 'nohp', 'hp', 'nomor'), email: pick(o, 'email'), segmen: pick(o, 'segmen'), tag: pick(o, 'tag') }));
    const r = await Api.post('crmImport', { rows: rows });
    out.innerHTML = '<div class="g2"><div class="card flat tight stat"><span class="lab">Ditambahkan</span><span class="val ok">' + r.ditambah + '</span></div><div class="card flat tight stat"><span class="lab">Ditolak</span><span class="val ' + (r.errors.length ? 'err' : '') + '">' + r.errors.length + '</span></div></div>' + (r.errors.length ? '<div class="tw" style="max-height:160px;overflow:auto;margin-top:8px"><table class="tbl" style="min-width:0"><tbody>' + r.errors.map(e => '<tr><td>Baris ' + e.baris + '</td><td class="err">' + esc(e.pesan) + '</td></tr>').join('') + '</tbody></table></div>' : '');
    if (r.ditambah) Crm.page();
  } catch (e) { out.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }
};
ACT.crmExport = el => busy(el, async () => { const r = await Api.post('crmExport', Object.assign({}, Crm.f)); if (!r.length) { toast('Tidak ada data.', 'error'); return; } await exportXlsx('kontak-crm-' + todayStr() + '.xlsx', 'Kontak', r); });
