/* =========================================================
   Shared UI: navbar, footer, book cards, and small helpers
   used by every page
   ========================================================= */

const BRAND_MARK_SVG =
  '<svg class="brand-mark" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M13 5.5C11 4 7.5 3.3 3.5 3.8V19c4-0.6 7.5 0.1 9.5 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M13 5.5C15 4 18.5 3.3 22.5 3.8V19c-4-0.6-7.5 0.1-9.5 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M13 5.5V20.5" stroke="var(--color-accent)" stroke-width="1.7" stroke-linecap="round"/>' +
  '</svg>';

function renderHeader(activePage) {
  const header = document.getElementById('site-header');
  if (!header) return;
  const user = DLib.getCurrentUser();

  let navLinks =
    '<a href="index.html" class="nav-link' + (activePage === 'home' ? ' active' : '') + '">Home</a>' +
    '<a href="catalogue.html" class="nav-link' + (activePage === 'catalogue' ? ' active' : '') + '">Catalogue</a>';

  if (user && user.role === 'admin') {
    const pendingCount = DLib.getPendingRequests().length;
    navLinks += '<a href="admin.html" class="nav-link' + (activePage === 'admin' ? ' active' : '') + '">Admin Panel' +
      (pendingCount > 0 ? ' <span class="nav-badge">' + pendingCount + '</span>' : '') + '</a>';
  } else if (user) {
    navLinks += '<a href="dashboard.html" class="nav-link' + (activePage === 'dashboard' ? ' active' : '') + '">My Dashboard</a>';
  }

  let authLinks = '';
  if (user && user.role === 'student') {
    authLinks += renderNotificationBellHTML(user);
  }
  if (user) {
    authLinks +=
      '<span class="nav-user">Hi, ' + escapeHtml(user.name.split(' ')[0]) + '</span>' +
      '<button class="btn btn-outline btn-sm" id="logout-btn" type="button">Logout</button>';
  } else {
    authLinks +=
      '<a href="login.html" class="btn btn-outline btn-sm">Login</a>' +
      '<a href="register.html" class="btn btn-primary btn-sm">Register</a>';
  }

  header.innerHTML =
    '<div class="navbar container">' +
    '  <a href="index.html" class="brand">' + BRAND_MARK_SVG + ' DigiLibrary</a>' +
    '  <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle navigation">☰</button>' +
    '  <nav class="nav-links" id="nav-links">' + navLinks + '</nav>' +
    '  <div class="nav-auth">' +
    authLinks +
    '  </div>' +
    '</div>';

  const toggle = document.getElementById('nav-toggle');
  toggle.addEventListener('click', function () {
    document.getElementById('nav-links').classList.toggle('open');
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', DLib.logoutUser);

  if (user && user.role === 'student') wireNotificationBell(user);

  initHeaderScrollShadow(header);
}

/* ---------------- Notification bell (students) ---------------- */
function renderNotificationBellHTML(user) {
  const unread = DLib.getUnreadNotificationCount(user.id);
  return (
    '<div class="notif-wrap">' +
    '  <button class="notif-bell" id="notif-bell" type="button" aria-label="Notifications">🔔' +
    (unread > 0 ? '<span class="notif-badge">' + (unread > 9 ? '9+' : unread) + '</span>' : '') +
    '  </button>' +
    '  <div class="notif-panel" id="notif-panel"></div>' +
    '</div>'
  );
}

function wireNotificationBell(user) {
  const bell = document.getElementById('notif-bell');
  const panel = document.getElementById('notif-panel');
  if (!bell || !panel) return;

  function renderPanel() {
    const alerts = DLib.getDueDateAlerts(user.id);
    const stored = DLib.getNotifications(user.id).slice(0, 10);

    const alertItems = alerts.map(function (a) {
      return '<div class="notif-item notif-alert">' +
        '<span class="notif-icon">' + (a.type === 'overdue' ? '⚠️' : '⏰') + '</span>' +
        '<span>' + escapeHtml(a.message) + '</span></div>';
    }).join('');

    const storedItems = stored.map(function (n) {
      return '<div class="notif-item' + (n.read ? '' : ' unread') + '" data-notif-id="' + n.id + '">' +
        '<span class="notif-icon">' + notificationIcon(n.type) + '</span>' +
        '<span>' + escapeHtml(n.message) + '<br><small class="text-muted">' + formatDate(n.createdDate) + '</small></span></div>';
    }).join('');

    const body = alertItems + storedItems;
    panel.innerHTML =
      '<div class="notif-header"><strong>Notifications</strong>' +
      (stored.some(function (n) { return !n.read; }) ? '<button class="notif-mark-all" id="notif-mark-all" type="button">Mark all read</button>' : '') +
      '</div>' +
      '<div class="notif-list">' + (body || '<div class="notif-empty">You\'re all caught up.</div>') + '</div>';

    const markAllBtn = document.getElementById('notif-mark-all');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', function () {
        DLib.markAllNotificationsRead(user.id);
        renderPanel();
        syncBadge();
      });
    }

    panel.querySelectorAll('[data-notif-id]').forEach(function (item) {
      item.addEventListener('click', function () {
        DLib.markNotificationRead(item.getAttribute('data-notif-id'));
        item.classList.remove('unread');
        syncBadge();
      });
    });
  }

  function syncBadge() {
    const unread = DLib.getUnreadNotificationCount(user.id);
    let badge = bell.querySelector('.notif-badge');
    if (unread > 0) {
      const label = unread > 9 ? '9+' : String(unread);
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notif-badge';
        bell.appendChild(badge);
      }
      badge.textContent = label;
    } else if (badge) {
      badge.remove();
    }
  }

  bell.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    if (isOpen) renderPanel();
  });

  document.addEventListener('click', function (e) {
    if (!panel.contains(e.target) && e.target !== bell) panel.classList.remove('open');
  });
}

function notificationIcon(type) {
  const icons = {
    'due-soon': '⏰', 'overdue': '⚠️', 'availability': '📗', 'new-book': '📚',
    'announcement': '📣', 'request-approved': '✅', 'request-rejected': '❌'
  };
  return icons[type] || '🔔';
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.innerHTML =
    '<div class="container footer-content">' +
    '  <p>&copy; ' + new Date().getFullYear() + ' DigiLibrary &mdash; Accra Technical University, BCP 206 Group 2.</p>' +
    '</div>';
}

/* ---------------- Navbar scroll shadow ---------------- */
function initHeaderScrollShadow(header) {
  function update() {
    if (window.scrollY > 4) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  update();
  // Assigning onscroll (rather than addEventListener) means re-calling this
  // on every renderHeader() refresh replaces the old handler instead of stacking a new one.
  window.onscroll = update;
}

/* ---------------- Small helpers ---------------- */
function showAlert(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = 'alert alert-' + (type || 'info');
  el.style.display = 'block';
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const labels = { borrowed: 'Borrowed', overdue: 'Overdue', returned: 'Returned', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  const classes = { borrowed: 'badge-borrowed', overdue: 'badge-overdue', returned: 'badge-returned', pending: 'badge-borrowed', approved: 'badge-available', rejected: 'badge-unavailable' };
  return '<span class="badge ' + classes[status] + '">' + labels[status] + '</span>';
}

function starDisplay(average, count) {
  const rounded = Math.round(average);
  let stars = '';
  for (let i = 1; i <= 5; i++) stars += i <= rounded ? '★' : '☆';
  if (!count) return '<span class="star-display star-empty">' + stars + '<span class="text-muted"> No reviews yet</span></span>';
  return '<span class="star-display">' + stars + ' <strong>' + average.toFixed(1) + '</strong>' +
    '<span class="text-muted"> (' + count + (count === 1 ? ' review' : ' reviews') + ')</span></span>';
}

function categoryBadge(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % 10;
  return '<span class="badge badge-cat-' + index + '">' + escapeHtml(category) + '</span>';
}

/* ---------------- Shared book card ---------------- */
function renderBookCardHTML(book, opts) {
  opts = opts || {};
  const user = DLib.getCurrentUser();
  const available = book.copiesAvailable > 0;

  let heart = '';
  if (user && user.role === 'student') {
    const isFav = DLib.isFavorite(user.id, book.id);
    heart = '<button class="favorite-btn' + (isFav ? ' active' : '') + '" data-favorite="' + book.id + '" type="button" aria-label="Toggle favorite">' + (isFav ? '♥' : '♡') + '</button>';
  }

  let actionHtml = '<a class="btn btn-outline btn-sm" href="book-details.html?id=' + book.id + '">Details</a>';
  if (opts.showBorrowAction !== false && user && user.role === 'student') {
    if (DLib.isBorrowedByUser(user.id, book.id)) {
      actionHtml += '<button class="btn btn-sm btn-accent" disabled>Borrowed</button>';
    } else if (DLib.hasPendingRequest(user.id, book.id)) {
      actionHtml += '<button class="btn btn-sm btn-outline" disabled>Request Pending</button>';
    } else if (available) {
      actionHtml += '<button class="btn btn-sm btn-primary" data-request="' + book.id + '">Request to Borrow</button>';
    }
  }

  const ratingStats = DLib.getRatingStats(book.id);
  const ratingHtml = ratingStats.count > 0
    ? '<div class="card-rating">★ ' + ratingStats.average.toFixed(1) + ' <span class="text-muted">(' + ratingStats.count + ')</span></div>'
    : '';

  return (
    '<div class="book-card">' +
    '  <div class="cover-wrap">' +
    '    <img class="cover" src="' + DLib.getCoverImage(book) + '" alt="Cover of ' + escapeHtml(book.title) + '">' +
    heart +
    '  </div>' +
    '  <div class="book-body">' +
    '    <div class="book-title">' + escapeHtml(book.title) + '</div>' +
    '    <div class="book-author">' + escapeHtml(book.author) + '</div>' +
    ratingHtml +
    '    <div class="book-meta">' +
    categoryBadge(book.category) +
    '      <span class="badge ' + (available ? 'badge-available' : 'badge-unavailable') + '">' + (available ? book.copiesAvailable + ' available' : 'Unavailable') + '</span>' +
    '    </div>' +
    '  </div>' +
    '  <div class="book-actions">' + actionHtml + '</div>' +
    '</div>'
  );
}

function wireBookCards(container, onChange) {
  container.querySelectorAll('[data-favorite]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const user = DLib.getCurrentUser();
      if (!user) { window.location.href = 'login.html'; return; }
      DLib.toggleFavorite(user.id, btn.getAttribute('data-favorite'));
      if (onChange) onChange();
    });
  });
  container.querySelectorAll('[data-request]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const user = DLib.getCurrentUser();
      const result = DLib.requestBorrow(user.id, btn.getAttribute('data-request'));
      if (!result.ok) { alert(result.message); return; }
      alert('Your request has been sent to the librarian for approval.');
      if (onChange) onChange();
    });
  });
}
