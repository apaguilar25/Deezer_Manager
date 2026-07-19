// Búsqueda en vivo: artistas, álbumes y canciones, con debounce.
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('searchForm');
  var input = document.getElementById('searchInput');
  var status = document.getElementById('searchStatus');
  var historyBox = document.getElementById('searchHistory');

  var secArtists = document.getElementById('secArtists');
  var secAlbums = document.getElementById('secAlbums');
  var secTracks = document.getElementById('secTracks');
  var artistResults = document.getElementById('artistResults');
  var albumResults = document.getElementById('albumResults');
  var trackResults = document.getElementById('trackResults');

  var back = document.getElementById('backBtn');
  if (back) {
    back.innerHTML = Icons.arrowLeft('icon icon-sm') + ' Volver al inicio';
    back.addEventListener('click', function () {
      window.location.href = './home.html';
    });
  }

  var qs = new URLSearchParams(location.search);
  var initial = qs.get('q') || '';
  var focusFlag = qs.get('focus');
  input.value = initial;
  // Cursor al final y foco.
  setTimeout(function () {
    input.focus();
    try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
  }, 0);

  renderHistory();
  if (initial) run(initial);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    Store.pushSearch(q);
    updateUrl(q);
    renderHistory();
    run(q);
  });

  // Búsqueda en vivo con debounce.
  var timer = null;
  var lastReq = 0;
  input.addEventListener('input', function () {
    var q = input.value.trim();
    updateUrl(q);
    clearTimeout(timer);
    if (!q) { clearAll(); status.textContent = ''; return; }
    timer = setTimeout(function () {
      Store.pushSearch(q);
      renderHistory();
      run(q);
    }, 220);
  });

  function updateUrl(q) {
    var url = new URL(location.href);
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    url.searchParams.delete('focus');
    history.replaceState(null, '', url.toString());
  }

  function clearAll() {
    artistResults.innerHTML = '';
    albumResults.innerHTML = '';
    trackResults.innerHTML = '';
    secArtists.hidden = true; secAlbums.hidden = true; secTracks.hidden = true;
  }

  function run(q) {
    var reqId = ++lastReq;
    status.textContent = 'Buscando "' + q + '"...';
    clearAll();

    Promise.all([
      DeezerAPI.searchArtists(q).catch(function () { return { data: [] }; }),
      DeezerAPI.searchAlbums(q).catch(function () { return { data: [] }; }),
      DeezerAPI.searchTracks(q).catch(function () { return { data: [] }; })
    ]).then(function (parts) {
      if (reqId !== lastReq) return; // llegó tarde, hay otra búsqueda más nueva
      var artists = (parts[0].data || []).filter(function (a) {
        return a && (a.picture_medium || a.picture);
      }).slice(0, 12);
      var albums = (parts[1].data || []).filter(function (al) {
        return al && (al.cover_medium || al.cover);
      }).slice(0, 12);
      var tracks = (parts[2].data || []).filter(function (t) {
        return t && t.artist && (t.album && (t.album.cover_small || t.album.cover));
      }).slice(0, 12);

      if (artists.length) {
        secArtists.hidden = false;
        artists.forEach(function (a) { artistResults.appendChild(artistCard(a, q)); });
      }
      if (albums.length) {
        secAlbums.hidden = false;
        albums.forEach(function (al) { albumResults.appendChild(albumCard(al, q)); });
      }
      if (tracks.length) {
        secTracks.hidden = false;
        tracks.forEach(function (t) { trackResults.appendChild(trackRow(t, q)); });
      }

      var total = artists.length + albums.length + tracks.length;
      status.textContent = total
        ? total + ' resultado(s) para "' + q + '".'
        : 'Sin resultados para "' + q + '".';
    }).catch(function (err) {
      if (reqId !== lastReq) return;
      status.textContent = 'Error: ' + err.message;
    });
  }

  function artistCard(a, q) {
    var card = document.createElement('a');
    card.className = 'card';
    card.href = './artist.html?id=' + encodeURIComponent(a.id) + '&from=search&q=' + encodeURIComponent(q);
    card.innerHTML =
      '<img src="' + (a.picture_medium || a.picture || '') + '" alt="' + esc(a.name) + '" />' +
      '<div class="card-body">' +
        '<h3>' + esc(a.name) + '</h3>' +
        '<p>' + (a.nb_fan ? a.nb_fan.toLocaleString() + ' fans' : 'Artista') + '</p>' +
      '</div>';
    return card;
  }

  function albumCard(al, q) {
    var card = document.createElement('a');
    card.className = 'card';
    var artistId = al.artist && al.artist.id;
    card.href = artistId
      ? './artist.html?id=' + encodeURIComponent(artistId) + '&from=search&q=' + encodeURIComponent(q)
      : '#';
    card.innerHTML =
      '<img src="' + (al.cover_medium || al.cover || '') + '" alt="' + esc(al.title) + '" />' +
      '<div class="card-body">' +
        '<h3>' + esc(al.title) + '</h3>' +
        '<p>' + esc((al.artist && al.artist.name) || 'Álbum') + '</p>' +
      '</div>';
    return card;
  }

  function trackRow(t, q) {
    var row = document.createElement('a');
    row.className = 'track-row';
    var artistId = t.artist && t.artist.id;
    row.href = artistId
      ? './artist.html?id=' + encodeURIComponent(artistId) + '&from=search&q=' + encodeURIComponent(q)
      : '#';
    var cover = (t.album && (t.album.cover_small || t.album.cover_medium || t.album.cover)) || '';
    row.innerHTML =
      '<img src="' + cover + '" alt="" />' +
      '<div class="track-info">' +
        '<div class="track-title">' + esc(t.title) + '</div>' +
        '<div class="track-sub">' + esc(t.artist.name) + (t.album && t.album.title ? ' · ' + esc(t.album.title) : '') + '</div>' +
      '</div>' +
      '<div class="track-dur">' + fmtDur(t.duration) + '</div>';
    return row;
  }

  function fmtDur(s) {
    s = Number(s) || 0;
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' + r : r);
  }

  function renderHistory() {
    var hist = Store.getSearchHistory();
    if (!hist.length) { historyBox.hidden = true; return; }
    historyBox.hidden = false;
    historyBox.innerHTML = '<span class="hist-label">Recientes:</span>' +
      hist.slice(0, 8).map(function (t) {
        return '<button type="button" class="chip" data-t="' + esc(t) + '">' + esc(t) + '</button>';
      }).join('');
    historyBox.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        input.value = c.getAttribute('data-t');
        form.dispatchEvent(new Event('submit'));
      });
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }
});
