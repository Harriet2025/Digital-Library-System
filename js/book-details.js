document.addEventListener('DOMContentLoaded', async function () {
  await DLib.init();
  renderHeader('catalogue');
  renderFooter();
  render();
});

function getBookIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function render() {
  const container = document.getElementById('book-details-content');
  const book = DLib.getBook(getBookIdFromUrl());

  if (!book) {
    container.innerHTML = '<p class="text-muted">This book could not be found. It may have been removed from the catalogue.</p>';
    return;
  }

  const available = book.copiesAvailable > 0;
  const user = DLib.getCurrentUser();
  DLib.recordView(user ? user.id : 'guest', book.id);

  const ratingStats = DLib.getRatingStats(book.id);

  let favoriteHtml = '';
  if (user && user.role === 'student') {
    const isFav = DLib.isFavorite(user.id, book.id);
    favoriteHtml = '<button class="favorite-btn-inline' + (isFav ? ' active' : '') + '" id="favorite-toggle" type="button">' +
      (isFav ? '♥ Favorited' : '♡ Add to Favorites') + '</button>';
  }

  container.innerHTML =
    '<div class="book-details">' +
    '  <img class="cover" src="' + DLib.getCoverImage(book) + '" alt="Cover of ' + escapeHtml(book.title) + '">' +
    '  <div>' +
    '    <div class="title-row">' +
    '      <div>' +
    '        <h1 class="mb-0">' + escapeHtml(book.title) + '</h1>' +
    '        <p class="text-muted">by ' + escapeHtml(book.author) + '</p>' +
    '      </div>' +
    favoriteHtml +
    '    </div>' +
    '    <div class="meta-row">' +
    categoryBadge(book.category) +
    '      <span class="badge badge-category">' + escapeHtml(book.format) + '</span>' +
    '      <span class="badge ' + (available ? 'badge-available' : 'badge-unavailable') + '">' +
    (available ? book.copiesAvailable + ' of ' + book.copiesTotal + ' available' : 'Currently unavailable') +
    '      </span>' +
    '    </div>' +
    '    <div class="rating-summary">' + starDisplay(ratingStats.average, ratingStats.count) + '</div>' +
    '    <p>' + escapeHtml(book.description) + '</p>' +
    '    <div class="spec-grid">' +
    specItem('ISBN', book.isbn) +
    specItem('Publisher', book.publisher) +
    specItem('Published', formatDate(book.publicationDate)) +
    specItem('Pages', book.pages ? book.pages + ' pages' : '—') +
    '    </div>' +
    '    <div class="action-area" id="action-area"></div>' +
    '  </div>' +
    '</div>' +
    '<div class="reviews-section" id="reviews-section"></div>' +
    '<div class="related-books" id="related-books"></div>';

  const favBtn = document.getElementById('favorite-toggle');
  if (favBtn) {
    favBtn.addEventListener('click', function () {
      DLib.toggleFavorite(user.id, book.id);
      render();
    });
  }

  renderActionArea(book);
  renderReviews(book, user);
  renderRelatedBooks(book);
}

function renderReviews(book, user) {
  const section = document.getElementById('reviews-section');
  const reviews = DLib.getReviews(book.id);

  let formHtml = '';
  if (user && user.role === 'student') {
    const existing = DLib.getUserReviewForBook(user.id, book.id);
    const myRating = existing ? existing.rating : 0;
    formHtml =
      '<div class="review-form-card">' +
      '  <h3 class="mb-0">' + (existing ? 'Update Your Review' : 'Write a Review') + '</h3>' +
      '  <div class="star-picker" id="star-picker">' + starPickerHTML(myRating) + '</div>' +
      '  <textarea id="review-text" placeholder="Share your thoughts on this book...">' + escapeHtml(existing ? existing.text : '') + '</textarea>' +
      '  <button class="btn btn-primary" id="submit-review-btn" type="button" style="margin-top:10px;">' + (existing ? 'Update Review' : 'Submit Review') + '</button>' +
      '</div>';
  }

  const reviewsHtml = reviews.length === 0
    ? '<p class="text-muted">No reviews yet. Be the first to share your thoughts.</p>'
    : reviews.map(function (r) {
        const reviewer = DLib.getUserById(r.userId);
        return (
          '<div class="review-card">' +
          '  <div class="review-header">' +
          '    <span class="reviewer-name">' + escapeHtml(reviewer ? reviewer.name : 'Former member') + '</span>' +
          '    <span class="review-date">' + formatDate(r.createdDate) + '</span>' +
          '  </div>' +
          '  <div class="review-stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</div>' +
          '  <p>' + escapeHtml(r.text) + '</p>' +
          '</div>'
        );
      }).join('');

  section.innerHTML =
    '<h2>Reviews</h2>' +
    formHtml +
    reviewsHtml;

  if (user && user.role === 'student') {
    const existingReview = DLib.getUserReviewForBook(user.id, book.id);
    let selectedRating = existingReview ? existingReview.rating : 0;

    function wireStarPicker() {
      const picker = document.getElementById('star-picker');
      picker.querySelectorAll('[data-star]').forEach(function (star) {
        star.addEventListener('click', function () {
          selectedRating = parseInt(star.getAttribute('data-star'), 10);
          picker.innerHTML = starPickerHTML(selectedRating);
          wireStarPicker();
        });
      });
    }
    wireStarPicker();

    document.getElementById('submit-review-btn').addEventListener('click', function () {
      if (!selectedRating) {
        alert('Please select a star rating before submitting.');
        return;
      }
      const text = document.getElementById('review-text').value.trim();
      DLib.addOrUpdateReview(user.id, book.id, selectedRating, text);
      render();
    });
  }
}

function starPickerHTML(selected) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += '<span class="star' + (i <= selected ? ' filled' : '') + '" data-star="' + i + '">★</span>';
  }
  return html;
}

function specItem(label, value) {
  return '<div class="spec-item"><div class="spec-label">' + escapeHtml(label) + '</div><div class="spec-value">' + escapeHtml(value || '—') + '</div></div>';
}

function renderRelatedBooks(book) {
  const section = document.getElementById('related-books');
  const related = DLib.getRelatedBooks(book, 4);
  if (related.length === 0) {
    section.innerHTML = '';
    return;
  }
  section.innerHTML =
    '<h2>You Might Also Like</h2>' +
    '<div class="grid book-grid" id="related-grid"></div>';
  const grid = document.getElementById('related-grid');
  grid.innerHTML = related.map(function (b) { return renderBookCardHTML(b, { showBorrowAction: false }); }).join('');
  wireBookCards(grid, function () { render(); });
}

function renderActionArea(book) {
  const area = document.getElementById('action-area');
  const user = DLib.getCurrentUser();

  if (!user) {
    area.innerHTML = '<p class="text-muted">You need an account to borrow this book.</p>' +
      '<a class="btn btn-primary" href="login.html">Login to Borrow</a>';
    return;
  }

  if (user.role === 'admin') {
    area.innerHTML = '<p class="text-muted">Admins manage the catalogue from the Admin Panel.</p>' +
      '<a class="btn btn-outline" href="admin.html">Go to Admin Panel</a>';
    return;
  }

  const records = DLib.getUserRecords(user.id);
  const activeRecord = records.find(function (r) { return r.bookId === book.id && r.status === 'borrowed'; });

  if (activeRecord) {
    const status = DLib.getRecordStatus(activeRecord);
    area.innerHTML =
      '<p>You borrowed this book on ' + formatDate(activeRecord.borrowDate) + '. Due ' + formatDate(activeRecord.dueDate) + ' ' + statusBadge(status) + '</p>' +
      '<div id="digital-access"></div>' +
      '<button class="btn btn-accent" id="return-btn">Return This Book</button>';

    renderDigitalAccess(book, user);

    document.getElementById('return-btn').addEventListener('click', function () {
      DLib.returnBook(activeRecord.id);
      render();
    });
    return;
  }

  if (DLib.hasPendingRequest(user.id, book.id)) {
    area.innerHTML = '<p class="text-muted">Your request to borrow this book is awaiting librarian approval.</p>' +
      '<button class="btn btn-outline" disabled>Request Pending</button>';
    return;
  }

  if (book.copiesAvailable > 0) {
    area.innerHTML = '<button class="btn btn-primary" id="borrow-btn">Request to Borrow</button>';
    document.getElementById('borrow-btn').addEventListener('click', function () {
      const result = DLib.requestBorrow(user.id, book.id);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      alert('Your request has been sent to the librarian for approval.');
      render();
    });
  } else {
    area.innerHTML = '<button class="btn btn-primary" disabled>No Copies Available</button>';
  }
}

function renderDigitalAccess(book, user) {
  const container = document.getElementById('digital-access');

  if (!book.fileData) {
    container.innerHTML = '<p class="text-muted">E-book file not uploaded yet. Check back later.</p>';
    return;
  }

  const progress = DLib.getProgress(user.id, book.id);
  const isPdf = book.format === 'PDF';
  const pdfSrc = book.fileData + (isPdf && progress.bookmarkPage ? '#page=' + progress.bookmarkPage : '');

  let viewerHtml;
  if (isPdf) {
    viewerHtml = '<div class="pdf-viewer"><iframe src="' + pdfSrc + '" title="' + escapeHtml(book.title) + ' viewer"></iframe></div>';
  } else {
    viewerHtml = '<p class="text-muted">In-browser preview is available for PDF titles. Download this EPUB below to open it in your preferred e-reader app.</p>';
  }

  container.innerHTML =
    viewerHtml +
    '<div class="progress-controls">' +
    '  <label for="progress-slider">Reading Progress: <span id="progress-label">' + progress.percent + '%</span></label>' +
    '  <input type="range" min="0" max="100" id="progress-slider" value="' + progress.percent + '">' +
    '  <div class="progress-bar-track"><div class="progress-bar-fill" id="progress-fill" style="width:' + progress.percent + '%"></div></div>' +
    (isPdf ?
      '  <label for="bookmark-input">Bookmark a Page</label>' +
      '  <div class="flex" style="gap:8px;">' +
      '    <input type="number" min="1" id="bookmark-input" value="' + (progress.bookmarkPage || '') + '" placeholder="Page number" style="max-width:140px;">' +
      '    <button class="btn btn-sm btn-outline" id="save-bookmark-btn" type="button">Save &amp; Jump</button>' +
      '  </div>'
      : ''
    ) +
    '</div>' +
    '<a class="btn btn-primary" href="' + book.fileData + '" download="' + escapeHtml(book.fileName || book.title) + '">Download</a>';

  const slider = document.getElementById('progress-slider');
  slider.addEventListener('input', function () {
    document.getElementById('progress-label').textContent = slider.value + '%';
    document.getElementById('progress-fill').style.width = slider.value + '%';
  });
  slider.addEventListener('change', function () {
    DLib.setProgress(user.id, book.id, { percent: parseInt(slider.value, 10) });
  });

  const bookmarkBtn = document.getElementById('save-bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', function () {
      const page = parseInt(document.getElementById('bookmark-input').value, 10) || null;
      DLib.setProgress(user.id, book.id, { bookmarkPage: page });
      renderDigitalAccess(book, user);
    });
  }
}
