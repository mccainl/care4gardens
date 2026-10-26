import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {Box3,Vector3} from 'three';
import {buildVeranda} from '../src/configurator-scene.js';
import {createConfigurator3D} from '../src/configurator-3d.js';

const initial={color:'Antraciet',gutter:'Rechte goot',roof:'Helder Glas',width:500,depth:300,front:'Open voorkant',left:'Open linkerzijde',right:'Open rechterzijde',shade:'Geen zonwering',light:'Geen verlichting',install:'Ja'};
for(const [width,depth] of [[300,200],[500,300],[1200,600]])for(const reduced of [false,true]){
 const model=buildVeranda({...initial,width,depth,gutter:'Halfronde goot',front:'Glazen schuifwanden getint glas',left:'Zijwand aluminium & glazen spie',right:'Zip-screen & glazen spie',shade:'Onderdak-zonwering',light:'Warm wit'},{reduced});
 model.group.updateMatrixWorld(true);
 const size=new Box3().setFromObject(model.group).getSize(new Vector3());
 assert([size.x,size.y,size.z].every(Number.isFinite));
 assert(size.x>width/100&&size.x<width/100+2,'Veranda stays within its expected footprint');
 assert(size.z>depth/100&&size.z<depth/100+2,'Rounded gutter must run along width, not depth');
 assert.equal(model.group.getObjectByName('front').children.some(m=>m.material?.transmission>0),!reduced,'Glass uses physical transmission on the GPU');
 model.dispose();
}

// Exercise the production viewer and its actual OrbitControls with touch events.
const dom=new JSDOM('<div id="viewer" tabindex="0"></div>',{pretendToBeVisual:true});const w=dom.window;
Object.assign(globalThis,{window:w,document:w.document,devicePixelRatio:1,matchMedia:()=>({matches:true}),requestAnimationFrame:w.requestAnimationFrame.bind(w),cancelAnimationFrame:w.cancelAnimationFrame.bind(w),ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
w.HTMLCanvasElement.prototype.getContext=()=>null;
w.SVGElement.prototype.setPointerCapture=()=>{};w.SVGElement.prototype.releasePointerCapture=()=>{};
const viewport=w.document.getElementById('viewer');Object.defineProperties(viewport,{clientWidth:{value:390},clientHeight:{value:330}});
const viewer=createConfigurator3D(viewport,initial),surface=viewport.querySelector('svg');
Object.defineProperties(surface,{clientWidth:{value:390},clientHeight:{value:330}});
assert.equal(viewport.dataset.renderer,'svg');assert(viewport.querySelectorAll('path').length>50);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function pointer(target,type,id,x,y){const event=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(event,{pointerId:id,pointerType:'touch',pageX:x,pageY:y,clientX:x,clientY:y,button:0});target.dispatchEvent(event);}
const startAngle=Number(viewport.dataset.azimuth);
pointer(surface,'pointerdown',1,130,150);pointer(w.document,'pointermove',1,220,170);pointer(w.document,'pointerup',1,220,170);await delay(50);
assert(Math.abs(Number(viewport.dataset.azimuth)-startAngle)>.2,'One-finger drag rotates the actual camera');
const startDistance=Number(viewport.dataset.distance);
pointer(surface,'pointerdown',1,110,150);pointer(surface,'pointerdown',2,190,150);pointer(w.document,'pointermove',1,75,150);pointer(w.document,'pointermove',2,225,150);pointer(w.document,'pointerup',1,75,150);pointer(w.document,'pointerup',2,225,150);await delay(50);
assert(Number(viewport.dataset.distance)<startDistance*.9,'Two-finger spreading zooms into the model');
const angleAfterTouch=Number(viewport.dataset.azimuth);
viewer.update({...initial,width:720,depth:400,color:'Crème'});await delay(110);
assert(viewport.getAttribute('aria-label').includes('720 bij 400'));
assert(Math.abs(Number(viewport.dataset.azimuth)-angleAfterTouch)<.01,'Changing dimensions retains the viewing angle');
viewport.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await delay(35);
assert(Number(viewport.dataset.azimuth)>angleAfterTouch,'Keyboard rotation works without touch');
viewer.setView('front');await delay(40);assert(Math.abs(Number(viewport.dataset.azimuth))<.02,'Front preset returns to the correct view');
viewer.dispose();w.close();
console.log('PASS: dimensional 3D geometry, physical glass, one-finger orbit, pinch zoom, preserved camera, keyboard controls and front view.');
