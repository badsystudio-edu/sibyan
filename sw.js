/* Service worker SIBYAN v3.1.0
 * Tujuan: aplikasi bisa dipasang (PWA) TANPA menahan versi lama.
 * Strategi: jaringan dulu (selalu cek pembaruan ke server), cache hanya sebagai cadangan saat offline.
 * Data (Google Apps Script) dan pustaka CDN tidak pernah dicegat. */
const VERSI = '3.1.0';
const CACHE = 'sibyan-' + VERSI;
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }))
      .then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
      .catch(() => caches.match(e.request))
  );
});
