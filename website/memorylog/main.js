/**
 * Memory Log - Cinematic Scroll Experience
 * Refined for a calmer, more sentimental feel.
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
                // Calculate scroll progress (0 to 1) across the viewport
                const scrollPercent = (viewportHeight - rect.top) / (viewportHeight + rect.height);

                // Reduced movement range for a subtle, "floating" feel rather than "moving"
                const translateY = (scrollPercent - 0.5) * 30;

                // Removed dynamic scaling to prevent "dizzying" zoom effects
                // Just applying the gentle vertical float
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

    // --- Fade in content on scroll (Slow & Emotional) ---
    const contents = document.querySelectorAll('.section-content, .interlude blockquote');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Gently reveal
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    contents.forEach(el => {
        // Initial state: Hidden and slightly shifted down
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)'; // Less travel distance for calmness
        // Long, smooth transition for memory-like emergence
        el.style.transition = 'opacity 1.8s ease-out, transform 1.8s cubic-bezier(0.2, 0.8, 0.2, 1)';

        observer.observe(el);
    });

});

