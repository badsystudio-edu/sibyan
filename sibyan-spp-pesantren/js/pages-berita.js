/* ============================================================
 * BERITA & PENGUMUMAN — dikelola admin, tampil di beranda publik & portal wali
 * Gambar disimpan di Google Drive (publik) dan tampil langsung di kartu & detail.
 * ============================================================ */
const Brt = {
  admin: null, draft: { old: [], baru: [], del: new Set() },

  cardHtml(b) {
    const g = b.gambar[0];
    return '<article class="news card tight fade" data-act="brtOpen" data-id="' + esc(b.id) + '" tabindex="0"><div class="news-img">' +
      (g ? '<img loading="lazy" src="' + imgUrl(g, 500) + '" alt="" onerror="this.style.display=\'none\'">' + (b.gambar.length > 1 ? '<span class="chip chip-gray news-cnt">' + ic('photo_library', 'sm') + ' ' + b.gambar.length + '</span>' : '') : ic('newspaper')) +
      '</div><div class="news-body"><div class="row wrap">' + chip(b.kategori, 'ok') + (b.sematkan ? chip('Disematkan', 'warn') : '') + '</div><h3>' + esc(b.judul) + '</h3><p class="small mute">' + fmtTgl(b.tanggal) + ' · ' + esc(b.penulis) + '</p><p class="small" style="margin-top:4px">' + esc(b.isi) + '</p></div></article>';
  },
  async loadInto(sel) {
    const box = $(sel); if (!box) return;
    box.innerHTML = skel(2, 120);
    try {
      const l = await Api.get('publicBerita', {});
      box.innerHTML = l.length ? l.map(b => this.cardHtml(b)).join('') : '<div class="card">' + emptyBox('newspaper', 'Belum ada berita atau pengumuman.') + '</div>';
    } catch (e) { box.innerHTML = '<div class="card">' + emptyBox('cloud_off', e.message) + '</div>'; }
  },
  async detail(id, admin) {
    const ld = Modal.open('<div class="center" style="padding:2rem"><span class="spin"></span> Memuat…</div>', 'wide');
    let b;
    try { b = admin ? this.admin.items.find(x => x.id === id) : await Api.get('publicBeritaDetail', { id: id }); } catch (e) { Modal.close(ld.closest('.overlay')); toast(e.message, 'error'); return; }
    Modal.close(ld.closest('.overlay'));
    Modal.open(mHead(b.judul, b.kategori + ' · ' + fmtTgl(b.tanggal) + ' · ' + b.penulis) + (b.gambar.length ? '<div class="gal">' + b.gambar.map(g => '<img loading="lazy" src="' + imgUrl(g, 1000) + '" alt="" onerror="this.style.display=\'none\'">').join('') + '</div>' : '') + '<div style="line-height:24px">' + nl2br(b.isi) + '</div>', 'wide');
  },

  // ----- Admin -----
  async page() {
    const r = this.admin = await Api.post('beritaList', {});
    $('#view').innerHTML = '<div class="fade stack"><div class="ph"><div><div class="eyebrow">BERITA & PENGUMUMAN</div><h1>Kelola Berita</h1><p class="mute">Berita berstatus <b>Terbit</b> langsung tampil di beranda publik dan portal wali, lengkap dengan gambarnya.</p></div><button class="btn deep" data-act="brtAdd">' + ic('edit_square') + ' Tulis Berita</button></div>' +
      (r.items.length ? r.items.map(b => '<div class="card tight"><div class="row" style="gap:.9rem;align-items:flex-start;flex-wrap:wrap"><div class="news-img" style="width:110px;min-height:90px">' + (b.gambar[0] ? '<img loading="lazy" src="' + imgUrl(b.gambar[0], 400) + '" alt="" onerror="this.style.display=\'none\'">' : ic('newspaper')) + '</div><div class="grow" style="min-width:200px"><div class="row wrap">' + chip(b.status === 'terbit' ? 'Terbit' : 'Draf', b.status === 'terbit' ? 'ok' : 'gray', true) + chip(b.kategori, 'info') + (b.sematkan ? chip('Disematkan', 'warn') : '') + (b.gambar.length ? chip(b.gambar.length + ' gambar', 'gray') : '') + '</div><h3 style="margin:6px 0 2px">' + esc(b.judul) + '</h3><p class="small mute">' + fmtTgl(b.tanggal) + ' · ' + esc(b.penulis) + '</p></div><div class="acts"><button class="btn soft sm" data-act="brtView" data-id="' + esc(b.id) + '">' + ic('visibility', 'sm') + ' Lihat</button><button class="btn ghost sm" data-act="brtEdit" data-id="' + esc(b.id) + '">' + ic('edit', 'sm') + ' Ubah</button><button class="btn danger sm" data-act="brtDel" data-id="' + esc(b.id) + '">' + ic('delete', 'sm') + '</button></div></div></div>').join('') : '<div class="card">' + emptyBox('newspaper', 'Belum ada berita. Tulis berita pertama Anda.') + '</div>') + '</div>';
  },
  form(b) {
    b = b || {}; this.draft = { old: (b.gambar || []).slice(), baru: [], del: new Set() };
    Modal.open(mHead(b.id ? 'Ubah Berita' : 'Tulis Berita') + '<form data-form="brtSave"><input type="hidden" name="id" value="' + esc(b.id || '') + '"><div class="fg"><label class="f">Judul *</label><input class="inp" name="judul" value="' + esc(b.judul || '') + '" maxlength="120" required></div>' +
      '<div class="fgrid c2"><div class="fg"><label class="f">Kategori</label><select class="inp" name="kategori">' + (this.admin.kategori || []).map(k => '<option ' + (b.kategori === k ? 'selected' : '') + '>' + esc(k) + '</option>').join('') + '</select></div><div class="fg"><label class="f">Tanggal</label><input class="inp" type="date" name="tanggal" value="' + esc(b.tanggal || todayStr()) + '" required></div></div>' +
      '<div class="fg"><label class="f">Isi berita / informasi *</label><textarea class="inp" name="isi" style="min-height:150px" maxlength="6000" required>' + esc(b.isi || '') + '</textarea></div>' +
      '<div class="fg"><label class="f">Gambar (boleh lebih dari satu, maks. 6)</label><input class="inp" type="file" accept="image/*" multiple data-ch="brtFiles" style="padding:8px 12px"><div class="thumbs" id="brtPrev" style="margin-top:8px"></div><p class="hint">Gambar dikecilkan otomatis. Gambar berita bersifat publik.</p></div>' +
      '<div class="row wrap" style="gap:1.2rem"><div class="fg" style="margin:0"><label class="f">Status</label><select class="inp" name="status" style="width:auto"><option value="terbit" ' + (b.status !== 'draf' ? 'selected' : '') + '>Terbit (tampil ke publik)</option><option value="draf" ' + (b.status === 'draf' ? 'selected' : '') + '>Draf (disembunyikan)</option></select></div><label class="row small" style="margin-top:16px"><input type="checkbox" class="ck" name="sematkan" ' + (b.sematkan ? 'checked' : '') + '> Sematkan di paling atas</label></div>' +
      '<div class="mf"><button type="button" class="btn ghost" data-act="close">Batal</button><button class="btn deep" type="submit">' + ic('publish') + ' Simpan</button></div></form>', 'wide');
    this.prev();
  },
  prev() {
    const d = this.draft, box = $('#brtPrev'); if (!box) return;
    box.innerHTML = d.old.map(g => '<div class="thumb ' + (d.del.has(g) ? 'del' : '') + '"><img src="' + imgUrl(g, 200) + '" alt="" onerror="this.style.opacity=.2"><button type="button" data-act="brtRmOld" data-id="' + esc(g) + '" title="' + (d.del.has(g) ? 'Batalkan hapus' : 'Hapus gambar') + '">' + ic(d.del.has(g) ? 'undo' : 'close', 'sm') + '</button></div>').join('') +
      d.baru.map((g, i) => '<div class="thumb"><img src="' + g + '" alt=""><button type="button" data-act="brtRmNew" data-i="' + i + '" title="Buang">' + ic('close', 'sm') + '</button></div>').join('');
  }
};
ACT.brtOpen = el => Brt.detail(el.dataset.id, false);
ACT.brtView = el => Brt.detail(el.dataset.id, true);
ACT.brtAdd = () => Brt.form();
ACT.brtEdit = el => Brt.form(Brt.admin.items.find(x => x.id === el.dataset.id));
ACT.brtRmOld = el => { const d = Brt.draft; d.del.has(el.dataset.id) ? d.del.delete(el.dataset.id) : d.del.add(el.dataset.id); Brt.prev(); };
ACT.brtRmNew = el => { Brt.draft.baru.splice(+el.dataset.i, 1); Brt.prev(); };
INP.brtFiles = async el => {
  const d = Brt.draft, files = Array.from(el.files);
  for (const f of files) {
    if (d.old.filter(g => !d.del.has(g)).length + d.baru.length >= 6) { toast('Maksimal 6 gambar per berita.', 'error'); break; }
    try { d.baru.push(await fileToDataUrl(f, 1100, 'image/jpeg', .8)); } catch (e) { toast(e.message, 'error'); }
  }
  el.value = ''; Brt.prev();
};
FRM.brtSave = f => busy(f.querySelector('button[type=submit]'), async () => {
  const d = Brt.draft;
  await Api.post('beritaSave', { id: f.id.value, judul: f.judul.value, kategori: f.kategori.value, tanggal: f.tanggal.value, isi: f.isi.value, status: f.status.value, sematkan: f.sematkan.checked, gambarBaru: d.baru, hapusGambar: Array.from(d.del) });
  Modal.closeAll(); toast('Berita disimpan.', 'success'); Brt.page();
});
ACT.brtDel = async el => { if (await confirmBox('Hapus berita ini beserta gambarnya?', 'Ya, hapus', true)) busy(null, async () => { await Api.post('beritaDelete', { id: el.dataset.id }); toast('Berita dihapus.', 'success'); Brt.page(); }); };
