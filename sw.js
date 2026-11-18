// Network-first service worker: online = always the latest deploy (cache-busting
// ?v= still works); offline / dead gym signal = the last copy that loaded.
// Never touches localStorage — logs are untouched by anything in here.
const CACHE = 'rhn-shell-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const net = fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}));
      }
      return res;
    });
    net.catch(() => {});
    try {
      // Weak gym signal: after 3 s serve the cached copy if there is one, else keep waiting.
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req) || (req.mode === 'navigate' ? await cache.match('./', { ignoreSearch: true }) : null);
      if (!cached) return await net;
      return await Promise.race([net, new Promise(r => setTimeout(() => r(cached), 3000))]);
    } catch (err) {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req) || await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await cache.match('./', { ignoreSearch: true }) || await cache.match('index.html', { ignoreSearch: true });
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
