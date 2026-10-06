/* Homepage behavior: accessible navigation, optional poster, native form routing. */
(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  const guide = nav?.querySelector('.nav-guide');
  const desktop = window.matchMedia('(min-width: 1200px)');
  const header = document.getElementById('header');
  const menuLabel = toggle?.querySelector('.menu-label');
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-nav-backdrop';
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);
  root.classList.add('cinematic-ready');

  function setMenu(open, returnFocus = false) {
    if (!toggle || !nav) return;
    nav.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    if (menuLabel) menuLabel.textContent = open ? '閉じる' : 'メニュー';
    const mobileOpen = open && !desktop.matches;
    root.classList.toggle('mobile-nav-open', mobileOpen);
    backdrop.hidden = !mobileOpen;
    if (mobileOpen) {
      root.style.setProperty('--mobile-nav-top', `${header.getBoundingClientRect().bottom}px`);
      nav.scrollTop = 0;
    }
    if (returnFocus) toggle.focus();
  }
  backdrop.addEventListener('click', () => setMenu(false, true));
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) {
      setMenu(false);
      if (desktop.matches && guide) guide.open = false;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !desktop.matches && nav?.classList.contains('active')) {
      const items = [toggle, ...nav.querySelectorAll('a, summary')].filter(el => el.getClientRects().length && (el.tagName === 'SUMMARY' || !el.closest('details:not([open])')));
      const index = items.indexOf(document.activeElement);
      event.preventDefault();
      items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
    if (event.key === 'Escape' && desktop.matches && guide?.open) {
      guide.open = false;
      guide.querySelector('summary').focus();
    }
    if (event.key === 'Escape' && nav?.classList.contains('active')) setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (nav?.classList.contains('active') && !event.target.closest('#header')) setMenu(false);
    if (desktop.matches && guide?.open && !guide.contains(event.target)) guide.open = false;
  });
  guide?.addEventListener('focusout', event => {
    if (desktop.matches && event.relatedTarget && !guide.contains(event.relatedTarget)) guide.open = false;
  });
  function syncNavigation() {
    setMenu(false);
    // Keep secondary destinations folded until requested; native details works without JS.
    if (guide) guide.open = false;
  }
  desktop.addEventListener('change', syncNavigation);
  syncNavigation();

  // Preserve native hash URLs/history; move keyboard focus to the destination as well.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const id = link.getAttribute('href').slice(1);
    const destination = document.getElementById(id);
    if (!destination) return;
    if (!destination.hasAttribute('tabindex')) destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
  });

  const poster = document.querySelector('.video-poster');
  const frame = document.querySelector('#videos iframe');
  if (poster && frame) {
    // Preserve the embed URL in rendered HTML. Native lazy loading handles bandwidth;
    // discovering the video must not depend on someone clicking the poster.
    const source = frame.getAttribute('src');
    frame.hidden = false;
    frame.tabIndex = -1;
    poster.hidden = false;
    poster.addEventListener('click', () => {
      frame.src = source + '&autoplay=1';
      frame.allow += '; autoplay';
      frame.hidden = false;
      frame.tabIndex = 0;
      poster.hidden = true;
      frame.focus();
    }, { once: true });
  }

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('image-reveal');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.article-card').forEach(card => observer.observe(card));
  }

  // Existing Netlify success destination is unchanged; no simulated submission or new service.
  if (new URLSearchParams(window.location.search).get('success') === 'true') {
    const thankYou = document.getElementById('thank-you-page');
    const main = document.getElementById('main-content');
    if (thankYou && main) {
      main.hidden = true;
      thankYou.style.display = 'flex';
      const heading = thankYou.querySelector('h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
})();
