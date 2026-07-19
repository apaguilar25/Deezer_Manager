document.addEventListener('DOMContentLoaded', function () {
  if (Auth.isAuthed()) { window.location.replace('./home.html'); return; }
  var form = document.getElementById('forgotForm');
  var err = document.getElementById('forgotError');
  var ok  = document.getElementById('forgotOk');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true; ok.hidden = true;
    var user = document.getElementById('user').value.trim();
    var p1 = document.getElementById('pass').value;
    var p2 = document.getElementById('pass2').value;
    if (p1 !== p2) { err.textContent = 'Las contraseñas no coinciden.'; err.hidden = false; return; }
    Auth.resetPassword(user, p1).then(function () {
      ok.textContent = 'Contraseña actualizada. Redirigiendo al inicio de sesión...';
      ok.hidden = false;
      setTimeout(function () { window.location.href = './login.html'; }, 900);
    }).catch(function (e2) {
      err.textContent = e2.message; err.hidden = false;
    });
  });
});
