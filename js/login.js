document.addEventListener('DOMContentLoaded', function () {
  renderHeader();
  renderFooter();

  if (DLib.getCurrentUser()) {
    window.location.href = 'catalogue.html';
    return;
  }

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert('login-alert');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const result = DLib.loginUser(email, password);
    if (!result.ok) {
      showAlert('login-alert', result.message, 'error');
      return;
    }

    window.location.href = result.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
  });
});
