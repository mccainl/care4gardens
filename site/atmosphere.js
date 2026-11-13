(() => {
 'use strict';
 const scene=document.querySelector('.cinematic-scene');if(!scene)return;
 const video=scene.querySelector('video'),button=scene.querySelector('button');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=false,manualPause=false,manualPlay=false,modal=false,pending=false,epoch=0;
 let pagePaused=document.body.classList.contains('motion-off');
 const eligible=()=>visible&&!document.hidden&&!manualPause&&!modal&&(!pagePaused||manualPlay)&&(!reduced.matches||manualPlay);
 const label=()=>{button.textContent=video.paused?'Beweging afspelen':'Beweging pauzeren';button.setAttribute('aria-pressed',String(!video.paused));};
 const update=()=>{
  if(!eligible()){++epoch;pending=false;video.pause();label();return;}
  if(pending||!video.paused)return;
  if(!video.src)video.src=video.dataset.src;
  pending=true;const request=++epoch;
  video.play().catch(()=>{}).finally(()=>{if(request!==epoch)return;pending=false;if(!eligible())video.pause();label();});
 };
 button.addEventListener('click',()=>{manualPause=!video.paused||pending;manualPlay=!manualPause;update();});
 video.addEventListener('playing',()=>{if(!eligible())video.pause();label();});
 video.addEventListener('pause',label);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.15}).observe(scene);
 document.addEventListener('visibilitychange',update);reduced.addEventListener('change',()=>{manualPlay=false;update();});
 document.addEventListener('care4gardens:film',e=>{modal=e.detail.open;update();});
 document.addEventListener('care4gardens:motion',e=>{pagePaused=Boolean(e.detail.paused);if(pagePaused)manualPlay=false;update();});
 video.addEventListener('error',()=>{video.hidden=true;button.hidden=true;});
 // A small camera drift while this scene is visible. Touch and reduced-motion
 // layouts keep a stable frame; scroll work is scheduled once per frame.
 let scheduled=false;
 const drift=()=>{scheduled=false;if(!visible||pagePaused||reduced.matches||innerWidth<=900)return;
  const rect=scene.getBoundingClientRect(),p=Math.max(-1,Math.min(1,(innerHeight/2-rect.top-rect.height/2)/innerHeight));
  scene.style.setProperty('--scene-drift',`${(p*24).toFixed(1)}px`);
 };
 addEventListener('scroll',()=>{if(!scheduled&&visible){scheduled=true;requestAnimationFrame(drift);}},{passive:true});
 reduced.addEventListener('change',()=>scene.style.removeProperty('--scene-drift'));
})();
