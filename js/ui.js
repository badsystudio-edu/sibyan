/* ============================================================
 * UI — helper umum, modal, toast, pustaka lazy-load, nota, KTS
 * ============================================================ */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NUM = n => Math.round(Number(n) || 0).toLocaleString('id-ID');
const rp = n => 'Rp ' + NUM(n);
const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BLN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const todayStr = () => new Date().toLocaleDateString('sv-SE', { timeZone: APP_CFG.tz });
const fmtTgl = s => { if (!s) return '-'; const p = String(s).slice(0, 10).split('-'); return (+p[2]) + ' ' + BLN3[+p[1] - 1] + ' ' + p[0]; };
const fmtJam = s => (s && s.length >= 16) ? s.slice(11, 16) + ' WIB' : '';
const ymLabel = ym => BLN[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const ic = (n, c) => '<span class="ms ' + (c || '') + '" aria-hidden="true">' + n + '</span>';
const debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms || 350); }; };
const chip = (t, c, dot) => '<span class="chip chip-' + c + '">' + (dot ? '<i></i>' : '') + esc(t) + '</span>';
const logoSrc = () => localStorage.getItem('sibyan_logo') || 'assets/logo.png';
const skel = (n, h) => Array.from({ length: n || 3 }, () => '<div class="skel" style="height:' + (h || 64) + 'px;margin-bottom:12px"></div>').join('');
const emptyBox = (icon, msg) => '<div class="empty">' + ic(icon) + esc(msg) + '</div>';

// ---------- Registri event (delegasi) ----------
const ACT = {}, INP = {}, FRM = {};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const f = ACT[t.dataset.act]; if (f) { e.preventDefault(); f(t, e); }
});
document.addEventListener('input', e => { const t = e.target.closest('[data-in]'); if (t && INP[t.dataset.in]) INP[t.dataset.in](t, e); });
document.addEventListener('change', e => { const t = e.target.closest('[data-ch]'); if (t && INP[t.dataset.ch]) INP[t.dataset.ch](t, e); });
document.addEventListener('submit', e => { const t = e.target.closest('[data-form]'); if (t && FRM[t.dataset.form]) { e.preventDefault(); FRM[t.dataset.form](t, e); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') Modal.close(); });

// ---------- Toast ----------
function toast(msg, type) {
  const d = document.createElement('div'); d.className = 'toast ' + (type || ''); d.textContent = msg;
  $('#toasts').appendChild(d); setTimeout(() => d.remove(), type === 'error' ? 5500 : 3200);
}

// ---------- Modal (bertumpuk) ----------
const Modal = {
  stack: [],
  open(html, cls) {
    const o = document.createElement('div'); o.className = 'overlay';
    o.innerHTML = '<div class="modal ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(o); document.body.classList.add('modal-open');
    o.addEventListener('mousedown', e => { if (e.target === o) this.close(o); });
    this.stack.push(o); requestAnimationFrame(() => o.classList.add('show'));
    return o.firstElementChild;
  },
  close(o) {
    o = o || this.stack[this.stack.length - 1]; if (!o) return;
    o.remove(); this.stack = this.stack.filter(x => x !== o);
    if (!this.stack.length) document.body.classList.remove('modal-open');
  },
  closeAll() { while (this.stack.length) this.close(); },
  top() { const o = this.stack[this.stack.length - 1]; return o ? o.firstElementChild : null; }
};
ACT.close = el => Modal.close(el.closest('.overlay'));
const mHead = (title, sub) => '<div class="mh"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p class="small mute">' + esc(sub) + '</p>' : '') + '</div><button class="btn ghost icon" data-act="close" aria-label="Tutup">' + ic('close') + '</button></div>';

function confirmBox(htmlMsg, label, danger) {
  return new Promise(res => {
    const m = Modal.open('<div class="mh"><h2>Konfirmasi</h2></div><p>' + htmlMsg + '</p><div class="mf"><button class="btn ghost" data-act="cfNo">Batal</button><button class="btn ' + (danger ? 'danger' : '') + '" data-act="cfYes">' + esc(label || 'Ya, lanjutkan') + '</button></div>', 'narrow');
    m.closest('.overlay').__res = res;
  });
}
ACT.cfYes = el => { const o = el.closest('.overlay'); o.__res(true); Modal.close(o); };
ACT.cfNo = el => { const o = el.closest('.overlay'); o.__res(false); Modal.close(o); };

// tombol sibuk + penanganan galat seragam
async function busy(btn, fn) {
  if (btn) { btn.disabled = true; btn.dataset.t = btn.innerHTML; btn.innerHTML = '<span class="spin"></span> Memproses…'; }
  try { return await fn(); }
  catch (e) { if (e.code !== 'AUTH') toast(e.message || 'Terjadi kesalahan', 'error'); return undefined; }
  finally { if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = btn.dataset.t; } }
}

// ---------- Pustaka (dimuat saat dibutuhkan) ----------
const LIB_URLS = {
  chart: ['https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'],
  xlsx: ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'],
  pdf: ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'],
  qr: ['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js']
};
const Lib = {
  p: {},
  load(n) {
    if (!this.p[n]) {
      this.p[n] = (async () => {
        for (const u of LIB_URLS[n]) await new Promise((ok, no) => {
          const s = document.createElement('script'); s.src = u; s.onload = ok;
          s.onerror = () => no(new Error('Gagal memuat pustaka tambahan. Periksa koneksi internet.')); document.head.appendChild(s);
        });
      })();
      this.p[n].catch(() => { delete this.p[n]; });
    }
    return this.p[n];
  }
};

// ---------- QR, WhatsApp, foto ----------
async function qrSvg(text) {
  await Lib.load('qr'); const q = qrcode(0, 'M'); q.addData(text); q.make();
  return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
}
const qrUrl = nis => location.origin + location.pathname + '#/?nis=' + encodeURIComponent(nis);
function waNum(hp) { let n = String(hp || '').replace(/\D/g, ''); if (!n) return ''; if (n[0] === '0') n = '62' + n.slice(1); else if (n[0] === '8') n = '62' + n; return n; }
const waLink = (hp, text) => 'https://wa.me/' + waNum(hp) + '?text=' + encodeURIComponent(text);
const fillTpl = (tpl, v) => String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m);

const Foto = {
  m: {},
  async hydrate(root) {
    root = root || document;
    const need = [...new Set($$('[data-foto]', root).map(e => e.dataset.foto).filter(n => !(n in this.m)))];
    for (let i = 0; i < need.length; i += 12) {
      const part = need.slice(i, i + 12);
      try { const r = await Api.post('getFoto', { nisList: part }); part.forEach(n => { this.m[n] = r[n] || ''; }); }
      catch (e) { part.forEach(n => { this.m[n] = ''; }); }
      this.paint(root);
    }
    this.paint(root);
  },
  paint(root) { $$('[data-foto]', root).forEach(e => { const v = this.m[e.dataset.foto]; if (v && !e.querySelector('img')) e.innerHTML = '<img src="' + v + '" alt="">'; }); }
};
const avatar = (nama, nis, adaFoto, cls) => {
  const v = Foto.m[nis];
  return '<span class="avatar ' + (cls || '') + '" ' + (adaFoto && !v ? 'data-foto="' + esc(nis) + '"' : '') + '>' + (v ? '<img src="' + v + '" alt="">' : esc(initials(nama))) + '</span>';
};

function fileToDataUrl(file, max, type, q) {
  type = type || 'image/jpeg';
  return new Promise((ok, no) => {
    const fr = new FileReader();
    fr.onerror = () => no(new Error('Gagal membaca berkas.'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => no(new Error('Berkas bukan gambar yang valid.'));
      im.onload = () => {
        const s = Math.min(1, (max || 320) / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        const x = c.getContext('2d'); if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
        x.drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL(type, q || .78));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

// ---------- Cetak & ekspor ----------
function printHtml(html, mode) {
  const r = $('#print-root'); r.innerHTML = html; document.body.dataset.print = mode || 'page';
  const done = () => { document.body.removeAttribute('data-print'); r.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done); setTimeout(() => window.print(), 120);
}
async function exportXlsx(filename, sheetName, rows) {
  await Lib.load('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows), wb = XLSX.utils.book_new();
  ws['!cols'] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.min(40, Math.max(k.length + 2, ...rows.slice(0, 50).map(r => String(r[k] === undefined ? '' : r[k]).length + 2))) }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); XLSX.writeFile(wb, filename);
}
function logoDataUrl() {
  return new Promise(ok => {
    const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); try { ok(c.toDataURL('image/png')); } catch (e) { ok(''); } };
    im.onerror = () => ok(''); im.src = logoSrc();
  });
}
async function exportPdf(o) {
  await Lib.load('pdf');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ orientation: o.landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const lg = await logoDataUrl(); let x = 14;
  if (lg) { try { doc.addImage(lg, 'PNG', 14, 9, 14, 14); x = 31; } catch (e) { } }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(App.name(), x, 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(App.alamat(), x, 20);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(o.title, 14, 31);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); if (o.sub) doc.text(o.sub, 14, 36);
  doc.autoTable({ startY: 40, head: o.head, body: o.body, foot: o.foot, styles: { fontSize: 8.5, cellPadding: 2 }, headStyles: { fillColor: [15, 81, 50] }, footStyles: { fillColor: [236, 253, 245], textColor: [15, 81, 50] }, columnStyles: o.colStyles || {} });
  doc.save(o.filename);
}

// ---------- Nota / kuitansi ----------
function receiptHtml(r, qr) {
  const p = r.pesantren || {};
  return '<div class="rcpt"><div class="hd"><img src="' + logoSrc() + '" alt=""><b>' + esc(p.nama || App.name()) + '</b><div>' + esc(p.alamat || '') + '</div><div class="b" style="margin-top:6px">*** BUKTI BAYAR ' + (r.jenis === 'SPP' ? 'SPP' : 'IURAN') + ' ***</div></div><hr>' +
    '<div class="ln"><span>No. Transaksi</span><span class="b">' + esc(r.id) + '</span></div>' +
    '<div class="ln"><span>Tanggal</span><span>' + fmtTgl(r.tanggal) + ' ' + fmtJam(r.dibuat) + '</span></div>' +
    '<div class="ln"><span>Petugas</span><span>' + esc(r.petugas) + '</span></div>' +
    '<div class="ln"><span>Metode</span><span>' + esc(r.metode) + '</span></div><hr>' +
    '<div class="ln"><span>Nama Santri</span><span class="b">' + esc(r.nama) + '</span></div>' +
    '<div class="ln"><span>NIS</span><span>' + esc(r.nis) + '</span></div>' +
    '<div class="ln"><span>Kelas</span><span>' + esc(r.kelas) + '</span></div><hr>' +
    '<div class="ln"><span>' + esc(r.uraian) + '</span><span>' + rp(r.nominal) + '</span></div>' +
    '<div class="ln tot"><span>TOTAL</span><span>' + rp(r.nominal) + '</span></div>' +
    (r.jenis === 'SPP' ? '<div class="ln"><span>Sisa tunggakan</span><span>' + rp(r.sisaTunggakan) + '</span></div>' : '') +
    '<hr><div class="qr">' + (qr || '') + '</div><div class="ctr small">' + esc(r.id) + '</div><div class="ctr small"><i>Jazakumullahu khairan katsiran</i></div></div>';
}
const Receipt = {
  cur: null,
  async show(idOrObj) {
    let r = idOrObj;
    if (typeof idOrObj === 'string') {
      const ld = Modal.open('<div class="center" style="padding:2rem"><span class="spin"></span> Memuat nota…</div>', 'narrow');
      try { r = await Api.post('getReceipt', { id: idOrObj }); } catch (e) { Modal.close(ld.closest('.overlay')); toast(e.message, 'error'); return; }
      Modal.close(ld.closest('.overlay'));
    }
    r.qr = await qrSvg('SIBYAN|' + r.id + '|' + r.nis + '|' + r.nominal).catch(() => '');
    this.cur = r;
    const isAdm = Api.user && Api.user.peran !== 'wali';
    Modal.open(mHead('Bukti Pembayaran', r.id) + receiptHtml(r, r.qr) +
      '<div class="mf" style="justify-content:center"><button class="btn deep" data-act="rcPrint">' + ic('print') + ' Cetak Thermal</button>' +
      (isAdm && r.hpWali ? '<button class="btn soft" data-act="rcWa">' + ic('share') + ' Kirim Struk WA</button>' : '') +
      '<button class="btn ghost" data-act="rcPdf">' + ic('download') + ' PDF</button></div>' +
      '<p class="hint center">Cetak ke printer thermal Bluetooth: pilih printer pada dialog cetak (mis. lewat aplikasi RawBT di Android).</p>');
  }
};
ACT.rcPrint = () => printHtml(receiptHtml(Receipt.cur, Receipt.cur.qr), 'receipt');
ACT.rcWa = () => {
  const r = Receipt.cur;
  const t = 'Assalamu\'alaikum. Bukti pembayaran ' + r.pesantren.nama + '\n\nNo: ' + r.id + '\nTanggal: ' + fmtTgl(r.tanggal) + '\nSantri: ' + r.nama + ' (NIS ' + r.nis + ')\n' + r.uraian + ': ' + rp(r.nominal) + '\nMetode: ' + r.metode + '\nSisa tunggakan SPP: ' + rp(r.sisaTunggakan) + '\n\nJazakumullahu khairan.';
  window.open(waLink(r.hpWali, t), '_blank');
};
ACT.rcPdf = async el => busy(el, async () => {
  await Lib.load('pdf'); const r = Receipt.cur, { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: [58, 135] });
  let y = 8; const c = (t, sz, b) => { doc.setFont('courier', b ? 'bold' : 'normal'); doc.setFontSize(sz || 7.5); doc.text(String(t), 29, y, { align: 'center' }); y += (sz || 7.5) * .45 + 1.2; };
  const l = (a, b, bold) => { doc.setFont('courier', bold ? 'bold' : 'normal'); doc.setFontSize(7); doc.text(String(a), 3, y); doc.text(String(b), 55, y, { align: 'right' }); y += 4; };
  c(r.pesantren.nama.toUpperCase(), 8, true); c('*** BUKTI BAYAR ' + (r.jenis === 'SPP' ? 'SPP' : 'IURAN') + ' ***', 7); y += 1;
  l('No', r.id); l('Tgl', fmtTgl(r.tanggal) + ' ' + fmtJam(r.dibuat).replace(' WIB', '')); l('Petugas', r.petugas); l('Metode', r.metode); y += 1;
  l('Nama', r.nama.slice(0, 22)); l('NIS', r.nis); l('Kelas', r.kelas); y += 1;
  doc.setFontSize(7); doc.text(doc.splitTextToSize(r.uraian, 52), 3, y); y += 7; l('TOTAL', rp(r.nominal), true);
  if (r.jenis === 'SPP') l('Sisa tunggakan', rp(r.sisaTunggakan)); y += 2; c('Jazakumullahu khairan', 7);
  doc.save('Nota-' + r.id + '.pdf');
});

// ---------- Kartu santri (KTS) ----------
async function ktsHtml(s, fotoUrl) {
  const qr = await qrSvg(qrUrl(s.nis)).catch(() => '');
  return '<div class="kts"><div class="top"><img src="' + logoSrc() + '" alt=""><div><b>' + esc(App.name()) + '</b><small>KARTU TANDA SANTRI</small></div></div>' +
    '<div class="body"><div class="kph">' + (fotoUrl ? '<img src="' + fotoUrl + '" alt="">' : esc(initials(s.nama))) + '</div><div><div class="nm">' + esc(s.nama) + '</div><div class="sub">' + esc(s.kelas) + '</div><div class="sub">Masuk ' + esc(s.thnMasuk) + '</div><div class="nis">' + esc(s.nis) + '</div></div></div>' +
    '<div class="qr">' + qr + '</div><div class="ft">Pindai QR untuk cek status</div></div>';
}

// ---------- Komponen tabel: paginasi ----------
function pager(page, total, size, act) {
  const pages = Math.max(1, Math.ceil(total / size)), a = Math.max(1, Math.min(page - 2, pages - 4)), b = Math.min(pages, a + 4);
  let btn = ''; for (let i = a; i <= b; i++) btn += '<button class="' + (i === page ? 'on' : '') + '" data-act="' + act + '" data-p="' + i + '">' + i + '</button>';
  const from = total ? (page - 1) * size + 1 : 0, to = Math.min(total, page * size);
  return '<div class="pager"><span class="small mute">Menampilkan ' + from + '–' + to + ' dari ' + NUM(total) + '</span><div class="pg"><button data-act="' + act + '" data-p="' + (page - 1) + '" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>' + btn +
    '<button data-act="' + act + '" data-p="' + (page + 1) + '" ' + (page >= pages ? 'disabled' : '') + '>›</button></div></div>';
}
const sppChip = (pekan, lunas) => lunas ? chip('Lunas', 'ok', true) : chip('Ada tunggakan ' + pekan + ' pekan', 'warn');
const kelasOpts = (sel, semua, hanyaAktif) => (semua ? '<option value="">' + esc(semua) + '</option>' : '') +
  (App.cfg && App.cfg.kelas || []).filter(k => !hanyaAktif || k.aktif === 'Y').map(k => '<option ' + (k.nama === sel ? 'selected' : '') + '>' + esc(k.nama) + '</option>').join('');
