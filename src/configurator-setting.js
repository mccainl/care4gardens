import * as THREE from 'three';

// Residential context is kept separate from the made-to-measure product geometry.
export function buildResidentialSetting(width,depth,{reduced=false}={}){
 const group=new THREE.Group();group.name='Brick house and garden';
 const back=-depth/2,front=depth/2,wallZ=back-.105,houseWidth=width+1.18,houseHeight=5.35;
 const resources=new Set(),keep=value=>(resources.add(value),value);
 const mat=(color,roughness=.85,metalness=0)=>keep(new THREE.MeshStandardMaterial({color,roughness,metalness}));
 const masonry=mat('#aaa399',1),trim=mat('#e5e3db',.48),zinc=mat('#626969',.45,.5),inside=mat('#b6ab98',1),curtain=mat('#e5dfd0',1);
 const timber=mat('#8d775c',.85),soil=mat('#4d4939',1),green=mat('#536546',1),grass=mat('#6f8962',1);
 function noise(seed,repeat=1){
  const data=new Uint8Array(128*128*4);let r=seed;
  for(let i=0;i<data.length;i+=4){r=(r*1664525+1013904223)>>>0;const n=160+(r>>>26);data[i]=data[i+1]=data[i+2]=n;data[i+3]=255;}
  const texture=keep(new THREE.DataTexture(data,128,128));texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.needsUpdate=true;return texture;
 }
 const cube=keep(new THREE.BoxGeometry(1,1,1));
 function box(x,y,z,w,h,d,material,parent=group){
  const mesh=new THREE.Mesh(cube,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 const doorWidth=Math.min(2.65,width*.53),doorX=width*.14;
 const windows=[{x:doorX,y:1.34,w:doorWidth,h:2.48,door:true}];
 const upstairs=width>8?3:2;
 for(let i=0;i<upstairs;i++)windows.push({x:houseWidth*((i+.5)/upstairs-.5)*.78,y:4.03,w:Math.min(1.45,houseWidth/(upstairs+1)),h:1.48});
 const holes=windows.map(v=>({x0:v.x-v.w/2-.055,x1:v.x+v.w/2+.055,y0:v.y-v.h/2-.055,y1:v.y+v.h/2+.055}));
 const house=new THREE.Group();house.name='Residential facade';group.add(house);
 // Real openings: split the load-bearing wall around the door and upper windows.
 const xs=[...new Set([-houseWidth/2,houseWidth/2,...holes.flatMap(v=>[v.x0,v.x1])])].sort((a,b)=>a-b);
 const ys=[...new Set([0,houseHeight,...holes.flatMap(v=>[v.y0,v.y1])])].sort((a,b)=>a-b);
 for(let x=0;x<xs.length-1;x++)for(let y=0;y<ys.length-1;y++){
  const cx=(xs[x]+xs[x+1])/2,cy=(ys[y]+ys[y+1])/2;
  if(!holes.some(v=>cx>v.x0&&cx<v.x1&&cy>v.y0&&cy<v.y1))box(cx,cy,wallZ-.15,xs[x+1]-xs[x],ys[y+1]-ys[y],.3,masonry,house);
 }
 // Running-bond brickwork, with individual colours, mortar joints and shallow bevels.
 const positions=[],colors=[],uvs=[],palette=['#9b806a','#aa8b70','#937863','#ad9278','#a38972','#8f7663','#b1987c','#9f856c'].map(c=>new THREE.Color(c));
 let brickCount=0;
 function quad(a,b,c,d,color){
  for(const [point,uv] of [[a,[0,0]],[b,[1,0]],[c,[1,1]],[a,[0,0]],[c,[1,1]],[d,[0,1]]]){positions.push(...point);colors.push(color.r,color.g,color.b);uvs.push(...uv);}
 }
 const course=reduced?.103:.082,brickWidth=reduced?.29:.245,joint=.008;
 for(let row=0,y=0;y<houseHeight;row++,y+=course){
  const y0=y+joint/2,y1=Math.min(y+course-joint/2,houseHeight);
  for(let col=0,x=-houseWidth/2-(row%2?brickWidth/2:0);x<houseWidth/2;col++,x+=brickWidth){
   let intervals=[[Math.max(-houseWidth/2,x+joint/2),Math.min(houseWidth/2,x+brickWidth-joint/2)]];
   for(const hole of holes)if(y1>hole.y0&&y0<hole.y1)intervals=intervals.flatMap(([a,b])=>b<=hole.x0||a>=hole.x1?[[a,b]]:[[a,Math.min(b,hole.x0)],[Math.max(a,hole.x1),b]].filter(([l,r])=>r-l>.008));
   for(const [x0,x1] of intervals){
    if(x1-x0<.012)continue;brickCount++;
    const color=palette[(row*7+col*3+Math.floor(col*row/5))%palette.length],z=wallZ+.019,bevel=reduced?0:.003;
    quad([x0+bevel,y0+bevel,z],[x1-bevel,y0+bevel,z],[x1-bevel,y1-bevel,z],[x0+bevel,y1-bevel,z],color);
    if(!reduced){
     const edge=color.clone().multiplyScalar(.88);
     quad([x0,y0,wallZ],[x1,y0,wallZ],[x1-bevel,y0+bevel,z],[x0+bevel,y0+bevel,z],edge);
     quad([x0+bevel,y1-bevel,z],[x1-bevel,y1-bevel,z],[x1,y1,wallZ],[x0,y1,wallZ],color);
     quad([x0,y0,wallZ],[x0+bevel,y0+bevel,z],[x0+bevel,y1-bevel,z],[x0,y1,wallZ],edge);
     quad([x1-bevel,y0+bevel,z],[x1,y0,wallZ],[x1,y1,wallZ],[x1-bevel,y1-bevel,z],edge);
    }
   }
  }
 }
 const brickGeo=keep(new THREE.BufferGeometry());brickGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));brickGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));brickGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));brickGeo.computeVertexNormals();
 const brickMat=keep(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94}));if(!reduced){brickMat.bumpMap=noise(34);brickMat.bumpScale=.006;}
 const brickwork=new THREE.Mesh(brickGeo,brickMat);brickwork.name='Individual facing bricks';brickwork.castShadow=true;brickwork.receiveShadow=true;house.add(brickwork);
 // Returns, upper floor, reveals and zinc coping give the house real depth.
 box(-houseWidth/2+.1,houseHeight/2,wallZ-.9,.2,houseHeight,1.8,masonry,house);
 box(houseWidth/2-.1,houseHeight/2,wallZ-.9,.2,houseHeight,1.8,masonry,house);
 box(0,houseHeight/2,wallZ-1.8,houseWidth,houseHeight,.15,inside,house);
 box(0,2.95,wallZ-.85,houseWidth,.15,1.6,trim,house);
 box(0,.01,wallZ-.8,houseWidth,.12,1.7,inside,house);
 box(0,houseHeight+.06,wallZ-.84,houseWidth+.11,.12,1.95,zinc,house);
 box(0,houseHeight-.09,wallZ+.033,houseWidth+.08,.12,.13,trim,house);
 const windowGlass=keep(new THREE.MeshPhysicalMaterial({color:'#b9ccd2',roughness:.08,metalness:.05,transmission:reduced?0:.72,thickness:.035,ior:1.5,clearcoat:1,transparent:reduced,opacity:reduced?.36:1,side:THREE.DoubleSide}));
 const glassGeo=keep(new THREE.PlaneGeometry(1,1));
 windows.forEach(v=>{
  const frame=new THREE.Group();frame.name=v.door?'Recessed patio doors':'Upper-storey window';house.add(frame);
  box(v.x,v.y,wallZ-.19,v.w+.1,v.h+.1,.12,zinc,frame);
  const recess=box(v.x,v.y,wallZ-.26,v.w,v.h,.04,inside,frame);recess.castShadow=false;
  const pane=new THREE.Mesh(glassGeo,windowGlass);pane.position.set(v.x,v.y,wallZ-.075);pane.scale.set(v.w-.09,v.h-.09,1);frame.add(pane);
  for(const side of [-1,1])box(v.x+side*v.w/2,v.y,wallZ-.04,.065,v.h+.065,.12,trim,frame);
  for(const side of [-1,1])box(v.x,v.y+side*v.h/2,wallZ-.04,v.w+.065,.065,.12,trim,frame);
  box(v.x,v.y,wallZ-.005,.052,v.h,.13,trim,frame);
  box(v.x,v.y-v.h/2-.045,wallZ+.065,v.w+.18,.065,.28,zinc,frame);
  // Pleated curtains behind the glass bring scale and a lived-in interior.
  const folds=Math.max(4,Math.round(v.w*5));
  for(const side of [-1,1])for(let i=0;i<folds;i++)box(v.x+side*(v.w/2-.08-i*.035),v.y,wallZ-.15+(i%2)*.012,.032,v.h-.13,.018,curtain,frame);
  if(v.door){box(v.x+.11,1.16,wallZ+.043,.021,.19,.03,zinc,frame);box(v.x,2.61,wallZ+.04,v.w+.2,.09,.13,zinc,frame);}
 });
 // The veranda wall plate is sealed into the masonry, not floating in front of it.
 box(0,2.895,back-.012,width+.2,.045,.17,zinc);
 // Flush porcelain terrace: small tonal changes, close joints, a slim stone edge.
 const stoneColors=['#c3beb1','#c8c3b7','#bcb8ae','#cec8bb','#c1beb5'],stones=stoneColors.map(c=>mat(c,.96));
 if(!reduced)for(let i=0;i<stones.length;i++){stones[i].bumpMap=noise(80+i,2);stones[i].bumpScale=.012;}
 const terraceW=width+1.08,terraceD=depth+1.02;
 box(0,-.005,.07,terraceW+.06,.14,terraceD+.06,mat('#a9a69b',1));
 const nx=Math.ceil(terraceW/.8),nz=Math.ceil(terraceD/.8),tw=terraceW/nx,td=terraceD/nz;
 for(let x=0;x<nx;x++)for(let z=0;z<nz;z++)box(-terraceW/2+(x+.5)*tw,.055,-terraceD/2+(z+.5)*td+.07,tw-.007,.024,td-.007,stones[(x*3+z*7)%stones.length]);
 // The lawn continues beyond the camera, so the terrace belongs to a garden.
 const lawnGeo=keep(new THREE.PlaneGeometry(70,70,16,16));lawnGeo.rotateX(-Math.PI/2);
 const lawn=new THREE.Mesh(lawnGeo,grass);lawn.name='Continuous garden lawn';lawn.position.set(0,-.078,front+7);lawn.receiveShadow=true;group.add(lawn);
 if(reduced){
  // SVG uses a painter's algorithm: keep large backing surfaces behind the small details.
  lawn.renderOrder=-20;brickwork.renderOrder=-8;
  for(const child of house.children)if(child.isMesh&&child!==brickwork)child.renderOrder=-10;
 }
 if(!reduced){grass.bumpMap=noise(74,110);grass.bumpScale=.024;grass.map=noise(19,85);grass.map.colorSpace=THREE.SRGBColorSpace;}
 // Low planting beds and a quiet timber garden boundary frame the product.
 let seed=481;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const leafGeo=keep(new THREE.SphereGeometry(1,reduced?5:8,reduced?3:6));
 const beds=new THREE.Group();beds.name='Planted garden borders';group.add(beds);
 for(const side of [-1,1]){
  const x=side*(width/2+1.02);box(x,-.035,.12,.65,.08,depth+1.7,soil,beds);
  box(x+side*.36,.025,.12,.055,.13,depth+1.78,zinc,beds);
  for(let j=0;j<Math.ceil((depth+1.5)/.5);j++){
   const z=back-.25+j*.51,height=.26+random()*.22;
   const bush=new THREE.Mesh(leafGeo,green);bush.position.set(x,height*.65,z);bush.scale.set(.3,height,.32);bush.castShadow=true;bush.receiveShadow=true;beds.add(bush);
   if(!reduced){
    for(let k=0;k<6;k++){const sprig=new THREE.Mesh(leafGeo,green);sprig.position.set(x+(random()-.5)*.42,height+random()*.18,z+(random()-.5)*.42);sprig.scale.set(.095,.12,.12);beds.add(sprig);}
   }
  }
  for(let j=0;j<Math.ceil((depth+.5)/.17);j++)box(side*(width/2+1.62),.61,back-.2+j*.17,.055,1.38,.145,timber,beds);
  for(const y of [.24,1.01])box(side*(width/2+1.65),y,back+depth/2,.045,.045,depth+.5,timber,beds);
 }
 // A few fine blades at the lawn edge are enough to break the computer-perfect line.
 if(!reduced){
  const blade=keep(new THREE.PlaneGeometry(.015,.1)),blades=new THREE.InstancedMesh(blade,mat('#6b8153',1),650),dummy=new THREE.Object3D();blades.material.side=THREE.DoubleSide;
  for(let i=0;i<650;i++){
   dummy.position.set((random()-.5)*(width+3),-.025,front+.62+random()*1.3);dummy.scale.set(1,.5+random(),1);dummy.rotation.set((random()-.5)*.5,random()*Math.PI,0);dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);
  }
  group.add(blades);
 }
 group.userData={brickCount,windowCount:windows.length,attachmentZ:back};
 const focusBounds=new THREE.Box3(new THREE.Vector3(-houseWidth/2-.06,-.1,back-.35),new THREE.Vector3(houseWidth/2+.06,houseHeight+.14,front+.9));
 return{group,focusBounds,target:new THREE.Vector3(0,2.05,-.15),dispose(){for(const resource of resources)resource.dispose();}};
}

// Outdoor sky and garden shapes produce natural glass reflections without a network asset.
export function createGardenEnvironment(){
 const scene=new THREE.Scene(),resources=[];
 const domeGeo=new THREE.SphereGeometry(35,32,16),colors=[];
 const top=new THREE.Color('#9cbdd4'),horizon=new THREE.Color('#eff0e5'),bottom=new THREE.Color('#667450');
 for(let i=0;i<domeGeo.attributes.position.count;i++){
  const y=domeGeo.attributes.position.getY(i)/35;
  const color=y>=0?horizon.clone().lerp(top,Math.pow(y,.65)):horizon.clone().lerp(bottom,Math.min(1,-y*3));colors.push(color.r,color.g,color.b);
 }
 domeGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const domeMat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide});scene.add(new THREE.Mesh(domeGeo,domeMat));resources.push(domeGeo,domeMat);
 const foliageGeo=new THREE.SphereGeometry(1,10,7),leafMat=new THREE.MeshBasicMaterial({color:'#526745'});resources.push(foliageGeo,leafMat);
 for(let i=0;i<24;i++){const angle=i*2.399,tree=new THREE.Mesh(foliageGeo,leafMat);tree.position.set(Math.cos(angle)*18,1+(i%4),Math.sin(angle)*18);tree.scale.set(3+(i%3),3.8+(i%2),3);scene.add(tree);}
 const sunGeo=new THREE.SphereGeometry(2.1,16,12),sunMat=new THREE.MeshBasicMaterial({color:new THREE.Color(6,5.6,4.8)}),sun=new THREE.Mesh(sunGeo,sunMat);sun.position.set(-12,22,10);scene.add(sun);resources.push(sunGeo,sunMat);
 return{scene,dispose(){resources.forEach(r=>r.dispose());}};
}
