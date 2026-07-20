// Service worker mínimo: cachea el shell para permitir carga offline de la UI.
// Las rutas se calculan a partir del scope del propio SW, así funciona
// tanto en / (preview) como en /reponame/ (GitHub Pages) sin cambios.
var CACHE = 'dm-shell-v3';
var BASE = new URL('./', self.registration.scope).href;
var REL_ASSETS = [
  'login.html',
  'signup.html',
  'forgot.html',
  'home.html',
  'search.html',
  'artist.html',
  'album.html',
  'favorites.html',
  'css/styles.css',
  'js/icons.js',
  'js/theme.js',
  'js/auth.js',
  'js/storage.js',
  'js/offline.js',
  'js/api.js',
  'js/ui.js',
  'js/home.js',
  'js/login.js',
  'js/signup.js',
  'js/forgot.js',
  'js/search.js',
  'js/artist.js',
  'js/album.js',
  'js/favorites.js'
];
var ASSETS = REL_ASSETS.map(function (p) { return new URL(p, BASE).href; });

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ASSETS.map(function (a) {
      return c.add(a).catch(function () { /* seguir aunque falle uno */ });
    }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // no interceptar Deezer/JSONP
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetchPromise = fetch(e.request).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});