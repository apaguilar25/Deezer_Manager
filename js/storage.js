// Persistencia local: favoritos, calificaciones, cola de sync, historial.
var Store = (function () {
  var FAV_KEY = 'dm_favorites';
  var RATE_KEY = 'dm_ratings';
  var SYNC_KEY = 'dm_pending_sync';
  var HIST_KEY = 'dm_search_history';

  function read(k, fallback) {
    try { return JSON.parse(localStorage.getItem(k)) || fallback; }
    catch (e) { return fallback; }
  }
  function write(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

  function getFavorites() { return read(FAV_KEY, {}); }
  function isFavorite(id) { return !!getFavorites()[id]; }

  function saveFavorite(album) {
    var favs = getFavorites();
    favs[album.id] = {
      id: album.id, title: album.title, cover: album.cover, artist: album.artist,tracks: album.tracks || [], 
      savedAt: Date.now()
    };
    write(FAV_KEY, favs);
    queueSync('fav_add', { id: album.id });
  }
  function removeFavorite(id) {
    var favs = getFavorites();
    delete favs[id];
    write(FAV_KEY, favs);
    queueSync('fav_remove', { id: id });
  }

  function getRatings() { return read(RATE_KEY, {}); }
  function getRating(id) { return getRatings()[id] || 0; }
  function setRating(id, value) {
    var r = getRatings();
    if (value > 0) r[id] = value; else delete r[id];
    write(RATE_KEY, r);
    queueSync('rating_set', { id: id, value: value });
  }

  function getPending() { return read(SYNC_KEY, []); }
  function queueSync(type, payload) {
    var q = getPending();
    q.push({ type: type, payload: payload, ts: Date.now() });
    write(SYNC_KEY, q);
    updateBadge();
    if (navigator.onLine) flush();
  }
  function flush() {
    var q = getPending();
    if (!q.length || !navigator.onLine) { updateBadge(); return; }
    console.log('[Deezer.Music] Sincronizando', q.length, 'cambios');
    write(SYNC_KEY, []);
    updateBadge();
  }
  function updateBadge() {
    var b = document.getElementById('pendingSyncBadge');
    if (!b) return;
    var q = getPending();
    if (q.length && !navigator.onLine) {
      b.hidden = false;
      b.textContent = q.length + ' cambio(s) pendiente(s) de sincronizar';
    } else {
      b.hidden = true;
    }
  }

  window.addEventListener('online', flush);
  document.addEventListener('DOMContentLoaded', updateBadge);

  function getSearchHistory() {
    var list = read(HIST_KEY, []);
    return list.map(function (x) { return x.term; });
  }
  function pushSearch(term) {
    if (!term) return;
    var list = read(HIST_KEY, []);
    list = list.filter(function (x) { return x.term.toLowerCase() !== term.toLowerCase(); });
    list.unshift({ term: term, ts: Date.now() });
    write(HIST_KEY, list.slice(0, 20));
  }

  return {
    getFavorites: getFavorites, isFavorite: isFavorite,
    saveFavorite: saveFavorite, removeFavorite: removeFavorite,
    getRating: getRating, setRating: setRating,
    getSearchHistory: getSearchHistory, pushSearch: pushSearch,
    flush: flush
  };
})();
