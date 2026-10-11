/* Progressive enhancements only: article text, photographs and links work without JS. */
(() => {
  'use strict';
  const launcher = document.querySelector('[data-video-launch]');
  const videoFrame = document.getElementById('article-video');
  const videoStatus = document.getElementById('video-status');
  if (launcher && videoFrame) {
    launcher.addEventListener('click', () => {
      const id = launcher.dataset.videoLaunch;
      if (!/^[\w-]{11}$/.test(id)) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = launcher.dataset.videoTitle;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      videoStatus.textContent = 'YouTubeプレーヤーを読み込んでいます。';
      iframe.addEventListener('load', () => {
        videoStatus.textContent = '再生できない場合は「YouTubeで見る」からご覧ください。';
      }, { once: true });
      videoFrame.replaceChildren(iframe);
      iframe.focus();
    }, { once: true });
  }
  const share = document.querySelector('[data-copy-video]');
  const shareStatus = document.getElementById('share-status');
  if (share && shareStatus) {
    share.addEventListener('click', async () => {
      share.disabled = true;
      shareStatus.textContent = 'コピーしています…';
      try {
        await navigator.clipboard.writeText(share.dataset.copyVideo);
        shareStatus.textContent = '動画のリンクをコピーしました。';
      } catch {
        shareStatus.textContent = 'コピーできませんでした。上の「YouTubeで見る」のリンクをご利用ください。';
      } finally {
        share.disabled = false;
      }
    });
  }
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.aside-toc a')];
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.isIntersecting);
      if (!entry) return;
      links.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-5% 0px -65% 0px', threshold: 0 });
    document.querySelectorAll('.story-section').forEach(section => observer.observe(section));
  }
})();
