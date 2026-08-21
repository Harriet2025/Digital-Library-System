let currentStudent = null;

document.addEventListener('DOMContentLoaded', async function () {
  await DLib.init();
  currentStudent = DLib.requireAuth('student');
  if (!currentStudent) return;

  renderHeader('dashboard');
  renderFooter();
  renderProfile();
  renderAll();
});

function renderProfile() {
  const initials = currentStudent.name.split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  document.getElementById('profile-card').innerHTML =
    '<div class="profile-avatar">' + initials + '</div>' +
    '<div>' +
    '  <h3 class="mb-0">' + escapeHtml(currentStudent.name) + '</h3>' +
    '  <p class="text-muted mb-0">' + escapeHtml(currentStudent.email) + ' &middot; Joined ' + formatDate(currentStudent.joinedDate) + '</p>' +
    '</div>';
}

function renderAll() {
  const records = DLib.getUserRecords(currentStudent.id).map(function (r) {
    return Object.assign({}, r, { computedStatus: DLib.getRecordStatus(r) });
  });

  const active = records.filter(function (r) { return r.status === 'borrowed'; });
  const history = records.filter(function (r) { return r.status === 'returned'; });
  const overdue = active.filter(function (r) { return r.computedStatus === 'overdue'; });

  document.getElementById('stats-grid').innerHTML =
    statCard(active.length, 'Currently Borrowed') +
    statCard(overdue.length, 'Overdue') +
    statCard(records.length, 'Total Borrowed (All Time)');

  renderCurrentBorrows(active);
  renderFavorites();
  renderHistory(history);
  renderRequests();
}

function renderRequests() {
  const tbody = document.getElementById('requests-table');
  const requests = DLib.getUserRequests(currentStudent.id);

  if (requests.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">You have not requested to borrow any books yet.</td></tr>';
    return;
  }

  tbody.innerHTML = requests.map(function (r) {
    const book = DLib.getBook(r.bookId);
    return (
      '<tr>' +
      '<td>' + escapeHtml(book ? book.title : 'Unknown book') + '</td>' +
      '<td>' + formatDate(r.requestDate) + '</td>' +
      '<td>' + statusBadge(r.status) + '</td>' +
      '<td>' + formatDate(r.reviewedDate) + '</td>' +
      '<td>' + (r.reason ? escapeHtml(r.reason) : '—') + '</td>' +
      '</tr>'
    );
  }).join('');
}

function statCard(value, label) {
  return '<div class="stat-card"><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div>';
}

function renderCurrentBorrows(records) {
  const tbody = document.getElementById('current-borrows');

  if (records.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">You have no books currently borrowed. <a href="catalogue.html">Browse the catalogue</a> to borrow one.</td></tr>';
    return;
  }

  tbody.innerHTML = records.map(function (r) {
    const book = DLib.getBook(r.bookId);
    if (!book) return '';
    const progress = DLib.getProgress(currentStudent.id, book.id);
    return (
      '<tr>' +
      '<td>' + escapeHtml(book.title) + '</td>' +
      '<td>' + escapeHtml(book.category) + '</td>' +
      '<td>' + formatDate(r.borrowDate) + '</td>' +
      '<td>' + formatDate(r.dueDate) + '</td>' +
      '<td>' + statusBadge(r.computedStatus) + '</td>' +
      '<td><div class="progress-bar-track" style="min-width:100px;"><div class="progress-bar-fill" style="width:' + progress.percent + '%"></div></div><span class="text-muted" style="font-size:0.78rem;">' + progress.percent + '%</span></td>' +
      '<td><a class="btn btn-sm btn-outline" href="book-details.html?id=' + book.id + '">Open</a> <button class="btn btn-sm btn-accent" data-return="' + r.id + '">Return</button></td>' +
      '</tr>'
    );
  }).join('');

  tbody.querySelectorAll('[data-return]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      DLib.returnBook(btn.getAttribute('data-return'));
      renderAll();
    });
  });
}

function renderFavorites() {
  const grid = document.getElementById('favorites-grid');
  const favoriteIds = DLib.getFavorites(currentStudent.id);
  const books = favoriteIds.map(function (id) { return DLib.getBook(id); }).filter(Boolean);

  if (books.length === 0) {
    grid.innerHTML = '<p class="text-muted">You haven\'t favorited any books yet. Tap the heart icon on a book to save it here.</p>';
    return;
  }

  grid.innerHTML = books.map(function (book) { return renderBookCardHTML(book, { showBorrowAction: false }); }).join('');
  wireBookCards(grid, renderAll);
}

function renderHistory(records) {
  const tbody = document.getElementById('borrow-history');

  if (records.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No returned books yet.</td></tr>';
    return;
  }

  tbody.innerHTML = records.map(function (r) {
    const book = DLib.getBook(r.bookId);
    if (!book) return '';
    return (
      '<tr>' +
      '<td>' + escapeHtml(book.title) + '</td>' +
      '<td>' + escapeHtml(book.category) + '</td>' +
      '<td>' + formatDate(r.borrowDate) + '</td>' +
      '<td>' + formatDate(r.returnDate) + '</td>' +
      '</tr>'
    );
  }).join('');
}
