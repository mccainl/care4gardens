const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
for(const reduced of [false,true]){
 const w=new JSDOM(fs.readFileSync('site/index.html','utf8'),{runScripts:'outside-only',url:'https://example.com',pretendToBeVisual:true}).window;
 let observer,paused=true,hidden=false,rejectPlay=false;
 w.matchMedia=()=>({matches:reduced,addEventListener(){}});
 w.IntersectionObserver=class{constructor(cb){observer=cb}observe(){}};
 const v=w.document.querySelector('.cinematic-scene video'),b=w.document.querySelector('.cinematic-scene button');
 Object.defineProperty(v,'paused',{get:()=>paused});
 v.play=()=>{if(rejectPlay)return Promise.reject(new Error('Autoplay unavailable'));paused=false;v.dispatchEvent(new w.Event('playing'));return Promise.resolve()};
 v.pause=()=>{paused=true;v.dispatchEvent(new w.Event('pause'))};
 Object.defineProperty(w.document,'hidden',{get:()=>hidden});
 const flush=()=>new Promise(r=>setImmediate(r));
 w.eval(fs.readFileSync('site/atmosphere.js','utf8'));
 assert(!v.getAttribute('src'));observer([{isIntersecting:true}]);await flush();assert.equal(paused,reduced);
 if(reduced){assert(!v.getAttribute('src'));b.click();await flush();assert(!paused,'Explicit playback is allowed with reduced motion');}
 assert.equal(b.getAttribute('aria-pressed'),'true');
 w.document.dispatchEvent(new w.CustomEvent('care4gardens:film',{detail:{open:true}}));assert(paused);
 w.document.dispatchEvent(new w.CustomEvent('care4gardens:film',{detail:{open:false}}));await flush();assert(!paused);
 hidden=true;w.document.dispatchEvent(new w.Event('visibilitychange'));assert(paused);
 hidden=false;w.document.dispatchEvent(new w.Event('visibilitychange'));await flush();assert(!paused);
 observer([{isIntersecting:false}]);assert(paused);observer([{isIntersecting:true}]);await flush();assert(!paused);
 b.click();assert(paused);observer([{isIntersecting:false}]);observer([{isIntersecting:true}]);await flush();assert(paused,'Explicit pause survives re-entry');
 rejectPlay=true;b.click();await flush();assert(paused);assert.equal(b.getAttribute('aria-pressed'),'false','Blocked autoplay must not show a pause button');
 rejectPlay=false;b.click();await flush();assert(!paused);w.close();
}
console.log('PASS: deferred media, reduced-motion opt-in, explicit pause preservation, offscreen/hidden/modal pause, and rejected autoplay recovery.');
})().catch(e=>{console.error(e);process.exitCode=1});
