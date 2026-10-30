/* ============================================================
 * LEBAH PENGIKUT POINTER 🐝
 * Lebah SVG kecil terbang halus mengikuti kursor (atau titik sentuh di HP).
 * - tidak menghalangi klik (pointer-events: none), disembunyikan saat cetak
 * - bisa dimatikan lewat menu pengguna / tombol 🐝 di beranda (tersimpan di perangkat)
 * - bawaan mati bila perangkat meminta "kurangi animasi"
 * ============================================================ */
const Lebah = {
  el: null, inner: null, raf: 0, on: false,
  x: -80, y: 140, tx: 0, ty: 0, vx: 0, vy: 0, dir: 1, t: 0, last: 0, lastMove: 0,

  enabled() {
    const v = localStorage.getItem('sibyan_lebah');
    if (v) return v === 'on';
    try { return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return true; }
  },
  svg() {
    return '<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><clipPath id="lbBody"><ellipse cx="30" cy="29" rx="18" ry="12"/></clipPath></defs>' +
      '<g class="w w1"><ellipse cx="25" cy="14" rx="12" ry="7" transform="rotate(-22 25 14)" fill="rgba(226,242,255,.82)" stroke="rgba(100,150,200,.75)" stroke-width="1"/></g>' +
      '<g class="w w2"><ellipse cx="37" cy="13" rx="11" ry="6" transform="rotate(12 37 13)" fill="rgba(226,242,255,.82)" stroke="rgba(100,150,200,.75)" stroke-width="1"/></g>' +
      '<polygon points="13,29 3,27 3,31" fill="#3b2a00"/>' +
      '<ellipse cx="30" cy="29" rx="18" ry="12" fill="#ffc400" stroke="#3b2a00" stroke-width="1.6"/>' +
      '<g clip-path="url(#lbBody)" fill="#3b2a00"><rect x="19" y="14" width="5" height="30"/><rect x="29" y="14" width="5" height="30"/><rect x="39" y="14" width="5" height="30"/></g>' +
      '<line x1="51" y1="21" x2="57" y2="11" stroke="#3b2a00" stroke-width="1.6" stroke-linecap="round"/><circle cx="57.5" cy="10.5" r="2" fill="#3b2a00"/>' +
      '<line x1="48" y1="21" x2="49" y2="9" stroke="#3b2a00" stroke-width="1.6" stroke-linecap="round"/><circle cx="49" cy="8.5" r="2" fill="#3b2a00"/>' +
      '<circle cx="51" cy="28" r="9" fill="#2b1d00"/><circle cx="54" cy="25.5" r="3.4" fill="#fff"/><circle cx="55" cy="25.5" r="1.7" fill="#111"/>' +
      '<path d="M50 32 Q54 35 58 31" fill="none" stroke="#ffc400" stroke-width="1.4" stroke-linecap="round"/></svg>';
  },

  _move: null, _frame: null,
  start() {
    if (this.on) return;
    this.on = true;
    this.el = document.createElement('div'); this.el.id = 'lebah'; this.el.setAttribute('aria-hidden', 'true');
    this.el.innerHTML = '<div class="bee-in">' + this.svg() + '</div>';
    document.body.appendChild(this.el); this.inner = this.el.firstChild;
    const w = window.innerWidth || 800, h = window.innerHeight || 600;
    this.x = -80; this.y = Math.round(h * .25); this.tx = Math.round(w * .65); this.ty = Math.round(h * .4);
    this.lastMove = this.last = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this._move = e => {
      const p = (e.touches && e.touches[0]) || e; if (p.clientX === undefined) return;
      this.tx = p.clientX; this.ty = p.clientY; this.lastMove = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    };
    ['pointermove', 'pointerdown', 'touchstart', 'touchmove'].forEach(n => window.addEventListener(n, this._move, { passive: true }));
    this._frame = now => this.tick(now);
    this.raf = requestAnimationFrame(this._frame);
  },
  stop() {
    this.on = false; cancelAnimationFrame(this.raf);
    if (this._move) ['pointermove', 'pointerdown', 'touchstart', 'touchmove'].forEach(n => window.removeEventListener(n, this._move));
    if (this.el) { this.el.remove(); this.el = null; }
  },
  tick(now) {
    if (!this.on || !this.el) return;
    const dt = Math.min(.05, Math.max(.001, (now - this.last) / 1000)); this.last = now; this.t += dt;
    const w = window.innerWidth || 800, h = window.innerHeight || 600, idle = now - this.lastMove > 3500;
    // melayang: goyangan kecil saat mengikuti, lingkaran lebih besar saat pointer diam
    const ax = idle ? 38 : 7, ay = idle ? 24 : 9, sp = idle ? .9 : 2.1;
    const gx = Math.min(w - 50, Math.max(4, this.tx + 24)) + Math.cos(this.t * sp) * ax;
    const gy = Math.min(h - 40, Math.max(4, this.ty + 20)) + Math.sin(this.t * sp * 1.45) * ay;
    const k = 1 - Math.pow(.015, dt), nx = this.x + (gx - this.x) * k, ny = this.y + (gy - this.y) * k;
    this.vx = (nx - this.x) / dt; this.vy = (ny - this.y) / dt; this.x = nx; this.y = ny;
    if (this.vx > 35) this.dir = 1; else if (this.vx < -35) this.dir = -1;
    const rot = Math.max(-24, Math.min(24, this.vy / 22)) * this.dir;
    this.el.style.transform = 'translate3d(' + this.x.toFixed(1) + 'px,' + this.y.toFixed(1) + 'px,0)';
    this.inner.style.transform = 'rotate(' + rot.toFixed(1) + 'deg) scaleX(' + this.dir + ')';
    this.raf = requestAnimationFrame(this._frame);
  },
  set(on, silent) {
    localStorage.setItem('sibyan_lebah', on ? 'on' : 'off');
    on ? this.start() : this.stop();
    if (!silent) toast(on ? 'Lebah dinyalakan 🐝' : 'Lebah dimatikan');
  },
  init() { if (this.enabled()) this.start(); }
};
ACT.lebahToggle = () => { const m = $('.menu'); if (m) m.remove(); Lebah.set(!Lebah.on); };
