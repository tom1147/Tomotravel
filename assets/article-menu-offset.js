/* Keep legacy article titles below the fixed header when navigation wraps. */
(() => {
  function initialize() {
    const header = document.getElementById('header');
    const wrapper = document.querySelector('.blog-page-wrapper');
    if (!header || !wrapper || getComputedStyle(header).position !== 'fixed') return;
    const root = document.documentElement;
    let frame = 0;
    let lastWidth = 0;
    let reservedHeight = 0;
    function measure() {
      frame = 0;
      if (lastWidth !== innerWidth) { reservedHeight = 0; lastWidth = innerWidth; }
      reservedHeight = Math.max(reservedHeight, Math.ceil(header.getBoundingClientRect().height));
      wrapper.style.removeProperty('padding-top');
      const declared = parseFloat(getComputedStyle(root).getPropertyValue(innerWidth >= 992 ? '--header-height-desktop' : '--header-height-mobile')) || 0;
      const existingGap = Math.max(0, parseFloat(getComputedStyle(wrapper).paddingTop) - declared);
      wrapper.style.paddingTop = `${reservedHeight + existingGap}px`;
      root.style.scrollPaddingTop = `${reservedHeight + 16}px`;
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(measure); }
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(header);
    addEventListener('resize', schedule, { passive: true });
    document.fonts?.ready.then(schedule);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
