/* Small progressive enhancement: original articles and links remain in the HTML. */
(() => {
  const root = document.documentElement;
  const nav = document.getElementById('daylight-nav');
  const toggle = document.querySelector('.daylight-menu-toggle');
  const guide = document.querySelector('.daylight-guide');
  const desktop = matchMedia('(min-width:1200px)');
  const header = document.querySelector('.daylight-header');
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-nav-backdrop';
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);
  root.classList.add('daylight-ready');
  function setMenu(open, restoreFocus = false) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    toggle.querySelector('small').textContent = open ? '閉じる' : 'メニュー';
    const mobileOpen = open && !desktop.matches;
    root.classList.toggle('mobile-nav-open', mobileOpen);
    backdrop.hidden = !mobileOpen;
    if (mobileOpen) {
      root.style.setProperty('--mobile-nav-top', `${header.getBoundingClientRect().bottom}px`);
      nav.scrollTop = 0;
    }
    if (restoreFocus) toggle.focus();
  }
  backdrop.addEventListener('click', () => setMenu(false, true));
  function syncMenu() { setMenu(false); guide.open = false; }
  toggle.hidden = false;
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  desktop.addEventListener('change', syncMenu);
  syncMenu();
  nav.addEventListener('click', event => { if (event.target.closest('a')) { setMenu(false); if (desktop.matches) guide.open = false; } });
  document.addEventListener('click', event => {
    if (!event.target.closest('.daylight-header')) setMenu(false);
    if (desktop.matches && !guide.contains(event.target)) guide.open = false;
  });
  guide.addEventListener('focusout', event => { if (desktop.matches && event.relatedTarget && !guide.contains(event.relatedTarget)) guide.open = false; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !desktop.matches && nav.classList.contains('is-open')) {
      const items = [toggle, ...nav.querySelectorAll('a, summary')].filter(el => el.getClientRects().length && (el.tagName === 'SUMMARY' || !el.closest('details:not([open])')));
      const index = items.indexOf(document.activeElement);
      event.preventDefault();
      items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
    if (event.key !== 'Escape') return;
    if (desktop.matches && guide.open) { guide.open = false; guide.querySelector('summary').focus(); }
    if (nav.classList.contains('is-open')) setMenu(false, true);
  });

  const articles = [...document.querySelectorAll('.post-card')];
  const topicControls = [...document.querySelectorAll('[data-topic]')];
  const query = document.getElementById('article-query');
  const search = document.getElementById('article-search');
  const searchToggle = document.querySelector('[data-search-toggle]');
  const status = document.querySelector('.filter-status');
  const empty = document.querySelector('.empty-state');
  const more = document.querySelector('.more-articles');
  const moreButton = document.getElementById('show-more');
  const title = document.getElementById('articles-title');
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g, ' ').trim();
  const records = articles.map(article => ({element:article,topics:article.dataset.topics.split(' '),text:normalize(article.textContent)}));
  let topic = 'all', limit = 4;
  document.querySelector('.filter-tabs').hidden = false;
  searchToggle.hidden = false;
  function render(announce = false) {
    const terms = normalize(query.value).split(' ').filter(Boolean);
    const matches = records.filter(record => (topic === 'all' || record.topics.includes(topic)) && terms.every(term => record.text.includes(term)));
    const visible = new Set(matches.slice(0, limit).map(record => record.element));
    articles.forEach(article => { article.hidden = !visible.has(article); });
    topicControls.forEach(control => {
      const active = control.dataset.topic === topic;
      if (control.tagName === 'BUTTON') control.setAttribute('aria-pressed', String(active));
      else if (active) control.setAttribute('aria-current', 'true');
      else control.removeAttribute('aria-current');
    });
    const remaining = Math.max(0, matches.length - limit);
    more.hidden = remaining === 0;
    moreButton.innerHTML = `続きを読む（残り${remaining}件） <span aria-hidden="true">↓</span>`;
    empty.hidden = matches.length > 0;
    status.hidden = !announce && topic === 'all' && !terms.length;
    if (!status.hidden) status.textContent = `${matches.length}件の記事 · ${Math.min(limit, matches.length)}件を表示`;
    return matches;
  }
  topicControls.forEach(control => control.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    topic = control.dataset.topic; limit = 4;
    render(true);
    if (control.tagName === 'A') title.focus({preventScroll:true});
  }));
  query.addEventListener('input', () => { limit = 4; render(true); });
  search.addEventListener('submit', event => { event.preventDefault(); limit = 4; render(true); title.focus({preventScroll:true}); });
  searchToggle.addEventListener('click', () => {
    setMenu(false);
    search.hidden = !search.hidden;
    searchToggle.setAttribute('aria-expanded', String(!search.hidden));
    if (!search.hidden) { query.focus({preventScroll:true}); search.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}); }
    else { query.value = ''; limit = 4; render(true); }
  });
  document.querySelector('.clear-search').addEventListener('click', () => { query.value = ''; limit = 4; render(true); query.focus(); });
  document.querySelector('[data-reset-filters]').addEventListener('click', () => { topic = 'all'; query.value = ''; limit = 4; render(true); title.focus({preventScroll:true}); });
  moreButton.addEventListener('click', () => {
    const matches = render();
    const firstNew = matches[limit]?.element;
    limit += 4;
    render(true);
    firstNew?.querySelector('.post-content > a')?.focus({preventScroll:true});
  });
  render();
})();
