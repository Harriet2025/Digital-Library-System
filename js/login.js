document.addEventListener('DOMContentLoaded', async function () {
  await DLib.init();
  renderHeader();
  renderFooter();

  if (DLib.getCurrentUser()) {
    window.location.href = 'catalogue.html';
    return;
  }

  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlert('login-alert');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const result = await DLib.loginUser(email, password);
    if (!result.ok) {
      showAlert('login-alert', result.message, 'error');
      return;
    }

    window.location.href = result.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
  });
});
