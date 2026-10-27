const {JSDOM} = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../site');
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup({blocked=false, reduced=false}={}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'), {runScripts:'outside-only', pretendToBeVisual:true});
  const w = dom.window, d = w.document, video = d.querySelector('#intro-film');
  const calls = []; let paused = true, ended = false;
  Object.defineProperties(video, {paused:{get:()=>paused}, ended:{get:()=>ended}});
  video.play = function() {
    calls.push({type:'play', muted:this.muted, time:this.currentTime});
    if (blocked && !this.muted) return Promise.reject(Object.assign(new Error('Gesture required'), {name:'NotAllowedError'}));
    paused = false; ended = false;
    this.dispatchEvent(new w.Event('playing'));
    return Promise.resolve();
  };
  video.pause = function() { calls.push({type:'pause'}); if (!paused) { paused=true; this.dispatchEvent(new w.Event('pause')); } };
  w.matchMedia = () => ({matches:reduced, addEventListener(){}});
  let observer;
  w.IntersectionObserver = class {constructor(callback){observer=callback;}observe(){}};
  w.eval(fs.readFileSync(path.join(root,'introduction.js'),'utf8'));
  return {w,d,video,calls,dom,
    visibility:ratio=>observer([{isIntersecting:ratio>0, intersectionRatio:ratio}]),
    allowSound:()=>{blocked=false;},
    finish:()=>{ended=true; paused=true; video.dispatchEvent(new w.Event('ended'));}
  };
}
(async()=>{
  const s=setup({blocked:true});
  assert.equal(s.calls.length,0,'No narration plays before the film enters view');
  s.visibility(.1); await tick();
  assert(!s.calls.some(c=>c.type==='play'),'Only a sliver of the player is not enough to start audio');
  s.visibility(.8); await tick();
  assert.deepEqual(s.calls.filter(c=>c.type==='play').map(c=>c.muted),[false,true],'Audible attempt falls back to inline muted playback');
  assert.equal(s.video.paused,false); assert.equal(s.video.muted,true);
  assert(s.d.querySelector('#intro-sound').textContent.includes('vanaf het begin'));
  assert(!s.d.querySelector('#film-dialog').open,'Autoplay never opens a separate player');
  s.video.currentTime=8; s.allowSound(); s.d.querySelector('#intro-sound').click(); await tick();
  assert.equal(s.video.currentTime,0,'First sound activation includes the whole narration');
  assert.equal(s.video.muted,false); assert.equal(s.video.paused,false);
  s.video.currentTime=4; s.visibility(0); await tick(); assert(s.video.paused);
  s.visibility(.9); await tick(); assert(!s.video.paused); assert.equal(s.video.currentTime,4,'Returning resumes at the same words');
  s.video.pause(); s.visibility(0); s.visibility(.9); await tick(); assert(s.video.paused,'Explicit pause survives scrolling');
  await s.video.play(); s.finish(); const plays=s.calls.filter(c=>c.type==='play').length;
  s.visibility(0);s.visibility(1);await tick();assert.equal(s.calls.filter(c=>c.type==='play').length,plays,'Completed narration does not repeat automatically');
  assert.equal(s.video.loop,false);
  await s.video.play();
  s.d.dispatchEvent(new s.w.CustomEvent('care4gardens:film',{detail:{open:true}}));await tick();assert(s.video.paused,'Expanded film has exclusive audio');
  s.d.dispatchEvent(new s.w.CustomEvent('care4gardens:film',{detail:{open:false,introduction:true,time:11,muted:false,ended:false}}));await tick();
  assert.equal(s.video.currentTime,11);assert(!s.video.paused,'Closing the expanded view continues inline');
  Object.defineProperty(s.d,'hidden',{configurable:true,value:true});s.d.dispatchEvent(new s.w.Event('visibilitychange'));await tick();assert(s.video.paused);
  s.dom.window.close();
  const a=setup();a.visibility(1);await tick();assert(!a.video.muted&&!a.video.paused,'Audio starts on visibility when browser policy permits');a.dom.window.close();
  const r=setup({reduced:true});r.visibility(1);await tick();assert(!r.calls.some(c=>c.type==='play'),'Reduced-motion visitors choose playback');r.dom.window.close();
  console.log('PASS: inline narration, gesture fallback, restart with first sound, viewport pause/resume, explicit pause, natural ending, exclusive expanded playback and reduced motion.');
})().catch(error=>{console.error(error);process.exit(1);});
