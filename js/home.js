// Home: buscador embebido, carrusel marquee de tendencias, álbumes curados, relacionados.

// Artistas que NO deben aparecer en ninguna sección (tendencias, álbumes, destacados).
var BLACKLIST = [
  'rosalia','rosalía','coldplay','future','bad bunny','drake','noah kahan',
  'morgan wallen','chris brown','eminem','kendrick lamar',
  'karol g','feid','tainy','eladio carrion','eladio carrión','anuel aa',
  'farruko','beele','mora','legallyrxx','reik','noreh','micro tdh',
  'don toliver','dontoliver','victor manuelle','víctor manuelle',
  'silvestre dangond','kanye west','elena rose','blessd','alvaro diaz',
  'alvaro díaz','álvaro díaz','tito rojas','aria vegas','jay wheeler',
  'jhayco','justin quiles','kapo','dei v','peso pluma','tan bionica',
  'tan biónica','doja cat','billie eilish','j balvin',
];
function inBlacklist(name) {
  var n = String(name || '').toLowerCase().trim();
  for (var i = 0; i < BLACKLIST.length; i++) if (n === BLACKLIST[i]) return true;
  return false;
}

// Nueva curaduría para el marquee (destacados que se mueven).
var CURATED_ARTISTS = [
  'Laufey','SZA','Arctic Monkeys','Olivia Rodrigo','BTS','Stray Kids',
  'Harry Styles','Clairo','Ross Lynch','FINNEAS','Michael Jackson',
  'Måneskin','Cigarettes After Sex','Sufjan Stevens','Conan Gray',
  'Stephen Sanchez','Ricky Montgomery','Daniel Caesar','Lyn Lapid',
  'The 1975','Milo J','keshi','Jósean Log','Dhruv','Rex Orange County'
];

// Artistas destacados (grid pequeño).
var FEATURED_ARTISTS = ['The Weeknd', 'Las Marías', 'Faouzia', 'BTS', 'Sabrina Carpenter', 'Chappell Roan', 'Taylor Swift', 'Troye Sivan'];

// Álbumes curados: "artista - título".
var CURATED_ALBUMS = [
  { artist: 'Laufey', title: 'Bewitched' },
  { artist: 'Arctic Monkeys', title: 'AM' },
  { artist: 'Olivia Rodrigo', title: 'GUTS' },
  { artist: 'BTS', title: 'Map of the Soul: 7' },
  { artist: 'Harry Styles', title: "Harry's House" },
  { artist: 'Clairo', title: 'Sling' },
  { artist: 'FINNEAS', title: 'Optimist' },
  { artist: 'Michael Jackson', title: 'Thriller' },
  { artist: 'Måneskin', title: 'Rush!' },
  { artist: 'Cigarettes After Sex', title: 'Cigarettes After Sex' },
  { artist: 'Conan Gray', title: 'Superache' },
  { artist: 'Stephen Sanchez', title: 'Angel Face' },
  { artist: 'Daniel Caesar', title: 'Freudian' },
  { artist: 'The 1975', title: 'Being Funny in a Foreign Language' },
  { artist: 'keshi', title: 'Gabriel' },
  { artist: 'SZA', title: 'SOS' },
  { artist: 'Rex Orange County', title: 'Pony' },
  { artist: 'The Weeknd', title: 'After Hours' },
  { artist: 'Måneskin', title: 'Rush!' },   
  { artist: 'Milo J', title: 'I Wish I Were a Boy' }
];

document.addEventListener('DOMContentLoaded', function () {

  // ---- Buscador embebido en el home: al escribir, va a la búsqueda en vivo ----
  var searchForm = document.getElementById('homeSearchForm');
  var homeInput = document.getElementById('homeSearchInput');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = homeInput.value.trim();
      if (!q) return;
      Store.pushSearch(q);
      window.location.href = './search.html?q=' + encodeURIComponent(q);
    });
    var si = document.getElementById('homeSearchIcon');
    if (si) si.innerHTML = Icons.search('icon icon-sm');

    // Redirige a la página de búsqueda con la primera letra.
    homeInput.addEventListener('input', function () {
      var v = homeInput.value;
      if (v && v.length >= 1) {
        window.location.href = './search.html?q=' + encodeURIComponent(v) + '&focus=1';
      }
    });
  }

  // ---- 1) Marquee de tendencias (solo curados) ----
  var trending = document.getElementById('trendingMarquee');
  Promise.all(CURATED_ARTISTS.map(function (name) {
    return DeezerAPI.searchArtists(name).then(function (d) {
      var list = (d && d.data) || [];
      // Preferir match exacto por nombre.
      var lc = name.toLowerCase();
      var exact = list.filter(function (a) { return a && a.name && a.name.toLowerCase() === lc; })[0];
      return exact || list[0] || null;
    }).catch(function () { return null; });
  })).then(function (arr) {
    var seen = {};
    var pool = arr.filter(function (a) {
      if (!a || !a.id) return false;
      if (inBlacklist(a.name)) return false;
      if (!(a.picture_medium || a.picture)) return false;
      if (seen[a.id]) return false;
      seen[a.id] = true;
      return true;
    });

    if (!pool.length) {
      trending.innerHTML = '<div class="empty">Sin tendencias por ahora.</div>';
      return;
    }

    var track = document.createElement('div');
    track.className = 'marquee-track';
    pool.forEach(function (a) { track.appendChild(artistCard(a)); });
    pool.forEach(function (a) { track.appendChild(artistCard(a)); });
    trending.innerHTML = '';
    trending.appendChild(track);
    var dur = Math.max(30, Math.round(track.scrollWidth / 80));
    track.style.animationDuration = dur + 's';
  }).catch(function (err) {
    trending.innerHTML = '<div class="empty">No se pudieron cargar tendencias: ' + esc(err.message) + '</div>';
  });

  // ---- 2) Álbumes recomendados (curados) ----
  var albumsGrid = document.getElementById('albumsGrid');
  Promise.all(CURATED_ALBUMS.map(function (spec) {
    var q = spec.artist + ' ' + spec.title;
    return DeezerAPI.searchAlbums(q).then(function (d) {
      var list = (d && d.data) || [];
      var normArtist = spec.artist.toLowerCase();
      var pick = list.filter(function (al) {
        if (!al.artist || inBlacklist(al.artist.name)) return false;
        return al.artist.name.toLowerCase().indexOf(normArtist) >= 0
            || normArtist.indexOf(al.artist.name.toLowerCase()) >= 0;
      })[0] || list[0];
      return pick || null;
    }).catch(function () { return null; });
  })).then(function (albums) {
    albumsGrid.innerHTML = '';
    var uniq = {};
    var final = albums.filter(function (al) {
      if (!al || !al.id) return false;
      if (al.artist && inBlacklist(al.artist.name)) return false;
      if (!(al.cover_medium || al.cover)) return false;
      if (uniq[al.id]) return false;
      uniq[al.id] = true;
      return true;
    });
    if (!final.length) { albumsGrid.innerHTML = '<div class="empty">Sin álbumes disponibles.</div>'; return; }
    final.forEach(function (al) { albumsGrid.appendChild(albumCard(al)); });
  });

  // ---- 3) Artistas destacados ----
  var artistsGrid = document.getElementById('artistsGrid');
  Promise.all(FEATURED_ARTISTS.map(function (n) {
    return DeezerAPI.searchArtists(n).then(function (d) {
      var list = (d && d.data) || [];
      var lc = n.toLowerCase();
      var exact = list.filter(function (a) { return a && a.name && a.name.toLowerCase() === lc; })[0];
      return exact || list[0] || null;
    }).catch(function () { return null; });
  })).then(function (arr) {
    artistsGrid.innerHTML = '';
    var items = arr.filter(function (a) {
      return a && !inBlacklist(a.name) && (a.picture_medium || a.picture);
    });
    if (!items.length) { artistsGrid.innerHTML = '<div class="empty">Sin artistas disponibles.</div>'; return; }
    items.forEach(function (a) { artistsGrid.appendChild(artistCard(a)); });
  });

  // ---- 4) Relacionado con tus búsquedas (variedad) ----
  var relatedGrid = document.getElementById('relatedGrid');
  var relatedEmpty = document.getElementById('relatedEmpty');
  var history = Store.getSearchHistory();
  if (!history.length) {
    relatedEmpty.hidden = false;
  } else {
    var top = history[0];
    document.getElementById('relatedTitle').textContent = 'Basado en "' + top + '"';
    // Buscamos el artista principal y traemos sus artistas relacionados para dar variedad.
    DeezerAPI.searchArtists(top).then(function (data) {
      var first = (data && data.data && data.data[0]) || null;
      if (!first) { relatedEmpty.hidden = false; return; }
      return DeezerAPI.artistRelated(first.id).then(function (rel) {
        var items = ((rel && rel.data) || []).filter(function (a) {
          return a && (a.picture_medium || a.picture) && !inBlacklist(a.name);
        });
        // Si no hay related, cae a otras búsquedas variadas.
        if (!items.length) {
          var extra = ((data.data) || []).slice(1, 9).filter(function (a) {
            return a && (a.picture_medium || a.picture) && !inBlacklist(a.name);
          });
          items = extra;
        }
        // Mezclamos para no mostrar siempre el mismo orden.
        items.sort(function () { return Math.random() - 0.5; });
        items = items.slice(0, 8);
        if (!items.length) { relatedEmpty.hidden = false; return; }
        items.forEach(function (a) { relatedGrid.appendChild(artistCard(a)); });
      });
    }).catch(function (err) {
      relatedGrid.innerHTML = '<div class="empty">Error: ' + esc(err.message) + '</div>';
    });
  }

  function artistCard(a) {
    var card = document.createElement('a');
    card.className = 'card';
    card.href = './artist.html?id=' + encodeURIComponent(a.id) + '&from=home';
    card.innerHTML =
      '<img src="' + (a.picture_medium || a.picture || '') + '" alt="' + esc(a.name) + '" />' +
      '<div class="card-body">' +
        '<h3>' + esc(a.name) + '</h3>' +
        '<p>' + (a.nb_fan ? a.nb_fan.toLocaleString() + ' fans' : 'Artista') + '</p>' +
      '</div>';
    return card;
  }
  function albumCard(al) {
    var card = document.createElement('a');
    card.className = 'card';
    var artistId = al.artist && al.artist.id;
    card.href = artistId ? './artist.html?id=' + encodeURIComponent(artistId) + '&from=home' : '#';
    card.innerHTML =
      '<img src="' + (al.cover_medium || al.cover || '') + '" alt="' + esc(al.title) + '" />' +
      '<div class="card-body">' +
        '<h3>' + esc(al.title) + '</h3>' +
        '<p>' + esc((al.artist && al.artist.name) || 'Álbum') + '</p>' +
      '</div>';
    return card;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }
});
