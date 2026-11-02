/* ============================================================
 * KERETA API 🚂 — lokomotif uap + tender + gerbong lewat berkala di dasar layar
 * - interval, durasi lintas, jumlah gerbong, suara, dan volume bisa diatur (tersimpan per perangkat)
 * - suara disintesis dengan WebAudio (tanpa berkas): desis uap, ketukan rel, peluit, gemuruh,
 *   dengan efek mendekat-menjauh (volume, panning kiri-kanan, nada peluit) mengikuti posisi kereta
 * - peramban baru mengizinkan suara setelah pengguna menyentuh/mengklik layar sekali
 * - tidak menghalangi klik, tidak ikut tercetak; bawaan mati bila perangkat meminta "kurangi animasi"
 * ============================================================ */
const Kereta = {
  DEF: { on: true, interval: 60, durasi: 12, gerbong: 5, suara: true, vol: 40 },
  cfg: null, timer: null, nextAt: 0, running: false, arah: -1, ctx: null, noise: null, hint: false, ready: false,

  load() {
    let s = {}; try { s = JSON.parse(localStorage.getItem('sibyan_kereta') || '{}') || {}; } catch (e) { }
    const c = Object.assign({}, this.DEF, s);
    if (s.on === undefined) { try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) c.on = false; } catch (e) { } }
    this.cfg = this.clamp(c);
  },
  clamp(c) {
    const n = (v, lo, hi, d) => { v = Math.round(Number(v)); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    c.durasi = n(c.durasi, 6, 40, 12); c.gerbong = n(c.gerbong, 1, 8, 5); c.vol = n(c.vol, 0, 100, 40);
    c.interval = n(c.interval, c.durasi + 3, 3600, 60); c.on = !!c.on; c.suara = !!c.suara;
    return c;
  },
  save() { this.cfg = this.clamp(this.cfg); localStorage.setItem('sibyan_kereta', JSON.stringify(this.cfg)); },

  // ---------- jadwal ----------
  init() {
    this.load();
    const un = () => { this.unlock(); if (this.ready) ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(n => window.removeEventListener(n, un, true)); };
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(n => window.addEventListener(n, un, true));
    if (this.cfg.on) this.schedule(7000);
  },
  schedule(ms) {
    clearTimeout(this.timer); this.nextAt = Date.now() + ms;
    this.timer = setTimeout(() => this.pass(), ms);
  },
  terapkan() {   // dipanggil setelah pengaturan berubah
    this.save();
    if (!this.cfg.on) { clearTimeout(this.timer); this.timer = null; return; }
    if (!this.running) { const maks = this.cfg.interval * 1000; this.schedule(this.timer ? Math.max(1500, Math.min(this.nextAt - Date.now(), maks)) : 4000); }
  },

  // ---------- gambar ----------
  wheel(cx, cy, r) {
    return '<g class="wh" style="animation-duration:' + (r > 10 ? .7 : .5) + 's"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (r > 10 ? '#b91c1c' : '#4b5563') + '" stroke="#111827" stroke-width="2"/>' +
      '<line x1="' + (cx - r + 2) + '" y1="' + cy + '" x2="' + (cx + r - 2) + '" y2="' + cy + '" stroke="#e5e7eb" stroke-width="1.6"/><line x1="' + cx + '" y1="' + (cy - r + 2) + '" x2="' + cx + '" y2="' + (cy + r - 2) + '" stroke="#e5e7eb" stroke-width="1.6"/><circle cx="' + cx + '" cy="' + cy + '" r="2.2" fill="#111827"/></g>';
  },
  gerbong(x, c) {
    let w = ''; for (let i = 0; i < 5; i++) w += '<rect x="' + (10 + i * 22) + '" y="36" width="15" height="14" rx="3" fill="#fef3c7" stroke="rgba(0,0,0,.35)"/>';
    return '<g transform="translate(' + x + ',0)"><rect x="4" y="66" width="116" height="5" fill="#374151"/><rect x="0" y="24" width="124" height="42" rx="6" fill="' + c + '"/><rect x="0" y="24" width="124" height="9" rx="4" fill="rgba(0,0,0,.2)"/><rect x="2" y="57" width="120" height="5" fill="rgba(0,0,0,.22)"/>' + w +
      '<rect x="124" y="62" width="6" height="4" fill="#111827"/>' + this.wheel(24, 74, 8) + this.wheel(100, 74, 8) + '</g>';
  },
  tender(x) {
    return '<g transform="translate(' + x + ',0)"><rect x="4" y="66" width="52" height="5" fill="#374151"/><rect x="2" y="36" width="54" height="30" rx="3" fill="#111827"/><path d="M6 36 Q16 20 28 25 Q40 19 52 36 Z" fill="#1f2937"/><circle cx="20" cy="28" r="2.4" fill="#4b5563"/><circle cx="34" cy="26" r="2.4" fill="#4b5563"/><circle cx="43" cy="30" r="2" fill="#4b5563"/>' +
      '<rect x="56" y="62" width="6" height="4" fill="#111827"/>' + this.wheel(16, 74, 8) + this.wheel(42, 74, 8) + '</g>';
  },
  loko(x) {
    return '<g transform="translate(' + x + ',0)"><rect x="0" y="62" width="152" height="7" fill="#374151"/>' +
      '<rect x="38" y="32" width="98" height="32" rx="14" fill="#1f2937"/><rect x="44" y="44" width="88" height="3" fill="#f59e0b"/><rect x="70" y="32" width="5" height="32" fill="#9ca3af"/><rect x="104" y="32" width="5" height="32" fill="#9ca3af"/>' +
      '<circle cx="60" cy="31" r="8" fill="#b91c1c"/><circle cx="90" cy="30" r="6" fill="#9ca3af"/>' +
      '<rect x="124" y="32" width="28" height="32" rx="10" fill="#111827"/><circle cx="150" cy="44" r="9" fill="rgba(253,224,71,.35)"/><circle cx="150" cy="44" r="5" fill="#fde047"/>' +
      '<path d="M127 32 L127 16 L123 11 L143 11 L139 16 L139 32 Z" fill="#111827"/><circle class="kr-smk" cx="133" cy="7" r="1" fill="none"/>' +
      '<rect x="2" y="20" width="40" height="46" rx="3" fill="#b91c1c"/><rect x="-2" y="14" width="48" height="8" rx="3" fill="#7f1d1d"/><rect x="10" y="28" width="18" height="14" rx="2" fill="#fde68a" stroke="rgba(0,0,0,.4)"/>' +
      '<polygon points="152,66 170,82 152,82" fill="#4b5563"/><line x1="62" y1="69" x2="126" y2="69" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/>' +
      this.wheel(62, 69, 13) + this.wheel(94, 69, 13) + this.wheel(126, 69, 13) + '</g>';
  },
  svgKereta(n) {
    const cols = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1'];
    let x = 0, g = ''; for (let i = 0; i < n; i++) { g += this.gerbong(x, cols[i % cols.length]); x += 130; }
    g += this.tender(x); x += 62; g += this.loko(x); x += 172;
    return { w: x, h: 86, svg: g };
  },

  // ---------- satu lintasan ----------
  pass() {
    this.timer = null;
    if (!this.cfg.on) return;
    const body = document.body, hidden = (typeof document.hidden !== 'undefined' && document.hidden) || (body.dataset && body.dataset.print);
    if (this.running || hidden) { this.schedule(this.cfg.interval * 1000); return; }
    this.running = true; this.arah = -this.arah;
    const c = this.cfg, dir = this.arah, vw = window.innerWidth || 800, vh = window.innerHeight || 600, dur = c.durasi * 1000;
    const k = vw < 640 ? .5 : (vw < 1100 ? .75 : 1), t = this.svgKereta(c.gerbong), W = t.w * k, H = t.h * k;
    const bnav = document.querySelector && document.querySelector('.bnav'), bawah = bnav ? 74 : 12;
    const el = document.createElement('div'); el.id = 'kereta'; el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'bottom:' + bawah + 'px;width:' + W + 'px;height:' + H + 'px';
    el.innerHTML = '<div class="kr-in" style="transform:scaleX(' + dir + ')"><svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + t.w + ' ' + t.h + '">' + t.svg + '</svg></div>';
    const rel = document.createElement('div'); rel.id = 'kereta-rel'; rel.style.bottom = (bawah - 3) + 'px';
    document.body.appendChild(rel); document.body.appendChild(el);
    const dari = dir > 0 ? -W - 10 : vw + 10, ke = dir > 0 ? vw + 10 : -W - 10;
    rel.style.opacity = '0'; if (rel.animate) rel.animate([{ opacity: 0 }, { opacity: .55, offset: .08 }, { opacity: .55, offset: .92 }, { opacity: 0 }], { duration: dur + 1500, fill: 'forwards' });
    const anim = el.animate([{ transform: 'translate3d(' + dari + 'px,0,0)' }, { transform: 'translate3d(' + ke + 'px,0,0)' }], { duration: dur, easing: 'linear', fill: 'forwards' });
    const snd = this.bunyi(dur / 1000, dir);
    const smoke = setInterval(() => {
      const m = el.querySelector('.kr-smk'); if (!m || !m.getBoundingClientRect) return;
      const r = m.getBoundingClientRect(); if (!r || r.right < 0 || r.left > vw) return;
      const p = document.createElement('div'); p.className = 'kr-puff'; p.style.left = (r.left + r.width / 2) + 'px'; p.style.top = (r.top + r.height / 2) + 'px';
      p.style.setProperty('--dx', (-dir * (18 + Math.random() * 30)) + 'px'); p.style.setProperty('--s', String(k)); document.body.appendChild(p); setTimeout(() => p.remove(), 2000);
    }, 230);
    const selesai = () => {
      clearInterval(smoke); el.remove(); setTimeout(() => rel.remove(), 1600); if (snd) snd.stop();
      this.running = false; if (this.cfg.on) this.schedule(Math.max(3, c.interval - c.durasi) * 1000);
    };
    anim.onfinish = selesai;
  },
  uji() { if (this.running) return; clearTimeout(this.timer); this.timer = null; this.pass(); },

  // ---------- suara (WebAudio) ----------
  unlock() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      if (!this.ctx) { this.ctx = new AC(); const ac = this.ctx; this.master = ac.createGain(); this.master.gain.value = 1; const comp = ac.createDynamicsCompressor(); this.master.connect(comp); comp.connect(ac.destination); }
      if (this.ctx.state === 'suspended' && this.ctx.resume) this.ctx.resume();
      this.ready = this.ctx.state === 'running';
    } catch (e) { }
  },
  buffNoise() {
    const ac = this.ctx; if (this.noise) return this.noise;
    const n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (this.noise = b);
  },
  puff(out, at, vol, accent) {   // desis uap + dentuman
    const ac = this.ctx, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.buffNoise(); f.type = 'bandpass'; f.frequency.value = 650 + Math.random() * 150; f.Q.value = .8;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol * (accent ? 1 : .72), at + .012); g.gain.exponentialRampToValueAtTime(.001, at + .16);
    s.connect(f); f.connect(g); g.connect(out); s.start(at, Math.random() * 1.5, .2);
    const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(accent ? 82 : 70, at); o.frequency.exponentialRampToValueAtTime(48, at + .12);
    og.gain.setValueAtTime(0, at); og.gain.linearRampToValueAtTime(vol * .7, at + .008); og.gain.exponentialRampToValueAtTime(.001, at + .13); o.connect(og); og.connect(out); o.start(at); o.stop(at + .16);
  },
  klik(out, at, vol) {   // ketukan sambungan rel
    const ac = this.ctx, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.buffNoise(); f.type = 'highpass'; f.frequency.value = 1800 + Math.random() * 900;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + .003); g.gain.exponentialRampToValueAtTime(.001, at + .05);
    s.connect(f); f.connect(g); g.connect(out); s.start(at, Math.random() * 1.5, .08);
  },
  peluit(out, at, len, vol, dur) {   // peluit uap: dua nada serempak, pitch sedikit turun di ujung, efek Doppler
    const ac = this.ctx, g = ac.createGain(), f = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
    f.type = 'lowpass'; f.frequency.value = 1500; f.Q.value = 1.2;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + .09); g.gain.setValueAtTime(vol, at + len - .22); g.gain.exponentialRampToValueAtTime(.001, at + len);
    lfo.frequency.value = 5.2; lg.gain.value = 6; lfo.connect(lg); [415.3, 523.3].forEach(fr => {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(fr, at); o.frequency.linearRampToValueAtTime(fr * .965, at + len); lg.connect(o.frequency);
      o.connect(f); o.start(at); o.stop(at + len + .05);
    });
    f.connect(g); g.connect(out); lfo.start(at); lfo.stop(at + len + .05);
  },
  bunyi(detik, dir) {
    const c = this.cfg; if (!c.suara || c.vol <= 0) return null;
    if (!this.ctx || this.ctx.state !== 'running') {
      this.unlock();
      if (!this.ctx || this.ctx.state !== 'running') { if (!this.hint) { this.hint = true; toast('Ketuk layar sekali untuk mengaktifkan suara kereta 🚂'); } return null; }
    }
    const ac = this.ctx, t0 = ac.currentTime + .05, vol = c.vol / 100, out = ac.createGain(), mix = ac.createGain(); out.gain.value = 0; mix.gain.value = 1;
    const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    mix.connect(out); if (pan) { out.connect(pan); pan.connect(this.master); } else out.connect(this.master);
    const N = 96, env = new Float32Array(N), pn = new Float32Array(N);   // kurva mendekat -> melewati -> menjauh
    for (let i = 0; i < N; i++) { const p = i / (N - 1); env[i] = vol * Math.pow(Math.sin(Math.PI * p), 1.25); pn[i] = dir * (2 * p - 1) * .9; }
    out.gain.setValueCurveAtTime(env, t0, detik); if (pan) pan.pan.setValueCurveAtTime(pn, t0, detik);
    // gemuruh roda di rel
    const rum = ac.createBufferSource(), rf = ac.createBiquadFilter(), rg = ac.createGain(); rum.buffer = this.buffNoise(); rum.loop = true; rf.type = 'lowpass'; rf.frequency.value = 170; rg.gain.value = .55;
    rum.connect(rf); rf.connect(rg); rg.connect(mix); rum.start(t0);
    // peluit: dua kali (menjelang dan saat melewati)
    const pel = (p, len) => this.peluit(mix, t0 + detik * p, len, .17, detik);
    pel(.07, .75); pel(.07 + .75 / detik + .03, .5); pel(.55, .9);
    // desis uap + ketukan rel dijadwalkan sedikit ke depan
    let nc = t0, nk = t0, n = 0;
    const iv = setInterval(() => {
      const now = ac.currentTime, akhir = t0 + detik;
      while (nc < now + .6 && nc < akhir) { this.puff(mix, nc, .85, n % 2 === 0); nc += .27; n++; }
      while (nk < now + .6 && nk < akhir) { this.klik(mix, nk, .4); this.klik(mix, nk + .045, .22); nk += .13; }
    }, 150);
    return { stop: () => { clearInterval(iv); setTimeout(() => { try { rum.stop(); out.disconnect(); } catch (e) { } }, 1500); } };
  },
  tesSuara() {
    this.unlock(); if (!this.ctx || this.ctx.state !== 'running') { toast('Peramban belum mengizinkan suara. Ketuk layar lalu coba lagi.', 'error'); return; }
    const ac = this.ctx, out = ac.createGain(); out.gain.value = Math.max(.02, this.cfg.vol / 100); out.connect(this.master);
    this.peluit(out, ac.currentTime + .05, .8, .22, 2); this.peluit(out, ac.currentTime + 1, .55, .22, 2);
    for (let i = 0; i < 8; i++) this.puff(out, ac.currentTime + 1.7 + i * .27, .8, i % 2 === 0);
  },

  // ---------- panel pengaturan ----------
  buka() {
    const c = this.cfg, pre = [[30, '30 dtk'], [60, '1 menit'], [120, '2 menit'], [300, '5 menit'], [600, '10 menit']];
    Modal.open(mHead('Kereta Api 🚂', 'Kereta melintas di dasar layar. Pengaturan tersimpan di perangkat ini.') +
      '<div class="stack">' +
      '<label class="row between"><b>Kereta lewat</b><span class="switch"><input type="checkbox" data-ch="krOn" ' + (c.on ? 'checked' : '') + '><i></i></span></label>' +
      '<div><label class="f">Sekali lewat setiap (detik)</label><input class="inp num" type="number" id="krInt" min="9" max="3600" value="' + c.interval + '" data-in="krInt"><div class="pills" style="margin-top:8px">' + pre.map(p => '<button class="pill ' + (c.interval === p[0] ? 'on' : '') + '" data-act="krPre" data-s="' + p[0] + '">' + p[1] + '</button>').join('') + '</div></div>' +
      '<div class="fgrid c2"><div class="fg"><label class="f">Lama melintas (detik)</label><input class="inp num" type="number" min="6" max="40" value="' + c.durasi + '" data-in="krDur"></div><div class="fg"><label class="f">Jumlah gerbong (1–8)</label><input class="inp num" type="number" min="1" max="8" value="' + c.gerbong + '" data-in="krGb"></div></div>' +
      '<label class="row between"><b>Suara kereta</b><span class="switch"><input type="checkbox" data-ch="krSuara" ' + (c.suara ? 'checked' : '') + '><i></i></span></label>' +
      '<div><label class="f">Volume: <span id="krVolTxt">' + c.vol + '</span>%</label><input type="range" min="0" max="100" value="' + c.vol + '" data-in="krVol" style="width:100%;accent-color:var(--primary)"></div>' +
      '<p class="hint">Peramban hanya mengizinkan suara setelah Anda menyentuh/mengklik layar sekali. Suara terdengar makin keras saat kereta mendekat dan bergeser kiri–kanan mengikuti posisinya.</p>' +
      '<div class="acts"><button class="btn soft sm" data-act="krUji">' + ic('train', 'sm') + ' Lewatkan sekarang</button><button class="btn ghost sm" data-act="krTes">' + ic('volume_up', 'sm') + ' Tes suara</button></div></div>', 'narrow');
  }
};
ACT.keretaSet = () => { const m = $('.menu'); if (m) m.remove(); Kereta.buka(); };
INP.krOn = el => { Kereta.cfg.on = el.checked; Kereta.terapkan(); if (el.checked) Kereta.schedule(3000); };
INP.krInt = el => { Kereta.cfg.interval = el.value; Kereta.terapkan(); };
ACT.krPre = el => { Kereta.cfg.interval = +el.dataset.s; Kereta.terapkan(); const i = $('#krInt'); if (i) i.value = Kereta.cfg.interval; $$('[data-act=krPre]').forEach(b => b.classList.toggle('on', b === el)); };
INP.krDur = el => { Kereta.cfg.durasi = el.value; Kereta.terapkan(); };
INP.krGb = el => { Kereta.cfg.gerbong = el.value; Kereta.terapkan(); };
INP.krSuara = el => { Kereta.cfg.suara = el.checked; Kereta.terapkan(); if (el.checked) Kereta.unlock(); };
INP.krVol = el => { Kereta.cfg.vol = el.value; Kereta.terapkan(); const t = $('#krVolTxt'); if (t) t.textContent = Kereta.cfg.vol; };
ACT.krUji = () => { Modal.closeAll(); Kereta.uji(); };
ACT.krTes = () => Kereta.tesSuara();
