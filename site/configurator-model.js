/* Lightweight, resolution-independent architectural model. No GPU or tracking required. */
(() => {
 'use strict';
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.Care4GardensModel=(state,front=false)=>{
  const width=state.width/100,depth=state.depth/100,height=2.6;
  const scale=front?Math.min(55,510/(width+1.7)):Math.min(55,530/(width*.86+depth*.65+2));
  const centerX=front?width/2:(width*.86-depth*.65)/2,centerY=front?0:(width*.28+depth*.38)/2;
  const project=(x,y,z)=>[360+((front?x:x*.86-z*.65)-centerX)*scale,305+((front?z*.11:x*.28+z*.38)-centerY-y)*scale];
  const point=p=>project(...p).map(n=>n.toFixed(2)).join(',');
  let shapes=[];
  const poly=(p,fill,extra='')=>`<polygon points="${p.map(point).join(' ')}" fill="${fill}" ${extra}/>`;
  const stroke=(p,color='#bdc5b7',w=.6,extra='')=>`<polyline points="${p.map(point).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>`;
  function box(x,y,z,w,h,d,colors=['#dddccf','#c9c9bc','#edede4'],extra=''){
   shapes.push(poly([[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]],colors[0],extra));
   shapes.push(poly([[x+w,y,z],[x+w,y,z+d],[x+w,y+h,z+d],[x+w,y+h,z]],colors[1],extra));
   shapes.push(poly([[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+d],[x,y+h,z+d]],colors[2],extra));
  }
  const frameColors=state.color==='Crème'?['#d9d6c6','#bdbcae','#f1eedf']:state.color==='Zwart'?['#292e2d','#191f1e','#4b5250']:['#46514e','#2c3935','#6f7a73'];
  const pane=state.roof.toLowerCase().includes('opaal')?'url(#cg-opal)':state.roof==='Getint Glas'?'url(#cg-tint)':'url(#cg-glass)';
  const soil=['#b4b5a6','#909b89','#cdd3c3'];
  // Plinth, paved terrace and its shadow give the object a visible physical scale.
  shapes.push(`<ellipse cx="360" cy="353" rx="${Math.min(265,(width+depth)*scale*.48)}" ry="64" fill="#65785b" opacity=".15" filter="url(#cg-shadow)"/>`);
  box(-.55,-.23,-.35,width+1.1,.22,depth+1,soil);
  box(-.45,-.01,-.23,width+.9,.10,depth+.82,['#c8cbbd','#afb8a5','#e5e6db']);
  for(let x=0;x<width+.5;x+=.65)shapes.push(stroke([[x,.095,-.2],[x,.095,depth+.56]],'#c9cebe',.7));
  for(let z=.1;z<depth+.6;z+=.65)shapes.push(stroke([[-.42,.095,z],[width+.42,.095,z]],'#c9cebe',.7));
  // The house facade is intentionally quiet: lime plaster, timber and reflective glazing.
  box(-.16,.1,-.22,width+.32,3.22,.17,['#e1dfd0','#c5c8b9','#f2f0e5']);
  const doorW=Math.min(width*.53,2.7),doorX=width*.43;
  box(doorX,.13,-.035,doorW,2.42,.018,['#79867b','#617366','#acb7a6']);
  shapes.push(poly([[doorX+.06,.19,-.011],[doorX+doorW-.06,.19,-.011],[doorX+doorW-.06,2.5,-.011],[doorX+.06,2.5,-.011]],'url(#cg-window)'));
  box(doorX+doorW/2,.15,.012,.035,2.39,.035,frameColors);
  for(let i=0;i<Math.floor(width*.29/.1);i++)box(.15+i*.1,.12,-.012,.052,2.94,.055,['#b09b7a','#958465','#c8b394']);
  // Rear supports and left-side closure sit behind the furniture.
  box(-.04,.1,0,.10,height,.10,frameColors);box(width-.06,.1,0,.10,height,.10,frameColors);
  function sideWall(value,x){
   if(value.startsWith('Open'))return;
   const onlyTriangle=value.startsWith('Spie '),isScreen=value.includes('Zip-screen'),solid=value.includes('aluminium'),polycarbonate=value.includes('geheel polycarbonaat');
   const mat=solid?frameColors[0]:isScreen?'url(#cg-screen)':polycarbonate?'url(#cg-opal)':'url(#cg-glass)';
   if(!onlyTriangle){
    shapes.push(poly([[x,.14,.12],[x,.14,depth-.07],[x,height-.03,depth-.07],[x,height+.02,.12]],mat,'stroke="#a9bbb0" stroke-width=".6"'));
    for(let z=.15;z<depth;z+=.8)box(x-.01,.14,z,.025,height-.16,.025,frameColors);
    box(x-.025,.12,.08,.05,.045,depth-.13,frameColors);
   }
   if(onlyTriangle||value.includes('spie'))shapes.push(poly([[x,height,.1],[x,height+.18,.1],[x,height,depth-.1]],'url(#cg-glass)','stroke="#839584" stroke-width=".7"'));
   if(value.includes('deur'))box(x-.02,.13,depth*.35,.045,2.17,.04,frameColors);
  }
  sideWall(state.left,0);
  // Scaled furniture and a woven rug make the volume legible.
  const sofaW=Math.min(2.2,width*.47),sofaX=Math.max(.45,width*.15),sofaZ=.48;
  box(sofaX-.12,.105,sofaZ-.1,sofaW+1.02,.008,Math.min(2.05,depth-.45),['#cac9b8','#bebfae','#d6d4c2']);
  for(let i=0;i<16;i++){const z=sofaZ-.06+i*Math.min(2.0,depth-.5)/16;shapes.push(stroke([[sofaX-.1,.116,z],[sofaX+sofaW+.86,.116,z]],'#c2c3b2',.5));}
  box(sofaX,.25,sofaZ,sofaW,.18,.78,['#9e8b70','#88795e','#b6a68c']);
  box(sofaX+.03,.43,sofaZ+.04,sofaW-.06,.22,.72,['#e3dfd0','#cbcaba','#f3efe3']);
  box(sofaX,.65,sofaZ,sofaW,.42,.17,['#d9d5c4','#bebfaf','#ebe7d9']);
  for(const x of [sofaX-.04,sofaX+sofaW-.09])box(x,.43,sofaZ,.13,.37,.8,['#d6d2c2','#bcc0af','#e9e4d6']);
  box(sofaX+.17,.65,sofaZ+.14,.42,.31,.13,['#87927b','#708168','#a6af96']);
  box(sofaX+sofaW-.61,.65,sofaZ+.14,.42,.31,.13,['#bab6a2','#aaa58c','#d1cbb7']);
  const tableZ=Math.min(sofaZ+1.14,depth-.55);
  box(sofaX+sofaW*.4,.12,tableZ,.12,.42,.12,['#947e61','#7a6c52','#b3a087']);
  box(sofaX+.18,.54,tableZ-.18,Math.min(1.35,sofaW),.07,.62,['#a08c70','#827458','#c2b095']);
  // Small pot and sculptural olive tree; foliage is deterministic across updates.
  function plant(x,z,size){
   box(x-.14*size,.1,z-.14*size,.28*size,.37*size,.28*size,['#b2afa0','#939d8c','#cecebd']);
   shapes.push(stroke([[x,.42*size,z],[x,1.42*size,z]],'#827c61',2*size));
   for(let i=0;i<32;i++){
    const a=i*2.39996,r=Math.sqrt((i+.5)/32)*.38*size;
    const [cx,cy]=project(x+Math.cos(a)*r,(1.25+Math.sin(i*2.3)*.25)*size,z+Math.sin(a)*r);
    shapes.push(`<ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="${(5+(i%4))*size}" ry="${(3+(i%3))*size}" fill="${['#879474','#a1aa8c','#687e5f','#bbc2a7'][i%4]}" transform="rotate(${i*37} ${cx} ${cy})"/>`);
   }
  }
  plant(width-.62,.52,.94);
  // Roof beams cast a soft pattern over the deck.
  for(let x=.18;x<width-.1;x+=.85)shapes.push(poly([[x,.11,.12],[x+.065,.11,.12],[x+.56,.11,depth+.4],[x+.49,.11,depth+.4]],'#74876b','opacity=".11"'));
  sideWall(state.right,width);
  if(!state.front.startsWith('Open')){
   const screen=state.front==='Zip-screen',tint=state.front.includes('getint');
   const count=Math.max(3,Math.round(width/.85)),piece=width/count;
   shapes.push(poly([[.03,.13,depth],[width-.03,.13,depth],[width-.03,height-.06,depth],[.03,height-.06,depth]],screen?'url(#cg-screen)':tint?'url(#cg-tint)':'url(#cg-glass)'));
   for(let i=0;i<=count;i++)box(i*piece-.012,.13,depth,.024,height-.16,.025,frameColors);
   box(0,.13,depth,width,.045,.05,frameColors);
   if(state.front==='Schuifpui')box(width/2-.03,.13,depth,.06,height-.15,.06,frameColors);
  }
  box(-.06,.1,depth-.07,.12,height,.12,frameColors);box(width-.06,.1,depth-.07,.12,height,.12,frameColors);
  const roofY=height+.13;
  shapes.push(poly([[0,roofY,0],[width,roofY,0],[width,roofY,depth],[0,roofY,depth]],pane,'stroke="#b6c4b6" stroke-width=".6"'));
  for(let x=.04;x<width;x+=.85){
   box(x,roofY-.04,0,.045,.06,depth,frameColors);
   if(state.roof.startsWith('Polycarbonaat'))for(let xx=x+.1;xx<Math.min(x+.8,width);xx+=.12)shapes.push(stroke([[xx,roofY+.002,0],[xx,roofY+.002,depth]],'#aebfb2',.45,'opacity=".55"'));
  }
  if(state.shade!=='Geen zonwering'){
   const shadeY=state.shade==='Bovendak-zonwering'?roofY+.025:roofY-.08;
   shapes.push(poly([[.1,shadeY,.06],[width-.1,shadeY,.06],[width-.1,shadeY,depth*.75],[.1,shadeY,depth*.75]],'#e4ddc7','opacity=".88"'));
   for(let z=.15;z<depth*.75;z+=.2)shapes.push(stroke([[.1,shadeY+.01,z],[width-.1,shadeY+.01,z]],'#c0bba7',.65));
  }
  box(-.07,roofY-.12,-.04,width+.14,.16,.12,frameColors);
  box(-.06,roofY-.1,0,.12,.14,depth+.07,frameColors);
  box(width-.06,roofY-.1,0,.12,.14,depth+.07,frameColors);
  box(-.07,roofY-.14,depth-.06,width+.14,state.gutter==='Halfronde goot'?.20:.16,.15,frameColors);
  if(state.gutter==='Halfronde goot')shapes.push(stroke([[-.07,roofY-.12,depth+.09],[width+.07,roofY-.12,depth+.09]],frameColors[2],4,'stroke-linecap="round"'));
  if(state.light!=='Geen verlichting')for(let x=.5;x<width-.25;x+=1){
   const [cx,cy]=project(x,height-.02,depth-.08),warm=state.light!=='Koud wit';
   shapes.push(`<ellipse cx="${cx}" cy="${cy}" rx="7" ry="4" fill="${warm?'#ffe0a0':'#e9f5ff'}" opacity=".3" filter="url(#cg-glow)"/><ellipse cx="${cx}" cy="${cy}" rx="2.2" ry="1.2" fill="${warm?'#ffe9b6':'#f4fbff'}"/>`);
  }
  plant(-.22,depth+.28,.65);
  // Dimension guides are part of the model, never a promise of an engineering drawing.
  function dimension(a,b,label){
   const [ax,ay]=project(...a),[bx,by]=project(...b);
   shapes.push(`<path d="M${ax},${ay} L${bx},${by}" fill="none" stroke="#9bab91" stroke-width=".8"/>`);
   for(const [x,y] of [[ax,ay],[bx,by]])shapes.push(`<path d="M${x-3},${y-5} L${x+3},${y+5}" stroke="#85977a" stroke-width=".8"/>`);
   const tx=(ax+bx)/2,ty=(ay+by)/2+15;
   shapes.push(`<text x="${tx}" y="${ty}" text-anchor="middle" fill="#697b5f" font-size="11" letter-spacing="1">${esc(label)}</text>`);
  }
  dimension([0,-.06,depth+1],[width,-.06,depth+1],`${state.width} cm`);
  if(!front)dimension([width+.65,-.06,0],[width+.65,-.06,depth],`${state.depth} cm`);
  return `<svg viewBox="0 0 720 470" role="img" aria-label="Ruimtelijke impressie: ${state.width} bij ${state.depth} centimeter, ${esc(state.color)}, ${esc(state.roof)}"><defs><filter id="cg-shadow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="14"/></filter><filter id="cg-glow"><feGaussianBlur stdDeviation="3"/></filter><linearGradient id="cg-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5ffff" stop-opacity=".15"/><stop offset=".48" stop-color="#c6ddd5" stop-opacity=".32"/><stop offset=".49" stop-color="#fff" stop-opacity=".56"/><stop offset=".52" stop-color="#fff" stop-opacity=".13"/><stop offset="1" stop-color="#8fae9e" stop-opacity=".32"/></linearGradient><linearGradient id="cg-opal"><stop stop-color="#eff1e5" stop-opacity=".92"/><stop offset="1" stop-color="#ccd6c6" stop-opacity=".88"/></linearGradient><linearGradient id="cg-tint"><stop stop-color="#a9bdb5" stop-opacity=".6"/><stop offset="1" stop-color="#405a54" stop-opacity=".65"/></linearGradient><linearGradient id="cg-window" x2="1" y2="1"><stop stop-color="#b9c6af"/><stop offset=".5" stop-color="#6f8070"/><stop offset=".51" stop-color="#8e9b87"/><stop offset="1" stop-color="#c2ceaf"/></linearGradient><pattern id="cg-screen" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#5b6a5b" fill-opacity=".8"/><path d="M0 1.5h3M1.5 0v3" stroke="#a3afa0" stroke-width=".4"/></pattern></defs>${shapes.join('')}</svg>`;
 };
})();
