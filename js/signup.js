document.addEventListener('DOMContentLoaded', function () {
  if (Auth.isAuthed()) { window.location.replace('./home.html'); return; }

  var form = document.getElementById('signupForm');
  var err = document.getElementById('signupError');
  var ok  = document.getElementById('signupOk');
  var btn = document.getElementById('signupBtn');
  var spinner = btn.querySelector('.spinner');
  var label = btn.querySelector('.btn-label');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true; ok.hidden = true;
    var username = document.getElementById('username').value.trim();
    var nickname = document.getElementById('nickname').value.trim();
    var pass     = document.getElementById('pass').value;
    var pass2    = document.getElementById('pass2').value;

    if (pass !== pass2) { err.textContent = 'Las contraseñas no coinciden.'; err.hidden = false; return; }

    btn.disabled = true; spinner.hidden = false; label.textContent = 'Creando...';
    Auth.register(username, pass, nickname).then(function () {
      ok.textContent = 'Cuenta creada. Iniciando sesión...';
      ok.hidden = false;
      return Auth.login(username, pass);
    }).then(function () {
      window.location.replace('./home.html');
    }).catch(function (e2) {
      err.textContent = e2.message || 'No se pudo crear la cuenta';
      err.hidden = false;
    }).finally(function () {
      btn.disabled = false; spinner.hidden = true; label.textContent = 'Crear cuenta';
    });
  });
});
