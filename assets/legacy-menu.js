// The blog also calls this after loading its shared header as a fragment.
export function initLegacyMenu() {
  const button = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  if (!button || !nav) return;

  const icon = button.querySelector('i');
  const mobile = window.matchMedia('(max-width: 768px)');
  function setOpen(open) {
    nav.classList.toggle('active', open);
    nav.inert = mobile.matches && !open;
    document.documentElement.classList.toggle('legacy-menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    icon.classList.toggle('fa-bars', !open);
    icon.classList.toggle('fa-times', open);
  }

  function closeIfOutside(event) {
    if (nav.classList.contains('active') && !button.contains(event.target) && !nav.contains(event.target)) {
      setOpen(false);
    }
  }
  setOpen(false);
  button.addEventListener('click', () => setOpen(!nav.classList.contains('active')));
  nav.addEventListener('click', event => {
    if (event.target.closest('a[href]') && nav.classList.contains('active')) setOpen(false);
  });
  document.addEventListener('click', closeIfOutside);
  document.addEventListener('focusin', closeIfOutside);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('active')) {
      setOpen(false);
      button.focus();
    }
  });
  mobile.addEventListener('change', () => {
    const focusInNav = nav.contains(document.activeElement);
    setOpen(false);
    if (mobile.matches && focusInNav) button.focus();
  });
}
