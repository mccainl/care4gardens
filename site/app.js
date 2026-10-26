(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  // Keep deep links to the optional film collection usable, including on arrival.
  function revealAnchor(hash, scroll=false){
    if(!hash)return;
    let target;
    try{target=document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return;}
    if(!target)return;
    let parent=target.parentElement,opened=false;
    while(parent){
      if(parent.tagName==='DETAILS'&&!parent.open){parent.open=true;opened=true;}
      parent=parent.parentElement;
    }
    if(opened&&scroll)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(link)revealAnchor(link.getAttribute('href'));
  });
  addEventListener('hashchange',()=>revealAnchor(location.hash,true));
  revealAnchor(location.hash,true);
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
  const heroVideo=$('.hero-video'),pauseButton=$('#hero-pause'),startButton=$('#hero-start');
  let heroVisible=true,filmOpen=false,heroPaused=reduced.matches;
  const story = $('.story-section');
  function syncHeroControl(){
    if(!pauseButton)return;
    const label=heroPaused?'Achtergrondvideo afspelen':'Achtergrondvideo pauzeren';
    pauseButton.innerHTML=icon(heroPaused?'play':'pause')+`<span class="control-label">${label}</span>`;
    pauseButton.setAttribute('aria-pressed',String(heroPaused));
    pauseButton.setAttribute('aria-label',label);
  }
  function syncHeroVideo(){
    if(!heroVideo)return;
    syncHeroControl();
    if(heroPaused||!heroVisible||filmOpen||document.hidden){heroVideo.pause();return;}
    heroVideo.play().then(()=>{if(startButton)startButton.hidden=true;}).catch(()=>{if(startButton)startButton.hidden=false;});
  }
  function applyMotion(){
    document.body.classList.toggle('motion-off',motionPaused);
    document.documentElement.classList.toggle('js-motion',!motionPaused);
    document.dispatchEvent(new CustomEvent('care4gardens:motion',{detail:{paused:motionPaused}}));
    syncHeroVideo();
  }
  if(heroVideo){heroVideo.muted=true;heroVideo.defaultMuted=true;}
  applyMotion();
  heroVideo?.addEventListener('playing',()=>{heroVideo.classList.add('playing');if(startButton)startButton.hidden=true;});
  heroVideo?.addEventListener('error',()=>{heroVideo.classList.remove('playing');if(startButton){startButton.hidden=false;startButton.querySelector('span').textContent='Film opnieuw laden';}});
  if(heroVideo)new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncHeroVideo();},{threshold:.08}).observe(heroVideo);
  document.addEventListener('visibilitychange',()=>{
    syncHeroVideo();
    if(filmOpen){const activeFilm=$('#brand-film');if(document.hidden)activeFilm.pause();else activeFilm.play().catch(()=>{});}
  });
  pauseButton?.addEventListener('click',()=>{heroPaused=!heroPaused;syncHeroVideo();});
  startButton?.addEventListener('click',()=>{heroPaused=false;if(heroVideo.error)heroVideo.load();syncHeroVideo();});
  reduced.addEventListener('change',e=>{motionPaused=e.matches;heroPaused=e.matches;applyMotion();});
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
  $$('[data-film]').forEach(b=>b.addEventListener('click',()=>{
    filmOpen=true;heroVideo?.pause();
    document.dispatchEvent(new CustomEvent('care4gardens:film',{detail:{open:true}}));
    const source=b.dataset.filmSrc||'assets/introduction.mp4';
    film.src=source;film.poster=b.dataset.filmPoster||'assets/02_douglas_after.webp';
    const title=b.dataset.filmTitle||'Care4Gardens. Maakt buitenleven mooier.';
    filmDialog.setAttribute('aria-label',title);$('.film-footer>span',filmDialog).textContent=title;
    $('#film-sound').hidden=!!b.dataset.filmSrc;
    const track=$('track',film);if(track)track.src=source.includes('installation')?'assets/installation-descriptions.vtt':source.includes('introduction')?'assets/descriptions.vtt':'assets/gallery-descriptions.vtt';
    filmDialog.showModal();document.body.classList.add('locked');film.currentTime=0;film.muted=!!b.dataset.filmSrc;film.play().catch(()=>{});
  }));
  const filmSound=$('#film-sound');
  function syncFilmSound(){if(!filmSound)return;filmSound.innerHTML=icon(film.muted?'muted':'sound')+`<span>${film.muted?'Geluid inschakelen':'Geluid uitschakelen'}</span>`;filmSound.setAttribute('aria-pressed',String(!film.muted));filmSound.setAttribute('aria-label',film.muted?'Filmgeluid inschakelen':'Filmgeluid uitschakelen');}
  filmSound?.addEventListener('click',()=>{film.muted=!film.muted;syncFilmSound();});
  if(filmDialog){
    syncFilmSound();
    film.addEventListener('volumechange',syncFilmSound);
    $('.dialog-close',filmDialog).addEventListener('click',()=>filmDialog.close());
    filmDialog.addEventListener('click',e=>{const r=filmDialog.getBoundingClientRect();if(e.target===filmDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))filmDialog.close();});
    filmDialog.addEventListener('close',()=>{film.pause();filmOpen=false;document.body.classList.remove('locked');syncHeroVideo();document.dispatchEvent(new CustomEvent('care4gardens:film',{detail:{open:false}}));});
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
})();
