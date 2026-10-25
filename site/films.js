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
    video.addEventListener('playing',()=>{video.closest('.motion-media,.installation-media').dataset.playing='true';retryFor(video).hidden=true;});
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

  const installation=document.querySelector('#installation-film');
  const seek=document.querySelector('#installation-seek');
  const chapters=[...document.querySelectorAll('[data-installation-time]')];
  const clock=number=>'00:'+String(Math.floor(number||0)).padStart(2,'0');
  let dragging=false,pendingSeek=null;
  function updateTimeline(){
    const duration=Number.isFinite(installation.duration)?installation.duration:15;
    const time=installation.currentTime||0;
    if(!dragging)seek.value=String(time);
    seek.max=String(duration);
    document.querySelector('#installation-time').textContent=clock(time)+' / '+clock(duration);
    let active=chapters[0];
    chapters.forEach(button=>{if(time>=Number(button.dataset.installationTime))active=button;});
    chapters.forEach(button=>{button.classList.toggle('active',button===active);button.setAttribute('aria-pressed',String(button===active));});
    seek.setAttribute('aria-valuetext',`${clock(time)}. ${active.querySelector('strong').textContent}`);
  }
  function jump(time){
    load(installation);states.get(installation).manual=true;
    if(installation.readyState>=1){installation.currentTime=Math.min(time,Math.max(0,installation.duration-.05));pendingSeek=null;}
    else pendingSeek=time;
    updateTimeline();sync(installation);
  }
  installation.addEventListener('loadedmetadata',()=>{if(pendingSeek!==null)jump(pendingSeek);updateTimeline();});
  installation.addEventListener('timeupdate',updateTimeline);
  chapters.forEach(button=>button.addEventListener('click',()=>jump(Number(button.dataset.installationTime))));
  seek.addEventListener('pointerdown',()=>{dragging=true;});
  addEventListener('pointerup',()=>{dragging=false;});
  seek.addEventListener('input',()=>jump(Number(seek.value)));
})();
