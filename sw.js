/* Service worker sederhana: cangkang aplikasi tersedia cepat; data selalu dari server. */
const CACHE = 'sibyan-v1';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/api.js', 'js/ui.js', 'js/pages-public.js', 'js/pages-admin.js', 'js/pages-santri.js', 'js/pages-keuangan.js', 'js/pages-laporan.js', 'js/pages-wali.js', 'js/app.js', 'assets/logo.png', 'manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // GAS & CDN tidak dicegat
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
