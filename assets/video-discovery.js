/* Video navigation measurement uses the site's existing GA4 setup. */
document.addEventListener('click', function (event) {
  if (!['tomotravel-pm.com', 'www.tomotravel-pm.com'].includes(window.location.hostname)) return;
  const link = event.target.closest('a[data-video-id]');
  if (!link || typeof window.gtag !== 'function') return;
  const id = link.dataset.videoId;
  if (!/^[\w-]{11}$/.test(id)) return;
  window.gtag('event', 'video_link_click', {
    video_id: id,
    destination: link.dataset.videoPlatform || 'site',
    source_page: window.location.pathname
  });
});

if (document.body.classList.contains('video-page')) {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    const setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.setAttribute('aria-controls', 'main-nav');
    setOpen(false);
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    toggle.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(!nav.classList.contains('is-open'));
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener('click', function (event) { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('click', function (event) { if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false); });
  }
}
