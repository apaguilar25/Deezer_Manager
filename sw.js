// Service worker: cachea el shell y sirve fallback offline para navegaciones.
// El scope se toma del propio SW, así funciona en / (preview) y en /reponame/ (GH Pages).
var CACHE = 'dm-shell-v5';
var BASE = new URL('./', self.registration.scope).href;

var PAGES = [
  'index.html', 'login.html', 'signup.html', 'forgot.html',
  'home.html', 'search.html', 'artist.html', 'album.html', 'favorites.html'
];
var STATIC = [
  'css/styles.css',
  'js/icons.js', 'js/theme.js', 'js/auth.js', 'js/storage.js',
  'js/offline.js', 'js/api.js', 'js/ui.js',
  'js/home.js', 'js/login.js', 'js/signup.js', 'js/forgot.js',
  'js/search.js', 'js/artist.js', 'js/album.js', 'js/favorites.js'
];
var OFFLINE_FALLBACK = new URL('home.html', BASE).href;
var ASSETS = PAGES.concat(STATIC).map(function (p) { return new URL(p, BASE).href; });

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // {cache:'reload'} evita traer una versión vieja desde HTTP cache.
      return Promise.all(ASSETS.map(function (a) {
        return c.add(new Request(a, { cache: 'reload' })).catch(function () {});
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Devuelve la respuesta cacheada equivalente aunque la URL traiga querystring
// (ej. artist.html?id=123 -> artist.html).
function matchIgnoringSearch(request) {
  return caches.open(CACHE).then(function (c) {
    return c.match(request).then(function (hit) {
      if (hit) return hit;
      var u = new URL(request.url);
      u.search = '';
      return c.match(u.href);
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // no interceptar Deezer/JSONP/imágenes CDN

  var isNavigation = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isNavigation) {
    // Network-first para HTML; si falla, servir cache; si no hay, fallback offline.
    e.respondWith(
      fetch(req).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () {
        return matchIgnoringSearch(req).then(function (cached) {
          return cached || caches.match(OFFLINE_FALLBACK);
        });
      })
    );
    return;
  }

  // Assets (css/js/imgs same-origin): stale-while-revalidate.
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
