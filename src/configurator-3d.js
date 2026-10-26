import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { buildVeranda } from './configurator-scene.js';
import { createGardenEnvironment } from './configurator-setting.js';

// Fit every corner, including the foreground terrace, at the current viewing angle.
export function fitModelDistance(bounds,target,direction,verticalFov,aspect){
 const backward=direction.clone().normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),backward).normalize(),up=new THREE.Vector3().crossVectors(backward,right);
 const tanY=Math.tan(verticalFov/2),tanX=tanY*aspect;let distance=0;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const corner=new THREE.Vector3(x,y,z).sub(target),near=corner.dot(backward);
  distance=Math.max(distance,near+Math.abs(corner.dot(right))/tanX,near+Math.abs(corner.dot(up))/tanY);
 }
 return distance*1.09;
}

export function createConfigurator3D(viewport,initialState){
 delete viewport.dataset.fitDistance;
 let renderer,compatibility=false,disposed=false,model,controls,raf=0,dirty=true,visible=true,interacting=false,tween=null,pendingState=null,updateTimer=0;
 let state={...initialState},lastTime=0,environment,bounds;
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,120);
 scene.background=new THREE.Color('#edf0e8');scene.fog=new THREE.Fog('#edf0e8',30,85);
 const ambient=new THREE.AmbientLight('#ffffff',.16);scene.add(ambient);
 const sky=new THREE.HemisphereLight('#e4efff','#7a8162',1.35);scene.add(sky);
 const sun=new THREE.DirectionalLight('#fff4e4',2.5);sun.position.set(-5,9,5);sun.castShadow=true;
 sun.shadow.mapSize.set(viewport.clientWidth<600?1024:2048,viewport.clientWidth<600?1024:2048);
 sun.shadow.camera.left=-11;sun.shadow.camera.right=11;sun.shadow.camera.top=11;sun.shadow.camera.bottom=-11;sun.shadow.camera.near=.1;sun.shadow.camera.far=40;sun.shadow.normalBias=.025;sun.shadow.bias=-.00012;sun.shadow.radius=4;scene.add(sun);
 const fill=new THREE.DirectionalLight('#dde8ef',.8);fill.position.set(5,4,-3);scene.add(fill);
 const shadowMaterial=new THREE.ShadowMaterial({color:'#596746',opacity:.22});
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(80,80),shadowMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-.269;ground.receiveShadow=true;scene.add(ground);
 function createRenderer(forceFallback=false){
  const canvas=document.createElement('canvas');let context;
  if(!forceFallback){try{context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});}catch{}}
  if(context){
   renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
   renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   const pmrem=new THREE.PMREMGenerator(renderer),garden=createGardenEnvironment();environment=pmrem.fromScene(garden.scene,.035);scene.environment=environment.texture;scene.environmentIntensity=.72;garden.dispose();pmrem.dispose();
   canvas.addEventListener('webglcontextlost',contextLost);
  }else{
   compatibility=true;renderer=new SVGRenderer();renderer.setQuality('high');renderer.setPrecision(2);renderer.overdraw=0;
   ambient.intensity=.68;sun.intensity=.5;fill.intensity=.15;sky.intensity=0;ground.visible=false;
  }
  const element=renderer.domElement;element.classList.add('atelier-renderer');element.setAttribute('aria-hidden','true');
  // OrbitControls captures gestures only on the model. The surrounding page scrolls normally.
  element.style.touchAction='none';viewport.replaceChildren(element);
  viewport.dataset.renderer=compatibility?'svg':'webgl';viewport.dataset.ready='true';
 }
 function contextLost(event){
  event.preventDefault();if(disposed||compatibility)return;
  controls.disconnect();renderer.dispose();environment?.dispose();environment=null;scene.environment=null;
  createRenderer(true);controls.connect(renderer.domElement);replaceModel(state);resize();start();
 }
 function replaceModel(next){
  const previous=model;model=buildVeranda(next,{reduced:compatibility});scene.add(model.group,model.setting.group);
  if(previous){scene.remove(previous.group,previous.setting.group);previous.dispose();}
  bounds=new THREE.Box3().setFromObject(model.group).union(model.setting.focusBounds);
  state={...next};viewport.setAttribute('aria-label',`Draaibaar 3D-model van uw overkapping, ${state.width} bij ${state.depth} centimeter. Sleep om te draaien, knijp om te zoomen. Pijltoetsen draaien; plus en min zoomen.`);
 }
 createRenderer();replaceModel(state);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(model.setting.target);controls.enableDamping=!reducedMotion.matches;controls.dampingFactor=.085;controls.enablePan=false;controls.enableZoom=true;controls.rotateSpeed=.65;controls.zoomSpeed=.72;controls.minPolarAngle=.5;controls.maxPolarAngle=Math.PI*.49;controls.minAzimuthAngle=-1.45;controls.maxAzimuthAngle=1.45;controls.autoRotate=false;controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
 function fitDistance(direction=camera.position.clone().sub(controls.target)){return fitModelDistance(bounds,controls.target,direction,THREE.MathUtils.degToRad(camera.fov),camera.aspect);}
 function setDistance(distance){const offset=camera.position.clone().sub(controls.target);if(offset.length()<.1)offset.set(1,.65,1.4);camera.position.copy(offset.normalize().multiplyScalar(distance).add(controls.target));controls.update();}
 function resize(){
  const width=viewport.clientWidth,height=viewport.clientHeight;if(!width||!height||disposed)return;
  const oldFit=viewport.dataset.fitDistance?Number(viewport.dataset.fitDistance):0,currentDistance=camera.position.distanceTo(controls.target);
  renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
  const fit=fitDistance();controls.minDistance=fit*.44;controls.maxDistance=fit*1.8;
  setDistance(oldFit?fit*Math.max(.44,Math.min(1.8,currentDistance/oldFit)):fit);
  viewport.dataset.fitDistance=String(fit);dirty=true;start();
 }
 camera.position.copy(new THREE.Vector3(.52,.19,1).multiplyScalar(12).add(controls.target));controls.update();resize();
 function draw(){
  renderer.render(scene,camera);dirty=false;
  // These attributes mirror the visible camera pose for assistive QA and regression checks.
  viewport.dataset.azimuth=controls.getAzimuthalAngle().toFixed(3);viewport.dataset.distance=camera.position.distanceTo(controls.target).toFixed(3);
 }
 function tick(now){
  raf=0;if(disposed||!visible||document.hidden)return;
  const dt=Math.min((now-lastTime)/1000||.016,.05);lastTime=now;
  if(tween){camera.position.lerp(tween,reducedMotion.matches?1:1-Math.exp(-dt*7));if(camera.position.distanceTo(tween)<.015){camera.position.copy(tween);tween=null;}dirty=true;}
  const changed=controls.update(dt);
  if(dirty||changed){try{draw();}catch(error){if(!compatibility){contextLost({preventDefault(){}});return;}throw error;}}
  if((changed||interacting||tween)&&!raf)raf=requestAnimationFrame(tick);
 }
 function start(){if(!raf&&!disposed&&visible&&!document.hidden){lastTime=performance.now();raf=requestAnimationFrame(tick);}}
 controls.addEventListener('start',()=>{interacting=true;tween=null;viewport.classList.add('is-interacting');start();});
 controls.addEventListener('end',()=>{interacting=false;viewport.classList.remove('is-interacting');start();});
 controls.addEventListener('change',()=>{dirty=true;start();});
 function view(name='perspective'){
  const direction=name==='front'?new THREE.Vector3(0,.08,1):new THREE.Vector3(.52,.19,1),fit=fitDistance(direction);
  viewport.dataset.fitDistance=String(fit);
  tween=direction.normalize().multiplyScalar(fit).add(controls.target);controls.enableDamping=!reducedMotion.matches;dirty=true;start();
 }
 function keydown(event){
  if(event.target!==viewport)return;
  const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);
  if(event.key==='ArrowLeft')spherical.theta-=.13;else if(event.key==='ArrowRight')spherical.theta+=.13;
  else if(event.key==='ArrowUp')spherical.phi=Math.max(.5,spherical.phi-.1);else if(event.key==='ArrowDown')spherical.phi=Math.min(Math.PI*.49,spherical.phi+.1);
  else if(event.key==='+'||event.key==='=')spherical.radius=Math.max(controls.minDistance,spherical.radius*.88);
  else if(event.key==='-')spherical.radius=Math.min(controls.maxDistance,spherical.radius*1.12);
  else if(event.key==='Home'){event.preventDefault();view();return;}else return;
  event.preventDefault();tween=null;camera.position.setFromSpherical(spherical).add(controls.target);controls.update();dirty=true;start();
 }
 viewport.addEventListener('keydown',keydown);
 const resizer=new ResizeObserver(resize);resizer.observe(viewport);
 const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible){dirty=true;start();}else{cancelAnimationFrame(raf);raf=0;}},{threshold:.01});observer.observe(viewport);
 function visibility(){if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{dirty=true;start();}}
 document.addEventListener('visibilitychange',visibility);
 draw();
 return{
  setView:view,
  update(next){
   if(JSON.stringify(next)===JSON.stringify(state)&&!pendingState)return;
   pendingState={...next};clearTimeout(updateTimer);
   updateTimer=setTimeout(()=>{
    if(disposed)return;
    const previousWidth=state.width,previousDepth=state.depth;replaceModel(pendingState);pendingState=null;
    if(state.width!==previousWidth||state.depth!==previousDepth)resize();dirty=true;start();
   },70);
  },
  dispose(){disposed=true;clearTimeout(updateTimer);cancelAnimationFrame(raf);observer.disconnect();resizer.disconnect();controls.dispose();model.dispose();environment?.dispose();renderer.dispose?.();ground.geometry.dispose();shadowMaterial.dispose();viewport.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',visibility);}
 };
}
