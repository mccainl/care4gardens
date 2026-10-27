(() => {
  'use strict';
  const videos=[...document.querySelectorAll('[data-loop-film]')];
  if(!videos.length)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused=reduced.matches,expanded=false;
  const states=new Map(videos.map(video=>[video,{visible:false,manual:false,loaded:false}]));
  const retryFor=video=>document.querySelector(`[data-retry-video="${video.id}"]`);
  function load(video){
    const state=states.get(video);
    if(state.loaded)return;
    state.loaded=true;video.muted=true;video.defaultMuted=true;video.src=video.dataset.src;
  }
  function mayPlay(video){const state=states.get(video);return state.visible&&!document.hidden&&!expanded&&(!motionPaused||state.manual);}
  function sync(video){
    if(!mayPlay(video)){video.pause();return;}
    load(video);
    video.play().then(()=>{if(!mayPlay(video))video.pause();else retryFor(video).hidden=true;}).catch(error=>{
      if(mayPlay(video)&&error.name!=='AbortError')retryFor(video).hidden=false;
    });
  }
  const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>{
    states.get(entry.target).visible=entry.isIntersecting;
    sync(entry.target);
  }),{threshold:.12});
  const preload=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){load(entry.target);preload.unobserve(entry.target);}
  }),{rootMargin:'250px'});
  videos.forEach(video=>{
    video.muted=true;video.defaultMuted=true;
    visibility.observe(video);preload.observe(video);
    video.addEventListener('loadeddata',()=>sync(video));
    video.addEventListener('playing',()=>{video.closest('.motion-media').dataset.playing='true';retryFor(video).hidden=true;});
    video.addEventListener('error',()=>{const retry=retryFor(video);retry.textContent='Film opnieuw laden';retry.hidden=false;});
    video.addEventListener('timeupdate',()=>{
      const progress=video.closest('.motion-card')?.querySelector('.motion-progress span');
      if(progress&&Number.isFinite(video.duration))progress.style.transform=`scaleX(${video.currentTime/video.duration})`;
    });
    retryFor(video).addEventListener('click',()=>{
      const state=states.get(video);state.manual=true;
      if(video.error){state.loaded=false;video.removeAttribute('src');}
      sync(video);
    });
  });
  const syncAll=()=>videos.forEach(sync);
  document.addEventListener('visibilitychange',syncAll);
  document.addEventListener('care4gardens:film',e=>{expanded=e.detail.open;syncAll();});
  document.addEventListener('care4gardens:motion',e=>{motionPaused=e.detail.paused;syncAll();});
  reduced.addEventListener('change',e=>{motionPaused=e.matches;syncAll();});

})();
