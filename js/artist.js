// Detalle de artista: banner + álbumes con filtro por estrellas.
document.addEventListener('DOMContentLoaded', function () {
  var qs = new URLSearchParams(location.search);
  var id = qs.get('id');
  var from = qs.get('from') || 'home';
  var q = qs.get('q') || '';

  var back = document.getElementById('backBtn');
  back.innerHTML = Icons.arrowLeft('icon icon-sm') + ' Volver';
  back.addEventListener('click', function (e) {
    e.preventDefault();
    if (from === 'search') {
      window.location.href = './search.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    } else if (from === 'favorites') {
      window.location.href = './favorites.html';
    } else {
      window.location.href = './home.html';
    }
  });

  var banner = document.getElementById('artistBanner');
  var albumsWrap = document.getElementById('artistAlbums');
  var status = document.getElementById('artistStatus');
  var filterEl = document.getElementById('starFilter');

  if (!id) { status.textContent = 'Artista no especificado.'; return; }

  var artistName = '';
  DeezerAPI.artist(id).then(function (a) {
    artistName = a.name;
    document.title = a.name + ' · Deezer.Music';
    banner.innerHTML =
      '<img src="' + (a.picture_xl || a.picture_big || '') + '" alt="' + esc(a.name) + '" />' +
      '<div class="banner-info">' +
        '<h1>' + esc(a.name) + '</h1>' +
        '<p>' + (a.nb_fan ? a.nb_fan.toLocaleString() + ' fans · ' : '') + (a.nb_album || 0) + ' álbumes</p>' +
      '</div>';
  }).catch(function (err) { status.textContent = 'Error: ' + err.message; });

  var allAlbums = [];
  var currentFilter = 0; // 0 = todos

  DeezerAPI.artistAlbums(id).then(function (data) {
    var items = ((data && data.data) || []).filter(function (al) {
      return al && (al.cover_medium || al.cover);
    });
    if (!items.length) { status.textContent = 'Sin álbumes disponibles.'; return; }
    allAlbums = items;
    renderFilter();
    render();
  }).catch(function (err) { status.textContent = 'Error: ' + err.message; });

  function render() {
    albumsWrap.innerHTML = '';
    var list = allAlbums.filter(function (al) {
      if (!currentFilter) return true;
      var r = Store.getRating(String(al.id));
      if (currentFilter === -1) return !r; // sin calificar
      return r === currentFilter;
    });
    status.textContent = list.length + ' álbum(es)' + (currentFilter ? ' con filtro aplicado' : '') + '.';
    list.forEach(function (al) { albumsWrap.appendChild(albumCard(al, id)); });
  }

  function renderFilter() {
    filterEl.innerHTML = buildFilterHtml(currentFilter);
    var menu = filterEl.querySelector('.dropdown-menu');
    
    // Toggle del menú
    filterEl.querySelector('.filter-toggle').addEventListener('click', function(e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });

    // Acción de selección
    filterEl.querySelectorAll('.dropdown-item').forEach(function(item) {
      item.addEventListener('click', function() {
        currentFilter = parseInt(item.getAttribute('data-val'), 10);
        renderFilter();
        render();
      });
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', function(e) {
      if (!filterEl.contains(e.target)) menu.hidden = true;
    });
  }

  function albumCard(al, artistId) {
    var card = document.createElement('div');
    card.className = 'album-card';
    var isFav = Store.isFavorite(String(al.id));
    var rating = Store.getRating(String(al.id));

    card.innerHTML =
      '<img src="' + (al.cover_medium || al.cover || '') + '" alt="' + esc(al.title) + '" />' +
      '<div class="album-body">' +
        '<h3>' + esc(al.title) + '</h3>' +
        '<p>' + (al.release_date || '') + '</p>' +
        '<div class="actions">' +
          '<button class="fav-btn' + (isFav ? ' on' : '') + '" title="Favorito">' +
            (isFav ? Icons.heartOn('icon icon-sm') : Icons.heart('icon icon-sm')) +
          '</button>' +
          '<div class="stars" data-id="' + al.id + '">' + starsHtml(rating) + '</div>' +
        '</div>' +
      '</div>';

    // Ir al detalle del álbum (canciones) al hacer click en la tarjeta,
    // excepto si el click fue sobre el corazón o las estrellas.
    card.addEventListener('click', function (e) {
      if (e.target.closest('.fav-btn') || e.target.closest('.stars')) return;
      window.location.href = './album.html?id=' + encodeURIComponent(al.id) +
        '&artistId=' + encodeURIComponent(artistId) +
        '&artistName=' + encodeURIComponent(artistName || '') +
        '&from=artist';
    });

    var fav = card.querySelector('.fav-btn');
    fav.addEventListener('click', function () {
      var album = {
        id: String(al.id), title: al.title,
        cover: al.cover_medium || al.cover,
        artist: { id: artistId, name: artistName }
      };
      if (Store.isFavorite(album.id)) {
        Store.removeFavorite(album.id);
        fav.classList.remove('on');
        fav.innerHTML = Icons.heart('icon icon-sm');
      } else {
        Store.saveFavorite(album);
        fav.classList.add('on');
        fav.innerHTML = Icons.heartOn('icon icon-sm');
      }
    });

    bindStars(card, al);
    return card;
  }

  function bindStars(card, al) {
    var stars = card.querySelectorAll('.star');
    stars.forEach(function (s, i) {
      s.addEventListener('click', function () {
        var current = Store.getRating(String(al.id));
        var next = current === (i + 1) ? 0 : (i + 1);
        Store.setRating(String(al.id), next);
        card.querySelector('.stars').innerHTML = starsHtml(next);
        bindStars(card, al);
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

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }

  function buildFilterHtml(active) {
    var opts = [
      { v: 0,  label: 'Todos' },
      { v: 5,  label: '5 ★' },
      { v: 4,  label: '4 ★' },
      { v: 3,  label: '3 ★' },
      { v: 2,  label: '2 ★' },
      { v: 1,  label: '1 ★' },
      { v: -1, label: 'Sin calificar' }
    ];
    var activeOpt = opts.find(function(o) { return o.v === active; });
    var btnText = active === 0 ? 'Filtrar' : 'Filtro: ' + activeOpt.label;

    var html = '<div class="star-filter">' +
      '<button type="button" class="btn btn-ghost filter-toggle">' + btnText + ' ▼</button>' +
      '<ul class="dropdown-menu" hidden>';
    
    opts.forEach(function(o) {
      var activeClass = o.v === active ? ' active' : '';
      html += '<li class="dropdown-item' + activeClass + '" data-val="' + o.v + '">' + o.label + '</li>';
    });
    html += '</ul></div>';
    return html;
  }
});