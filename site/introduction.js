(() => {
  'use strict';
  const video = document.querySelector('#intro-film');
  if (!video) return;
  const hero = video.closest('.hero');
  const pause = document.querySelector('#hero-pause');
  const sound = document.querySelector('#intro-sound');
  const captions = document.querySelector('#intro-captions');
  const status = document.querySelector('#intro-status');
  const copy = hero.querySelector('.hero-content');
  const expanded = document.querySelector('#brand-film');
  const progress = hero.querySelector('.hero-film-progress span');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 601px)');
  const rect = hero.getBoundingClientRect();
  let visible = rect.bottom > 0 && rect.top < innerHeight;
  let modalOpen = false, modalIntroduction = false, manualPause = false;
  let finished = false, heard = false, userStarted = false, failed = false;
  let pending = false, epoch = 0, captionsChoice = null;
  const paths = {play:'M9 5l11 7-11 7Z',pause:'M8 5v14M16 5v14',replay:'M4 10a8 8 0 1 1 1 8M4 4v6h6'};

  function eligible() {
    return visible && !document.hidden && !modalOpen && !manualPause && !finished && (!reduced.matches || userStarted);
  }
  function updateCaptions() {
    const show = captionsChoice ?? video.muted;
    for (const track of video.textTracks) if (track.kind === 'captions') track.mode = show ? 'showing' : 'hidden';
    captions.setAttribute('aria-pressed', String(show));
    captions.setAttribute('aria-label', show ? 'Ondertiteling uitschakelen' : 'Ondertiteling inschakelen');
  }
  function updateCopy() {
    const quiet = desktop.matches && !reduced.matches && !video.paused && !finished && !failed && video.currentTime > 4 && !copy.contains(document.activeElement);
    hero.classList.toggle('film-view', quiet);
    copy.inert = quiet;
  }
  function update() {
    const label = failed ? 'Film opnieuw laden' : finished ? 'Film opnieuw afspelen' : video.paused ? 'Film afspelen' : 'Film pauzeren';
    pause.innerHTML = `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[finished ? 'replay' : video.paused ? 'play' : 'pause']}"></path></svg><span class="control-label">${label}</span>`;
    pause.setAttribute('aria-label', label);
    sound.textContent = video.muted ? 'Geluid aan' : 'Geluid uit';
    sound.setAttribute('aria-pressed', String(!video.muted));
    sound.setAttribute('aria-label', video.muted && !heard ? 'Film vanaf het begin met geluid afspelen' : video.muted ? 'Filmgeluid inschakelen' : 'Filmgeluid uitschakelen');
    status.textContent = failed ? 'De film kon niet laden. Probeer opnieuw met de afspeelknop.'
      : finished ? 'De film is afgelopen. U kunt hem opnieuw afspelen.'
      : video.paused ? 'Film gepauzeerd.'
      : video.muted ? (heard ? 'De film speelt zonder geluid.' : 'De film speelt zonder geluid. Geluid aan start de uitleg vanaf het begin.')
      : 'De introductiefilm speelt met Nederlandse uitleg.';
    updateCaptions();
    updateCopy();
  }
  function pauseForPage() {
    ++epoch;
    pending = false;
    video.pause();
    update();
  }
  function seek(time) {
    try { video.currentTime = time; } catch { /* Metadata may arrive after the first play request. */ }
  }
  async function play() {
    if (!eligible()) { pauseForPage(); return; }
    if (pending) return;
    pending = true;
    const request = ++epoch;
    const attemptedAudible = !video.muted;
    try {
      await video.play();
    } catch (error) {
      if (error.name === 'NotAllowedError' && attemptedAudible && request === epoch && eligible()) {
        video.muted = true;
        update();
        try { await video.play(); } catch (fallback) {
          if (fallback.name !== 'AbortError' && request === epoch) manualPause = true;
        }
      } else if (error.name !== 'AbortError' && request === epoch) manualPause = true;
    } finally {
      if (request === epoch) {
        pending = false;
        if (!eligible()) video.pause();
        update();
      }
    }
  }
  function restart() { finished = false; seek(0); }
  video.controls = false;
  video.loop = false;
  video.muted = false;
  seek(0);
  video.addEventListener('playing', () => {
    if (!eligible()) { video.pause(); return; }
    failed = false;
    hero.classList.add('film-ready');
    video.classList.add('playing');
    if (!video.muted) heard = true;
    update();
  });
  video.addEventListener('pause', () => {
    if (eligible() && !pending && !video.ended) manualPause = true;
    update();
  });
  video.addEventListener('ended', () => { finished = true; update(); });
  video.addEventListener('volumechange', update);
  video.addEventListener('loadedmetadata', updateCaptions);
  video.addEventListener('error', () => {
    failed = true; manualPause = true; video.classList.remove('playing'); update();
  });
  video.addEventListener('timeupdate', () => {
    progress.style.transform = `scaleX(${Number.isFinite(video.duration) && video.duration > 0 ? Math.min(1, video.currentTime / video.duration) : 0})`;
    updateCopy();
  });
  pause.addEventListener('click', () => {
    if (!video.paused && !finished) { manualPause = true; pauseForPage(); return; }
    if (failed) { failed = false; video.load(); }
    if (finished) restart();
    manualPause = false; userStarted = true;
    play();
  });
  sound.addEventListener('click', () => {
    const enable = video.muted;
    if (enable && (!heard || finished)) restart();
    video.muted = !enable;
    if (enable) { ++epoch; pending = false; manualPause = false; userStarted = true; play(); }
    update();
  });
  captions.addEventListener('click', () => { captionsChoice = !(captionsChoice ?? video.muted); updateCaptions(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .1;
    play();
  }, {threshold:.1}).observe(hero);
  document.addEventListener('visibilitychange', play);
  document.addEventListener('care4gardens:film', event => {
    const detail = event.detail;
    modalOpen = detail.open;
    if (detail.open) { modalIntroduction = detail.introduction; pauseForPage(); return; }
    if (detail.introduction) {
      video.muted = detail.muted;
      finished = !!detail.ended;
      manualPause = !finished && !!detail.paused;
      seek(detail.time);
      userStarted = true;
    }
    modalIntroduction = false;
    play();
  });
  function expandedSound() {
    if (!modalOpen || !modalIntroduction || expanded.muted) return;
    if (!heard) expanded.currentTime = 0;
    if (!expanded.paused) heard = true;
  }
  expanded.addEventListener('volumechange', expandedSound);
  expanded.addEventListener('playing', expandedSound);
  reduced.addEventListener('change', () => { userStarted = false; play(); });
  desktop.addEventListener('change', updateCopy);
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    ++epoch; pending = false; restart(); manualPause = false; userStarted = false; heard = false;
    const box = hero.getBoundingClientRect(); visible = box.bottom > 0 && box.top < innerHeight;
    play();
  });
  // Start at entry, without waiting for a scroll event or opening another player.
  update();
  play();
})();
