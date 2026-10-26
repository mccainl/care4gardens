(() => {
 'use strict';
 const root=document.getElementById('visual-configurator');
 if(!root||!window.Care4GardensModel)return;
 const KEY='care4gardens-design-v1';
 // Exact public answer labels from Care4Gardens' existing Reuzenpanda form.
 const options={
  color:['Crème','Antraciet','Zwart'],gutter:['Rechte goot','Halfronde goot'],
  roof:['Polycarbonaat Opaal','Polycarbonaat Helder','Helder Glas','Opaal Glas','Getint Glas'],
  front:['Open voorkant','Glazen schuifwanden helder glas','Glazen schuifwanden getint glas','Schuifpui','Zip-screen'],
  left:['Open linkerzijde','Zijwand glas & deur','Zijwand geheel glas','Zijwand geheel polycarbonaat','Zijwand aluminium & glazen spie','Zijwand aluminium & polycarbonaat spie','Schuifpui & glazen spie','Schuifpui & polycarbonaat spie','Glazen schuifwanden & glazen spie','Glazen schuifwanden & polycarbonaat spie','Spie glas','Spie polycarbonaat','Zip-screen & glazen spie'],
  right:['Open rechterzijde','Zijwand glas & deur','Zijwand geheel glas','Zijwand geheel polycarbonaat','Zijwand aluminium & glazen spie','Zijwand aluminium & polycarbonaat spie','Schuifpui & glazen spie','Schuifpui & polycarbonaat spie','Glazen schuifwanden & glazen spie','Glazen schuifwanden & polycarbonaat spie','Spie glas','Spie polycarbonaat','Zip-screen & glazen spie'],
  shade:['Geen zonwering','Bovendak-zonwering','Onderdak-zonwering'],
  light:['Geen verlichting','Koud wit','Warm wit','Dimbaar warm wit'],install:['Ja','Nee']
 };
 let state={color:'Antraciet',gutter:options.gutter[0],roof:'Helder Glas',width:500,depth:300,front:options.front[0],left:options.left[0],right:options.right[0],shade:options.shade[0],light:options.light[0],install:'Ja'};
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved&&typeof saved==='object'){
   for(const key of Object.keys(options))if(options[key].includes(saved[key]))state[key]=saved[key];
   if(Number.isInteger(saved.width)&&saved.width>=300&&saved.width<=1200)state.width=saved.width;
   const max=state.roof.startsWith('Polycarbonaat')?400:600;
   if(Number.isInteger(saved.depth)&&saved.depth>=200&&saved.depth<=max)state.depth=saved.depth;
  }
 }catch{}
 let step=0,frontView=false,viewer=null,launching=false;
 const steps=[['Uitstraling','Uw stijl. Uw buitenruimte.','Begin met de kleur en de lijn van uw overkapping.'],['Dak','Licht, precies zoals u wilt.','Kies het materiaal dat bij uw buitenruimte past.'],['Afmetingen','Maak ruimte voor uw plannen.','Pas de maten aan en zie de verhoudingen veranderen.'],['Wanden','Open. Of heerlijk beschut.','Kies per zijde hoe u uw buitenruimte wilt afsluiten.'],['Comfort','De details maken het verschil.','Voeg zonwering, verlichting en montage toe.'],['Uw ontwerp','Dit wordt uw buitenplek.','Bekijk uw keuzes en ga verder met uw persoonlijke aanvraag.']];
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
 root.innerHTML=`<div class="atelier-scene"><div class="atelier-scene-top"><span class="atelier-wordmark">CARE4GARDENS ATELIER</span><button type="button" class="atelier-expand" aria-label="Vergroot het 3D-model" aria-expanded="false"><span>Vergroot</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button></div><div class="atelier-model" id="atelier-model" tabindex="0" role="img" aria-describedby="atelier-gesture"></div><p class="atelier-gesture" id="atelier-gesture">Uw 3D-model wordt voorbereid</p><div class="atelier-scene-footer"><p class="atelier-spec"><strong id="atelier-size"></strong><span id="atelier-finish"></span></p><div class="atelier-view" role="group" aria-label="Aanzicht"><button type="button" data-angle="perspective" aria-pressed="true">Perspectief</button><button type="button" data-angle="front" aria-pressed="false">Voorzijde</button></div></div><p class="atelier-caption">Ruimtelijke impressie. Details en uitvoering stemmen we persoonlijk met u af.</p></div><div class="atelier-panel"><nav class="atelier-progress" aria-label="Stappen van uw ontwerp"></nav><p class="atelier-step-count"></p><h3 id="atelier-title" tabindex="-1"></h3><p class="atelier-description"></p><form id="atelier-form" novalidate><div class="atelier-fields"></div><p class="atelier-error" role="alert" hidden></p><div class="atelier-controls"><button type="button" class="atelier-back" hidden>Terug</button><button type="submit" class="atelier-next">Verder ${arrow}</button><button type="button" id="load-configurator" class="atelier-submit" aria-controls="quote-embed" aria-expanded="false" hidden>Verder met aanvraag ${arrow}</button></div></form><p class="atelier-trust">Vrijblijvend samenstellen. Persoonlijk advies.</p></div>`;
 const fields=root.querySelector('.atelier-fields'),model=root.querySelector('#atelier-model'),form=root.querySelector('form');
 const submit=root.querySelector('#load-configurator'),next=root.querySelector('.atelier-next'),back=root.querySelector('.atelier-back'),error=root.querySelector('.atelier-error');
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 function updateModel(){
  if(viewer)viewer.update(state);else model.innerHTML=window.Care4GardensModel(state,frontView);
  scene.querySelector('#atelier-size').textContent=`${(state.width/100).toLocaleString('nl-NL',{minimumFractionDigits:2})} × ${(state.depth/100).toLocaleString('nl-NL',{minimumFractionDigits:2})} m`;
  scene.querySelector('#atelier-finish').textContent=`${state.color} · ${state.roof.toLowerCase()}`;
 }
 function radios(key,cls,content){return `<div class="${cls}">${options[key].map((v,i)=>`<label class="atelier-choice"><input type="radio" name="${key}" value="${esc(v)}" ${state[key]===v?'checked':''}><span class="atelier-card">${content(v,i)}</span></label>`).join('')}</div>`;}
 function select(key,label,small=''){return `<label class="atelier-select"><span>${label}${small?`<small>${small}</small>`:''}</span><select name="${key}" aria-label="${label}">${options[key].map(v=>`<option ${state[key]===v?'selected':''} value="${esc(v)}">${key==='install'?(v==='Ja'?'Graag met montage':'Ik monteer zelf'):esc(v)}</option>`).join('')}</select></label>`;}
 function dimensions(key,label,min,max){return `<div class="atelier-dimension"><div class="atelier-dimension-head"><label for="atelier-${key}">${label}</label><span class="atelier-number"><input id="atelier-${key}" name="${key}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" value="${state[key]}" required aria-describedby="${key}-limits"><span>cm</span></span></div><input type="range" data-range="${key}" min="${min}" max="${max}" step="1" value="${state[key]}" aria-label="${label} aanpassen"><span id="${key}-limits" class="atelier-dimension-limits"><span>${min} cm</span><span>${max} cm</span></span></div>`;}
 function summary(){return [['Kleur & profiel',`${state.color} · ${state.gutter.toLowerCase()}`],['Dak',state.roof],['Afmetingen',`${state.width} × ${state.depth} cm`],['Voorzijde',state.front],['Linkerzijde',state.left],['Rechterzijde',state.right],['Zonwering',state.shade],['Verlichting',state.light],['Montage',state.install==='Ja'?'Met montage':'Zelf monteren']];}
 function summaryText(){return 'Care4Gardens ontwerp\n'+summary().map(([k,v])=>`${k}: ${v}`).join('\n');}
 function render(focus=false){
  root.querySelector('.atelier-progress').innerHTML=steps.map(([label],i)=>`<button type="button" data-step-link="${i}" aria-label="Stap ${i+1}: ${label}" ${i===step?'aria-current="step"':''} class="${i<step?'done':''}"></button>`).join('');
  root.querySelector('.atelier-step-count').textContent=`0${step+1} / 06 — ${steps[step][0]}`;
  root.querySelector('#atelier-title').textContent=steps[step][1];root.querySelector('.atelier-description').textContent=steps[step][2];
  if(step===0)fields.innerHTML=`<fieldset><legend>Kleur van het aluminium</legend>${radios('color','atelier-swatches',(v,i)=>`<i class="atelier-swatch" style="--swatch:${['#e4dfcf','#3e4948','#242a28'][i]}" aria-hidden="true"></i><b>${v}</b><small>RAL ${['9001','7016','9005'][i]}</small>`)}</fieldset><fieldset><legend>De afwerking van uw goot</legend>${radios('gutter','atelier-gutters',(v,i)=>`<svg viewBox="0 0 80 40" aria-hidden="true"><path d="M10 8h45l13 8H23Z" fill="#8c9982"/><path d="${i?'M23 16h45v4c0 17-45 17-45 0Z':'M23 16h45v17H23Z'}" fill="#4e6048"/><path d="M10 8v17l13 8V16Z" fill="#b1b9a5"/></svg><b>${v}</b>`)}</fieldset>`;
  if(step===1)fields.innerHTML=radios('roof','atelier-roofs',(v,i)=>`<i class="atelier-roof-sample ${i<2?'poly ':''}${v.toLowerCase().includes('opaal')?'opal ':''}${i===4?'tint':''}" aria-hidden="true"></i><b>${esc(v)}</b>`)+`<p class="atelier-note">Glas: tot 600 cm diep. Polycarbonaat: tot 400 cm diep.</p>`;
  if(step===2)fields.innerHTML=dimensions('width','Breedte',300,1200)+dimensions('depth','Diepte',200,state.roof.startsWith('Polycarbonaat')?400:600)+`<p class="atelier-note">Een eerste inschatting is voldoende. De definitieve maten worden bij het advies gecontroleerd.</p>`;
  if(step===3)fields.innerHTML=select('front','Voorzijde')+select('left','Linkerzijde','Vanuit de tuin gezien')+select('right','Rechterzijde','Vanuit de tuin gezien');
  if(step===4)fields.innerHTML=select('shade','Zonwering')+select('light','Verlichting')+select('install','Montage');
  if(step===5)fields.innerHTML=`<dl class="atelier-summary">${summary().map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="atelier-note">Uw keuzes gaan mee naar de bestaande calculator. Controleer daar uw maten en keuzes en vul uw contactgegevens in. U verzendt pas bij de laatste bevestiging.</p>`;
  back.hidden=step===0;next.hidden=step===5;submit.hidden=step!==5;error.hidden=true;
  updateModel();if(focus)root.querySelector('#atelier-title').focus({preventScroll:true});
 }
 function validate(){
  if(step!==2)return true;
  for(const key of ['width','depth']){
   const input=form.elements.namedItem(key);
   if(!input.checkValidity()){
    error.textContent=`Vul voor ${key==='width'?'de breedte':'de diepte'} een heel aantal centimeters in tussen ${input.min} en ${input.max}.`;
    error.hidden=false;input.setAttribute('aria-invalid','true');input.focus();return false;
   }
  }
  error.hidden=true;return true;
 }
 root.addEventListener('input',e=>{
  const el=e.target,key=el.dataset.range||el.name;
  if(key==='width'||key==='depth'){
   const n=Number(el.value),max=key==='width'?1200:state.roof.startsWith('Polycarbonaat')?400:600,min=key==='width'?300:200;
   if(!Number.isInteger(n)||n<min||n>max)return;
   state[key]=n;form.elements.namedItem(key).value=n;form.elements.namedItem(key).removeAttribute('aria-invalid');root.querySelector(`[data-range="${key}"]`).value=n;error.hidden=true;save();updateModel();
  }
 });
 root.addEventListener('change',e=>{
  const key=e.target.name,value=e.target.value;if(!options[key]?.includes(value))return;
  state[key]=value;
  if(key==='roof'&&value.startsWith('Polycarbonaat')&&state.depth>400){state.depth=400;error.textContent='Voor dit dak is de diepte aangepast naar maximaal 400 cm.';error.hidden=false;}
  save();updateModel();
 });
 const scene=root.querySelector('.atelier-scene');
 root.addEventListener('click',e=>{
  const link=e.target.closest('[data-step-link]');if(link&&validate()){step=Number(link.dataset.stepLink);render(true);}
 });
 function go(nextStep){step=nextStep;render(true);if(matchMedia('(max-width: 720px)').matches)root.scrollIntoView?.({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 form.addEventListener('submit',e=>{e.preventDefault();if(validate()&&step<5)go(step+1);});
 back.addEventListener('click',()=>go(Math.max(0,step-1)));
 submit.addEventListener('click',()=>{
  const prefill={'Goot':state.gutter,'Kleur ':state.color,'Materiaal dak':state.roof,'Breedte':String(state.width),'Diepte':String(state.depth),'Type zonwering':state.shade,'Type voorkant':state.front,'Type linkerzijde':state.left,'Type rechterzijde':state.right,'Type verlichting':state.light,'Laten monteren?':state.install,'Overige opmerkingen':summaryText()};
  root.dispatchEvent(new CustomEvent('care4gardens:request-quote',{bubbles:true,detail:{prefill,summary:summaryText()}}));
 });
 const dialog=document.createElement('dialog');dialog.className='atelier-lightbox';dialog.setAttribute('aria-label','Uw overkapping in 3D');document.body.append(dialog);
 const sceneSpace=document.createElement('div');sceneSpace.className='atelier-scene-placeholder';sceneSpace.setAttribute('aria-hidden','true');
 const expand=scene.querySelector('.atelier-expand');
 const modelStatus=scene.querySelector('#atelier-gesture');
 scene.addEventListener('click',e=>{
  const angle=e.target.closest('[data-angle]');
  if(angle){frontView=angle.dataset.angle==='front';scene.querySelectorAll('[data-angle]').forEach(b=>b.setAttribute('aria-pressed',String(b===angle)));if(viewer)viewer.setView(angle.dataset.angle);else updateModel();}
 });
 expand.addEventListener('click',()=>{
  if(dialog.open){dialog.close();return;}
  sceneSpace.style.minHeight=scene.getBoundingClientRect().height+'px';scene.replaceWith(sceneSpace);dialog.append(scene);dialog.showModal();document.body.classList.add('atelier-zoomed');expand.setAttribute('aria-expanded','true');expand.setAttribute('aria-label','Terug naar uw ontwerp');expand.querySelector('span').textContent='Terug';
 });
 dialog.addEventListener('close',()=>{sceneSpace.replaceWith(scene);document.body.classList.remove('atelier-zoomed');expand.setAttribute('aria-expanded','false');expand.setAttribute('aria-label','Vergroot het 3D-model');expand.querySelector('span').textContent='Vergroot';expand.focus({preventScroll:true});});
 async function launch(){
  if(launching)return;launching=true;
  try{const {createConfigurator3D}=await import('./studio.bundle.js?v=3');viewer=createConfigurator3D(model,state);modelStatus.textContent='Sleep om te draaien · knijp om te zoomen';}
  catch(error){launching=false;model.dataset.ready='false';modelStatus.textContent='Het 3D-model is nog niet geladen. Tik om opnieuw te proberen.';console.warn('3D model could not be loaded',error);}
 }
 model.addEventListener('pointerdown',()=>{if(!viewer)launch();});
 const modelObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){modelObserver.disconnect();launch();}},{rootMargin:'200px'});modelObserver.observe(model);
 root.hidden=false;render();
 const section=document.getElementById('offerte');
 const visibility=new IntersectionObserver(entries=>document.body.classList.toggle('calculator-in-view',entries.some(e=>e.isIntersecting)),{rootMargin:'-10% 0px -12% 0px',threshold:0});visibility.observe(section);
})();
