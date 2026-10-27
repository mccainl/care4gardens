(() => {
  'use strict';
  const video = document.querySelector('#intro-film');
  if (!video) return;
  const sound = document.querySelector('#intro-sound');
  const status = document.querySelector('#intro-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, modalOpen = false, manualPause = false;
  let automaticPause = true, finished = false, soundHeard = false;
  let playPending = false;

  function updateSound() {
    sound.textContent = video.muted ? (soundHeard ? 'Geluid aan' : 'Luister vanaf het begin') : 'Geluid uit';
    sound.setAttribute('aria-pressed', String(!video.muted));
    status.textContent = finished ? 'Bekijk de film opnieuw met de afspeelknop.'
      : video.muted ? 'De film speelt zonder geluid. Zet het geluid aan voor de uitleg.'
      : 'Overkappingen en glazen schuifwanden. Care4Gardens maakt buitenleven mooier.';
  }
  function pauseAutomatically() {
    automaticPause = true;
    video.pause();
  }
  async function playVisible() {
    if (!visible || document.hidden || modalOpen || manualPause || finished || reduced.matches) {
      pauseAutomatically();
      return;
    }
    if (playPending) return;
    playPending = true;
    try {
      await video.play();
    } catch (error) {
      if (error.name === 'NotAllowedError' && !video.muted) {
        video.muted = true;
        updateSound();
        // Browsers that require a gesture can still show the whole film inline.
        if (visible && !document.hidden && !modalOpen) {
          try { await video.play(); } catch { status.textContent = 'Tik op afspelen om de film te bekijken.'; }
        }
      } else if (error.name !== 'AbortError') {
        status.textContent = 'Tik op afspelen om de film te bekijken.';
      }
    } finally {
      playPending = false;
      if (!visible || document.hidden || modalOpen) pauseAutomatically();
    }
  }
  video.loop = false;
  video.muted = false;
  video.addEventListener('playing', () => {
    automaticPause = false;
    manualPause = false;
    finished = false;
    if (!video.muted) soundHeard = true;
    updateSound();
  });
  video.addEventListener('pause', () => {
    if (!automaticPause && !video.ended) manualPause = true;
  });
  video.addEventListener('ended', () => { finished = true; updateSound(); });
  video.addEventListener('volumechange', updateSound);
  video.addEventListener('error', () => { status.textContent = 'De film kon niet laden. Probeer de pagina opnieuw te openen.'; });
  sound.addEventListener('click', () => {
    const enable = video.muted;
    if (enable && !soundHeard) video.currentTime = 0;
    video.muted = !enable;
    if (enable) {
      manualPause = false;
      if (finished) { video.currentTime = 0; finished = false; }
      // Call play inside the gesture, including for reduced-motion visitors.
      video.play().catch(() => { status.textContent = 'Tik op afspelen om de film te bekijken.'; });
    }
    updateSound();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.35;
    playVisible();
  }, { threshold: 0.35 }).observe(video);
  document.addEventListener('visibilitychange', playVisible);
  document.addEventListener('care4gardens:film', event => {
    modalOpen = event.detail.open;
    if (!modalOpen && event.detail.introduction) {
      video.currentTime = event.detail.time;
      video.muted = event.detail.muted;
      finished = event.detail.ended;
      if (!video.muted) soundHeard = true;
      updateSound();
    }
    playVisible();
  });
  reduced.addEventListener('change', playVisible);
  // No loop and no automatic replay: the closing words get a complete ending.
  updateSound();
})();
