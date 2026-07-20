// Cliente Deezer vía JSONP (Deezer no permite CORS directo desde navegador).
// Cachea respuestas en localStorage para que funcione offline lo ya visitado.
var DeezerAPI = (function () {
  var BASE = 'https://api.deezer.com';
  var CACHE_PREFIX = 'dz_cache_';
  var counter = 0;

  function cacheGet(path) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + path);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      return obj && obj.data ? obj : null;
    } catch (e) { return null; }
  }
  function cacheSet(path, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + path, JSON.stringify({ t: Date.now(), data: data }));
    } catch (e) {
      // Cuota llena: purga entradas de caché y reintenta una vez.
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (k && k.indexOf(CACHE_PREFIX) === 0) localStorage.removeItem(k);
        }
        localStorage.setItem(CACHE_PREFIX + path, JSON.stringify({ t: Date.now(), data: data }));
      } catch (e2) {}
    }
  }

  function jsonpRaw(path) {
    return new Promise(function (resolve, reject) {
      var cbName = '__dz_cb_' + (++counter) + '_' + Date.now();
      var sep = path.indexOf('?') >= 0 ? '&' : '?';
      var url = BASE + path + sep + 'output=jsonp&callback=' + cbName;
      var script = document.createElement('script');
      var timer = setTimeout(function () {
        cleanup(); reject(new Error('Sin conexión con Deezer'));
      }, 12000);

      function cleanup() {
        clearTimeout(timer);
        try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function (data) {
        cleanup();
        if (data && data.error) reject(new Error(data.error.message || 'Error Deezer'));
        else resolve(data);
      };
      script.onerror = function () { cleanup(); reject(new Error('Fallo al cargar recurso')); };
      script.src = url;
      document.head.appendChild(script);
    });
  }

  // Si estamos offline -> cache. Si online -> red y guardar; ante fallo -> cache.
  function jsonp(path) {
    var cached = cacheGet(path);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (cached) return Promise.resolve(cached.data);
      return Promise.reject(new Error('Sin conexión y sin datos en caché'));
    }
    return jsonpRaw(path).then(function (data) {
      cacheSet(path, data);
      return data;
    }).catch(function (err) {
      if (cached) return cached.data;
      throw err;
    });
  }

  return {
    searchArtists: function (q) { return jsonp('/search/artist?q=' + encodeURIComponent(q)); },
    searchAlbums:  function (q) { return jsonp('/search/album?q=' + encodeURIComponent(q)); },
    searchTracks:  function (q) { return jsonp('/search?q=' + encodeURIComponent(q) + '&limit=20'); },
    artist:        function (id) { return jsonp('/artist/' + id); },
    artistAlbums:  function (id) { return jsonp('/artist/' + id + '/albums?limit=50'); },
    artistRelated: function (id) { return jsonp('/artist/' + id + '/related?limit=12'); },
    album:         function (id) { return jsonp('/album/' + id); },
    chartArtists:  function (limit) { return jsonp('/chart/0/artists?limit=' + (limit || 20)); },
    chartAlbums:   function (limit) { return jsonp('/chart/0/albums?limit=' + (limit || 10)); }
  };
})();
