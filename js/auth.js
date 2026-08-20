/* =========================================================
   Authentication helpers (registration, login, route guards)
   ========================================================= */

DLib.isValidEmail = function (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

DLib.registerUser = function (name, email, password, role) {
  if (!name || !email || !password) {
    return { ok: false, message: 'All fields are required.' };
  }
  if (!DLib.isValidEmail(email)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }
  if (password.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters.' };
  }
  if (DLib.getUserByEmail(email)) {
    return { ok: false, message: 'An account with this email already exists.' };
  }
  const finalRole = (role === 'admin') ? 'admin' : 'student';

  const users = DLib.getUsers();
  const user = {
    id: DLib.generateId('u'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    role: finalRole,
    joinedDate: new Date().toISOString().slice(0, 10)
  };
  users.push(user);
  DLib.saveUsers(users);
  DLib.setCurrentUser(user.id);
  return { ok: true, user: user };
};

DLib.loginUser = function (email, password) {
  const user = DLib.getUserByEmail(email);
  if (!user || user.password !== password) {
    return { ok: false, message: 'Invalid email or password.' };
  }
  DLib.setCurrentUser(user.id);
  return { ok: true, user: user };
};

DLib.logoutUser = function () {
  DLib.clearCurrentUser();
  window.location.href = 'index.html';
};

/**
 * Ensures a user is logged in (and optionally has a specific role)
 * before a protected page renders. Redirects otherwise.
 */
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
