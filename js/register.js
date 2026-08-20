document.addEventListener('DOMContentLoaded', function () {
  renderHeader();
  renderFooter();

  if (DLib.getCurrentUser()) {
    window.location.href = 'catalogue.html';
    return;
  }

  document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert('register-alert');

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const roleInput = document.querySelector('input[name="role"]:checked');
    const role = roleInput ? roleInput.value : 'student';

    if (password !== confirmPassword) {
      showAlert('register-alert', 'Passwords do not match.', 'error');
      return;
    }

    const result = DLib.registerUser(name, email, password, role);
    if (!result.ok) {
      showAlert('register-alert', result.message, 'error');
      return;
    }

    window.location.href = result.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
  });
});
