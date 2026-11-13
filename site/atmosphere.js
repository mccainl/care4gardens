(() => {
 'use strict';
 const scene=document.querySelector('.cinematic-scene');if(!scene)return;
 const video=scene.querySelector('video'),button=scene.querySelector('button');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=false,manual=false,modal=false;
 const update=()=>{const play=visible&&!document.hidden&&!manual&&!modal&&!reduced.matches;
  if(play){if(!video.src)video.src=video.dataset.src;video.play().catch(()=>{button.textContent='Film afspelen';});}else video.pause();
  button.textContent=play?'Beweging pauzeren':'Beweging afspelen';button.setAttribute('aria-pressed',String(play));};
 button.addEventListener('click',()=>{manual=!manual;if(reduced.matches){if(video.paused){if(!video.src)video.src=video.dataset.src;video.play().catch(()=>{});button.textContent='Beweging pauzeren';button.setAttribute('aria-pressed','true');}else{video.pause();button.textContent='Beweging afspelen';button.setAttribute('aria-pressed','false');}}else update();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.15}).observe(scene);
 document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
 document.addEventListener('care4gardens:film',e=>{modal=e.detail.open;update();});
 video.addEventListener('error',()=>{video.hidden=true;button.hidden=true;});
})();
