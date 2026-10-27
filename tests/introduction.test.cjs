const {JSDOM} = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../site');
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup({blocked=false, denyAll=false, reduced=false, deferred=false, inView=true}={}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'), {runScripts:'outside-only', pretendToBeVisual:true});
  const w=dom.window,d=w.document,video=d.querySelector('#intro-film'),hero=d.querySelector('.hero'),calls=[];
  let paused=true,ended=false,observer,resolvePlay;
  const textTracks=[{kind:'captions',mode:'disabled'},{kind:'descriptions',mode:'disabled'}];
  Object.defineProperties(video,{paused:{get:()=>paused},ended:{get:()=>ended},duration:{get:()=>30},textTracks:{get:()=>textTracks}});
  hero.getBoundingClientRect=()=>({top:inView?70:-900,bottom:inView?700:-200});
  video.play=function(){
    calls.push({type:'play',muted:this.muted,time:this.currentTime});
    if(denyAll||(blocked&&!this.muted))return Promise.reject(Object.assign(new Error('Gesture required'),{name:'NotAllowedError'}));
    const complete=()=>{paused=false;ended=false;this.dispatchEvent(new w.Event('playing'));};
    if(deferred)return new Promise(resolve=>{resolvePlay=()=>{complete();resolve();};});
    complete();return Promise.resolve();
  };
  video.pause=function(){calls.push({type:'pause'});if(!paused){paused=true;this.dispatchEvent(new w.Event('pause'));}};
  video.load=function(){calls.push({type:'load'});paused=true;ended=false;this.currentTime=0;};
  const motion={matches:reduced,addEventListener(type,fn){this.listener=fn;}};
  w.matchMedia=query=>query.includes('reduced')?motion:{matches:true,addEventListener(){}};
  w.IntersectionObserver=class{constructor(callback){observer=callback;}observe(){}};
  w.eval(fs.readFileSync(path.join(root,'introduction.js'),'utf8'));
  const s={w,d,video,hero,calls,dom,textTracks,
    click:selector=>d.querySelector(selector).click(),
    visibility:ratio=>observer([{isIntersecting:ratio>0,intersectionRatio:ratio}]),
    allowSound:()=>{blocked=false;denyAll=false;},
    finish:()=>{ended=true;paused=true;video.currentTime=30;video.dispatchEvent(new w.Event('ended'));},
    resolve:()=>{deferred=false;resolvePlay();},
    modal:detail=>d.dispatchEvent(new w.CustomEvent('care4gardens:film',{detail})),
    hidden:value=>{Object.defineProperty(d,'hidden',{configurable:true,value});d.dispatchEvent(new w.Event('visibilitychange'));},
    motion:value=>{motion.matches=value;motion.listener();},
    pageshow:()=>{const e=new w.Event('pageshow');Object.defineProperty(e,'persisted',{value:true});w.dispatchEvent(e);},
    close:()=>dom.window.close()
  };return s;
}
(async()=>{
  const s=setup({blocked:true});await tick();
  assert.deepEqual(s.calls.filter(c=>c.type==='play').map(c=>[c.muted,c.time]),[[false,0],[true,0]],'Entry starts at zero immediately; blocked audio falls back without scrolling or opening a dialog');
  assert(!s.video.paused&&s.video.muted);assert(!s.d.querySelector('#film-dialog').open);
  assert.equal(s.textTracks[0].mode,'showing','Muted playback retains the spoken information in captions');
  s.click('#intro-captions');assert.equal(s.textTracks[0].mode,'hidden');
  s.video.currentTime=8;s.allowSound();s.click('#intro-sound');await tick();
  assert.equal(s.video.currentTime,0,'First sound tap includes the complete explanation');assert(!s.video.muted&&!s.video.paused);
  s.video.currentTime=4;s.visibility(0);await tick();assert(s.video.paused);
  s.visibility(.9);await tick();assert(!s.video.paused);assert.equal(s.video.currentTime,4);
  s.click('#hero-pause');s.visibility(0);s.visibility(1);await tick();assert(s.video.paused,'Explicit pause survives returning to the hero');
  s.click('#hero-pause');await tick();assert(!s.video.paused);
  s.video.pause();s.visibility(0);s.visibility(1);await tick();assert(s.video.paused,'External media controls also retain an intentional pause');s.click('#hero-pause');await tick();
  s.video.currentTime=12;s.click('#intro-sound');s.click('#intro-sound');await tick();assert.equal(s.video.currentTime,12,'Later sound toggles preserve position');
  s.finish();const plays=s.calls.filter(c=>c.type==='play').length;s.visibility(0);s.visibility(1);await tick();
  assert.equal(s.calls.filter(c=>c.type==='play').length,plays,'The narration never loops automatically');assert.equal(s.video.currentTime,30,'Natural final frame remains visible');assert(!s.video.loop);
  assert(s.hero.classList.contains('film-view'),'Closing wordmark remains unobstructed after the film ends');
  s.click('#hero-pause');await tick();assert.equal(s.video.currentTime,0);assert(!s.video.paused);
  s.modal({open:true,introduction:true});assert(s.video.paused,'Expanded player has exclusive sound');
  s.modal({open:false,introduction:true,time:11,muted:false,ended:false,paused:false});await tick();assert.equal(s.video.currentTime,11);assert(!s.video.paused);
  s.modal({open:true,introduction:true});s.modal({open:false,introduction:true,time:14,muted:true,ended:false,paused:true});await tick();assert(s.video.paused,'A pause in expanded view stays paused after closing');
  s.modal({open:true,introduction:true});s.modal({open:false,introduction:true,time:30,muted:false,ended:true,paused:true});await tick();assert(s.video.paused);assert.equal(s.video.currentTime,30);
  s.pageshow();await tick();assert.equal(s.video.currentTime,0,'History restoration begins the film at zero');assert(!s.video.paused);
  s.hidden(true);await tick();assert(s.video.paused);s.hidden(false);await tick();assert(!s.video.paused);
  s.video.currentTime=5;s.video.dispatchEvent(new s.w.Event('timeupdate'));assert(s.hero.classList.contains('film-view'));assert(s.hero.querySelector('.hero-content').inert);
  s.click('#hero-pause');assert(!s.hero.classList.contains('film-view'));
  s.close();

  const earlyMute=setup({blocked:true});earlyMute.click('#intro-sound');await tick();assert(earlyMute.video.muted&&!earlyMute.video.paused,'Muting during a blocked audible attempt still permits picture playback');earlyMute.close();
  const a=setup();await tick();assert(!a.video.muted&&!a.video.paused,'Permitted audio starts immediately on arrival');a.close();
  const r=setup({reduced:true});await tick();assert(!r.calls.some(c=>c.type==='play'));r.click('#hero-pause');await tick();assert(!r.video.paused,'Reduced-motion visitors can deliberately play');r.motion(true);await tick();assert(r.video.paused);r.close();
  const b=setup({denyAll:true});await tick();assert.equal(b.d.querySelector('#hero-pause').getAttribute('aria-label'),'Film afspelen');b.allowSound();b.click('#hero-pause');await tick();assert(!b.video.paused);b.close();
  const race=setup({deferred:true});race.visibility(0);race.resolve();await tick();assert(race.video.paused,'Late autoplay resolution cannot play offscreen');race.visibility(1);await tick();assert(!race.video.paused);race.close();
  const early=setup({deferred:true});early.visibility(0);early.visibility(1);early.resolve();await tick();assert(!early.video.paused,'Rapid leave/return can start a newer play request');early.close();
  const deep=setup({inView:false});await tick();assert(!deep.calls.some(c=>c.type==='play'),'An arrival at a lower-page deep link does not start offscreen audio');deep.visibility(1);await tick();assert(!deep.video.paused);deep.close();
  console.log('PASS: hero entry at zero, audio fallback, captions, first-sound restart, pause/resume, no replay loop, expanded handoff, history restoration, reduced motion and async races.');
})().catch(error=>{console.error(error);process.exit(1);});
