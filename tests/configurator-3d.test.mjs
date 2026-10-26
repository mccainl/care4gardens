import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {Box3,Vector3,PerspectiveCamera,MathUtils} from 'three';
import {buildVeranda} from '../src/configurator-scene.js';
import {createConfigurator3D,fitModelDistance} from '../src/configurator-3d.js';

const initial={color:'Antraciet',gutter:'Rechte goot',roof:'Helder Glas',width:500,depth:300,front:'Open voorkant',left:'Open linkerzijde',right:'Open rechterzijde',shade:'Geen zonwering',light:'Geen verlichting',install:'Ja'};
for(const [width,depth] of [[300,200],[500,300],[1200,600]])for(const reduced of [false,true]){
 const model=buildVeranda({...initial,width,depth,gutter:'Halfronde goot',front:'Glazen schuifwanden getint glas',left:'Zijwand aluminium & glazen spie',right:'Zip-screen & glazen spie',shade:'Onderdak-zonwering',light:'Warm wit'},{reduced});
 model.group.updateMatrixWorld(true);
 const size=new Box3().setFromObject(model.group).getSize(new Vector3());
 assert([size.x,size.y,size.z].every(Number.isFinite));
 assert(size.x>width/100&&size.x<width/100+2,'Veranda stays within its expected footprint');
 assert(size.z>depth/100&&size.z<depth/100+2,'Rounded gutter must run along width, not depth');
 assert.equal(model.group.getObjectByName('front').children.some(m=>m.material?.transmission>0),!reduced,'Glass uses physical transmission on the GPU');
 assert(model.setting.group.userData.brickCount>300,'The house has individual brick courses even at its smallest size');
 assert(model.setting.group.getObjectByName('Recessed patio doors'),'Patio doors connect the home and veranda');
 assert(model.setting.group.getObjectByName('Continuous garden lawn'),'The terrace is set into a garden');
 assert.equal(model.setting.group.userData.attachmentZ,-depth/200,'The house stays attached when veranda depth changes');
 const bounds=new Box3().setFromObject(model.group).union(model.setting.focusBounds),target=model.setting.target;
 for(const aspect of [.7,1.18,1.7,2.2])for(const direction of [new Vector3(.7,.53,1),new Vector3(0,.18,1),new Vector3(-1,.4,.3)]){
  const camera=new PerspectiveCamera(36,aspect,.1,120),distance=fitModelDistance(bounds,target,direction,MathUtils.degToRad(36),aspect);
  camera.position.copy(direction.clone().normalize().multiplyScalar(distance).add(target));camera.lookAt(target);camera.updateMatrixWorld();
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   const p=new Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1,'The complete terrace fits on mobile, desktop and enlarged views');
  }
 }
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
viewer.dispose();
// Smooth damping must never multiply animation loops while the camera settles.
let peakFrames=0;const queued=new Set();globalThis.matchMedia=()=>({matches:false});
globalThis.requestAnimationFrame=callback=>{const id=w.requestAnimationFrame(time=>{queued.delete(id);callback(time);});queued.add(id);peakFrames=Math.max(peakFrames,queued.size);return id;};
globalThis.cancelAnimationFrame=id=>{queued.delete(id);w.cancelAnimationFrame(id);};
const damped=createConfigurator3D(viewport,initial),dampedSurface=viewport.querySelector('svg');
Object.defineProperties(dampedSurface,{clientWidth:{value:390},clientHeight:{value:330}});
pointer(dampedSurface,'pointerdown',1,120,140);pointer(w.document,'pointermove',1,230,150);pointer(w.document,'pointerup',1,230,150);await delay(500);
assert.equal(peakFrames,1,'Only one animation frame is queued during smooth camera damping');
damped.dispose();assert.equal(queued.size,0);w.close();
console.log('PASS: dimensional 3D geometry, physical glass, one-finger orbit, pinch zoom, preserved camera, keyboard controls and front view.');
