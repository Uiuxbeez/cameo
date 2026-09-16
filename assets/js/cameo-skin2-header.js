(() => {
    const header = document.querySelector('.s2-header');
    if (!header) return;
    const topRow = document.querySelector('.hero-section-one > .header-top');
    const updateHeader = () => {
        const scrolled = window.scrollY > 10;
        header.classList.toggle('is-scrolled', scrolled);
        if (topRow) topRow.hidden = scrolled;
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('pageshow', updateHeader);
})();
