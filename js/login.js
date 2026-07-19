document.addEventListener('DOMContentLoaded', function () {
  if (Auth.isAuthed()) { window.location.replace('./home.html'); return; }

  var form = document.getElementById('loginForm');
  var btn = document.getElementById('loginBtn');
  var spinner = btn.querySelector('.spinner');
  var label = btn.querySelector('.btn-label');
  var err = document.getElementById('loginError');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var user = document.getElementById('user').value.trim();
    var pass = document.getElementById('pass').value;
    if (!user || !pass) { err.textContent = 'Completa usuario y contraseña.'; err.hidden = false; return; }

    btn.disabled = true; spinner.hidden = false; label.textContent = 'Validando...';
    Auth.login(user, pass).then(function () {
      window.location.replace('./home.html');
    }).catch(function (e2) {
      err.textContent = e2.message || 'Error de autenticación';
      err.hidden = false;
    }).finally(function () {
      btn.disabled = false; spinner.hidden = true; label.textContent = 'Entrar';
    });
  });
});
