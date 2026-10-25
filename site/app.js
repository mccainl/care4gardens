(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const labels = {aluminium:'Aluminium overkappingen',douglas:'Douglas & maatwerk',glas:'Glazen schuifwanden',screens:'Screens & zonwering',accessoires:'Accessoires'};
  const escape = text => String(text ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = number => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:Number.isInteger(number)?0:2}).format(number);
  const icons={play:'<path d="m9 5 11 7-11 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',sound:'<path d="m11 5-6 4H2v6h3l6 4ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',muted:'<path d="m11 5-6 4H2v6h3l6 4ZM16 9l6 6m0-6-6 6"/>'};
  const icon=name=>`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reduced.matches;
  let manualStoryY = null;
  let lastStage = -1;
  const header = $('#header');
  const heroVideo=$('.hero-video'),soundButton=$('#hero-sound'),startButton=$('#hero-start');
  let heroVisible=true,filmOpen=false,heroSound=false;
  const story = $('.story-section');
  function syncSound(){
    if(!heroVideo||!soundButton)return;
    heroVideo.muted=!heroSound;
    soundButton.innerHTML=icon(heroSound?'sound':'muted')+`<span class="control-label">${heroSound?'Geluid uitschakelen':'Geluid inschakelen'}</span>`;
    soundButton.setAttribute('aria-pressed',String(heroSound));
    soundButton.setAttribute('aria-label',heroSound?'Geluid uitschakelen':'Geluid inschakelen');
  }
  function syncHeroVideo(){
    if(!heroVideo)return;
    if(motionPaused||!heroVisible||filmOpen||document.hidden){heroVideo.pause();return;}
    heroVideo.play().then(()=>{if(startButton)startButton.hidden=true;}).catch(()=>{if(startButton)startButton.hidden=false;});
  }
  function applyMotion(){
    document.body.classList.toggle('motion-off',motionPaused);
    document.documentElement.classList.toggle('js-motion',!motionPaused);
    document.dispatchEvent(new CustomEvent('care4gardens:motion',{detail:{paused:motionPaused}}));
    syncHeroVideo();
  }
  if(heroVideo){heroVideo.muted=true;heroVideo.defaultMuted=true;}
  applyMotion();syncSound();
  heroVideo?.addEventListener('playing',()=>{heroVideo.classList.add('playing');if(startButton)startButton.hidden=true;});
  heroVideo?.addEventListener('error',()=>{heroVideo.classList.remove('playing');if(startButton){startButton.hidden=false;startButton.querySelector('span').textContent='Film opnieuw laden';}});
  if(heroVideo)new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncHeroVideo();},{threshold:.08}).observe(heroVideo);
  document.addEventListener('visibilitychange',()=>{
    syncHeroVideo();
    if(filmOpen){const activeFilm=$('#brand-film');if(document.hidden)activeFilm.pause();else activeFilm.play().catch(()=>{});}
  });
  soundButton?.addEventListener('click',()=>{heroSound=!heroSound;syncSound();if(heroSound){motionPaused=false;heroVideo.currentTime=0;applyMotion();}syncHeroVideo();});
  startButton?.addEventListener('click',()=>{motionPaused=false;if(heroVideo.error)heroVideo.load();applyMotion();});
  reduced.addEventListener('change',e=>{motionPaused=e.matches;applyMotion();});
  const revealObserver = new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting)entry.target.classList.add('is-visible');
    else if(entry.boundingClientRect.top>innerHeight)entry.target.classList.remove('is-visible');
  }),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
  $$('.reveal').forEach((el,i)=>{if(el.parentElement?.classList.contains('collection-grid'))el.style.transitionDelay=`${(i%2)*80}ms`;revealObserver.observe(el);});
  const stageDescriptions=['Een overkapping geeft uw buitenleven een eigen plek.','Glazen schuifwanden sluiten de ruimte af. Uw uitzicht blijft.','Een warme avondimpressie. Meer tijd voor de momenten die tellen.'];
  function setStage(stage){
    if(!story)return;
    story.style.setProperty('--glass',stage>0?'1':'0');story.style.setProperty('--evening',stage===2?'1':'0');
    if(lastStage!==stage){lastStage=stage;$('#story-description').textContent=stageDescriptions[stage];$$('[data-stage]').forEach(b=>{const active=Number(b.dataset.stage)===stage;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
  }
  $$('[data-stage]').forEach(b=>b.addEventListener('click',()=>{manualStoryY=scrollY;setStage(Number(b.dataset.stage));}));
  let scrollScheduled=false;
  function updateScroll(){
    scrollScheduled=false;header?.classList.toggle('scrolled',scrollY>30);
    const available=document.documentElement.scrollHeight-innerHeight;
    document.documentElement.style.setProperty('--progress',`${available>0?scrollY/available*100:0}%`);
    if(story&&!motionPaused){
      const rect=story.getBoundingClientRect();const fraction=Math.min(1,Math.max(0,(77-rect.top)/Math.max(1,rect.height-innerHeight+77)));
      if(manualStoryY!==null&&Math.abs(scrollY-manualStoryY)>90)manualStoryY=null;
      if(manualStoryY===null)setStage(fraction<.32?0:fraction<.7?1:2);
      story.style.setProperty('--story-scale',String(1+fraction*.035));
    }
  }
  addEventListener('scroll',()=>{if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(updateScroll);}},{passive:true});
  updateScroll();
  const menu=$('#mobile-menu'),menuButton=$('.menu-toggle');
  function closeMenu(){menu?.classList.remove('open');if(menu)menu.inert=true;menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Menu openen');document.body.classList.remove('locked');}
  menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menu.classList.toggle('open',open);menu.inert=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Menu sluiten':'Menu openen');document.body.classList.toggle('locked',open);});
  $$('a',menu||document.createElement('div')).forEach(a=>a.addEventListener('click',closeMenu));
  addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(e.key==='Tab'&&menu?.classList.contains('open')){const focusable=[menuButton,...$$('a',menu)];const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  addEventListener('resize',()=>{if(innerWidth>900)closeMenu();});
  const filmDialog=$('#film-dialog'),film=$('#brand-film');
  $$('[data-film]').forEach(b=>b.addEventListener('click',()=>{filmOpen=true;heroVideo?.pause();filmDialog.showModal();document.body.classList.add('locked');film.currentTime=0;film.muted=false;film.play().catch(()=>{});}));
  const filmSound=$('#film-sound');
  function syncFilmSound(){if(!filmSound)return;filmSound.innerHTML=icon(film.muted?'muted':'sound')+`<span>${film.muted?'Geluid inschakelen':'Geluid uitschakelen'}</span>`;filmSound.setAttribute('aria-pressed',String(!film.muted));filmSound.setAttribute('aria-label',film.muted?'Filmgeluid inschakelen':'Filmgeluid uitschakelen');}
  filmSound?.addEventListener('click',()=>{film.muted=!film.muted;syncFilmSound();});
  if(filmDialog){
    syncFilmSound();
    film.addEventListener('volumechange',syncFilmSound);
    $('.dialog-close',filmDialog).addEventListener('click',()=>filmDialog.close());
    filmDialog.addEventListener('click',e=>{const r=filmDialog.getBoundingClientRect();if(e.target===filmDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))filmDialog.close();});
    filmDialog.addEventListener('close',()=>{film.pause();filmOpen=false;document.body.classList.remove('locked');syncHeroVideo();});
  }
  const comparisons={aluminium:['01_aluminium','een aluminium overkapping'],douglas:['02_douglas','een Douglas overkapping'],glas:['03_glass_sliding_wall','glazen schuifwanden'],compact:['05_compact_veranda','een compacte veranda']};
  const range=$('#compare-range');
  range?.addEventListener('input',()=>$('.comparison').style.setProperty('--split',`${range.value}%`));
  $$('[data-compare]').forEach(b=>b.addEventListener('click',()=>{
    const [file,description]=comparisons[b.dataset.compare];$('#compare-before').src=`assets/${file}_before.webp`;$('#compare-after').src=`assets/${file}_after.webp`;$('#compare-before').alt=`Voor: ${description}, open`;
    $('#compare-after').alt=`Na: ${description}, afgesloten met glas`;range.value='50';$('.comparison').style.setProperty('--split','50%');
    $$('[data-compare]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});
  }));
  const comfortCaptions={open:'Open. Licht. Verbonden.',closed:'Beschut, met alle ruimte voor uitzicht.',screen:'Schaduw, precies waar u wilt.',evening:'Nog lang niet naar binnen.'};
  $$('[data-comfort]').forEach(b=>b.addEventListener('click',()=>{$('.comfort-visual').dataset.mode=b.dataset.comfort;$('#comfort-caption').textContent=comfortCaptions[b.dataset.comfort];$$('[data-comfort]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});}));
  // A browser-local brief. Nothing is submitted to a server by this concept.
  const planner=$('#planner-form');let currentStep=0,brief='';
  function showStep(step){
    currentStep=step;$$('[data-step]').forEach(el=>el.hidden=Number(el.dataset.step)!==step);$$('.planner-progress span').forEach((el,i)=>el.classList.toggle('active',i<=step));
    $('#plan-back').hidden=step!==1;$('#plan-next').hidden=step===2;$('#plan-reset').hidden=step!==2;$('#plan-next').innerHTML=step===1?'Bekijk uw tuinplan':'Volgende stap';
    $('#plan-error').textContent='';
    if(step===1){const cat=new FormData(planner).get('category');$('#depth-label').textContent=['glas','screens'].includes(cat)?'Hoogte in cm':'Diepte in cm';}
  }
  function createBrief(){
    const d=new FormData(planner);const cat=d.get('category');const second=['glas','screens'].includes(cat)?'Hoogte':'Diepte';
    const pairs=[['Uw idee',labels[cat]],['Afmetingen',`${d.get('width')?d.get('width')+' cm breed':'Breedte nog te bepalen'} · ${d.get('depth')?d.get('depth')+' cm '+second.toLowerCase():second+' nog te bepalen'}`],['Montage',d.get('installation')],['Interesse in',d.getAll('extra').join(', ')||'Persoonlijk advies'],['Uw wensen',d.get('notes')?.trim()||'Nog te bespreken']];
    $('#plan-summary').innerHTML='<dl>'+pairs.map(([key,value])=>`<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')+'</dl>';
    brief='Mijn tuinplan voor Care4Gardens\n\n'+pairs.map(([key,value])=>`${key}: ${value}`).join('\n')+'\n\nGraag ontvang ik vrijblijvend advies over de mogelijkheden en een passende offerte.\n\nNaam:\nTelefoon:\nPostcode:\n\nSamengesteld via het MCC websiteconcept. Afmetingen zijn indicatief; uitvoering en prijs moeten worden bevestigd.';
    $('#email-plan').href=`mailto:info@care4gardens.nl?subject=${encodeURIComponent('Mijn tuinplan | vrijblijvend advies')}&body=${encodeURIComponent(brief)}`;
  }
  if(planner){
    planner.addEventListener('submit',e=>e.preventDefault());
    $('#plan-next').addEventListener('click',()=>{if(currentStep===1){const inputs=$$('input[type=number]',planner);if(inputs.some(i=>!i.checkValidity())){$('#plan-error').textContent='Controleer de afmetingen. Vul een waarde binnen het aangegeven bereik in, of laat het veld leeg.';inputs.find(i=>!i.checkValidity())?.reportValidity();return;}createBrief();}showStep(currentStep+1);});
    $('#plan-back').addEventListener('click',()=>showStep(0));$('#plan-reset').addEventListener('click',()=>showStep(0));
    $('#download-plan').addEventListener('click',()=>{const blob=new Blob([brief],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Mijn-Care4Gardens-tuinplan.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);});
    $$('[data-plan-category]').forEach(a=>a.addEventListener('click',()=>{$(`input[name=category][value="${a.dataset.planCategory}"]`,planner).checked=true;showStep(0);}));
    const params=new URLSearchParams(location.search);if(labels[params.get('plan')]){const input=$(`input[name=category][value="${params.get('plan')}"]`,planner);if(input)input.checked=true;}
  }
  $('#studio-to-plan')?.addEventListener('click',()=>{
    const studio=$('#veranda-studio');if(!studio||!planner)return;
    $('input[name=category][value="aluminium"]',planner).checked=true;
    const glass=$('input[name=extra][value="Glazen schuifwanden"]',planner);if(glass)glass.checked=true;
    const notes=$('textarea[name=notes]',planner);
    const preference=`Interesse in de ontwerpstudio: ${studio.dataset.finish==='stone'?'zandkleur':'antraciet'} frame, glazen schuifwanden${studio.dataset.light==='evening'?', warme verlichting':''}. Graag advies over beschikbare uitvoeringen.`;
    if(notes&&!notes.value.includes('Interesse in de ontwerpstudio:'))notes.value=(notes.value?notes.value+'\n':'')+preference;
    showStep(0);
  });
  // Catalogue and exact Shopify variant selection, using the audited public snapshot.
  if(!$('#product-grid'))return;
  const params=new URLSearchParams(location.search);let category=labels[params.get('categorie')]?params.get('categorie'):'all';let products=[],limit=12;
  const grid=$('#product-grid'),status=$('#catalogue-count'),dialog=$('#product-dialog');let activeProduct=null;
  function filtered(){
    const query=$('#product-search').value.trim().toLocaleLowerCase('nl');const width=$('#width-filter').value;
    let list=products.filter(p=>(category==='all'||p.category===category)&&(!query||p.title.toLocaleLowerCase('nl').includes(query))&&(!width||String(p.width)===width));
    const sort=$('#product-sort').value;if(sort==='price-desc')list.sort((a,b)=>b.price-a.price);else if(sort==='name')list.sort((a,b)=>a.title.localeCompare(b.title,'nl'));else if(sort==='price-asc')list.sort((a,b)=>a.price-b.price);else{const order={aluminium:0,glas:1,screens:2,accessoires:3};list.sort((a,b)=>order[a.category]-order[b.category]||a.price-b.price);}
    return list;
  }
  function render(){
    const list=filtered();status.textContent=`${list.length} ${list.length===1?'product':'producten'}${category!=='all'?' · '+labels[category]:''}`;
    $$('[data-category]').forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('#width-filter').disabled=category!=='aluminium';
    grid.innerHTML=list.slice(0,limit).map(p=>`<button class="product-card" data-product="${escape(p.id)}" aria-label="Bekijk ${escape(p.title)}"><div class="product-photo"><img src="${escape(p.images[0]||'assets/01_aluminium_after.webp')}" width="600" height="480" loading="lazy" alt="${escape(p.title)}"></div><p class="product-category">${escape(labels[p.category])}</p><h3>${escape(p.title.replace('Terrasoverkapping ','').replace('Zonwering Ritsscreen Met Afstandsbediening tot ','Ritsscreen tot ').replace(' Breedte Met Montage',' breed'))}</h3><p class="product-price"><small>Vanaf</small>${money(p.price)}</p><p class="product-meta">${p.variants.length} ${p.variants.length===1?'uitvoering':'uitvoeringen'} · Bekijk mogelijkheden</p></button>`).join('');
    if(!list.length)grid.innerHTML='<div class="empty-state"><h3>Even anders zoeken?</h3><p>Er zijn geen producten met deze combinatie van filters.</p><button class="text-link" id="clear-filters">Wis de filters </button></div>';
    $('#load-more').hidden=list.length<=limit;
    $('#shown-count').textContent=`${Math.min(limit,list.length)} van ${list.length} weergegeven`;
  }
  function categoryChange(cat){category=cat;limit=12;$('#width-filter').value='';render();const url=new URL(location.href);if(cat==='all')url.searchParams.delete('categorie');else url.searchParams.set('categorie',cat);url.searchParams.delete('product');history.replaceState({},'',url);}
  $$('[data-category]').forEach(b=>b.addEventListener('click',()=>categoryChange(b.dataset.category)));
  ['product-search','width-filter','product-sort'].forEach(id=>$('#'+id).addEventListener(id==='product-search'?'input':'change',()=>{limit=12;render();}));
  $('#load-more').addEventListener('click',()=>{limit+=12;render();});
  grid.addEventListener('click',e=>{const card=e.target.closest('[data-product]');if(card)openProduct(card.dataset.product);if(e.target.closest('#clear-filters')){$('#product-search').value='';categoryChange('all');}});
  function updateVariant(){
    const choices=$$('.variant-select',dialog).map(s=>s.value);const v=activeProduct.variants.find(v=>choices.every((choice,i)=>v.options[i]===choice));
    $('#detail-price').textContent=v?money(v.price):'Op aanvraag';$('#variant-status').textContent=v?(v.available?'Beschikbaar volgens de catalogusopname. Controleer de actuele status in de webshop.':'Deze uitvoering was niet beschikbaar bij de catalogusopname.'):'Deze combinatie is niet beschikbaar.';
    const buy=$('#original-product');buy.href=activeProduct.url+(v?'?variant='+v.id:'');buy.textContent='Bekijk deze uitvoering in de webshop ';
    buy.setAttribute('aria-disabled',String(!v));if(!v)buy.removeAttribute('href');
  }
  function openProduct(id){
    const p=products.find(p=>p.id===id);if(!p)return;activeProduct=p;
    $('#detail-content').innerHTML=`<div class="product-detail"><div class="detail-gallery"><img id="detail-image" src="${escape(p.images[0])}" alt="${escape(p.title)}"><div class="detail-thumbs">${p.images.map((src,i)=>`<button data-image="${i}" class="${i===0?'active':''}" aria-label="Productafbeelding ${i+1}"><img src="${escape(src)}" alt=""></button>`).join('')}</div></div><div class="detail-copy"><p class="product-category">${escape(labels[p.category])}</p><h2 id="product-title">${escape(p.title)}</h2><p class="detail-price" id="detail-price"></p><p class="detail-price-note">Prijs uit de catalogus van 25 oktober 2026.</p>${p.options.filter(o=>o.name!=='Title').map((o,i)=>`<label class="variant-label">${escape(o.name)}<select class="variant-select" data-option="${i}">${o.values.map(v=>`<option>${escape(v)}</option>`).join('')}</select></label>`).join('')}<div class="detail-action"><a class="button button-dark" id="original-product" target="_blank" rel="noopener"></a><a class="text-link" href="./?plan=${p.category}#samenstellen">Bespreek uw wensen </a></div><p class="form-note" id="variant-status"></p><div class="detail-spec"><p>${p.category==='aluminium'?'Selecteer de gewenste verlichting. Bespreek overige opties en montage tijdens uw adviesgesprek.':p.category==='glas'?'Controleer de opening, hoogte en ondergrond vóór bestelling. Selecteer hierboven levering met of zonder montage.':p.category==='screens'?'Kies de kleur en hoogte. Dit product wordt in de broncatalogus aangeboden met afstandsbediening en montage.':'Controleer voor bestelling of dit onderdeel geschikt is voor uw schuifwandsysteem.'}</p><details><summary>Productinformatie uit de webshop</summary><p class="source-description">${escape(p.description)}</p></details></div></div></div>`;
    $$('.variant-select',dialog).forEach(s=>s.addEventListener('change',updateVariant));
    $$('[data-image]',dialog).forEach(b=>b.addEventListener('click',()=>{$('#detail-image').src=p.images[Number(b.dataset.image)];$$('[data-image]',dialog).forEach(x=>x.classList.toggle('active',x===b));}));
    updateVariant();dialog.showModal();document.body.classList.add('locked');
    const url=new URL(location.href);url.searchParams.set('product',p.id);history.replaceState({},'',url);
  }
  $('.dialog-close',dialog).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('locked');const url=new URL(location.href);url.searchParams.delete('product');history.replaceState({},'',url);});
  fetch('catalogue.json').then(r=>{if(!r.ok)throw new Error('catalogue');return r.json();}).then(data=>{
    products=data.products;const widths=[...new Set(products.map(p=>p.width).filter(Boolean))].sort((a,b)=>a-b);$('#width-filter').innerHTML='<option value="">Alle breedtes</option>'+widths.map(w=>`<option value="${w}">${String(w).replace('.',',')} meter</option>`).join('');render();if(params.get('product'))openProduct(params.get('product'));
  }).catch(()=>{status.textContent='De collectie kon niet worden geladen.';grid.innerHTML='<div class="empty-state"><h3>Bekijk de collectie in de webshop.</h3><p>De lokale catalogus is op dit moment niet beschikbaar.</p><a class="text-link" href="https://care4gardens.nl/collections/all">Naar Care4Gardens </a></div>';$('#load-more').hidden=true;});
})();
