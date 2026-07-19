// Indicador de estado de red. (Sin service worker en modo estático/GH Pages).
(function () {
  function render() {
    var el = document.getElementById('netStatus');
    if (!el) return;
    if (navigator.onLine) { el.textContent = 'En línea'; el.className = 'net-pill online'; }
    else { el.textContent = 'Sin conexión'; el.className = 'net-pill offline'; }
  }
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  document.addEventListener('DOMContentLoaded', render);
})();
