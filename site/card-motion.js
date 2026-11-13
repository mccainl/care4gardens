(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = matchMedia('(forced-colors: active)');
  let paused = document.body.classList.contains('motion-off');
  let filmOpen = false;
  const rails = [];
  const photos = [...document.querySelectorAll('.collection-card')];
  const photoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('mcc-motion-visible', entry.isIntersecting));
  }, { threshold: .08 });
  photos.forEach(photo => photoObserver.observe(photo));

  document.querySelectorAll('.original-grid').forEach(viewport => {
    const cards = [...viewport.querySelectorAll(':scope > .original-card')];
    if (cards.length < 2) return;
    cards.at(-1).setAttribute('data-original-accessory', '');
    const track = document.createElement('div');
    const group = document.createElement('div');
    track.className = 'mcc-card-track';
    group.className = 'mcc-card-group';
    group.append(...cards);
    const duplicate = group.cloneNode(true);
    duplicate.setAttribute('aria-hidden', 'true');
    duplicate.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    duplicate.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(node => node.setAttribute('tabindex', '-1'));
    track.append(group, duplicate);
    viewport.append(track);
    viewport.classList.add('mcc-card-rail');
    viewport.setAttribute('aria-label', 'Care4Gardens in beeld');
    const hint = viewport.nextElementSibling;
    if (hint?.classList.contains('gallery-hint')) hint.textContent = 'Veeg of scroll om meer te ontdekken.';

    let visible = false, hovered = false, pointerDown = false, focused = false;
    let cycle = 0, frame = 0, last = 0, position = 0, interactionUntil = 0, wakeup = 0;
    const canMove = () => visible && !paused && !filmOpen && !document.hidden && !reduced.matches && !forcedColors.matches && !hovered && !pointerDown && !focused && performance.now() >= interactionUntil && cycle > 0;
    function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
    function start() { if (!frame && canMove()) { position = viewport.scrollLeft; frame = requestAnimationFrame(tick); } }
    function tick(time) {
      frame = 0;
      if (!canMove()) { last = 0; return; }
      const elapsed = last ? Math.min(time - last, 48) : 0;
      last = time;
      position += elapsed * .022;
      if (position >= cycle) position -= cycle;
      viewport.scrollLeft = position;
      frame = requestAnimationFrame(tick);
    }
    function sync() { canMove() ? start() : stop(); }
    function measure() {
      const width = viewport.clientWidth;
      if (!width) { cycle = 0; stop(); return; }
      const gap = parseFloat(getComputedStyle(viewport).getPropertyValue('--card-gap')) || 24;
      const size = width < 560 ? width * .84 : width < 860 ? (width - gap) / 2 : (width - gap * 2) / 3;
      viewport.style.setProperty('--card-width', `${size}px`);
      cycle = group.getBoundingClientRect().width + gap;
      position = viewport.scrollLeft % cycle;
      viewport.scrollLeft = position;
      sync();
    }
    function hold() {
      interactionUntil = performance.now() + 4000;
      stop();
      clearTimeout(wakeup);
      wakeup = setTimeout(sync, 4050);
    }
    viewport.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; sync(); } });
    viewport.addEventListener('pointerleave', () => { hovered = false; sync(); });
    viewport.addEventListener('pointerdown', () => { pointerDown = true; hold(); }, { passive: true });
    window.addEventListener('pointerup', () => { if (pointerDown) { pointerDown = false; hold(); } }, { passive: true });
    window.addEventListener('pointercancel', () => { pointerDown = false; sync(); }, { passive: true });
    viewport.addEventListener('wheel', hold, { passive: true });
    viewport.addEventListener('focusin', () => { focused = true; sync(); });
    viewport.addEventListener('focusout', () => { requestAnimationFrame(() => { focused = viewport.contains(document.activeElement); sync(); }); });
    new ResizeObserver(measure).observe(viewport);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .05 }).observe(viewport);
    rails.push({ sync, stop });
    measure();
  });
  const syncAll = () => rails.forEach(rail => rail.sync());
  document.addEventListener('care4gardens:motion', event => { paused = Boolean(event.detail.paused); syncAll(); });
  document.addEventListener('care4gardens:film', event => { filmOpen = Boolean(event.detail.open); syncAll(); });
  document.addEventListener('visibilitychange', syncAll);
  reduced.addEventListener('change', syncAll);
  forcedColors.addEventListener('change', syncAll);
  window.addEventListener('pagehide', () => rails.forEach(rail => rail.stop()));
  window.addEventListener('pageshow', syncAll);
})();
