/* Lightweight, event-driven journey motion. No render loop or 3D runtime. */
(() => {
  const atlas = document.getElementById('journey-atlas');
  const svg = atlas?.querySelector('.journey-route');
  const path = svg?.querySelector('path');
  if (!atlas || !svg || !path) return;
  const stages = [...atlas.querySelectorAll('.journey-stage')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  progress.classList.add('journey-route-progress');
  svg.append(progress);
  const animations = new Set();
  let frame = 0;
  let active = -1;
  let length = 0;
  let points = [];
  function paintProgress() {
    progress.style.opacity = active < 0 ? '0' : '1';
    if (!length || active < 0) return;
    // The curve is monotonic vertically. Locate the marker once per section change.
    let low = 0, high = length;
    const target = points[active]?.y ?? 0;
    for (let i = 0; i < 14; i++) {
      const mid = (low + high) / 2;
      if (path.getPointAtLength(mid).y < target) low = mid;
      else high = mid;
    }
    progress.style.strokeDasharray = `${length} ${length}`;
    progress.style.strokeDashoffset = String(length - high);
  }
  function setActive(index) {
    if (index === active) return;
    active = index;
    stages.forEach((stage, i) => {
      stage.classList.toggle('is-current', i === index);
      stage.classList.toggle('is-reached', i <= index);
    });
    document.querySelectorAll('#main-nav a[href^="#"]').forEach(link => {
      if (link.hash === '#' + stages[index]?.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    paintProgress();
  }
  function draw() {
    frame = 0;
    const parent = atlas.getBoundingClientRect();
    points = [...atlas.querySelectorAll('.journey-marker')].map(marker => {
      const box = marker.getBoundingClientRect();
      return {x:box.left-parent.left+box.width/2,y:box.top-parent.top+box.height/2};
    });
    if (!points.length) return;
    svg.setAttribute('viewBox', `0 0 ${parent.width} ${parent.height}`);
    let d = `M ${points[0].x} 0 L ${points[0].x} ${points[0].y}`;
    points.forEach((p,index)=>{
      if (!index) return;
      const previous=points[index-1];
      const span=p.y-previous.y;
      const sway=Math.min(24,parent.width*.03)*(index%2?1:-1);
      d+=` C ${previous.x+sway} ${previous.y+span*.34}, ${p.x+sway} ${p.y-span*.34}, ${p.x} ${p.y}`;
    });
    path.setAttribute('d',d);
    progress.setAttribute('d',d);
    length = path.getTotalLength();
    paintProgress();
  }
  function schedule(){ if(!frame) frame=requestAnimationFrame(draw); }
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(atlas);
  window.addEventListener('resize',schedule,{passive:true});
  atlas.addEventListener('toggle', event => {
    schedule();
    const detail = event.target;
    if (detail.tagName !== 'DETAILS' || !detail.open || motion.matches || document.hidden) return;
    [...detail.children].filter(child => child.tagName !== 'SUMMARY').forEach(child => {
      if (typeof child.animate !== 'function') return;
      const animation = child.animate([{opacity:0, transform:'translateY(4px)'}, {opacity:1, transform:'none'}], {duration:220, easing:'cubic-bezier(.16,1,.3,1)'});
      animations.add(animation);
      animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    });
  }, true);
  if ('IntersectionObserver' in window) {
    const inView = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => inView.set(entry.target, entry.isIntersecting));
      const candidates = stages.filter(stage => inView.get(stage));
      if (candidates.length) setActive(stages.indexOf(candidates[candidates.length - 1]));
    }, {rootMargin:'-20% 0px -55% 0px', threshold:0});
    stages.forEach(stage => observer.observe(stage));
  }
  motion.addEventListener('change', () => {
    if (motion.matches) animations.forEach(animation => animation.cancel());
  });
  document.fonts?.ready.then(schedule);
  draw();
})();
