// Detalle de álbum: portada + info, favorito/estrellas y lista de canciones con reproductor.
document.addEventListener('DOMContentLoaded', function () {
  var qs = new URLSearchParams(location.search);
  var id = qs.get('id');
  var artistId = qs.get('artistId') || '';
  var artistName = qs.get('artistName') || '';
  var from = qs.get('from') || 'home';

  var back = document.getElementById('backBtn');
  if (back) {
    back.innerHTML = Icons.arrowLeft('icon icon-sm') + ' Volver';
    back.addEventListener('click', function (e) {
      e.preventDefault();
      if (from === 'artist' && artistId) {
        window.location.href = './artist.html?id=' + encodeURIComponent(artistId);
      } else if (from === 'favorites') {
        window.location.href = './favorites.html';
      } else {
        window.location.href = './home.html';
      }
    });
  }

  var banner = document.getElementById('albumBanner');
  var status = document.getElementById('albumStatus');
  var trackList = document.getElementById('trackList');

  if (!id) { status.textContent = 'Álbum no especificado.'; return; }

  // =========================================================================
  // 1. MODO OFFLINE / ONLINE
  // =========================================================================
  if (!navigator.onLine) {
    var favs = Store.getFavorites();
    var albumLocal = favs[id];

    if (!albumLocal) {
      status.textContent = 'Estás sin conexión y este álbum no está guardado.';
      return;
    }
    // Renderizamos usando la memoria local
    renderizarAlbum(albumLocal, true);
  } else {
    // Renderizamos pidiendo datos a la API de Deezer
    DeezerAPI.album(id).then(function (al) {
      renderizarAlbum(al, false);
    }).catch(function (err) {
      status.textContent = 'Error: ' + err.message;
    });
  }

  // =========================================================================
  // 2. FUNCIÓN CENTRAL (Sirve tanto para datos de API como Locales)
  // =========================================================================
  function renderizarAlbum(al, isOffline) {
    document.title = al.title + ' · Deezer.Music';
    
    var aId = artistId || (al.artist && al.artist.id) || '';
    var aName = artistName || (al.artist && al.artist.name) || al.artist || '';
    var coverImg = al.cover_xl || al.cover_big || al.cover_medium || al.cover || '';
    
    var isFav = Store.isFavorite(String(al.id));
    var rating = Store.getRating(String(al.id));

    banner.innerHTML =
      '<img src="' + coverImg + '" alt="' + esc(al.title) + '" />' +
      '<div class="banner-info">' +
        '<h1>' + esc(al.title) + '</h1>' +
        '<p>' + esc(aName) + (al.release_date ? ' · ' + al.release_date : '') + (al.nb_tracks ? ' · ' + al.nb_tracks + ' pistas' : '') + '</p>' +
        '<div class="album-hero-actions">' +
          '<button id="albumFavBtn" class="fav-btn' + (isFav ? ' on' : '') + '" title="Favorito">' +
            (isFav ? Icons.heartOn('icon icon-sm') : Icons.heart('icon icon-sm')) +
          '</button>' +
          '<div id="albumStars" class="stars" data-id="' + al.id + '">' + starsHtml(rating) + '</div>' +
        '</div>' +
      '</div>';

    // === BOTÓN FAVORITO CORREGIDO ===
    var fav = document.getElementById('albumFavBtn');
    fav.addEventListener('click', function () {
      var albumParaGuardar = {
        id: String(al.id), 
        title: al.title,
        cover: coverImg,
        artist: { id: aId, name: aName },
        // AHORA SÍ GUARDAMOS LAS CANCIONES SEGÚN DE DÓNDE VENGAN
        tracks: isOffline ? al.tracks : ((al.tracks && al.tracks.data) || [])
      };
      
      if (Store.isFavorite(albumParaGuardar.id)) {
        Store.removeFavorite(albumParaGuardar.id);
        fav.classList.remove('on');
        fav.innerHTML = Icons.heart('icon icon-sm');
      } else {
        Store.saveFavorite(albumParaGuardar);
        fav.classList.add('on');
        fav.innerHTML = Icons.heartOn('icon icon-sm');
      }
    });
    
    bindStars(al.id);

    // === RENDERIZAR LISTA DE CANCIONES ===
    var tracks = isOffline ? (al.tracks || []) : ((al.tracks && al.tracks.data) || []);
    if (!tracks.length) {
      status.textContent = 'Sin canciones disponibles.';
      return;
    }
    
    status.textContent = tracks.length + ' canción(es).';
    trackList.innerHTML = '';
    tracks.forEach(function (t, i) { 
      trackList.appendChild(trackRow(t, i, coverImg)); 
    });
  }

  // =========================================================================
  // 3. FUNCIONES UTILITARIAS (Sin cambios)
  // =========================================================================asdsada
  function trackRow(t, i, coverImg) {
    var row = document.createElement('div');
    row.className = 'track-row';
    row.innerHTML =
      '<span class="track-idx">' + (i + 1) + '</span>' +
      '<img src="' + coverImg + '" alt="" />' +
      '<div class="track-info">' +
        '<div class="track-title">' + esc(t.title) + '</div>' +
        '<div class="track-sub">' + fmtDur(t.duration) + '</div>' +
      '</div>' +
      (t.preview
        ? '<audio controls preload="auto" src="' + t.preview + '"></audio>'
        : '<span class="muted">Sin preview</span>');
    return row;
  }

  function bindStars(albumId) {
    var box = document.getElementById('albumStars');
    if (!box) return;
    var stars = box.querySelectorAll('.star');
    stars.forEach(function (s, i) {
      s.addEventListener('click', function () {
        var current = Store.getRating(String(albumId));
        var next = current === (i + 1) ? 0 : (i + 1);
        Store.setRating(String(albumId), next);
        box.innerHTML = starsHtml(next);
        bindStars(albumId);
      });
    });
  }

  function starsHtml(value) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<button type="button" class="star' + (i <= value ? ' on' : '') + '">' + Icons.star('icon icon-xs') + '</button>';
    }
    return out;
  }

  function fmtDur(s) {
    s = Number(s) || 0;
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' + r : r);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }
});