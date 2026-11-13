const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
for(const reduced of [false,true]){
const w=new JSDOM(fs.readFileSync('site/index.html','utf8'),{runScripts:'outside-only',url:'https://example.com'}).window;
let observer,paused=true;w.matchMedia=()=>({matches:reduced,addEventListener(){}});w.IntersectionObserver=class{constructor(cb){observer=cb}observe(){}};
const v=w.document.querySelector('.cinematic-scene video'),b=w.document.querySelector('.cinematic-scene button');
Object.defineProperty(v,'paused',{get:()=>paused});v.play=()=>{paused=false;return Promise.resolve()};v.pause=()=>{paused=true};Object.defineProperty(w.document,'hidden',{value:false});
w.eval(fs.readFileSync('site/atmosphere.js','utf8'));assert(!v.getAttribute('src'));observer([{isIntersecting:true}]);assert.equal(paused,reduced);
if(!reduced){b.click();assert(paused);observer([{isIntersecting:false}]);observer([{isIntersecting:true}]);assert(paused);b.click();assert(!paused);}
observer([{isIntersecting:false}]);assert(paused);w.close();}
console.log('PASS: deferred media, reduced motion, explicit pause preservation, offscreen pause');
