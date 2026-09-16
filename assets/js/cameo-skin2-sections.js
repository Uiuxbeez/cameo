document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.s2-portfolio');
  if (!section) return;
  const buttons = section.querySelectorAll('[data-filter]');
  const cards = section.querySelectorAll('[data-category]');
  const grid = section.querySelector('.s2-project-grid');
  if (!grid) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let revision = 0;
  const applyFilter = (category) => {
    cards.forEach((card) => {
      card.hidden = category !== 'All' && card.dataset.category !== category;
    });
    grid.classList.toggle('is-filtered', category !== 'All');
  };
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      if (button.getAttribute('aria-pressed') === 'true') return;
      const currentRevision = ++revision;
      const category = button.dataset.filter;
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      grid.getAnimations().forEach((animation) => animation.cancel());
      if (reducedMotion.matches || !grid.animate) {
        applyFilter(category);
        return;
      }
      const oldHeight = grid.getBoundingClientRect().height;
      const fadeOut = grid.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 160, easing: 'ease-out', fill: 'forwards'
      });
      try {
        await fadeOut.finished;
      } catch {
        return; // A newer selection replaces this transition.
      }
      if (revision !== currentRevision) return;
      applyFilter(category);
      const newHeight = grid.getBoundingClientRect().height;
      fadeOut.cancel();
      grid.animate([
        { height: `${oldHeight}px`, opacity: 0, transform: 'translateY(10px)', overflow: 'hidden' },
        { height: `${newHeight}px`, opacity: 1, transform: 'translateY(0)', overflow: 'hidden' }
      ], { duration: 380, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    });
  });
});
