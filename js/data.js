/* =========================================================
   DLib data layer
   All app data (users, books, borrow records) lives in
   localStorage so the whole system runs without a backend.
   ========================================================= */
const DLib = (function () {
  const KEYS = {
    users: 'dlib_users',
    books: 'dlib_books',
    records: 'dlib_borrow_records',
    session: 'dlib_current_user',
    seedVersion: 'dlib_seed_version',
    favorites: 'dlib_favorites',
    progress: 'dlib_reading_progress',
    requests: 'dlib_borrow_requests',
    notifications: 'dlib_notifications',
    reviews: 'dlib_reviews',
    recentlyViewed: 'dlib_recently_viewed'
  };

  // Bump this whenever the seed catalogue below changes, so existing
  // browsers pick up the new sample books instead of keeping stale data.
  const SEED_VERSION = '5';

  function generateId(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  let booksCache = null;
  let usersCache = null;

  function read(key, fallback) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function daysFromNow(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  /* ---------------- Seed data (first run only) ---------------- */
  function seed() {
    if (localStorage.getItem(KEYS.seedVersion) !== SEED_VERSION) {
      localStorage.removeItem(KEYS.books);
      localStorage.removeItem(KEYS.records);
      localStorage.setItem(KEYS.seedVersion, SEED_VERSION);
    }

    if (!localStorage.getItem(KEYS.records)) {
      write(KEYS.records, [
        { id: 'rec_1', userId: 'u_demo', bookId: 'bk_1', borrowDate: daysFromNow(-10), dueDate: daysFromNow(4), returnDate: null, status: 'borrowed' },
        { id: 'rec_2', userId: 'u_demo', bookId: 'bk_2', borrowDate: daysFromNow(-20), dueDate: daysFromNow(-6), returnDate: null, status: 'borrowed' },
        { id: 'rec_3', userId: 'u_demo', bookId: 'bk_7', borrowDate: daysFromNow(-45), dueDate: daysFromNow(-31), returnDate: daysFromNow(-33), status: 'returned' },
        { id: 'rec_4', userId: 'u_kwame', bookId: 'bk_16', borrowDate: daysFromNow(-30), dueDate: daysFromNow(-16), returnDate: daysFromNow(-18), status: 'returned' },
        { id: 'rec_5', userId: 'u_kwame', bookId: 'bk_1', borrowDate: daysFromNow(-25), dueDate: daysFromNow(-11), returnDate: daysFromNow(-14), status: 'returned' },
        { id: 'rec_6', userId: 'u_abena', bookId: 'bk_19', borrowDate: daysFromNow(-15), dueDate: daysFromNow(-1), returnDate: daysFromNow(-3), status: 'returned' }
      ]);
    }

    if (!localStorage.getItem(KEYS.favorites)) {
      write(KEYS.favorites, [
        { userId: 'u_demo', bookId: 'bk_16' },
        { userId: 'u_demo', bookId: 'bk_19' }
      ]);
    }

    if (!localStorage.getItem(KEYS.progress)) {
      write(KEYS.progress, [
        { userId: 'u_demo', bookId: 'bk_1', percent: 35, bookmarkPage: 120 }
      ]);
    }

    if (!localStorage.getItem(KEYS.requests)) {
      write(KEYS.requests, [
        { id: 'req_1', userId: 'u_demo', bookId: 'bk_5', requestDate: daysFromNow(-1), status: 'pending', reviewedDate: null, reason: null }
      ]);
    }

    if (!localStorage.getItem(KEYS.notifications)) {
      write(KEYS.notifications, [
        { id: 'ntf_1', userId: 'u_demo', type: 'request-approved', message: 'Your request to borrow "Introduction to Algorithms" was approved.', bookId: 'bk_1', createdDate: daysFromNow(-10), read: true },
        { id: 'ntf_2', userId: 'u_demo', type: 'new-book', message: 'New book added to the catalogue: "Midnight in Jamestown".', bookId: 'bk_24', createdDate: daysFromNow(-3), read: false },
        { id: 'ntf_3', userId: 'u_demo', type: 'announcement', message: 'The library will extend borrowing periods to 21 days during exam season.', bookId: null, createdDate: daysFromNow(-1), read: false }
      ]);
    }

    if (!localStorage.getItem(KEYS.reviews)) {
      write(KEYS.reviews, [
        { id: 'rev_1', bookId: 'bk_1', userId: 'u_kwame', rating: 5, text: 'Dense but incredibly thorough. The chapters on graph algorithms saved me during exams.', createdDate: daysFromNow(-13) },
        { id: 'rev_2', bookId: 'bk_1', userId: 'u_demo', rating: 4, text: 'A tough read but worth it. Wish there were more worked examples.', createdDate: daysFromNow(-9) },
        { id: 'rev_3', bookId: 'bk_16', userId: 'u_kwame', rating: 5, text: 'Could not put this down. The world-building is fantastic for a debut fantasy novel.', createdDate: daysFromNow(-17) },
        { id: 'rev_4', bookId: 'bk_19', userId: 'u_abena', rating: 4, text: 'Fun, fast-paced sci-fi. The ending felt a little rushed though.', createdDate: daysFromNow(-2) },
        { id: 'rev_5', bookId: 'bk_7', userId: 'u_demo', rating: 5, text: 'A must-read classic. Achebe\'s writing still hits hard decades later.', createdDate: daysFromNow(-32) }
      ]);
    }
  }

  /* ---------------- Books (MySQL-backed via api/books.php, cached) ---------------- */
  async function fetchBooksFromServer() {
    const res = await fetch('api/books.php');
    if (!res.ok) throw new Error('Failed to load books from server');
    const books = await res.json();
    booksCache = books;
    write(KEYS.books, books);
    return books;
  }
  function getBooks() {
    if (booksCache) return booksCache;
    return read(KEYS.books, []);
  }
  function saveBooks(books) { booksCache = books; write(KEYS.books, books); }
  function getBook(id) { return getBooks().find(b => b.id === id) || null; }

  async function addBook(book) {
    const res = await fetch('api/books.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add book');
    const newBook = Object.assign({ copiesAvailable: book.copiesTotal, addedDate: new Date().toISOString().slice(0, 10) }, book, { id: data.id });
    saveBooks(getBooks().concat([newBook]));
    return newBook;
  }

  async function updateBook(id, updates) {
    const res = await fetch('api/books.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ id: id }, updates))
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update book');
    const books = getBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return null;
    books[idx] = Object.assign({}, books[idx], updates);
    saveBooks(books);
    return books[idx];
  }

  async function deleteBook(id) {
    const res = await fetch('api/books.php?id=' + id, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete book');
    saveBooks(getBooks().filter(b => b.id !== id));
  }

  function getCategories() {
    return Array.from(new Set(getBooks().map(b => b.category))).sort();
  }

  /* ---------------- Cover images ---------------- */
  const COVER_COLORS = ['#1e3a5f', '#2c5282', '#0f766e', '#7c2d12', '#4c1d95', '#9d174d', '#134e4a', '#78350f'];

  function placeholderCover(title, category) {
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
    const color = COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
    const initials = title.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320">' +
      '<rect width="240" height="320" fill="' + color + '"/>' +
      '<text x="120" y="165" font-family="Segoe UI, Arial, sans-serif" font-size="58" fill="#ffffff" fill-opacity="0.92" text-anchor="middle" font-weight="bold">' + initials + '</text>' +
      '<text x="120" y="290" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#ffffff" fill-opacity="0.85" text-anchor="middle">' + category + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  function getRelatedBooks(book, limit) {
    limit = limit || 4;
    if (!book) return [];
    return getBooks()
      .filter(function (b) { return b.id !== book.id && b.category === book.category; })
      .slice(0, limit);
  }

  function getCoverImage(book) {
    return book.cover || placeholderCover(book.title, book.category);
  }

  /* ---------------- Users (MySQL-backed via api/users.php + api/auth.php) ---------------- */
  async function fetchUsersFromServer() {
    const res = await fetch('api/users.php');
    if (!res.ok) throw new Error('Failed to load users from server');
    const users = await res.json();
    usersCache = users;
    write(KEYS.users, users);
    return users;
  }
  function getUsers() {
    if (usersCache) return usersCache;
    return read(KEYS.users, []);
  }
  function saveUsers(users) { usersCache = users; write(KEYS.users, users); }
  function getUserById(id) { return getUsers().find(u => u.id === id) || null; }
  function getUserByEmail(email) {
    return getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
  }

  async function init() {
    await Promise.all([fetchBooksFromServer(), fetchUsersFromServer()]);
    seed();
  }

  async function loginUser(email, password) {
    const res = await fetch('api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { ok: false, message: data.error || 'Invalid email or password.' };
    }
    setCurrentUser(data.user.id);
    if (!getUsers().some(u => u.id === data.user.id)) saveUsers(getUsers().concat([data.user]));
    return { ok: true, user: data.user };
  }

  async function registerUser(name, email, password, role) {
    if (!name || !email || !password) return { ok: false, message: 'All fields are required.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Please enter a valid email address.' };
    if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };

    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: role === 'admin' ? 'admin' : 'student' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) return { ok: false, message: data.error || 'Registration failed.' };
    saveUsers(getUsers().concat([data.user]));
    setCurrentUser(data.user.id);
    return { ok: true, user: data.user };
  }

  async function deleteUserRemote(id) {
    const res = await fetch('api/users.php?id=' + id, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete user');
  }

  /* ---------------- Session ---------------- */
  function getCurrentUser() {
    const id = localStorage.getItem(KEYS.session);
    return id ? getUserById(id) : null;
  }
  function setCurrentUser(id) { localStorage.setItem(KEYS.session, id); }
  function clearCurrentUser() { localStorage.removeItem(KEYS.session); }

  /* ---------------- Borrow records ---------------- */
  function getRecords() { return read(KEYS.records, []); }
  function saveRecords(records) { write(KEYS.records, records); }

  function getRecordStatus(record) {
    if (record.status === 'returned') return 'returned';
    const today = new Date().toISOString().slice(0, 10);
    return record.dueDate < today ? 'overdue' : 'borrowed';
  }

  function getUserRecords(userId) {
    return getRecords()
      .filter(r => r.userId === userId)
      .sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));
  }

  function isBorrowedByUser(userId, bookId) {
    return getRecords().some(r => r.userId === userId && r.bookId === bookId && r.status === 'borrowed');
  }

  function createBorrowRecord(userId, bookId) {
    const book = getBook(bookId);
    const records = getRecords();
    const record = {
      id: generateId('rec'),
      userId,
      bookId,
      borrowDate: daysFromNow(0),
      dueDate: daysFromNow(14),
      returnDate: null,
      status: 'borrowed'
    };
    records.push(record);
    saveRecords(records);
    updateBook(bookId, { copiesAvailable: book.copiesAvailable - 1 });
    return record;
  }

  function returnBook(recordId) {
    const records = getRecords();
    const record = records.find(r => r.id === recordId);
    if (!record || record.status !== 'borrowed') return { ok: false, message: 'Record not found.' };

    record.status = 'returned';
    record.returnDate = daysFromNow(0);
    saveRecords(records);

    const book = getBook(record.bookId);
    if (book) {
      const wasUnavailable = book.copiesAvailable < 1;
      updateBook(book.id, { copiesAvailable: Math.min(book.copiesTotal, book.copiesAvailable + 1) });
      if (wasUnavailable) {
        getFavoritingUserIds(book.id).forEach(function (uid) {
          notifyUser(uid, 'availability', 'A copy of "' + book.title + '" is now available to borrow.', book.id);
        });
      }
    }
    return { ok: true };
  }

  /* ---------------- Borrow requests (student requests, librarian approves) ---------------- */
  function getRequests() { return read(KEYS.requests, []); }
  function saveRequests(requests) { write(KEYS.requests, requests); }

  function getUserRequests(userId) {
    return getRequests().filter(r => r.userId === userId).sort((a, b) => b.requestDate.localeCompare(a.requestDate));
  }

  function getPendingRequests() {
    return getRequests().filter(r => r.status === 'pending').sort((a, b) => a.requestDate.localeCompare(b.requestDate));
  }

  function hasPendingRequest(userId, bookId) {
    return getRequests().some(r => r.userId === userId && r.bookId === bookId && r.status === 'pending');
  }

  function requestBorrow(userId, bookId) {
    const book = getBook(bookId);
    if (!book) return { ok: false, message: 'Book not found.' };
    if (book.copiesAvailable < 1) return { ok: false, message: 'No copies available right now.' };
    if (isBorrowedByUser(userId, bookId)) return { ok: false, message: 'You already have this book borrowed.' };
    if (hasPendingRequest(userId, bookId)) return { ok: false, message: 'You already have a pending request for this book.' };

    const requests = getRequests();
    const request = {
      id: generateId('req'),
      userId,
      bookId,
      requestDate: daysFromNow(0),
      status: 'pending',
      reviewedDate: null,
      reason: null
    };
    requests.push(request);
    saveRequests(requests);
    return { ok: true, request };
  }

  function approveRequest(requestId) {
    const requests = getRequests();
    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return { ok: false, message: 'Request not found.' };

    const book = getBook(request.bookId);
    if (!book || book.copiesAvailable < 1) {
      return { ok: false, message: 'No copies available to approve this request right now.' };
    }

    createBorrowRecord(request.userId, request.bookId);
    request.status = 'approved';
    request.reviewedDate = daysFromNow(0);
    saveRequests(requests);

    notifyUser(request.userId, 'request-approved', 'Your request to borrow "' + book.title + '" was approved.', book.id);
    return { ok: true };
  }

  function rejectRequest(requestId, reason) {
    const requests = getRequests();
    const request = requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return { ok: false, message: 'Request not found.' };

    const book = getBook(request.bookId);
    request.status = 'rejected';
    request.reviewedDate = daysFromNow(0);
    request.reason = reason || null;
    saveRequests(requests);

    const suffix = reason ? ' Reason: ' + reason : '';
    notifyUser(request.userId, 'request-rejected', 'Your request to borrow "' + (book ? book.title : 'a book') + '" was declined.' + suffix, book ? book.id : null);
    return { ok: true };
  }

  /* ---------------- Favorites ---------------- */
  function getFavorites(userId) {
    return read(KEYS.favorites, []).filter(f => f.userId === userId).map(f => f.bookId);
  }

  function getFavoritingUserIds(bookId) {
    return read(KEYS.favorites, []).filter(f => f.bookId === bookId).map(f => f.userId);
  }

  function isFavorite(userId, bookId) {
    return getFavorites(userId).includes(bookId);
  }

  function toggleFavorite(userId, bookId) {
    const favorites = read(KEYS.favorites, []);
    const idx = favorites.findIndex(f => f.userId === userId && f.bookId === bookId);
    if (idx === -1) {
      favorites.push({ userId, bookId });
      write(KEYS.favorites, favorites);
      return true;
    }
    favorites.splice(idx, 1);
    write(KEYS.favorites, favorites);
    return false;
  }

  /* ---------------- Reading progress & bookmarks ---------------- */
  function getProgress(userId, bookId) {
    const entry = read(KEYS.progress, []).find(p => p.userId === userId && p.bookId === bookId);
    return entry ? { percent: entry.percent, bookmarkPage: entry.bookmarkPage } : { percent: 0, bookmarkPage: null };
  }

  function setProgress(userId, bookId, updates) {
    const records = read(KEYS.progress, []);
    const idx = records.findIndex(p => p.userId === userId && p.bookId === bookId);
    if (idx === -1) {
      records.push(Object.assign({ userId, bookId, percent: 0, bookmarkPage: null }, updates));
    } else {
      records[idx] = Object.assign({}, records[idx], updates);
    }
    write(KEYS.progress, records);
  }

  /* ---------------- Notifications ---------------- */
  function notifyUser(userId, type, message, bookId) {
    const notifications = read(KEYS.notifications, []);
    notifications.push({
      id: generateId('ntf'),
      userId,
      type,
      message,
      bookId: bookId || null,
      createdDate: daysFromNow(0),
      read: false
    });
    write(KEYS.notifications, notifications);
  }

  function notifyAllStudents(type, message, bookId) {
    getUsers().filter(u => u.role === 'student').forEach(function (u) {
      notifyUser(u.id, type, message, bookId);
    });
  }

  function getNotifications(userId) {
    return read(KEYS.notifications, [])
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }

  function getDueDateAlerts(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const soonCutoff = daysFromNow(3);
    const alerts = [];
    getUserRecords(userId).filter(r => r.status === 'borrowed').forEach(function (r) {
      const book = getBook(r.bookId);
      if (!book) return;
      if (r.dueDate < today) {
        alerts.push({ type: 'overdue', message: '"' + book.title + '" is overdue (was due ' + r.dueDate + ').', bookId: book.id });
      } else if (r.dueDate <= soonCutoff) {
        alerts.push({ type: 'due-soon', message: '"' + book.title + '" is due on ' + r.dueDate + '.', bookId: book.id });
      }
    });
    return alerts;
  }

  function getUnreadNotificationCount(userId) {
    const unreadStored = getNotifications(userId).filter(n => !n.read).length;
    return unreadStored + getDueDateAlerts(userId).length;
  }

  function markNotificationRead(notificationId) {
    const notifications = read(KEYS.notifications, []);
    const entry = notifications.find(n => n.id === notificationId);
    if (entry) entry.read = true;
    write(KEYS.notifications, notifications);
  }

  function markAllNotificationsRead(userId) {
    const notifications = read(KEYS.notifications, []);
    notifications.forEach(function (n) { if (n.userId === userId) n.read = true; });
    write(KEYS.notifications, notifications);
  }

  /* ---------------- Category management ---------------- */
  function getCategoryCounts() {
    const counts = {};
    getBooks().forEach(function (b) { counts[b.category] = (counts[b.category] || 0) + 1; });
    return Object.keys(counts).sort().map(function (name) { return { name, count: counts[name] }; });
  }

  function renameCategory(oldName, newName) {
    if (!newName || oldName === newName) return;
    const books = getBooks().map(function (b) {
      return b.category === oldName ? Object.assign({}, b, { category: newName }) : b;
    });
    saveBooks(books);
  }

  /* ---------------- User management ---------------- */
  async function deleteUser(userId) {
    await deleteUserRemote(userId);
    saveUsers(getUsers().filter(u => u.id !== userId));
    saveRecords(getRecords().filter(r => r.userId !== userId));
    saveRequests(getRequests().filter(r => r.userId !== userId));
    write(KEYS.favorites, read(KEYS.favorites, []).filter(f => f.userId !== userId));
    write(KEYS.progress, read(KEYS.progress, []).filter(p => p.userId !== userId));
    write(KEYS.notifications, read(KEYS.notifications, []).filter(n => n.userId !== userId));
    write(KEYS.reviews, read(KEYS.reviews, []).filter(r => r.userId !== userId));
    write(KEYS.recentlyViewed, read(KEYS.recentlyViewed, []).filter(v => v.viewerId !== userId));
  }

  /* ---------------- Statistics ---------------- */
  function getAvailableBooksCount() {
    return getBooks().filter(b => b.copiesAvailable > 0).length;
  }

  function getMostBorrowedBooks(limit) {
    limit = limit || 5;
    const counts = {};
    getRecords().forEach(function (r) { counts[r.bookId] = (counts[r.bookId] || 0) + 1; });
    return Object.keys(counts)
      .map(function (bookId) { return { book: getBook(bookId), count: counts[bookId] }; })
      .filter(function (entry) { return entry.book; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, limit);
  }

  function getMostActiveUsers(limit) {
    limit = limit || 5;
    const counts = {};
    getRecords().forEach(function (r) { counts[r.userId] = (counts[r.userId] || 0) + 1; });
    return Object.keys(counts)
      .map(function (userId) { return { user: getUserById(userId), count: counts[userId] }; })
      .filter(function (entry) { return entry.user; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, limit);
  }

  function getRecentlyAddedBooks(limit) {
    limit = limit || 5;
    return getBooks().slice().sort(function (a, b) { return b.addedDate.localeCompare(a.addedDate); }).slice(0, limit);
  }

  /* ---------------- Reviews & ratings ---------------- */
  function getReviews(bookId) {
    return read(KEYS.reviews, [])
      .filter(r => r.bookId === bookId)
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }

  function getAllReviews() {
    return read(KEYS.reviews, []).sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }

  function getUserReviewForBook(userId, bookId) {
    return read(KEYS.reviews, []).find(r => r.userId === userId && r.bookId === bookId) || null;
  }

  function getRatingStats(bookId) {
    const reviews = getReviews(bookId);
    if (reviews.length === 0) return { average: 0, count: 0 };
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
  }

  function addOrUpdateReview(userId, bookId, rating, text) {
    const reviews = read(KEYS.reviews, []);
    const existing = reviews.find(r => r.userId === userId && r.bookId === bookId);
    if (existing) {
      existing.rating = rating;
      existing.text = text;
      existing.createdDate = daysFromNow(0);
    } else {
      reviews.push({
        id: generateId('rev'),
        bookId, userId, rating, text,
        createdDate: daysFromNow(0)
      });
    }
    write(KEYS.reviews, reviews);
  }

  function deleteReview(reviewId) {
    write(KEYS.reviews, read(KEYS.reviews, []).filter(r => r.id !== reviewId));
  }

  /* ---------------- Recently viewed ---------------- */
  function recordView(viewerId, bookId) {
    if (!viewerId) return;
    let views = read(KEYS.recentlyViewed, []).filter(v => !(v.viewerId === viewerId && v.bookId === bookId));
    views.unshift({ viewerId, bookId, viewedDate: daysFromNow(0) });

    const mine = views.filter(v => v.viewerId === viewerId).slice(0, 20);
    const others = views.filter(v => v.viewerId !== viewerId);
    write(KEYS.recentlyViewed, mine.concat(others));
  }

  function getRecentlyViewed(viewerId, limit, excludeBookId) {
    limit = limit || 6;
    if (!viewerId) return [];
    return read(KEYS.recentlyViewed, [])
      .filter(v => v.viewerId === viewerId && v.bookId !== excludeBookId)
      .map(v => getBook(v.bookId))
      .filter(Boolean)
      .slice(0, limit);
  }

  /* ---------------- Popularity & recommendations ---------------- */
  function getPopularBooks(limit) {
    limit = limit || 4;
    const borrowCounts = {};
    getRecords().forEach(function (r) { borrowCounts[r.bookId] = (borrowCounts[r.bookId] || 0) + 1; });

    return getBooks()
      .map(function (book) {
        const stats = getRatingStats(book.id);
        const score = (borrowCounts[book.id] || 0) * 2 + stats.average;
        return { book, score };
      })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, limit)
      .map(function (entry) { return entry.book; });
  }

  function getRecommendedBooks(userId, limit) {
    limit = limit || 4;
    if (!userId) return getPopularBooks(limit);

    const signalBookIds = new Set([
      ...getFavorites(userId),
      ...getUserRecords(userId).map(r => r.bookId),
      ...read(KEYS.reviews, []).filter(r => r.userId === userId && r.rating >= 4).map(r => r.bookId)
    ]);

    if (signalBookIds.size === 0) return getPopularBooks(limit);

    const categoryCounts = {};
    signalBookIds.forEach(function (bookId) {
      const book = getBook(bookId);
      if (book) categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
    });
    const preferredCategories = Object.keys(categoryCounts).sort(function (a, b) { return categoryCounts[b] - categoryCounts[a]; });

    const candidates = getBooks().filter(function (b) {
      return preferredCategories.includes(b.category) && !signalBookIds.has(b.id);
    });

    if (candidates.length === 0) return getPopularBooks(limit);

    return candidates
      .sort(function (a, b) {
        const rankA = preferredCategories.indexOf(a.category);
        const rankB = preferredCategories.indexOf(b.category);
        if (rankA !== rankB) return rankA - rankB;
        return getRatingStats(b.id).average - getRatingStats(a.id).average;
      })
      .slice(0, limit);
  }

  return {
    seed, generateId, init,
    getBooks, saveBooks, getBook, addBook, updateBook, deleteBook, getCategories, getCoverImage, getRelatedBooks,
    getUsers, saveUsers, getUserById, getUserByEmail, loginUser, registerUser, deleteUser,
    getCurrentUser, setCurrentUser, clearCurrentUser,
    getRecords, saveRecords, getRecordStatus, getUserRecords, isBorrowedByUser, returnBook,
    getRequests, getUserRequests, getPendingRequests, hasPendingRequest, requestBorrow, approveRequest, rejectRequest,
    getFavorites, getFavoritingUserIds, isFavorite, toggleFavorite,
    getProgress, setProgress,
    notifyUser, notifyAllStudents, getNotifications, getDueDateAlerts, getUnreadNotificationCount,
    markNotificationRead, markAllNotificationsRead,
    getCategoryCounts, renameCategory,
    getAvailableBooksCount, getMostBorrowedBooks, getMostActiveUsers, getRecentlyAddedBooks,
    getReviews, getAllReviews, getUserReviewForBook, getRatingStats, addOrUpdateReview, deleteReview,
    recordView, getRecentlyViewed, getPopularBooks, getRecommendedBooks
  };
})();

