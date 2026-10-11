/* Progressive enhancement: stories, videos and all article links exist in HTML. */
(() => {
  document.querySelectorAll('[data-play-video]').forEach(button => {
    const player = button.parentElement.querySelector('iframe');
    if (!player) return;
    button.hidden = false;
    player.tabIndex = -1;
    player.setAttribute('aria-hidden', 'true');
    button.addEventListener('click', () => {
      const url = new URL(player.src);
      url.searchParams.set('autoplay', '1');
      player.src = url.href;
      button.hidden = true;
      player.removeAttribute('aria-hidden');
      player.removeAttribute('tabindex');
      player.focus();
    });
  });
  document.querySelectorAll('[data-copy-link]').forEach(button => {
    button.addEventListener('click', async () => {
      const status = document.querySelector('[data-copy-status]');
      button.disabled = true;
      try {
        await navigator.clipboard.writeText(document.querySelector('link[rel="canonical"]')?.href || location.href);
        status.textContent = '記事リンクをコピーしました。';
      } catch {
        status.textContent = 'コピーできませんでした。アドレス欄のURLをコピーしてください。';
      } finally { button.disabled = false; }
    });
  });
  const chapterLinks = [...document.querySelectorAll('.desktop-contents a')];
  if (chapterLinks.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const active = entries.find(entry => entry.isIntersecting);
      if (!active) return;
      chapterLinks.forEach(link => {
        if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, {rootMargin: '-8% 0px -65% 0px'});
    document.querySelectorAll('.story-section[id]').forEach(section => observer.observe(section));
  }
  const search = document.querySelector('.archive-search');
  if (!search) return;
  const query = document.getElementById('travel-query');
  const country = document.getElementById('travel-country');
  const cards = [...document.querySelectorAll('.archive-section .post-card')];
  const topicButtons = [...document.querySelectorAll('[data-filter-topic]')];
  const status = document.querySelector('.archive-status');
  const more = document.querySelector('.archive-more');
  const moreButton = document.querySelector('[data-show-more]');
  const empty = document.querySelector('.archive-empty');
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g, ' ').trim();
  const records = cards.map(element => ({element, text: normalize(element.textContent), country: element.dataset.country, topics: element.dataset.topics.split(' '), series: element.dataset.series}));
  let topic = 'all', legacy = false, limit = 12;
  function render() {
    const words = normalize(query.value).split(' ').filter(Boolean);
    const matches = records.filter(row => (country.value === 'all' || country.value === row.country) && (topic === 'all' || row.topics.includes(topic)) && (!legacy || (row.series === 'legacy' && row.country === 'フィリピン')) && words.every(word => row.text.includes(word)));
    const visible = new Set(matches.slice(0, limit).map(row => row.element));
    cards.forEach(card => { card.hidden = !visible.has(card); });
    topicButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filterTopic === topic)));
    status.textContent = `${matches.length}件の記事 · ${Math.min(limit, matches.length)}件を表示${legacy ? ' · セブ島の初期3シリーズ' : ''}`;
    empty.hidden = matches.length !== 0;
    more.hidden = matches.length <= limit;
    moreButton.textContent = `続きを表示（残り${Math.max(0, matches.length - limit)}件）↓`;
    return matches;
  }
  function resetLimit() { legacy = false; limit = 12; render(); }
  query.addEventListener('input', resetLimit);
  country.addEventListener('change', resetLimit);
  search.addEventListener('submit', event => { event.preventDefault(); resetLimit(); });
  search.addEventListener('reset', () => {
    topic = 'all'; legacy = false; limit = 12;
    setTimeout(render, 0);
  });
  topicButtons.forEach(button => button.addEventListener('click', () => {
    topic = button.dataset.filterTopic; legacy = false; limit = 12; render();
  }));
  document.querySelector('[data-legacy-filter]')?.addEventListener('click', () => {
    topic = 'all'; country.value = 'all'; query.value = ''; legacy = true; limit = 12; render();
  });
  moreButton.addEventListener('click', () => {
    const matches = render();
    const next = matches[limit];
    limit += 12; render();
    next?.element.querySelector('h2 a')?.focus({preventScroll: true});
  });
  render();
})();
