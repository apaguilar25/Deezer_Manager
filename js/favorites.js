// Favoritos con filtro por estrellas.
document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('favGrid');
  var status = document.getElementById('favStatus');
  var filterEl = document.getElementById('starFilter');
  var back = document.getElementById('backBtn');

  if (back) {
    back.innerHTML = Icons.arrowLeft('icon icon-sm') + ' Volver al inicio';
    back.addEventListener('click', function () { window.location.href = './home.html'; });
  }

  var currentFilter = 0;

  function all() {
    var favs = Store.getFavorites();
    return Object.keys(favs).map(function (k) { return favs[k]; })
      .sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
  }

  function render() {
    var list = all();
    if (!list.length) {
      filterEl.innerHTML = '';
      grid.innerHTML = '';
      status.innerHTML = 'Aún no has guardado álbumes. Explora <a href="./home.html">tu inicio</a>, selecciona tu album favorito y toca el corazón.';
      return;
    }
    
    // Inyección del filtro con estructura de dropdown
    filterEl.innerHTML = buildFilterHtml(currentFilter);
    var menu = filterEl.querySelector('.dropdown-menu');
    
    filterEl.querySelector('.filter-toggle').addEventListener('click', function(e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });

    filterEl.querySelectorAll('.dropdown-item').forEach(function(item) {
      item.addEventListener('click', function() {
        currentFilter = parseInt(item.getAttribute('data-val'), 10);
        render();
      });
    });

    document.addEventListener('click', function(e) {
      if (!filterEl.contains(e.target)) menu.hidden = true;
    });

    var filtered = list.filter(function (al) {
      if (!currentFilter) return true;
      var r = Store.getRating(String(al.id));
      if (currentFilter === -1) return !r;
      return r === currentFilter;
    });

    status.textContent = filtered.length + ' álbum(es)' + (currentFilter ? ' con filtro aplicado' : ' guardados') + '.';
    grid.innerHTML = '';
    filtered.forEach(function (al) { grid.appendChild(card(al)); });
  }

  function card(al) {
    var el = document.createElement('div');
    el.className = 'album-card';
    var artistId = (al.artist && al.artist.id) || '';
    var rating = Store.getRating(String(al.id));
    el.innerHTML =
      '<img src="' + (al.cover || '') + '" alt="' + esc(al.title) + '" />' +
      '<div class="album-body">' +
        '<h3>' + esc(al.title) + '</h3>' +
        (al.artist && al.artist.name ? '<p>' + esc(al.artist.name) + '</p>' : '') +
        '<div class="actions">' +
          (artistId ? '<a class="chip" href="./artist.html?id=' + encodeURIComponent(artistId) + '&from=favorites">Ver artista</a>' : '<span></span>') +
          '<button class="fav-btn on" title="Quitar">' + Icons.heartOn('icon icon-sm') + '</button>' +
        '</div>' +
        '<div class="stars" style="margin-top:8px">' + starsHtml(rating) + '</div>' +
      '</div>';

    el.querySelector('.fav-btn').addEventListener('click', function () {
      Store.removeFavorite(al.id);
      render();
    });
    bindStars(el, al);
    return el;
  }

  function bindStars(el, al) {
    var stars = el.querySelectorAll('.star');
    stars.forEach(function (s, i) {
      s.addEventListener('click', function () {
        var current = Store.getRating(String(al.id));
        var next = current === (i + 1) ? 0 : (i + 1);
        Store.setRating(String(al.id), next);
        render();
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

  function buildFilterHtml(active) {
    var opts = [
      { v: 0,  label: 'Todos' },
      { v: 5,  label: '5★' },
      { v: 4,  label: '4★' },
      { v: 3,  label: '3★' },
      { v: 2,  label: '2★' },
      { v: 1,  label: '1★' },
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

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }

  render();
});