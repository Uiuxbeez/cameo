(() => {
    const hero = document.querySelector('.cameo-hero-slider');
    if (!hero) return;
    const slides = Array.from(hero.querySelectorAll(':scope > .tab-content > .tab-pane'));
    const fill = hero.querySelector('.cameo-hero-progress > span');
    if (!fill || slides.length < 2) return;

    const duration = 6000;
    let index = Math.max(0, slides.findIndex(slide => slide.classList.contains('active')));
    let elapsed = 0;
    let previousTime = null;

    function tick(time) {
        if (previousTime !== null) elapsed += time - previousTime;
        previousTime = time;

        // Leave the completed line painted for one frame before advancing.
        if (elapsed > duration && fill.style.transform === 'scaleX(1)') {
            slides[index].classList.remove('active', 'show');
            index = (index + 1) % slides.length;
            slides[index].classList.add('active', 'show');
            elapsed = 0;
        }
        fill.style.transform = `scaleX(${Math.min(elapsed / duration, 1)})`;
        requestAnimationFrame(tick);
    }

    // Background tabs resume from the same point instead of skipping slides.
    document.addEventListener('visibilitychange', () => { previousTime = null; });
    requestAnimationFrame(tick);
})();
