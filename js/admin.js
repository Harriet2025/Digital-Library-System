let pendingCoverData = null;
let pendingFileData = null;
let pendingFileName = null;

document.addEventListener('DOMContentLoaded', function () {
  const admin = DLib.requireAuth('admin');
  if (!admin) return;

  renderHeader('admin');
  renderFooter();
  renderStats();
  renderRequestsTable();
  renderBooksTable();
  renderActivityTable();
  renderReviewsTable();
  renderCategoriesTable();
  renderStudentsTable();
  renderInsights();

  document.getElementById('add-book-btn').addEventListener('click', function () { openBookModal(); });
  document.getElementById('modal-close').addEventListener('click', closeBookModal);
  document.getElementById('book-modal').addEventListener('click', function (e) {
    if (e.target.id === 'book-modal') closeBookModal();
  });
  document.getElementById('book-form').addEventListener('submit', handleBookFormSubmit);
  document.getElementById('book-cover').addEventListener('change', handleCoverFileChange);
  document.getElementById('book-file').addEventListener('change', handleBookFileChange);

  document.getElementById('activity-search').addEventListener('input', renderActivityTable);
  document.getElementById('activity-status').addEventListener('change', renderActivityTable);

  document.getElementById('announcement-form').addEventListener('submit', handleAnnouncementSubmit);
});

/* ---------------- Stats ---------------- */
function renderStats() {
  const books = DLib.getBooks();
  const students = DLib.getUsers().filter(function (u) { return u.role === 'student'; });
  const records = DLib.getRecords();
  const borrowed = records.filter(function (r) { return DLib.getRecordStatus(r) !== 'returned'; });
  const overdue = records.filter(function (r) { return DLib.getRecordStatus(r) === 'overdue'; });
  const pending = DLib.getPendingRequests();

  document.getElementById('stats-grid').innerHTML =
    statCard(books.length, 'Total Books') +
    statCard(DLib.getAvailableBooksCount(), 'Available Books') +
    statCard(students.length, 'Registered Students') +
    statCard(borrowed.length, 'Currently Borrowed') +
    statCard(overdue.length, 'Overdue') +
    statCard(pending.length, 'Pending Requests');
}

function statCard(value, label) {
  return '<div class="stat-card"><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div>';
}

function refreshAll() {
  renderStats();
  renderRequestsTable();
  renderBooksTable();
  renderActivityTable();
  renderReviewsTable();
  renderCategoriesTable();
  renderStudentsTable();
  renderInsights();
  renderHeader('admin');
}

/* ---------------- Books table ---------------- */
function renderBooksTable() {
  const tbody = document.getElementById('books-table');
  const books = DLib.getBooks();

  if (books.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No books in the catalogue yet. Click "Add New Book" to get started.</td></tr>';
    return;
  }

  tbody.innerHTML = books.map(function (book) {
    return (
      '<tr>' +
      '<td>' + escapeHtml(book.title) + '</td>' +
      '<td>' + escapeHtml(book.author) + '</td>' +
      '<td>' + escapeHtml(book.category) + '</td>' +
      '<td>' + escapeHtml(book.format) + '</td>' +
      '<td>' + book.copiesAvailable + ' / ' + book.copiesTotal + '</td>' +
      '<td>' + (book.fileData ? '<span class="badge badge-available">Uploaded</span>' : '<span class="badge badge-unavailable">Missing</span>') + '</td>' +
      '<td>' + formatDate(book.addedDate) + '</td>' +
      '<td class="table-actions">' +
      '  <button class="btn btn-sm btn-outline" data-edit="' + book.id + '">Edit</button>' +
      '  <button class="btn btn-sm btn-danger" data-delete="' + book.id + '">Delete</button>' +
      '</td>' +
      '</tr>'
    );
  }).join('');

  tbody.querySelectorAll('[data-edit]').forEach(function (btn) {
    btn.addEventListener('click', function () { openBookModal(btn.getAttribute('data-edit')); });
  });
  tbody.querySelectorAll('[data-delete]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const book = DLib.getBook(btn.getAttribute('data-delete'));
      if (!book) return;
      if (confirm('Delete "' + book.title + '"? This also removes its borrowing records.')) {
        DLib.deleteBook(book.id);
        refreshAll();
      }
    });
  });
}

/* ---------------- Add / Edit modal ---------------- */
function openBookModal(bookId) {
  const form = document.getElementById('book-form');
  form.reset();
  hideAlert('book-form-alert');
  pendingCoverData = null;
  pendingFileData = null;
  pendingFileName = null;

  const categoryList = document.getElementById('category-list');
  categoryList.innerHTML = DLib.getCategories().map(function (c) {
    return '<option value="' + escapeHtml(c) + '">';
  }).join('');

  const fileHint = document.getElementById('current-file-hint');

  if (bookId) {
    const book = DLib.getBook(bookId);
    document.getElementById('modal-title').textContent = 'Edit Book';
    document.getElementById('book-id').value = book.id;
    document.getElementById('book-title').value = book.title;
    document.getElementById('book-author').value = book.author;
    document.getElementById('book-category').value = book.category;
    document.getElementById('book-format').value = book.format;
    document.getElementById('book-description').value = book.description;
    document.getElementById('book-isbn').value = book.isbn || '';
    document.getElementById('book-publisher').value = book.publisher || '';
    document.getElementById('book-pub-date').value = book.publicationDate || '';
    document.getElementById('book-pages').value = book.pages || '';
    document.getElementById('book-copies').value = book.copiesTotal;
    pendingCoverData = book.cover;
    pendingFileData = book.fileData;
    pendingFileName = book.fileName;
    fileHint.textContent = book.fileName
      ? 'Current file: ' + book.fileName + ' (choose a new file to replace it).'
      : 'No e-book file uploaded yet. Choose a file to make this book downloadable once borrowed.';
  } else {
    document.getElementById('modal-title').textContent = 'Add New Book';
    document.getElementById('book-id').value = '';
    fileHint.textContent = 'Uploaded here becomes downloadable to students once they borrow the book.';
  }

  document.getElementById('book-modal').classList.add('open');
}

function closeBookModal() {
  document.getElementById('book-modal').classList.remove('open');
}

function handleCoverFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () { pendingCoverData = reader.result; };
  reader.readAsDataURL(file);
}

function handleBookFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    pendingFileData = reader.result;
    pendingFileName = file.name;
  };
  reader.readAsDataURL(file);
}

function handleBookFormSubmit(e) {
  e.preventDefault();
  hideAlert('book-form-alert');

  const id = document.getElementById('book-id').value;
  const title = document.getElementById('book-title').value.trim();
  const author = document.getElementById('book-author').value.trim();
  const category = document.getElementById('book-category').value.trim();
  const format = document.getElementById('book-format').value;
  const description = document.getElementById('book-description').value.trim();
  const isbn = document.getElementById('book-isbn').value.trim();
  const publisher = document.getElementById('book-publisher').value.trim();
  const publicationDate = document.getElementById('book-pub-date').value;
  const pages = parseInt(document.getElementById('book-pages').value, 10) || null;
  const copiesTotal = parseInt(document.getElementById('book-copies').value, 10);

  if (!title || !author || !category || !description || !copiesTotal || copiesTotal < 1) {
    showAlert('book-form-alert', 'Please fill in all fields with a valid number of copies.', 'error');
    return;
  }

  if (id) {
    const existing = DLib.getBook(id);
    const borrowedCount = existing.copiesTotal - existing.copiesAvailable;
    const newAvailable = Math.max(0, copiesTotal - borrowedCount);
    DLib.updateBook(id, {
      title, author, category, format, description,
      isbn, publisher, publicationDate, pages,
      copiesTotal, copiesAvailable: newAvailable,
      cover: pendingCoverData,
      fileName: pendingFileName,
      fileData: pendingFileData
    });
  } else {
    const newBook = DLib.addBook({
      title, author, category, format, description,
      isbn, publisher, publicationDate, pages, copiesTotal,
      cover: pendingCoverData, fileName: pendingFileName, fileData: pendingFileData
    });
    DLib.notifyAllStudents('new-book', 'New book added to the catalogue: "' + newBook.title + '".', newBook.id);
  }

  closeBookModal();
  refreshAll();
}

/* ---------------- Borrowing requests ---------------- */
function renderRequestsTable() {
  const tbody = document.getElementById('requests-table');
  const requests = DLib.getPendingRequests();

  if (requests.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No pending borrow requests.</td></tr>';
    return;
  }

  tbody.innerHTML = requests.map(function (r) {
    const user = DLib.getUserById(r.userId);
    const book = DLib.getBook(r.bookId);
    if (!user || !book) return '';
    return (
      '<tr>' +
      '<td>' + escapeHtml(user.name) + '</td>' +
      '<td>' + escapeHtml(book.title) + '</td>' +
      '<td>' + formatDate(r.requestDate) + '</td>' +
      '<td class="table-actions">' +
      '  <button class="btn btn-sm btn-primary" data-approve="' + r.id + '">Approve</button>' +
      '  <button class="btn btn-sm btn-danger" data-reject="' + r.id + '">Reject</button>' +
      '</td>' +
      '</tr>'
    );
  }).join('');

  tbody.querySelectorAll('[data-approve]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const result = DLib.approveRequest(btn.getAttribute('data-approve'));
      if (!result.ok) { alert(result.message); return; }
      refreshAll();
    });
  });
  tbody.querySelectorAll('[data-reject]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const reason = prompt('Optional reason for declining this request:') || '';
      DLib.rejectRequest(btn.getAttribute('data-reject'), reason.trim());
      refreshAll();
    });
  });
}

/* ---------------- Reviews moderation ---------------- */
function renderReviewsTable() {
  const tbody = document.getElementById('reviews-table');
  const reviews = DLib.getAllReviews();

  if (reviews.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No reviews have been posted yet.</td></tr>';
    return;
  }

  tbody.innerHTML = reviews.map(function (r) {
    const book = DLib.getBook(r.bookId);
    const student = DLib.getUserById(r.userId);
    return (
      '<tr>' +
      '<td>' + escapeHtml(book ? book.title : 'Deleted book') + '</td>' +
      '<td>' + escapeHtml(student ? student.name : 'Former member') + '</td>' +
      '<td>' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</td>' +
      '<td style="white-space:normal; max-width:280px;">' + escapeHtml(r.text || '—') + '</td>' +
      '<td>' + formatDate(r.createdDate) + '</td>' +
      '<td><button class="btn btn-sm btn-danger" data-delete-review="' + r.id + '">Delete</button></td>' +
      '</tr>'
    );
  }).join('');

  tbody.querySelectorAll('[data-delete-review]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (confirm('Delete this review? This cannot be undone.')) {
        DLib.deleteReview(btn.getAttribute('data-delete-review'));
        refreshAll();
      }
    });
  });
}

/* ---------------- Categories ---------------- */
function renderCategoriesTable() {
  const tbody = document.getElementById('categories-table');
  const categories = DLib.getCategoryCounts();

  if (categories.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="3">No categories yet.</td></tr>';
    return;
  }

  tbody.innerHTML = categories.map(function (c) {
    return (
      '<tr>' +
      '<td>' + categoryBadge(c.name) + '</td>' +
      '<td>' + c.count + '</td>' +
      '<td>' +
      '  <div class="category-rename">' +
      '    <input type="text" value="' + escapeHtml(c.name) + '" data-rename-input="' + escapeHtml(c.name) + '">' +
      '    <button class="btn btn-sm btn-outline" data-rename-save="' + escapeHtml(c.name) + '">Save</button>' +
      '  </div>' +
      '</td>' +
      '</tr>'
    );
  }).join('');

  tbody.querySelectorAll('[data-rename-save]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const oldName = btn.getAttribute('data-rename-save');
      const input = tbody.querySelector('[data-rename-input="' + CSS.escape(oldName) + '"]');
      const newName = input.value.trim();
      if (!newName || newName === oldName) return;
      DLib.renameCategory(oldName, newName);
      refreshAll();
    });
  });
}

/* ---------------- Announcements ---------------- */
function handleAnnouncementSubmit(e) {
  e.preventDefault();
  hideAlert('announcement-alert');
  const textarea = document.getElementById('announcement-text');
  const message = textarea.value.trim();
  if (!message) {
    showAlert('announcement-alert', 'Please write a message before sending.', 'error');
    return;
  }
  DLib.notifyAllStudents('announcement', message);
  textarea.value = '';
  showAlert('announcement-alert', 'Announcement sent to all students.', 'success');
}

/* ---------------- Library insights ---------------- */
function renderInsights() {
  renderInsightList('most-borrowed-list', DLib.getMostBorrowedBooks(5).map(function (entry) {
    return { title: entry.book.title, count: entry.count + (entry.count === 1 ? ' borrow' : ' borrows') };
  }));
  renderInsightList('most-active-list', DLib.getMostActiveUsers(5).map(function (entry) {
    return { title: entry.user.name, count: entry.count + (entry.count === 1 ? ' borrow' : ' borrows') };
  }));
  renderInsightList('recent-books-list', DLib.getRecentlyAddedBooks(5).map(function (book) {
    return { title: book.title, count: formatDate(book.addedDate) };
  }));
}

function renderInsightList(elementId, items) {
  const el = document.getElementById(elementId);
  if (items.length === 0) {
    el.innerHTML = '<div class="insight-empty">Not enough data yet.</div>';
    return;
  }
  el.innerHTML = items.map(function (item, i) {
    return '<div class="insight-row"><span class="insight-rank">' + (i + 1) + '</span>' +
      '<span class="insight-title">' + escapeHtml(item.title) + '</span>' +
      '<span class="insight-count">' + escapeHtml(String(item.count)) + '</span></div>';
  }).join('');
}

/* ---------------- Borrowing activity table ---------------- */
function renderActivityTable() {
  const tbody = document.getElementById('activity-table');
  const query = document.getElementById('activity-search').value.trim().toLowerCase();
  const statusFilter = document.getElementById('activity-status').value;

  let rows = DLib.getRecords().map(function (r) {
    return {
      record: r,
      user: DLib.getUserById(r.userId),
      book: DLib.getBook(r.bookId),
      status: DLib.getRecordStatus(r)
    };
  }).filter(function (row) { return row.user && row.book; });

  if (statusFilter) {
    rows = rows.filter(function (row) { return row.status === statusFilter; });
  }
  if (query) {
    rows = rows.filter(function (row) {
      return row.user.name.toLowerCase().includes(query) || row.book.title.toLowerCase().includes(query);
    });
  }

  rows.sort(function (a, b) { return b.record.borrowDate.localeCompare(a.record.borrowDate); });

  if (rows.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No borrowing activity matches your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function (row) {
    return (
      '<tr>' +
      '<td>' + escapeHtml(row.user.name) + '</td>' +
      '<td>' + escapeHtml(row.book.title) + '</td>' +
      '<td>' + formatDate(row.record.borrowDate) + '</td>' +
      '<td>' + formatDate(row.record.dueDate) + '</td>' +
      '<td>' + formatDate(row.record.returnDate) + '</td>' +
      '<td>' + statusBadge(row.status) + '</td>' +
      '</tr>'
    );
  }).join('');
}

/* ---------------- Students table ---------------- */
function renderStudentsTable() {
  const tbody = document.getElementById('students-table');
  const students = DLib.getUsers().filter(function (u) { return u.role === 'student'; });

  if (students.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No students registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = students.map(function (student) {
    const activeCount = DLib.getUserRecords(student.id).filter(function (r) { return r.status === 'borrowed'; }).length;
    return (
      '<tr>' +
      '<td>' + escapeHtml(student.name) + '</td>' +
      '<td>' + escapeHtml(student.email) + '</td>' +
      '<td>' + formatDate(student.joinedDate) + '</td>' +
      '<td>' + activeCount + '</td>' +
      '<td><button class="btn btn-sm btn-danger" data-remove-user="' + student.id + '">Remove</button></td>' +
      '</tr>'
    );
  }).join('');

  tbody.querySelectorAll('[data-remove-user]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const student = DLib.getUserById(btn.getAttribute('data-remove-user'));
      if (!student) return;
      if (confirm('Remove "' + student.name + '"? This deletes their account, borrow history, requests, and favorites.')) {
        DLib.deleteUser(student.id);
        refreshAll();
      }
    });
  });
}
