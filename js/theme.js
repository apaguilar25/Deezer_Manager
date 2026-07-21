// Tematización dual. Persiste elección en localStorage.
var Theme = (function () {
  var KEY = 'dm_theme';
  var saved = localStorage.getItem(KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  function set(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(KEY, t);
  }
  function toggle() {
    var current = document.documentElement.getAttribute('data-theme');
    set(current === 'dark' ? 'light' : 'dark');
  }
  function current() { return document.documentElement.getAttribute('data-theme'); }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var render = function () {
      var t = current();
      btn.innerHTML = (typeof Icons !== 'undefined')
        ? (t === 'dark' ? Icons.sun('icon icon-sm') : Icons.moon('icon icon-sm'))
        : (t === 'dark' ? 'Light' : 'Dark');
    };
    render();
    btn.addEventListener('click', function () { toggle(); render(); });
  });

  return { set: set, toggle: toggle, current: current };
})();
