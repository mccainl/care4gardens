(() => {
  'use strict';
  document.querySelectorAll('[data-customer-post]').forEach(button => {
    button.addEventListener('click', () => {
      const player = button.closest('.customer-player');
      const frame = document.createElement('iframe');
      frame.src = 'https://www.instagram.com/reel/' + button.dataset.customerPost + '/embed/';
      frame.title = 'Care4Gardens klantverhaal: ' + button.dataset.storyTitle;
      frame.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      player.replaceChildren(frame);
      player.classList.add('is-embedded');
    }, {once: true});
  });
})();
