/* Photo EINS : garde l'appli sur le téléphone pour qu'elle s'ouvre sans réseau.
   Pour forcer une mise à jour, change VERSION (ex. v2) en même temps que index.html. */
const VERSION = 'photo-eins-v12';
const COQUILLE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(COQUILLE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Les échanges avec le script Google passent toujours par le réseau.
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  const memeOrigine = url.origin === self.location.origin;
  const police = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!memeOrigine && !police) return;

  // Réponse immédiate depuis le téléphone, mise à jour en arrière-plan quand le réseau est là.
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const enCache = await cache.match(req, { ignoreSearch: memeOrigine });
    // no-cache : on redemande toujours à GitHub si le fichier a changé (sinon le navigateur
    // peut resservir une ancienne copie pendant 10 minutes).
    const reseau = fetch(req, memeOrigine ? { cache: 'no-cache' } : undefined)
      .then((r) => {
        if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone());
        return r;
      })
      .catch(() => null);
    if (enCache) {
      e.waitUntil(reseau);
      return enCache;
    }
    const r = await reseau;
    if (r) return r;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  }));
});
