import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export async function createStudio(shell){
 const viewport=shell.querySelector('.studio-viewport');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
 renderer.setSize(viewport.clientWidth,viewport.clientHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.18;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-label','Interactieve veranda met verschuifbare glazen deuren');
 viewport.prepend(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e4e7dc');
 const camera=new THREE.PerspectiveCamera(35,viewport.clientWidth/viewport.clientHeight,.1,80);
 const compact=viewport.clientWidth<650;
 camera.position.set(compact?10.1:8.8,compact?6.7:5.6,compact?13.5:10.7);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.target.set(0,1.1,0);controls.enableDamping=true;controls.dampingFactor=.065;
 controls.enablePan=false;controls.enableZoom=false;controls.minDistance=7;controls.maxDistance=24;
 controls.minPolarAngle=.4;controls.maxPolarAngle=Math.PI*.49;
 controls.autoRotate=true;controls.autoRotateSpeed=.22;
 renderer.domElement.style.touchAction='pan-y';
 const pmrem=new THREE.PMREMGenerator(renderer);
 const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.06);
 scene.environment=environment.texture;scene.environmentIntensity=.6;room.dispose();pmrem.dispose();
 const hemi=new THREE.HemisphereLight('#f7f5df','#6d7860',1.8);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#fff2d7',4.2);sun.position.set(-5,10,7);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun);
 const fill=new THREE.DirectionalLight('#dce9ff',1.1);fill.position.set(6,5,-4);scene.add(fill);
 const stage=new THREE.Group();scene.add(stage);
 const std=(color,roughness=.65,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const frame=std('#303c3b',.33,.6),stone=std('#d8d5c7',.91),joint=std('#b4b9a9',.95),wall=std('#ebe6d6',.94),wood=std('#9a7450',.72),fabric=std('#ded9c8',.96),cushion=std('#87917a',1),dark=std('#495242',.9),planterMat=std('#b5ad9a',.94);
 const glass=new THREE.MeshPhysicalMaterial({color:'#dcf0ec',roughness:.07,metalness:.05,transmission:.88,thickness:.06,ior:1.48,envMapIntensity:1.1,clearcoat:1,clearcoatRoughness:.07});
 const roofGlass=new THREE.MeshPhysicalMaterial({color:'#c5d4cc',roughness:.14,transmission:.7,thickness:.08,ior:1.45,clearcoat:.7});
 const lightMaterial=new THREE.MeshStandardMaterial({color:'#ffefd0',emissive:'#ffc677',emissiveIntensity:.15,roughness:.3});
 const reusableBox=new THREE.BoxGeometry(1,1,1);
 function box(w,h,d,mat,x,y,z,parent=stage,round=0){
  const geo=round?new RoundedBoxGeometry(w,h,d,3,round):reusableBox;
  const mesh=new THREE.Mesh(geo,mat);if(!round)mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=mat!==glass&&mat!==roofGlass;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function cylinder(r1,r2,h,mat,x,y,z,parent=stage){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,24),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 const base=box(8.2,.22,6.6,joint,0,-.14,0,stage,.15);
 box(6.65,.12,4.8,stone,0,.025,0,stage,.08);
 for(let x=-3.3;x<3.3;x+=.83)for(let z=-2.37;z<2.38;z+=.8)box(.815,.024,.784,stone,x+.405,.096,z+.39);
 const backdrop=box(6.6,3.4,.16,wall,0,1.8,-2.18,stage,.04);
 // A quiet architectural wall with a glazed entrance and a timber accent.
 box(2.55,2.64,.07,frame,.85,1.45,-2.065);
 const interior=std('#716e5e',.99);box(2.37,2.47,.035,interior,.85,1.45,-2.014);
 box(2.37,2.47,.014,glass,.85,1.45,-1.98);
 box(.035,2.5,.05,frame,.85,1.45,-1.95);
 for(let i=0;i<12;i++)box(.065,2.98,.055,wood,-2.6+i*.095,1.69,-2.05);
 // Six metre demonstration veranda, with actual depth and sliding panel geometry.
 for(const x of [-3,3])for(const z of [-1.94,1.94])box(.115,2.7,.115,frame,x,1.47,z);
 for(const z of [-1.94,1.94])box(6.12,.16,.13,frame,0,2.82,z);
 for(const x of [-3,3])box(.13,.16,4.02,frame,x,2.82,0);
 for(let i=0;i<6;i++){const x=-2.94+i*.988;box(.972,.035,3.88,roofGlass,x+.486,2.82,0);if(i>0)box(.045,.09,3.88,frame,x,2.79,0);}
 const sliding=[];
 // Frameless glass remains fully present in both open and closed positions.
 for(let i=0;i<5;i++){
  const panel=new THREE.Group();stage.add(panel);panel.position.set(-2.94+i*1.176,0,1.91+i*.026);
  box(1.188,2.54,.014,glass,.588,1.47,0,panel);
  box(1.188,.035,.037,frame,.588,.2,0,panel);
  box(1.188,.032,.037,frame,.588,2.74,0,panel);
  box(.012,2.54,.016,frame,.006,1.47,0,panel);
  box(.026,.13,.045,frame,1.12,1.4,.03,panel,.01);
  sliding.push({panel,closed:-2.94+i*1.176,open:-2.94+i*.045});
 }
 for(const x of [-2.97,2.97]){
  for(let j=0;j<3;j++){const pane=box(.014,2.54,1.26,glass,x,1.47,-1.27+j*1.28);pane.castShadow=false;box(.03,2.54,.02,frame,x,1.47,-1.9+j*1.28);}
  box(.05,.035,3.84,frame,x,.2,0);box(.05,.035,3.84,frame,x,2.74,0);
 }
 for(let k=0;k<5;k++)box(5.93,.018,.012,frame,0,.158,1.88+k*.028);
 // Rounded outdoor furniture gives a human scale without overpowering the product.
 const sofa=new THREE.Group();stage.add(sofa);sofa.position.set(-.6,0,-.95);
 box(2.3,.14,.92,wood,0,.44,0,sofa,.045);
 for(const x of [-1,1])for(const z of [-.34,.34])box(.065,.32,.065,wood,x,.26,z,sofa,.016);
 box(2.25,.3,.87,fabric,0,.62,0,sofa,.11);
 box(2.24,.55,.23,fabric,0,.97,-.38,sofa,.09);
 for(const x of [-1.12,1.12])box(.18,.42,.9,fabric,x,.8,0,sofa,.07);
 for(const x of [-.7,.7]){const c=box(.5,.42,.16,cushion,x,.97,-.19,sofa,.065);c.rotation.z=x*.09;}
 const rug=new THREE.Mesh(new THREE.PlaneGeometry(3.7,2.15),std('#c4bda7',1));rug.rotation.x=-Math.PI/2;rug.position.set(-.25,.118,.2);rug.receiveShadow=true;stage.add(rug);
 cylinder(.57,.57,.07,wood,-.35,.57,.45);cylinder(.22,.32,.36,wood,-.35,.35,.45);
 cylinder(.16,.12,.2,planterMat,-.35,.71,.45);cylinder(.14,.14,.015,standardSoil(),-.35,.82,.45);
 const chair=new THREE.Group();stage.add(chair);chair.position.set(1.55,0,.55);chair.rotation.y=-.45;
 box(.9,.14,.86,wood,0,.42,0,chair,.045);box(.79,.2,.72,fabric,0,.58,0,chair,.08);box(.8,.55,.18,fabric,0,.86,-.34,chair,.06);
 for(const x of [-.36,.36])for(const z of [-.3,.3])box(.055,.3,.055,wood,x,.24,z,chair,.01);
 for(const x of [-.45,.45])box(.065,.08,.9,wood,x,.81,0,chair,.02);
 // Deterministic foliage, instanced for mobile rendering.
 let seed=14;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const leafMat=new THREE.MeshStandardMaterial({color:'#6d8053',roughness:.93});
 const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),leafMat,530);leaves.castShadow=true;stage.add(leaves);
 const dummy=new THREE.Object3D();let leafIndex=0;
 function leaf(x,y,z,sx,sy,sz){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(random()*2,random()*6,random()*2);dummy.updateMatrix();leaves.setMatrixAt(leafIndex++,dummy.matrix);leaves.setColorAt(leafIndex-1,new THREE.Color().setHSL(.21+random()*.06,.16+random()*.15,.22+random()*.14));}
 function standardSoil(){return std('#565044',1);}
 function plant(x,z,height,radius,count){
  const potHeight=height>.9?.45:.3;
  cylinder(radius*.8,radius*.58,potHeight,planterMat,x,potHeight/2+.12,z);cylinder(radius*.72,radius*.72,.025,standardSoil(),x,potHeight+.12,z);
  if(height>1){cylinder(.027,.052,height*.65,wood,x,potHeight+height*.32,z);for(let k=0;k<5;k++){const branch=cylinder(.012,.018,height*.3,wood,x+(k%2?.12:-.12),height*.7,z+(k%3-.8)*.07);branch.rotation.z=(k%2?1:-1)*.45;}}
  for(let i=0;i<count;i++){const angle=random()*Math.PI*2,r=Math.sqrt(random())*radius*1.35,y=potHeight+.13+height*.52+Math.sin(random()*Math.PI)*height*.3;leaf(x+Math.cos(angle)*r,y,z+Math.sin(angle)*r,.035+random()*.06,.012+random()*.025,.05+random()*.065);}
 }
 plant(2.35,-1.28,1.85,.34,180);plant(-2.4,.9,.65,.31,100);plant(-.35,.45,.16,.09,35);
 // Low planting on the outer edge of the terrace.
 for(const x of [-3.65,3.65]){box(.57,.19,4.8,dark,x,.06,-.2,stage,.13);for(let i=0;i<100;i++){const z=-2.25+random()*4.3;leaf(x+(random()-.5)*.5,.22+random()*.32,z,.08+random()*.08,.12+random()*.1,.08+random()*.08);}}
 leaves.count=leafIndex;leaves.instanceMatrix.needsUpdate=true;
 // Warm evening lights and visibly illuminated roof details.
 const warmLights=[];
 for(const x of [-2,-.7,.7,2]){
  const fixture=cylinder(.032,.032,.018,lightMaterial,x,2.715,.7);fixture.castShadow=false;
  const light=new THREE.PointLight('#ffd29a',0,5,2);light.position.set(x,2.56,.65);scene.add(light);warmLights.push(light);
 }
 box(5.72,.012,.016,lightMaterial,0,2.71,-1.87);
 const terraceFill=new THREE.PointLight('#ffc27f',0,9,2);terraceFill.position.set(0,2.2,-1);scene.add(terraceFill);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),std('#e0e5d8',.98));floor.rotation.x=-Math.PI/2;floor.position.y=-.26;floor.receiveShadow=true;scene.add(floor);
 const dayColor=new THREE.Color('#e4e7dc'),nightColor=new THREE.Color('#172b2b');
 let visible=true,paused=matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-off');
 let interacted=false,glassValue=0,glassTarget=0,lightValue=0,lightTarget=0,frameId=0,lastTime=0,preset=null,dirty=true;
 controls.autoRotate=!paused;controls.enableDamping=!paused;
 shell.dataset.finish='anthracite';shell.dataset.light='day';
 const cameraTarget=new THREE.Vector3();
 function choose(group,selected){shell.querySelectorAll(group).forEach(b=>{const active=b===selected;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
 function userInteraction(){interacted=true;controls.autoRotate=false;preset=null;dirty=true;}
 controls.addEventListener('start',userInteraction);controls.addEventListener('change',()=>{dirty=true;});
 function targetCamera(position){interacted=true;controls.autoRotate=false;cameraTarget.set(...position);preset=cameraTarget.clone();if(paused){camera.position.copy(preset);preset=null;controls.update();}dirty=true;}
 shell.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{choose('[data-view]',b);const factor=viewport.clientWidth<650?1.24:1;const views={perspective:[8.8,5.6,10.7],front:[0,3.3,13.7],side:[13.5,4.9,1.8]};targetCamera(views[b.dataset.view].map(x=>x*factor));}));
 shell.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{userInteraction();const distance=camera.position.distanceTo(controls.target);const next=THREE.MathUtils.clamp(distance*(b.dataset.zoom==='in'?.85:1.15),7,24);targetCamera(camera.position.clone().sub(controls.target).normalize().multiplyScalar(next).add(controls.target).toArray());}));
 shell.querySelectorAll('[data-finish]').forEach(b=>b.addEventListener('click',()=>{userInteraction();choose('[data-finish]',b);shell.dataset.finish=b.dataset.finish;frame.color.set(b.dataset.finish==='stone'?'#ae9e84':'#303c3b');frame.metalness=b.dataset.finish==='stone'?.35:.6;dirty=true;}));
 const slider=shell.querySelector('#studio-glass');
 slider.addEventListener('input',()=>{userInteraction();glassTarget=Number(slider.value)/100;slider.setAttribute('aria-valuetext',glassTarget===0?'Volledig gesloten':glassTarget===1?'Volledig opengeschoven':`${slider.value} procent geopend`);shell.dataset.glass=slider.value;dirty=true;});
 shell.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{userInteraction();choose('[data-light]',b);shell.dataset.light=b.dataset.light;lightTarget=b.dataset.light==='evening'?1:0;dirty=true;}));
 viewport.addEventListener('keydown',event=>{
  if(event.target!==viewport)return;
  const vector=camera.position.clone().sub(controls.target),sphere=new THREE.Spherical().setFromVector3(vector);
  if(event.key==='ArrowLeft')sphere.theta-=.15;else if(event.key==='ArrowRight')sphere.theta+=.15;
  else if(event.key==='ArrowUp')sphere.phi=Math.max(.4,sphere.phi-.1);else if(event.key==='ArrowDown')sphere.phi=Math.min(Math.PI*.49,sphere.phi+.1);
  else if(event.key==='+'||event.key==='=')sphere.radius=Math.max(7,sphere.radius*.9);else if(event.key==='-')sphere.radius=Math.min(24,sphere.radius*1.1);else return;
  event.preventDefault();targetCamera(new THREE.Vector3().setFromSpherical(sphere).add(controls.target).toArray());
 });
 const onMotion=event=>{paused=event.detail.paused;controls.autoRotate=!paused&&!interacted;controls.enableDamping=!paused;dirty=true;start();};document.addEventListener('care4gardens:motion',onMotion);
 function tick(time){
  frameId=0;if(!visible||document.hidden)return;
  const dt=Math.min((time-lastTime)/1000||.016,.05);lastTime=time;
  const moving=Math.abs(glassTarget-glassValue)>.0005||Math.abs(lightTarget-lightValue)>.0005||preset;
  const t=paused?1:1-Math.exp(-dt*4.5);
  glassValue=THREE.MathUtils.lerp(glassValue,glassTarget,t);lightValue=THREE.MathUtils.lerp(lightValue,lightTarget,t);
  sliding.forEach(({panel,closed,open})=>panel.position.x=THREE.MathUtils.lerp(closed,open,glassValue));
  if(preset){camera.position.lerp(preset,t);if(camera.position.distanceTo(preset)<.005)preset=null;}
  if(dirty||moving||controls.autoRotate){
   scene.background.copy(dayColor).lerp(nightColor,lightValue);floor.material.color.copy(scene.background);
   hemi.intensity=THREE.MathUtils.lerp(1.8,.42,lightValue);sun.intensity=THREE.MathUtils.lerp(4.2,.5,lightValue);fill.intensity=THREE.MathUtils.lerp(1.1,.6,lightValue);
   scene.environmentIntensity=THREE.MathUtils.lerp(.6,.28,lightValue);lightMaterial.emissiveIntensity=THREE.MathUtils.lerp(.15,4,lightValue);
   warmLights.forEach(light=>light.intensity=lightValue*8);terraceFill.intensity=lightValue*13;
   controls.update(dt);renderer.render(scene,camera);dirty=false;
  }else if(!paused){controls.update(dt);}
  frameId=requestAnimationFrame(tick);
 }
 function start(){if(!frameId&&visible&&!document.hidden){lastTime=performance.now();dirty=true;frameId=requestAnimationFrame(tick);}}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frameId);frameId=0;}},{threshold:.01});observer.observe(viewport);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0;}else start();});
 new ResizeObserver(()=>{const w=viewport.clientWidth,h=viewport.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;start();}}).observe(viewport);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();shell.dataset.ready='false';shell.dataset.failed='true';shell.querySelector('#studio-status').textContent='Bekijk de sfeerbeelden hieronder';cancelAnimationFrame(frameId);});
 controls.update();renderer.render(scene,camera);
 shell.dataset.ready='true';shell.querySelector('#studio-status').textContent='Sleep om rond te kijken';
 start();
}
