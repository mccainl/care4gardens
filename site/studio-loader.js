const shell=document.querySelector('#veranda-studio');
function photoStudio(shell){
 const viewport=shell.querySelector('.studio-viewport');
 shell.dataset.fallback='photo';shell.dataset.finish='anthracite';shell.dataset.light='day';shell.dataset.glass='0';
 viewport.querySelectorAll('canvas').forEach(canvas=>canvas.remove());
 viewport.setAttribute('aria-label','Sfeerweergave van dezelfde veranda met open of gesloten glazen wanden');
 const open=document.createElement('img');open.className='studio-photo-open';open.src='assets/01_aluminium_before.webp';open.alt='Dezelfde veranda, open zonder glazen afsluiting';viewport.prepend(open);
 const tone=document.createElement('div');tone.className='studio-photo-tone';tone.setAttribute('aria-hidden','true');viewport.append(tone);
 const poster=shell.querySelector('.studio-poster'),range=shell.querySelector('#studio-glass');
 const status=shell.querySelector('#studio-status');status.textContent='Sfeerweergave · ontdek open en beschut';
 document.querySelector('#studio .section-intro').textContent='Schuif van open naar beschut. Ontdek het verschil in dezelfde tuin en kies de sfeer van daglicht of een warme avond.';
 const updateGlass=()=>{poster.style.opacity=String(1-Number(range.value)/100);shell.dataset.glass=range.value;range.setAttribute('aria-valuetext',Number(range.value)===0?'Volledig gesloten':Number(range.value)===100?'Volledig open':`${range.value}% open`);};
 range.addEventListener('input',updateGlass);updateGlass();
 shell.querySelectorAll('[data-light]').forEach(button=>button.addEventListener('click',()=>{
  shell.dataset.light=button.dataset.light;
  shell.querySelectorAll('[data-light]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
 }));
}
if(shell){
 let launched=false;
 const observer=new IntersectionObserver(async entries=>{
  if(!entries.some(e=>e.isIntersecting)||launched)return;
  launched=true;observer.disconnect();
  try{const {createStudio}=await import('./studio.bundle.js?v=3');await createStudio(shell);}
  catch(error){photoStudio(shell);console.warn('WebGL unavailable. Interactive photographic studio enabled.',error);}
 },{rootMargin:'350px'});
 observer.observe(shell);
}
