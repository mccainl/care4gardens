import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// One actual, dimensioned model for both the GPU and compatibility renderers.
export function buildVeranda(state,{reduced=false}={}){
 const group=new THREE.Group();group.name='Care4Gardens veranda';
 const w=state.width/100,d=state.depth/100,h=2.63,back=-d/2,front=d/2;
 const frameColor=state.color==='Crème'?'#dcd6c4':state.color==='Zwart'?'#202723':'#3b4843';
 const materials=new Set(),geometries=new Set(),textures=new Set();
 const standard=(color,roughness=.65,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.add(m);return m;};
 function physical(parameters){const m=new THREE.MeshPhysicalMaterial(parameters);materials.add(m);return m;}
 function noiseTexture(seed=1){
  const pixels=new Uint8Array(128*128);let r=seed;
  for(let i=0;i<pixels.length;i++){r=(r*1664525+1013904223)>>>0;pixels[i]=120+(r>>>25);}
  const texture=new THREE.DataTexture(pixels,128,128,THREE.RedFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(8,8);texture.needsUpdate=true;textures.add(texture);return texture;
 }
 const frame=physical({color:frameColor,roughness:.37,metalness:.5,clearcoat:.22,clearcoatRoughness:.42});
 const stone=standard('#d9d4c5',.95),joints=standard('#b8b8a6',1),plaster=standard('#e8dfcc',.95),timber=standard('#aa8961',.68),fabric=standard('#e7e0cc',1),cushion=standard('#8b9679',1),soil=standard('#514c38',1),planter=standard('#b5ad98',.92);
 const leaf=standard('#718460',.9),screen=standard('#6a7366',.9),interior=standard('#6d7767',.95);
 const glass=physical({color:'#dce9df',roughness:.06,metalness:0,transmission:reduced?0:.94,thickness:.025,ior:1.5,envMapIntensity:1.2,clearcoat:1,transparent:reduced,opacity:reduced?.2:1,depthWrite:!reduced,side:THREE.DoubleSide});
 const tinted=physical({color:'#80958c',roughness:.08,transmission:reduced?0:.7,thickness:.04,ior:1.5,clearcoat:1,transparent:reduced,opacity:reduced?.37:1,depthWrite:!reduced,side:THREE.DoubleSide});
 const opal=physical({color:'#e3e8d8',roughness:.45,transmission:reduced?0:.25,thickness:.025,transparent:reduced,opacity:reduced?.87:1,side:THREE.DoubleSide});
 if(!reduced){stone.bumpMap=noiseTexture(8);stone.bumpScale=.025;plaster.bumpMap=noiseTexture(12);plaster.bumpScale=.018;fabric.bumpMap=noiseTexture(42);fabric.bumpScale=.016;timber.bumpMap=noiseTexture(21);timber.bumpMap.repeat.set(1,18);timber.bumpScale=.012;frame.bumpMap=noiseTexture(55);frame.bumpScale=.002;}
 const boxGeometry=new THREE.BoxGeometry(1,1,1);geometries.add(boxGeometry);
 function box(x,y,z,width,height,depth,material=frame,round=0,parent=group){
  let geo=round&&!reduced?new RoundedBoxGeometry(width,height,depth,2,Math.min(round,width/3,height/3,depth/3)):boxGeometry;
  if(reduced&&material.transparent){
   // A single, double-sided glass surface avoids overlapping translucent triangles in SVG.
   geo=new THREE.BoxGeometry(width,height,depth);const start=height<=width&&height<=depth?12:depth<=width?24:0;
   geo.setIndex(Array.from(geo.getIndex().array.slice(start,start+6)));geo.clearGroups();
  }
  geometries.add(geo);
  const mesh=new THREE.Mesh(geo,material);if(geo===boxGeometry)mesh.scale.set(width,height,depth);
  mesh.position.set(x,y,z);mesh.castShadow=material!==glass&&material!==tinted&&material!==opal;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function cylinder(x,y,z,top,bottom,height,material,segments=reduced?10:24,parent=group){
  const geo=new THREE.CylinderGeometry(top,bottom,height,segments);geometries.add(geo);const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 }
 function beam(a,b,r,material=timber,parent=group){
  const direction=new THREE.Vector3().subVectors(b,a),middle=a.clone().add(b).multiplyScalar(.5);
  const mesh=cylinder(middle.x,middle.y,middle.z,r*.65,r,direction.length(),material,reduced?5:8,parent);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return mesh;
 }
 // Floating stone plinth and individually laid porcelain tiles.
 box(0,-.13,.08,w+1.25,.26,d+1.2,joints,.06);
 box(0,.01,.08,w+1.13,.08,d+1.08,stone,.04);
 const nx=Math.ceil((w+1.08)/.8),nz=Math.ceil((d+1.04)/.8),tileW=(w+1.08)/nx,tileD=(d+1.04)/nz;
 for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++)box(-(w+1.08)/2+(ix+.5)*tileW,.06,-(d+1.04)/2+(iz+.5)*tileD+.08,tileW-.012,.025,tileD-.012,stone);
 // Architectural facade with deep window reveals and fine timber slats.
 box(0,1.69,back-.18,w+.55,3.32,.22,plaster,.035);
 const doorW=Math.min(2.6,w*.46),doorX=w*.18;
 box(doorX,1.37,back-.045,doorW+.12,2.58,.08,frame);
 box(doorX,1.37,back+.002,doorW,2.46,.025,interior);
 box(doorX,1.37,back+.025,doorW,2.46,.018,glass);
 box(doorX,1.37,back+.045,.035,2.48,.045,frame);
 box(doorX+.08,1.22,back+.085,.025,.22,.035,frame,.008);
 for(let i=0;i<Math.floor(w*.27/.095);i++)box(-w/2+.24+i*.095,1.57,back-.005,.043,2.95,.075,timber,.003);
 // Sloped roof: height is illustrative, the chosen footprint is exact.
 const slope=.2;
 for(const x of [-w/2,w/2]){
  box(x,(h+.08)/2,front,.115,h+.08,.115,frame,.008);
  box(x,(h+slope+.08)/2,back,.115,h+slope+.08,.115,frame,.008);
 }
 box(0,h+slope,back,w+.16,.15,.16,frame,.008);
 box(0,h,front,w+.18,.16,.17,frame,.008);
 const roofMaterial=state.roof==='Getint Glas'?tinted:state.roof.toLowerCase().includes('opaal')?opal:glass;
 const beams=Math.max(3,Math.ceil(w/.9));
 for(let i=0;i<=beams;i++){
  const x=-w/2+i*w/beams;
  const rafter=box(x,h+slope/2,0,i===0||i===beams?.09:.055,.11,d+.07,frame,.004);rafter.rotation.x=Math.atan(slope/d);
  if(i<beams){
   const panel=box(x+w/beams/2,h+slope/2+.045,0,w/beams-.04,.02,d-.06,roofMaterial);panel.rotation.x=Math.atan(slope/d);panel.castShadow=false;
   if(state.roof.startsWith('Polycarbonaat'))for(let q=1;q<5;q++){const rib=box(x+(w/beams)*q/5,h+slope/2+.057,0,.008,.008,d-.08,opal);rib.rotation.x=Math.atan(slope/d);}
  }
 }
 if(state.gutter==='Halfronde goot'){
  const geo=new THREE.CylinderGeometry(.115,.115,w+.18,reduced?10:28,1,false,0,Math.PI);geometries.add(geo);
  const gutter=new THREE.Mesh(geo,frame);gutter.rotation.z=-Math.PI/2;gutter.position.set(0,h-.04,front+.04);gutter.castShadow=true;group.add(gutter);
 }
 // Downpipe, fasteners and end caps make the frame read as a real product.
 cylinder(w/2+.015,h/2,front-.01,.026,.026,h,frame);
 for(const x of [-w/2,w/2])for(const y of [.18,h-.16])box(x,y,front+.064,.043,.018,.012,frame,.003);
 const sides=[];
 function side(value,sideName){
  if(value.startsWith('Open'))return;
  const isFront=sideName==='front',length=isFront?w:d,sgn=sideName==='left'?-1:1;
  const local=new THREE.Group();local.name=sideName;group.add(local);sides.push(local);
  if(isFront)local.position.z=front-.025;else{local.rotation.y=-Math.PI/2;local.position.x=sgn*(w/2-.025);}
  const triangleOnly=value.startsWith('Spie '),solid=value.includes('aluminium'),isScreen=value.includes('Zip-screen'),isPoly=value.includes('geheel polycarbonaat'),isSliding=value.includes('schuifwand')||value.includes('Schuifpui'),mat=isScreen?screen:solid?frame:isPoly?opal:value.includes('getint')?tinted:glass;
  if(!triangleOnly){
   const count=isScreen||solid?1:Math.max(2,Math.ceil(length/.95)),pw=(length-.13)/count;
   for(let i=0;i<count;i++){
    const x=-length/2+.065+pw*(i+.5),offset=isSliding?i*.008:0;
    box(x,1.34,offset,pw-.008,2.45,.018,mat,0,local);
    if(!solid&&!isScreen){box(x-pw/2,1.34,offset,.012,2.46,.024,frame,0,local);box(x,.125,offset,pw,.025,.035,frame,0,local);}
    if(isSliding)box(x+pw*.4,1.25,offset+.024,.024,.15,.035,frame,.006,local);
   }
   box(0,.103,0,length-.08,.035,.055,frame,0,local);box(0,h-.105,0,length-.08,.042,.05,frame,0,local);
   if(value.includes('deur')){box(-length*.2,1.18,.02,.035,2.1,.045,frame,0,local);box(-length*.1,1.18,.055,.14,.024,.025,frame,0,local);}
   if(value.includes('Schuifpui'))box(0,1.34,0,.05,2.45,.06,frame,0,local);
  }
  if(!isFront&&(triangleOnly||value.includes('spie'))){
   const points=[-length/2,h-.06,0,-length/2,h+.14,0,length/2,h-.06,0];
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.computeVertexNormals();geometries.add(geo);local.add(new THREE.Mesh(geo,value.includes('polycarbonaat')?opal:glass));
  }
 }
 side(state.front,'front');side(state.left,'left');side(state.right,'right');
 if(state.shade!=='Geen zonwering'){
  const shade=standard('#d9cfb7',.95),above=state.shade==='Bovendak-zonwering';
  const awning=box(0,h+slope/2+(above?.095:-.12),-.08,w-.18,.018,d*.78,shade);awning.rotation.x=Math.atan(slope/d);
  box(0,h+slope-(above?-.1:.12),back+.05,w-.15,.08,.11,frame,.02);
 }
 // Outdoor seating with soft cushions, seams, fine legs and a round oak table.
 const sofa=new THREE.Group();sofa.position.set(-Math.min(.55,w*.09),0,back+.78);group.add(sofa);
 const sw=Math.min(2.2,w*.52),fabricShadow=standard('#d6cfbb',1);
 box(0,.4,0,sw,.15,.87,timber,.035,sofa);
 for(const x of [-sw/2+.14,sw/2-.14])for(const z of [-.32,.32])cylinder(x,.25,z,.028,.025,.27,timber,10,sofa);
 for(const x of [-sw/4,sw/4])box(x,.61,.02,sw/2-.025,.27,.79,fabric,.105,sofa);
 box(0,.92,-.33,sw,.5,.2,fabric,.075,sofa);
 for(const x of [-sw/2,sw/2])box(x,.69,0,.16,.39,.87,fabricShadow,.065,sofa);
 for(const x of [-sw*.29,sw*.29]){const pillow=box(x,.91,-.14,.43,.4,.16,cushion,.055,sofa);pillow.rotation.z=x*.08;}
 const rug=standard('#c5bca5',1);if(!reduced){rug.bumpMap=noiseTexture(7);rug.bumpScale=.02;}
 box(-.2,.084,back+Math.min(1.66,d*.55),Math.min(3.45,w-.4),.008,Math.min(2.05,d-.5),rug,.015);
 const tableZ=back+Math.min(1.72,d-.48);
 cylinder(-.24,.54,tableZ,.53,.53,.07,timber);cylinder(-.24,.31,tableZ,.18,.24,.42,timber);
 const ceramic=standard('#e7e1cf',.45);cylinder(-.38,.62,tableZ-.07,.095,.07,.13,ceramic,16);cylinder(-.1,.598,tableZ+.08,.09,.09,.025,ceramic,16);
 if(w>=4&&d>=2.5){
  const chair=new THREE.Group();chair.position.set(w/2-.88,0,front-.7);chair.rotation.y=-.48;group.add(chair);
  box(0,.4,0,.77,.12,.74,timber,.025,chair);box(0,.55,.01,.71,.2,.67,fabric,.065,chair);box(0,.82,-.29,.72,.44,.17,fabric,.055,chair);
  for(const x of [-.3,.3])for(const z of [-.27,.27])box(x,.24,z,.04,.3,.04,timber,.008,chair);
  for(const x of [-.39,.39])box(x,.72,0,.04,.05,.72,timber,.01,chair);
 }
 // Seeded olive foliage is instanced on the GPU and kept deliberately light in fallback.
 let seed=72;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function plant(x,z,scale){
  cylinder(x,.34*scale,z,.23*scale,.17*scale,.5*scale,planter);
  cylinder(x,.596*scale,z,.21*scale,.21*scale,.012,soil);
  beam(new THREE.Vector3(x,.5*scale,z),new THREE.Vector3(x+.035*scale,1.6*scale,z),.028*scale);
  for(let i=0;i<5;i++){const a=i*2.3;beam(new THREE.Vector3(x,1.05*scale,z),new THREE.Vector3(x+Math.cos(a)*.3*scale,1.65*scale,z+Math.sin(a)*.3*scale),.008*scale);}
  const count=reduced?28:220,geo=new THREE.SphereGeometry(1,reduced?4:7,reduced?3:5);geometries.add(geo);
  const leaves=reduced?null:new THREE.InstancedMesh(geo,leaf,count),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
   const a=random()*Math.PI*2,r=Math.sqrt(random())*.47*scale;
   dummy.position.set(x+Math.cos(a)*r,(1.45+random()*.43)*scale,z+Math.sin(a)*r);dummy.scale.set((.04+random()*.06)*scale,.017*scale,(.065+random()*.04)*scale);dummy.rotation.set(random()*2,random()*6,random()*3);dummy.updateMatrix();
   if(leaves){leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.22+random()*.03,.17,.27+random()*.18));}
   else{const m=new THREE.Mesh(geo,leaf);m.position.copy(dummy.position);m.scale.copy(dummy.scale).multiplyScalar(2);m.rotation.copy(dummy.rotation);group.add(m);}
  }
  if(leaves){leaves.castShadow=true;group.add(leaves);}
 }
 plant(-w/2-.26,front+.24,.72);plant(w/2-.48,back+.62,.9);
 const lightOn=state.light!=='Geen verlichting';
 if(lightOn){
  const warm=state.light!=='Koud wit',color=warm?'#ffd99b':'#e3f2ff';
  const lamp=standard(color,.35);lamp.emissive.set(color);lamp.emissiveIntensity=reduced?.3:2;
  for(let i=0;i<beams;i++){
   const x=-w/2+(i+.5)*w/beams;cylinder(x,h-.09,front-.1,.026,.026,.018,lamp,12);
   if(!reduced){const light=new THREE.PointLight(color,2.5,3.5,2);light.position.set(x,h-.2,front-.13);group.add(light);}
  }
 }
 group.userData={width:w,depth:d,frameColor,front:state.front,roof:state.roof,lightOn};
 return {group,width:w,depth:d,dispose(){for(const geo of geometries)geo.dispose();for(const mat of materials)mat.dispose();for(const texture of textures)texture.dispose();}};
}
