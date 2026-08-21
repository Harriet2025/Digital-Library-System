document.addEventListener('DOMContentLoaded', async function () {
  await DLib.init();
  renderHeader('home');
  renderFooter();
  renderFeaturedBooks();
  renderPopularBooks();
  renderRecommended();
  renderRecentlyViewed();
  renderHeroStats();
});

function renderHeroStats() {
  document.getElementById('stat-book-count').textContent = DLib.getBooks().length + '+';
  document.getElementById('stat-category-count').textContent = DLib.getCategories().length;
}

function renderFeaturedBooks() {
  const container = document.getElementById('featured-books');
  const books = DLib.getRecentlyAddedBooks(4);
  container.innerHTML = books.map(function (book) { return renderBookCardHTML(book, { showBorrowAction: false }); }).join('');
  wireBookCards(container, renderFeaturedBooks);
}

function renderPopularBooks() {
  const container = document.getElementById('popular-books');
  const books = DLib.getPopularBooks(4);
  container.innerHTML = books.map(function (book) { return renderBookCardHTML(book, { showBorrowAction: false }); }).join('');
  wireBookCards(container, renderPopularBooks);
}

function renderRecommended() {
  const user = DLib.getCurrentUser();
  const section = document.getElementById('recommended-section');
  if (!user || user.role !== 'student') {
    section.style.display = 'none';
    return;
  }
  const books = DLib.getRecommendedBooks(user.id, 4);
  if (books.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  const container = document.getElementById('recommended-books');
  container.innerHTML = books.map(function (book) { return renderBookCardHTML(book, { showBorrowAction: false }); }).join('');
  wireBookCards(container, renderRecommended);
}

function renderRecentlyViewed() {
  const user = DLib.getCurrentUser();
  const viewerId = user ? user.id : 'guest';
  const section = document.getElementById('recently-viewed-section');
  const books = DLib.getRecentlyViewed(viewerId, 6);
  if (books.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  const container = document.getElementById('recently-viewed-books');
  container.innerHTML = books.map(function (book) { return renderBookCardHTML(book, { showBorrowAction: false }); }).join('');
  wireBookCards(container, renderRecentlyViewed);
}
