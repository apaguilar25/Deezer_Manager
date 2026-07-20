// Cliente Deezer vía JSONP (Deezer no permite CORS directo desde navegador).
var DeezerAPI = (function () {
  var BASE = 'https://api.deezer.com';
  var counter = 0;

  function jsonp(path) {
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
