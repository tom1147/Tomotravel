/**
 * Memory Log - Cinematic Scroll Experience
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Parallax for Cinematic Sections ---
    const sections = document.querySelectorAll('.cinematic-section, .split-item');

    function parallax() {
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const bg = section.querySelector('.section-bg img');

            if (bg && rect.top < viewportHeight && rect.bottom > 0) {
                const scrollPercent = (viewportHeight - rect.top) / (viewportHeight + rect.height);
                const translateY = (scrollPercent - 0.5) * 60;
                bg.style.transform = `scale(1.05) translateY(${translateY}px)`;
            }
        });
    }

    // Throttle scroll events
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                parallax();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Initial call
    parallax();

    // --- Fade in content on scroll ---
    const contents = document.querySelectorAll('.section-content, .interlude blockquote');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    });

    contents.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'opacity 1s ease, transform 1s ease';
        observer.observe(el);
    });

});
