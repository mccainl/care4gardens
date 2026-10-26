import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { buildVeranda } from './configurator-scene.js';

export function createConfigurator3D(viewport,initialState){
 let renderer,compatibility=false,disposed=false,model,controls,raf=0,dirty=true,visible=true,interacting=false,tween=null,pendingState=null,updateTimer=0;
 let state={...initialState},lastTime=0,environment;
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,120);
 const ambient=new THREE.AmbientLight('#f4f1e4',.24);scene.add(ambient);
 const sky=new THREE.HemisphereLight('#fff9e8','#687257',1.7);scene.add(sky);
 const sun=new THREE.DirectionalLight('#fff2d5',3.1);sun.position.set(-5,9,5);sun.castShadow=true;
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
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
   renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.7;room.dispose();pmrem.dispose();
   canvas.addEventListener('webglcontextlost',contextLost);
  }else{
   compatibility=true;renderer=new SVGRenderer();renderer.setQuality('high');renderer.setPrecision(2);
   ambient.intensity=.72;sun.intensity=.62;fill.intensity=.2;sky.intensity=0;ground.visible=false;
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
  const previous=model;model=buildVeranda(next,{reduced:compatibility});scene.add(model.group);
  if(previous){scene.remove(previous.group);previous.dispose();}
  state={...next};viewport.setAttribute('aria-label',`Draaibaar 3D-model van uw overkapping, ${state.width} bij ${state.depth} centimeter. Sleep om te draaien, knijp om te zoomen. Pijltoetsen draaien; plus en min zoomen.`);
 }
 createRenderer();replaceModel(state);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.12,0);controls.enableDamping=!reducedMotion.matches;controls.dampingFactor=.085;controls.enablePan=false;controls.enableZoom=true;controls.rotateSpeed=.65;controls.zoomSpeed=.72;controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI*.47;controls.autoRotate=false;controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
 function fitDistance(){
  const verticalFov=THREE.MathUtils.degToRad(camera.fov),horizontalFov=2*Math.atan(Math.tan(verticalFov/2)*camera.aspect);
  const footprint=Math.hypot(model.width+1.4,model.depth+1.4);
  return Math.max(footprint/(2*Math.tan(horizontalFov/2)),(3.5+model.depth*.45)/(2*Math.tan(verticalFov/2)))*1.08;
 }
 function setDistance(distance){const offset=camera.position.clone().sub(controls.target);if(offset.length()<.1)offset.set(1,.65,1.4);camera.position.copy(offset.normalize().multiplyScalar(distance).add(controls.target));controls.update();}
 function resize(){
  const width=viewport.clientWidth,height=viewport.clientHeight;if(!width||!height||disposed)return;
  const oldFit=viewport.dataset.fitDistance?Number(viewport.dataset.fitDistance):0,currentDistance=camera.position.distanceTo(controls.target);
  renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
  const fit=fitDistance();controls.minDistance=fit*.44;controls.maxDistance=fit*1.8;
  setDistance(oldFit?fit*Math.max(.44,Math.min(1.8,currentDistance/oldFit)):fit);
  viewport.dataset.fitDistance=String(fit);dirty=true;start();
 }
 camera.position.set(7.8,5.6,10.8);controls.update();resize();
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
  if(changed||interacting||tween)raf=requestAnimationFrame(tick);
 }
 function start(){if(!raf&&!disposed&&visible&&!document.hidden){lastTime=performance.now();raf=requestAnimationFrame(tick);}}
 controls.addEventListener('start',()=>{interacting=true;tween=null;viewport.classList.add('is-interacting');start();});
 controls.addEventListener('end',()=>{interacting=false;viewport.classList.remove('is-interacting');start();});
 controls.addEventListener('change',()=>{dirty=true;start();});
 function view(name='perspective'){
  const fit=fitDistance(),direction=name==='front'?new THREE.Vector3(0,.18,1):new THREE.Vector3(.7,.53,1);
  tween=direction.normalize().multiplyScalar(fit).add(controls.target);controls.enableDamping=!reducedMotion.matches;dirty=true;start();
 }
 function keydown(event){
  if(event.target!==viewport)return;
  const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);
  if(event.key==='ArrowLeft')spherical.theta-=.13;else if(event.key==='ArrowRight')spherical.theta+=.13;
  else if(event.key==='ArrowUp')spherical.phi=Math.max(.25,spherical.phi-.1);else if(event.key==='ArrowDown')spherical.phi=Math.min(Math.PI*.47,spherical.phi+.1);
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
