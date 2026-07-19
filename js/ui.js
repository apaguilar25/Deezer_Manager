// UI compartida: sidebar desplegable + popover de perfil, inyectado en páginas privadas.
var UI = (function () {
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function currentPage() {
    var p = location.pathname.split('/').pop();
    return p || 'home.html';
  }

  function buildSidebar() {
    var page = currentPage();
    // El buscador ya vive dentro de home.html; se quita "Buscar" del sidebar.
    var items = [
      { href: './home.html',      label: 'Inicio',      icon: Icons.home('icon') },
      { href: './favorites.html', label: 'Mis álbumes', icon: Icons.heart('icon') }
    ];
    var links = items.map(function (it) {
      var active = it.href.endsWith(page) ? ' active' : '';
      return '<a class="sb-item' + active + '" href="' + it.href + '">' + it.icon + '<span>' + it.label + '</span></a>';
    }).join('');

    var wrap = el('aside', 'sidebar');
    wrap.innerHTML =
      '<div class="sb-brand">' + Icons.logo('icon') + '<span>DEEZER<span class="brand-accent">.MUSIC</span></span></div>' +
      links +
      '<div class="sb-foot">v1 · Neon Edition</div>';

    var backdrop = el('div', 'sidebar-backdrop');
    backdrop.addEventListener('click', close);
    document.body.appendChild(backdrop);
    document.body.appendChild(wrap);
  }

  function open()  { document.body.classList.add('sb-open'); }
  function close() { document.body.classList.remove('sb-open'); }
  function toggle(){ document.body.classList.toggle('sb-open'); }

  function initials(name) {
    return (name || '?').trim().split(/\s+/).map(function (s) { return s[0]; }).slice(0, 2).join('').toUpperCase();
  }

  function buildProfile() {
    var u = Auth.currentUser() || { username: 'guest', name: 'Invitado' };
    var btn = el('button', 'profile-btn', '');
    btn.innerHTML =
      '<span class="profile-avatar">' + initials(u.name) + '</span>' +
      '<span>' + escapeHtml(u.name) + '</span>';

    var pop = el('div', 'profile-popover', '');
    pop.innerHTML =
      '<div class="pp-head">' +
        '<span class="profile-avatar">' + initials(u.name) + '</span>' +
        '<div>' +
          '<div class="pp-name">' + escapeHtml(u.name) + '</div>' +
          '<div class="pp-role">@' + escapeHtml(u.username) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pp-row" data-action="theme">' +
        '<span data-theme-label>Modo oscuro</span>' +
        '<span data-theme-icon>' + Icons.moon('icon icon-sm') + '</span>' +
      '</div>' +
      '<div class="pp-row danger" data-action="logout">' +
        '<span>Cerrar sesión</span>' + Icons.logout('icon icon-sm') +
      '</div>';

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      pop.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) pop.classList.remove('open');
    });

    pop.querySelector('[data-action="theme"]').addEventListener('click', function () {
      Theme.toggle();
      refreshThemeLabel(pop);
    });
    pop.querySelector('[data-action="logout"]').addEventListener('click', Auth.logout);

    refreshThemeLabel(pop);
    return { btn: btn, pop: pop };
  }

  function refreshThemeLabel(pop) {
    var t = document.documentElement.getAttribute('data-theme');
    var isDark = t === 'dark';
    pop.querySelector('[data-theme-label]').textContent = isDark ? 'Cambiar a claro' : 'Cambiar a oscuro';
    pop.querySelector('[data-theme-icon]').innerHTML = isDark ? Icons.sun('icon icon-sm') : Icons.moon('icon icon-sm');
  }

  function buildTopbar() {
    var topbar = document.querySelector('.topbar');
    if (!topbar) return;

    topbar.innerHTML = '';
    var left = el('div', 'topbar-left');
    var right = el('div', 'topbar-right');

    var menuBtn = el('button', 'icon-btn', Icons.menu('icon'));
    menuBtn.setAttribute('aria-label', 'Abrir menú');
    menuBtn.addEventListener('click', toggle);
    left.appendChild(menuBtn);

    var brand = el('h1', 'brand', Icons.logo('icon') + 'DEEZER<span class="brand-accent">.MUSIC</span>');
    left.appendChild(brand);

    var prof = buildProfile();
    right.appendChild(prof.btn);
    topbar.appendChild(left);
    topbar.appendChild(right);
    document.body.appendChild(prof.pop);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var page = currentPage();
    if (/(login|signup|forgot|index)\.html?$/.test(page) || page === '') return;
    if (!Auth.isAuthed()) return;
    buildSidebar();
    buildTopbar();
  });

  return { open: open, close: close, toggle: toggle };
})();
