/* =========================================================
   Authentication helpers (session + route guards).
   Login/register logic lives in js/data.js and talks to
   api/auth.php and api/users.php.
   ========================================================= */

DLib.logoutUser = function () {
  DLib.clearCurrentUser();
  window.location.href = 'index.html';
};

DLib.requireAuth = function (role) {
  const user = DLib.getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
    return null;
  }
  return user;
};
