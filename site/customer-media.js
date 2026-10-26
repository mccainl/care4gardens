(() => {
  'use strict';
  const videos = [...document.querySelectorAll('[data-customer-video]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, expanded = false;
  const visible = new Set();
  const button = v => v.parentElement.querySelector('button');
  function mute(v) { v.muted = true; button(v).textContent = 'Luister naar het verhaal'; button(v).setAttribute('aria-pressed','false'); }
  function sync(v) {
    if (!visible.has(v) || document.hidden || expanded || paused) { v.pause(); mute(v); return; }
    if (!v.getAttribute('src')) v.src = v.dataset.src;
    v.play().catch(() => { button(v).textContent = 'Verhaal afspelen'; });
  }
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
    sync(e.target);
  }), {threshold: 0.25});
  videos.forEach(v => {
    v.muted = true; observer.observe(v);
    button(v).addEventListener('click', () => {
      const listen = v.muted;
      videos.forEach(mute);
      if (listen) { paused = false; v.currentTime = 0; v.muted = false; button(v).textContent = 'Geluid uit'; button(v).setAttribute('aria-pressed','true'); }
      sync(v);
    });
    v.addEventListener('error', () => { v.closest('article').querySelector('.customer-fallback').hidden = false; });
  });
  const syncAll = () => videos.forEach(sync);
  document.addEventListener('visibilitychange',syncAll);
  document.addEventListener('care4gardens:motion',e => { paused = e.detail.paused; syncAll(); });
  document.addEventListener('care4gardens:film',e => { expanded = e.detail.open; syncAll(); });
  reduced.addEventListener('change',e => { paused = e.matches; syncAll(); });
})();
