// Autenticación local simulada. Persistencia: localStorage.
// Estructura DB: { [username]: { pass, name, createdAt } }
// - username = "Nombre de usuario" (login)
// - name     = "Apodo" (nombre que se muestra en la UI)
var Auth = (function () {
  var TOKEN_KEY = 'dm_token';
  var USER_KEY  = 'dm_user';
  var DB_KEY    = 'dm_users';

  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return 'h' + (h >>> 0).toString(16);
  }

  function loadDb() {
    try { return JSON.parse(localStorage.getItem(DB_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

  (function seed() {
    var db = loadDb();
    if (!db.admin) {
      db.admin = { pass: hash('1234'), name: 'Admin', createdAt: Date.now() };
      saveDb(db);
    }
  })();

  function login(user, pass) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        var db = loadDb();
        var u = db[user];
        if (u && u.pass === hash(pass)) {
          var token = 'tok_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, user);
          resolve({ token: token, user: user });
        } else {
          reject(new Error('Usuario o contraseña incorrectos'));
        }
      }, 500);
    });
  }

  function register(user, pass, nickname) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (!user || user.length < 3) return reject(new Error('El nombre de usuario debe tener al menos 3 caracteres'));
        if (!nickname || nickname.length < 2) return reject(new Error('El apodo debe tener al menos 2 caracteres'));
        if (!pass || pass.length < 4)  return reject(new Error('La contraseña debe tener al menos 4 caracteres'));
        var db = loadDb();
        if (db[user]) return reject(new Error('Ese nombre de usuario ya existe'));
        db[user] = { pass: hash(pass), name: nickname, createdAt: Date.now() };
        saveDb(db);
        resolve({ user: user });
      }, 500);
    });
  }

  function resetPassword(user, newPass) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (!newPass || newPass.length < 4) return reject(new Error('La nueva contraseña debe tener al menos 4 caracteres'));
        var db = loadDb();
        if (!db[user]) return reject(new Error('Ese usuario no está registrado'));
        db[user].pass = hash(newPass);
        saveDb(db);
        resolve({ user: user });
      }, 500);
    });
  }

  function currentUser() {
    var name = localStorage.getItem(USER_KEY);
    if (!name) return null;
    var db = loadDb();
    var u = db[name] || {};
    return { username: name, name: u.name || name };
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.clear();
    window.location.replace('./login.html');
  }

  function isAuthed() { return !!localStorage.getItem(TOKEN_KEY); }

  function requireAuth() {
    if (!isAuthed()) window.location.replace('./login.html');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var path = location.pathname;
    var isPublic = /(login|signup|forgot|index)\.html?$/.test(path) || /\/$/.test(path);
    if (!isPublic) requireAuth();
  });

  return {
    login: login, logout: logout,
    register: register, resetPassword: resetPassword,
    currentUser: currentUser,
    isAuthed: isAuthed, requireAuth: requireAuth
  };
})();
