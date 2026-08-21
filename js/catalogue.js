document.addEventListener('DOMContentLoaded', async function () {
  await DLib.init();
  renderHeader('catalogue');
  renderFooter();
  await populateCategories();
  await applyFilters();

  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('category-filter').addEventListener('change', applyFilters);
  document.getElementById('sort-select').addEventListener('change', applyFilters);
  document.getElementById('available-only').addEventListener('change', applyFilters);
});

async function populateCategories() {
  const select = document.getElementById('category-filter');
  const categories = await DLib.getCategories();
  categories.forEach(function (category) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

async function applyFilters() {
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const category = document.getElementById('category-filter').value;
  const sortBy = document.getElementById('sort-select').value;
  const availableOnly = document.getElementById('available-only').checked;

  let books = await DLib.getBooks();

  if (query) {
    books = books.filter(function (b) {
      return b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query);
    });
  }
  if (category) {
    books = books.filter(function (b) { return b.category === category; });
  }
  if (availableOnly) {
    books = books.filter(function (b) { return b.copiesAvailable > 0; });
  }

  if (sortBy === 'title') {
    books.sort(function (a, b) { return a.title.localeCompare(b.title); });
  } else if (sortBy === 'author') {
    books.sort(function (a, b) { return a.author.localeCompare(b.author); });
  } else {
    books.sort(function (a, b) { return b.addedDate.localeCompare(a.addedDate); });
  }

  renderBooks(books);
}

function renderBooks(books) {
  const grid = document.getElementById('book-grid');
  const noResults = document.getElementById('no-results');
  const countEl = document.getElementById('results-count');

  countEl.textContent = books.length + (books.length === 1 ? ' book found' : ' books found');

  if (books.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  grid.innerHTML = books.map(function (book) { return renderBookCardHTML(book); }).join('');
  wireBookCards(grid, applyFilters);
}
