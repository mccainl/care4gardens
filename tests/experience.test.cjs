const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../site');
const data=JSON.parse(fs.readFileSync(path.join(root,'catalogue.json'),'utf8'));
const code=fs.readFileSync(path.join(root,'app.js'),'utf8');
function setup(file,url){
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.matchMedia=()=>({matches:false,addEventListener(){}});w.observers=[];w.IntersectionObserver=class{constructor(callback,options){this.callback=callback;this.options=options;w.observers.push(this);}observe(){}unobserve(){}disconnect(){}};
 w.mediaCalls=[];w.HTMLMediaElement.prototype.play=function(){w.mediaCalls.push(['play',this.className||this.id]);return Promise.resolve();};w.HTMLMediaElement.prototype.pause=function(){w.mediaCalls.push(['pause',this.className||this.id]);};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.fetch=async()=>({ok:true,json:async()=>structuredClone(data)});w.eval(code);return w;
}
function click(w,s){const e=w.document.querySelector(s);assert(e,'Missing control '+s);e.click();}
function change(w,s,v){const e=w.document.querySelector(s);e.value=v;e.dispatchEvent(new w.Event(e.tagName==='INPUT'?'input':'change',{bubbles:true}));}
(async()=>{
 const w=setup('index.html','https://example.com/care4gardens/');const d=w.document;
 const hero=d.querySelector('.hero-video');assert(hero.autoplay&&hero.loop&&hero.playsInline);assert(hero.src.endsWith('assets/introduction.mp4'));assert(hero.muted);
 assert(w.mediaCalls.some(([type,name])=>type==='play'&&name==='hero-video'),'Introduction starts without a click');
 hero.currentTime=8;click(w,'#hero-sound');assert.equal(hero.muted,false);assert.equal(hero.currentTime,0);assert.equal(d.querySelector('#hero-sound').getAttribute('aria-pressed'),'true');
 click(w,'#hero-sound');assert.equal(hero.muted,true);
 hero.dispatchEvent(new w.Event('playing'));assert(hero.classList.contains('playing'));
 assert(d.querySelector('#hero-sound svg'));assert(!d.querySelector('.motion-toggle'));assert(d.querySelector('#brand-film').loop);assert.equal(d.querySelector('#brand-film').controls,false);
 assert(!/[↗→←↺↓✓▶Ⅱ×‹›]/u.test(d.body.textContent),'No emoji-style UI characters');
 click(w,'[data-film]');assert(w.mediaCalls.some(([type,name])=>type==='pause'&&name.includes('hero-video')));assert.equal(d.querySelector('#brand-film').muted,false);click(w,'#film-dialog .dialog-close');

 click(w,'[data-compare="douglas"]');assert(d.querySelector('#compare-after').src.endsWith('02_douglas_after.webp'));
 change(w,'#compare-range','75');assert.equal(d.querySelector('.comparison').style.getPropertyValue('--split'),'75%');
 click(w,'[data-comfort="closed"]');assert.equal(d.querySelector('.comfort-visual').dataset.mode,'closed');
 click(w,'[data-comfort="screen"]');assert.equal(d.querySelector('.comfort-visual').dataset.mode,'screen');
 click(w,'[data-stage="1"]');assert.equal(d.querySelector('.story-section').style.getPropertyValue('--glass'),'1');
 assert(!d.querySelector('[aria-label="Animaties pauzeren"]'));
 click(w,'#film-sound');assert(d.querySelector('#brand-film').muted);click(w,'#film-sound');assert(!d.querySelector('#brand-film').muted);
 click(w,'.menu-toggle');assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'),'true');
 w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'),'false');
 click(w,'[data-film]');assert(d.querySelector('#film-dialog').open);
 Object.defineProperty(d,'hidden',{configurable:true,value:true});d.dispatchEvent(new w.Event('visibilitychange'));assert.deepEqual(w.mediaCalls.at(-1),['pause','brand-film']);
 Object.defineProperty(d,'hidden',{configurable:true,value:false});d.dispatchEvent(new w.Event('visibilitychange'));assert.deepEqual(w.mediaCalls.at(-1),['play','brand-film']);
 click(w,'#film-dialog .dialog-close');assert(!d.body.classList.contains('locked'));
 click(w,'#plan-next');assert(!d.querySelector('[data-step="1"]').hidden);
 change(w,'[name="width"]','400');change(w,'[name="depth"]','300');change(w,'[name="notes"]','Test & <script>');
 click(w,'#plan-next');assert(!d.querySelector('[data-step="2"]').hidden);assert(d.querySelector('#plan-summary').textContent.includes('400 cm breed'));
 assert(!d.querySelector('#plan-summary script'));assert(decodeURIComponent(d.querySelector('#email-plan').href).includes('Test & <script>'));
 click(w,'#plan-reset');assert(!d.querySelector('[data-step="0"]').hidden);
 d.querySelector('#veranda-studio').dataset.finish='stone';d.querySelector('#veranda-studio').dataset.light='evening';click(w,'#studio-to-plan');
 assert(d.querySelector('textarea[name=notes]').value.includes('zandkleur'));assert(d.querySelector('textarea[name=notes]').value.includes('warme verlichting'));assert(d.querySelector('input[name=extra][value="Glazen schuifwanden"]').checked);
 w.eval(fs.readFileSync(path.join(root,'studio-loader.js'),'utf8'));w.photoStudio(d.querySelector('#veranda-studio'));
 assert.equal(d.querySelector('#veranda-studio').dataset.fallback,'photo');change(w,'#studio-glass','100');assert.equal(d.querySelector('.studio-poster').style.opacity,'0');assert.equal(d.querySelector('#studio-glass').getAttribute('aria-valuetext'),'Volledig open');
 change(w,'#studio-glass','0');assert.equal(d.querySelector('.studio-poster').style.opacity,'1');click(w,'[data-light="evening"]');assert.equal(d.querySelector('#veranda-studio').dataset.light,'evening');assert.equal(d.querySelector('button[data-light="evening"]').getAttribute('aria-pressed'),'true');w.close();
 const s=setup('collectie.html','https://example.com/care4gardens/collectie.html');await new Promise(r=>setTimeout(r,30));const sd=s.document;
 assert.equal(sd.querySelectorAll('.product-card').length,12);assert(sd.querySelector('#catalogue-count').textContent.startsWith('100'));
 click(s,'[data-category="aluminium"]');assert(sd.querySelector('#catalogue-count').textContent.startsWith('56'));
 change(s,'#width-filter','3.06');assert(sd.querySelector('#catalogue-count').textContent.startsWith('7'));
 click(s,'[data-category="screens"]');assert(sd.querySelector('#catalogue-count').textContent.startsWith('10'));
 click(s,'[data-category="glas"]');change(s,'#product-search','366');assert(sd.querySelector('#catalogue-count').textContent.startsWith('2'));
 const glass=data.products.find(p=>p.category==='glas'&&p.title.includes('Heldere')&&p.title.includes('366'));
 click(s,`[data-product="${glass.id}"]`);assert(sd.querySelector('#product-dialog').open);const select=sd.querySelector('.variant-select');select.value='Met montage';select.dispatchEvent(new s.Event('change'));
 const variant=glass.variants.find(v=>v.title==='Met montage');assert(sd.querySelector('#original-product').href.includes('variant='+variant.id));assert(sd.querySelector('#detail-price').textContent.includes('1.300'));
 click(s,'#product-dialog .dialog-close');assert(!sd.querySelector('#product-dialog').open);assert(!s.location.search.includes('product='));
 change(s,'#product-search','no matching product');assert(sd.querySelector('.empty-state'));click(s,'#clear-filters');assert.equal(sd.querySelectorAll('.product-card').length,12);
 click(s,'#load-more');assert.equal(sd.querySelectorAll('.product-card').length,24);s.close();
 for(const file of ['index.html','collectie.html']){
  const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'));const ids=[...dom.window.document.querySelectorAll('[id]')].map(e=>e.id);assert.equal(ids.length,new Set(ids).size,'Duplicate IDs');
  for(const el of dom.window.document.querySelectorAll('[src],[data-src],[poster],link[href],a[href]')){
   let ref=el.getAttribute('src')||el.getAttribute('data-src')||el.getAttribute('poster')||el.getAttribute('href');if(!ref||/^(https?:|mailto:|tel:|#)/.test(ref))continue;const pathname=ref.split(/[?#]/)[0];if(!pathname||pathname==='./')continue;assert(fs.existsSync(path.join(root,pathname)),`${file}: missing ${ref}`);
  }dom.window.close();
 }
 for(const p of data.products){assert(p.variants.length>0);for(const img of p.images)assert(fs.existsSync(path.join(root,img)),img);for(const v of p.variants)assert(Number.isFinite(v.price)&&v.price>0);}
 const fw=setup('index.html','https://example.com/care4gardens/');const fd=fw.document;fw.eval(fs.readFileSync(path.join(root,'films.js'),'utf8'));
 const inline=[...fd.querySelectorAll('[data-loop-film]')];assert.equal(inline.length,4);
 for(const video of inline)assert(video.autoplay&&video.loop&&video.playsInline&&video.muted&&!video.controls);
 const visibility=fw.observers.find(o=>o.options?.threshold===.12);assert(visibility);
 visibility.callback(inline.map(target=>({target,isIntersecting:true})));
 await Promise.resolve();assert(inline.every(video=>video.src.endsWith(video.dataset.src)));
 assert(fw.mediaCalls.some(([type,name])=>type==='play'&&name==='installation-film'));
 const installation=fd.querySelector('#installation-film');Object.defineProperty(installation,'readyState',{value:4});Object.defineProperty(installation,'duration',{value:15.041667});
 click(fw,'[data-installation-time="10.3"]');assert.equal(installation.currentTime,10.3);assert.equal(fd.querySelector('[data-installation-time="10.3"]').getAttribute('aria-pressed'),'true');
 change(fw,'#installation-seek','3');assert.equal(installation.currentTime,3);assert.equal(fd.querySelector('[data-installation-time="2"]').getAttribute('aria-pressed'),'true');
 const beforeExpanded=fw.mediaCalls.length;click(fw,'[data-film-src="assets/glass-closing.mp4"]');assert(fd.querySelector('#brand-film').src.endsWith('glass-closing.mp4'));assert(fd.querySelector('#film-sound').hidden);assert.equal(fd.querySelector('#film-dialog').getAttribute('aria-label'),'Glas in beweging');
 for(const video of inline)assert(fw.mediaCalls.slice(beforeExpanded).some(([type,name])=>type==='pause'&&name===video.id));
 click(fw,'#film-dialog .dialog-close');assert(fw.mediaCalls.slice(beforeExpanded).some(([type,name])=>type==='play'&&name==='installation-film'));
 visibility.callback([{target:installation,isIntersecting:false}]);assert.deepEqual(fw.mediaCalls.at(-1),['pause','installation-film']);
 click(fw,'.hero-film-row [data-film]');assert(fd.querySelector('#brand-film').src.endsWith('introduction.mp4'));assert(!fd.querySelector('#film-sound').hidden);assert(!fd.querySelector('#brand-film').muted);
 click(fw,'#film-dialog .dialog-close');await Promise.resolve();fw.close();
 console.log('PASS: planner, input escaping, comparisons, atmosphere controls, mobile menu state, looping film and tab return, 100-product catalogue, category/width/search filters, pagination, exact variant prices and links, local assets, unique IDs.');
 console.log('PASS: autoplay setup, drawn icons, sound toggles, exclusive film playback and 3D preferences in enquiry.');
 console.log('PASS: four inline looping films, viewport playback, chapter seeking, scrubber, expanded film selection and exclusive playback.');
 console.log('DOM tests only. Rendering, media playback and real browser behavior require browser verification.');
})().catch(e=>{console.error(e);process.exit(1)});
