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

    if (!localStorage.getItem(KEYS.users)) {
      write(KEYS.users, [
        { id: 'u_admin', name: 'Library Admin', email: 'admin@library.edu', password: 'admin123', role: 'admin', joinedDate: daysFromNow(-120) },
        { id: 'u_demo', name: 'Ama Serwaa', email: 'student@library.edu', password: 'student123', role: 'student', joinedDate: daysFromNow(-60) },
        { id: 'u_kwame', name: 'Kwame Boateng', email: 'kwame.boateng@student.edu', password: 'student123', role: 'student', joinedDate: daysFromNow(-52) },
        { id: 'u_abena', name: 'Abena Owusu', email: 'abena.owusu@student.edu', password: 'student123', role: 'student', joinedDate: daysFromNow(-30) }
      ]);
    } else {
      // Migration: add the demo reviewer accounts for browsers seeded
      // before reviews existed, so seeded reviews have a real author.
      const users = read(KEYS.users, []);
      let changed = false;
      [
        { id: 'u_kwame', name: 'Kwame Boateng', email: 'kwame.boateng@student.edu', password: 'student123', role: 'student', joinedDate: daysFromNow(-52) },
        { id: 'u_abena', name: 'Abena Owusu', email: 'abena.owusu@student.edu', password: 'student123', role: 'student', joinedDate: daysFromNow(-30) }
      ].forEach(function (demoUser) {
        if (!users.some(u => u.id === demoUser.id)) {
          users.push(demoUser);
          changed = true;
        }
      });
      if (changed) write(KEYS.users, users);
    }

    if (!localStorage.getItem(KEYS.books)) {
      write(KEYS.books, [
        // Course materials / academic
        { id: 'bk_1', title: 'Introduction to Algorithms', author: 'T. H. Cormen', category: 'Computer Science', format: 'PDF', description: 'A comprehensive guide to algorithm design, analysis, and complexity, covering sorting, graphs, and dynamic programming.', isbn: '978-9988-01-001-4', publisher: 'MIT Academic Press', publicationDate: '2019-03-10', pages: 1312, copiesTotal: 3, copiesAvailable: 2, addedDate: daysFromNow(-90), cover: null, fileName: null, fileData: null },
        { id: 'bk_2', title: 'Calculus: Early Transcendentals', author: 'James Stewart', category: 'Mathematics', format: 'PDF', description: 'Core calculus concepts including limits, derivatives, integrals, and series with worked examples.', isbn: '978-9988-01-002-1', publisher: 'Cengage Learning', publicationDate: '2020-01-15', pages: 1368, copiesTotal: 2, copiesAvailable: 1, addedDate: daysFromNow(-85), cover: null, fileName: null, fileData: null },
        { id: 'bk_3', title: 'Principles of Marketing', author: 'Philip Kotler', category: 'Business', format: 'EPUB', description: 'An introduction to marketing strategy, consumer behaviour, branding, and digital marketing channels.', isbn: '978-9988-01-003-8', publisher: 'Pearson Education', publicationDate: '2021-06-01', pages: 716, copiesTotal: 4, copiesAvailable: 4, addedDate: daysFromNow(-70), cover: null, fileName: null, fileData: null },
        { id: 'bk_4', title: 'Clean Code', author: 'Robert C. Martin', category: 'Computer Science', format: 'PDF', description: 'A handbook of agile software craftsmanship focused on writing readable, maintainable code.', isbn: '978-9988-01-004-5', publisher: 'Prentice Hall', publicationDate: '2018-08-01', pages: 464, copiesTotal: 2, copiesAvailable: 0, addedDate: daysFromNow(-65), cover: null, fileName: null, fileData: null },
        { id: 'bk_5', title: 'Fundamentals of Database Systems', author: 'Elmasri & Navathe', category: 'Computer Science', format: 'PDF', description: 'Covers relational databases, SQL, normalization, transactions, and database design.', isbn: '978-9988-01-005-2', publisher: 'Addison-Wesley', publicationDate: '2020-02-20', pages: 1242, copiesTotal: 3, copiesAvailable: 3, addedDate: daysFromNow(-55), cover: null, fileName: null, fileData: null },
        { id: 'bk_6', title: 'Engineering Mechanics: Statics', author: 'R. C. Hibbeler', category: 'Engineering', format: 'PDF', description: 'Foundational statics concepts for engineering students, including forces, equilibrium, and trusses.', isbn: '978-9988-01-006-9', publisher: 'Wiley', publicationDate: '2019-05-05', pages: 640, copiesTotal: 2, copiesAvailable: 2, addedDate: daysFromNow(-50), cover: null, fileName: null, fileData: null },
        { id: 'bk_8', title: 'Organic Chemistry Essentials', author: 'Paula Bruice', category: 'Science', format: 'PDF', description: 'An accessible introduction to organic chemistry structures, reactions, and mechanisms.', isbn: '978-9988-01-008-3', publisher: 'Oxford University Press', publicationDate: '2017-09-12', pages: 812, copiesTotal: 2, copiesAvailable: 2, addedDate: daysFromNow(-35), cover: null, fileName: null, fileData: null },
        { id: 'bk_9', title: 'Financial Accounting Basics', author: 'Jerry J. Weygandt', category: 'Business', format: 'PDF', description: 'Introduces financial statements, bookkeeping principles, and accounting cycles for beginners.', isbn: '978-9988-01-009-0', publisher: 'Wiley', publicationDate: '2021-01-08', pages: 592, copiesTotal: 3, copiesAvailable: 3, addedDate: daysFromNow(-30), cover: null, fileName: null, fileData: null },
        { id: 'bk_10', title: 'Data Communications and Networking', author: 'Behrouz Forouzan', category: 'Computer Science', format: 'PDF', description: 'Explores networking fundamentals, protocols, the OSI model, and network security basics.', isbn: '978-9988-01-010-6', publisher: 'McGraw-Hill', publicationDate: '2018-04-22', pages: 1176, copiesTotal: 2, copiesAvailable: 2, addedDate: daysFromNow(-25), cover: null, fileName: null, fileData: null },
        { id: 'bk_11', title: 'Introduction to Psychology', author: 'David G. Myers', category: 'Science', format: 'EPUB', description: 'A survey of core psychological concepts including cognition, development, and behaviour.', isbn: '978-9988-01-011-3', publisher: 'Worth Publishers', publicationDate: '2019-10-01', pages: 768, copiesTotal: 3, copiesAvailable: 3, addedDate: daysFromNow(-20), cover: null, fileName: null, fileData: null },
        { id: 'bk_12', title: 'Graphic Design: The New Basics', author: 'Ellen Lupton', category: 'Arts & Design', format: 'PDF', description: 'A visual guide to design fundamentals: layout, typography, colour, and composition.', isbn: '978-9988-01-012-0', publisher: 'Princeton Architectural Press', publicationDate: '2015-03-01', pages: 240, copiesTotal: 2, copiesAvailable: 2, addedDate: daysFromNow(-15), cover: null, fileName: null, fileData: null },
        { id: 'bk_13', title: 'Web Technologies with PHP and JavaScript', author: 'Group 2 Press', category: 'Computer Science', format: 'PDF', description: 'A practical guide to building dynamic web applications with HTML, CSS, JavaScript, and PHP.', isbn: '978-9988-01-013-7', publisher: 'Group 2 Press', publicationDate: '2026-01-15', pages: 386, copiesTotal: 4, copiesAvailable: 4, addedDate: daysFromNow(-10), cover: null, fileName: null, fileData: null },

        // Fiction & general-interest reading
        { id: 'bk_7', title: 'Things Fall Apart', author: 'Chinua Achebe', category: 'Literature', format: 'EPUB', description: 'A classic novel depicting pre-colonial life in Nigeria and the arrival of European colonialism.', isbn: '978-9988-01-007-6', publisher: 'Heinemann African Writers Series', publicationDate: '1994-11-01', pages: 209, copiesTotal: 5, copiesAvailable: 5, addedDate: daysFromNow(-40), cover: null, fileName: null, fileData: null },
        { id: 'bk_14', title: 'African History: A Concise Introduction', author: 'Kwame Nimako', category: 'History', format: 'EPUB', description: 'A concise overview of major events and movements across African history.', isbn: '978-9988-01-014-4', publisher: 'Sub-Saharan Publishers', publicationDate: '2016-07-01', pages: 328, copiesTotal: 3, copiesAvailable: 3, addedDate: daysFromNow(-5), cover: null, fileName: null, fileData: null },
        { id: 'bk_15', title: 'The Lantern of Osu', author: 'Efua Mensah', category: 'Fiction', format: 'EPUB', description: 'A coming-of-age story set in Accra, following a young woman chasing her dreams against family expectations.', isbn: '978-9988-01-015-1', publisher: 'Nyansa House', publicationDate: '2022-05-20', pages: 284, copiesTotal: 4, copiesAvailable: 4, addedDate: daysFromNow(-48), cover: null, fileName: null, fileData: null },
        { id: 'bk_16', title: 'Whispers of the Old Kingdom', author: 'Kwabena Osei', category: 'Fantasy', format: 'EPUB', description: 'An epic fantasy adventure through a forgotten kingdom of spirits, warriors, and ancient magic.', isbn: '978-9988-01-016-8', publisher: 'Baobab Fiction', publicationDate: '2023-02-14', pages: 352, copiesTotal: 3, copiesAvailable: 3, addedDate: daysFromNow(-42), cover: null, fileName: null, fileData: null },
        { id: 'bk_17', title: 'The Silent Witness', author: 'Naana Boateng', category: 'Mystery & Thriller', format: 'PDF', description: 'A gripping crime thriller where a quiet witness holds the key to unravelling a city-wide conspiracy.', isbn: '978-9988-01-017-5', publisher: 'Harmattan Press', publicationDate: '2021-09-09', pages: 296, copiesTotal: 3, copiesAvailable: 2, addedDate: daysFromNow(-38), cover: null, fileName: null, fileData: null },
        { id: 'bk_18', title: 'Letters from Labadi', author: 'Adjoa Frimpong', category: 'Romance', format: 'EPUB', description: 'A heartfelt romance told through letters exchanged between two childhood friends separated by distance.', isbn: '978-9988-01-018-2', publisher: 'Nyansa House', publicationDate: '2020-02-11', pages: 244, copiesTotal: 4, copiesAvailable: 4, addedDate: daysFromNow(-33), cover: null, fileName: null, fileData: null },
        { id: 'bk_19', title: 'Beyond the Red Horizon', author: 'Kojo Antwi-Mensah', category: 'Science Fiction', format: 'PDF', description: 'A crew of explorers races against time on a distant red planet to uncover a secret that could save Earth.', isbn: '978-9988-01-019-9', publisher: 'Baobab Fiction', publicationDate: '2024-03-01', pages: 312, copiesTotal: 2, copiesAvailable: 2, addedDate: daysFromNow(-28), cover: null, fileName: null, fileData: null },
        { id: 'bk_20', title: 'A Life in Motion', author: 'Sarah Owusu', category: 'Biography', format: 'PDF', description: 'The inspiring true story of an athlete who overcame injury and setbacks to reach the world stage.', isbn: '978-9988-01-020-5', publisher: 'Milestone Books', publicationDate: '2019-11-01', pages: 268, copiesTotal: 2, copiesAvailable: 2, addedDate: daysFromNow(-22), cover: null, fileName: null, fileData: null },
        { id: 'bk_21', title: 'Small Steps, Big Change', author: 'Daniel Asante', category: 'Self-Help', format: 'EPUB', description: 'Practical, everyday habits for building discipline, focus, and confidence as a student and young professional.', isbn: '978-9988-01-021-2', publisher: 'Clear Path Publishing', publicationDate: '2022-01-10', pages: 192, copiesTotal: 3, copiesAvailable: 3, addedDate: daysFromNow(-18), cover: null, fileName: null, fileData: null },
        { id: 'bk_22', title: 'Songs of the Harmattan', author: 'Abena Nyarko', category: 'Poetry', format: 'PDF', description: 'A poetry collection exploring home, memory, and the changing seasons of West Africa.', isbn: '978-9988-01-022-9', publisher: 'Harmattan Press', publicationDate: '2021-12-01', pages: 128, copiesTotal: 3, copiesAvailable: 3, addedDate: daysFromNow(-12), cover: null, fileName: null, fileData: null },
        { id: 'bk_23', title: 'The Trials of Kojo', author: 'Emmanuel Darko', category: 'Adventure', format: 'EPUB', description: 'A young adventurer sets out across the Volta region on a journey full of danger, friendship, and discovery.', isbn: '978-9988-01-023-6', publisher: 'Baobab Fiction', publicationDate: '2023-08-19', pages: 302, copiesTotal: 3, copiesAvailable: 3, addedDate: daysFromNow(-8), cover: null, fileName: null, fileData: null },
        { id: 'bk_24', title: 'Midnight in Jamestown', author: 'Naa Adjeley', category: 'Mystery & Thriller', format: 'PDF', description: 'A journalist investigating a decades-old disappearance uncovers secrets the old town wanted buried.', isbn: '978-9988-01-024-3', publisher: 'Harmattan Press', publicationDate: '2024-06-15', pages: 276, copiesTotal: 2, copiesAvailable: 2, addedDate: daysFromNow(-3), cover: null, fileName: null, fileData: null }
      ]);
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

  /* ---------------- Books ---------------- */
  function getBooks() { return read(KEYS.books, []); }
  function saveBooks(books) { write(KEYS.books, books); }
  function getBook(id) { return getBooks().find(b => b.id === id) || null; }

  function addBook(book) {
    const books = getBooks();
    const newBook = {
      id: generateId('bk'),
      title: book.title,
      author: book.author,
      category: book.category,
      format: book.format,
      description: book.description,
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publicationDate: book.publicationDate || '',
      pages: book.pages || null,
      copiesTotal: book.copiesTotal,
      copiesAvailable: book.copiesTotal,
      addedDate: new Date().toISOString().slice(0, 10),
      cover: book.cover || null,
      fileName: book.fileName || null,
      fileData: book.fileData || null
    };
    books.unshift(newBook);
    saveBooks(books);
    return newBook;
  }

  function updateBook(id, updates) {
    const books = getBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return null;
    books[idx] = Object.assign({}, books[idx], updates);
    saveBooks(books);
    return books[idx];
  }

  function deleteBook(id) {
    saveBooks(getBooks().filter(b => b.id !== id));
    saveRecords(getRecords().filter(r => r.bookId !== id));
    write(KEYS.reviews, read(KEYS.reviews, []).filter(r => r.bookId !== id));
  }

  function getCategories() {
    return Array.from(new Set(getBooks().map(b => b.category))).sort();
  }

  function getRelatedBooks(book, limit) {
    limit = limit || 4;
    const books = getBooks().filter(b => b.id !== book.id);
    const sameCategory = books.filter(b => b.category === book.category);
    const others = books.filter(b => b.category !== book.category);
    return sameCategory.concat(others).slice(0, limit);
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

  function getCoverImage(book) {
    return book.cover || placeholderCover(book.title, book.category);
  }

  /* ---------------- Users ---------------- */
  function getUsers() { return read(KEYS.users, []); }
  function saveUsers(users) { write(KEYS.users, users); }
  function getUserById(id) { return getUsers().find(u => u.id === id) || null; }
  function getUserByEmail(email) {
    return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
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
  function deleteUser(userId) {
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
    seed, generateId,
    getBooks, saveBooks, getBook, addBook, updateBook, deleteBook, getCategories, getCoverImage, getRelatedBooks,
    getUsers, saveUsers, getUserById, getUserByEmail, deleteUser,
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

DLib.seed();
