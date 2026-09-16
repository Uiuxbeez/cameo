(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('cameo-theme'); } catch (_) {}
  let explicit = saved === 'light' || saved === 'dark';
  function apply(theme) {
    root.dataset.cameoTheme = theme;
    document.querySelectorAll('.cameo-theme-toggle').forEach(button => {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
      button.title = button.getAttribute('aria-label');
      button.innerHTML = `<i class="ti ti-${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    });
  }
  apply(explicit ? saved : system.matches ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.cameoTheme);
    document.querySelectorAll('.cameo-theme-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const theme = root.dataset.cameoTheme === 'dark' ? 'light' : 'dark';
        explicit = true;
        apply(theme);
        try { localStorage.setItem('cameo-theme', theme); } catch (_) {}
      });
    });
  });
  system.addEventListener('change', event => {
    if (!explicit) apply(event.matches ? 'dark' : 'light');
  });
})();
