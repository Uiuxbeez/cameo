(() => {
  const gallery = document.querySelector('.ca-project-gallery');
  if (!gallery) return;
  const cards = Array.from(document.getElementById('project-cards').content.children);
  const grid = document.getElementById('project-results');
  const buttons = gallery.querySelectorAll('[data-filter]');
  const more = document.getElementById('load-projects');
  const status = gallery.querySelector('.ca-project-status');
  const batchSize = 6;
  let matching = cards;
  let shown = 0;
  function loadMore() {
    const batch = matching.slice(shown, shown + batchSize);
    grid.append(...batch.map(card => card.cloneNode(true)));
    shown += batch.length;
    more.hidden = shown >= matching.length;
    status.textContent = matching.length ? `Showing ${shown} of ${matching.length} projects` : 'No projects in this category yet.';
    if (typeof lightbox !== 'undefined') lightbox.reload();
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    matching = cards.filter(card => button.dataset.filter === 'All' || card.dataset.category === button.dataset.filter);
    shown = 0;
    grid.replaceChildren();
    loadMore();
  }));
  more.addEventListener('click', loadMore);
  loadMore();
  // Load only in response to downward scrolling, never an initial intersection
  // or a layout change after appending cards.
  let lastScrollY = window.scrollY;
  let scrollPending = false;
  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    const movingDown = currentY > lastScrollY;
    lastScrollY = currentY;
    if (!movingDown || scrollPending || more.hidden) return;
    scrollPending = true;
    window.requestAnimationFrame(() => {
      scrollPending = false;
      const bottom = grid.getBoundingClientRect().bottom;
      if (!more.hidden && bottom > 0 && bottom <= window.innerHeight + 100) {
        loadMore();
      }
    });
  }, { passive: true });
})();
