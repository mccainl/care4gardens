const shell=document.querySelector('#veranda-studio');
if(shell){
 let launched=false;
 const observer=new IntersectionObserver(async entries=>{
  if(!entries.some(e=>e.isIntersecting)||launched)return;
  launched=true;observer.disconnect();
  try{const {createStudio}=await import('./studio.bundle.js?v=3');await createStudio(shell);}
  catch(error){shell.dataset.failed='true';document.querySelector('#studio-status').textContent='Bekijk de sfeerbeelden hieronder';console.warn('The 3D preview is unavailable; photographic comparisons remain available.',error);}
 },{rootMargin:'350px'});
 observer.observe(shell);
}
