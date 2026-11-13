const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('site/index.html','utf8');
function setup(saved){
 const w=new JSDOM(html,{url:'https://example.com/care4gardens/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 w.matchMedia=()=>({matches:false,addEventListener(){}});
 w.IntersectionObserver=class{observe(){}disconnect(){}};
 w.HTMLMediaElement.prototype.pause=function(){};
 w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 if(saved)w.sessionStorage.setItem('care4gardens-plan-v1',saved);
 for(const file of ['app.js','configurator-model.js','configurator.js','integrations.js'])w.eval(fs.readFileSync('site/'+file,'utf8'));
 return w;
}
const click=(w,s)=>w.document.querySelector(s).click();
function input(w,s,value){const el=w.document.querySelector(s);el.value=value;el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));}
const w=setup(),d=w.document;
click(w,'#plan-next');input(w,'#planner-form [name=width]','640');input(w,'#planner-form [name=depth]','350');
input(w,'#planner-form [name=notes]','Eettafel & <script>een wens</script>');input(w,'#planner-form [name=installation]','Ik wil zelf monteren');
const saved=w.sessionStorage.getItem('care4gardens-plan-v1');
click(w,'#plan-next');click(w,'#plan-to-quote');
assert(d.querySelector('.atelier-summary').textContent.includes('640 × 350'));
assert(d.querySelector('.atelier-summary').textContent.includes('Zelf monteren'));
assert(!d.querySelector('.atelier-fields script'));
click(w,'#design-to-plan');
assert.equal(d.querySelector('#planner-form [name=installation]').value,'Ik wil zelf monteren');
assert(d.querySelector('#plan-summary').textContent.includes('640 × 350'));
assert.equal(d.querySelector('[data-step="2"]').hidden,false);
click(w,'#plan-to-quote');click(w,'#load-configurator');
let frame=d.querySelector('#quote-embed iframe');
assert.equal(new URL(frame.src).searchParams.get('pf_Breedte'),'640');
assert.equal(new URL(frame.src).searchParams.get('pf_Laten monteren?'),'Nee');
assert(new URL(frame.src).searchParams.get('pf_Overige opmerkingen').includes('Eettafel & <script>'));
click(w,'#plan-to-quote');
assert.equal(d.querySelector('#quote-start').hidden,false,'Returning with a plan reopens the editable design');
assert.equal(d.querySelectorAll('#quote-embed iframe').length,0);
click(w,'#load-configurator');click(w,'#edit-visual-design');click(w,'#plan-reset');
d.querySelector('[name=category][value=douglas]').checked=true;
click(w,'#plan-next');click(w,'#plan-next');click(w,'#plan-to-quote');
frame=d.querySelector('#quote-embed iframe');
assert(new URL(frame.src).searchParams.get('pf_Overige opmerkingen').includes('Douglas'));
assert(!new URL(frame.src).searchParams.has('pf_Kleur '),'A timber plan must not be converted to an aluminium product');
// Returning to the plan and handing off again replaces the old provider frame.
click(w,'#plan-reset');input(w,'#planner-form [name=notes]','Nieuwe wens');click(w,'#plan-next');click(w,'#plan-next');click(w,'#plan-to-quote');
assert.equal(d.querySelectorAll('#quote-embed iframe').length,1);
assert(new URL(d.querySelector('#quote-embed iframe').src).searchParams.get('pf_Overige opmerkingen').includes('Nieuwe wens'));
w.close();
const restored=setup(saved),rd=restored.document;
assert.equal(rd.querySelector('#planner-form [name=width]').value,'640');
assert.equal(rd.querySelector('#planner-form [name=notes]').value,'Eettafel & <script>een wens</script>');
// Values outside the aluminium model bounds remain explicit advice notes.
click(restored,'#plan-next');input(restored,'#planner-form [name=width]','150');click(restored,'#plan-next');click(restored,'#plan-to-quote');
assert(rd.querySelector('.atelier-fields').textContent.includes('150 cm'));
assert.equal(JSON.parse(restored.localStorage.getItem('care4gardens-design-v1')).width,500);
restored.close();
const malformed=setup('{not json');malformed.close();
console.log('PASS: plan restoration, bidirectional design handoff, exact provider values, special requests, input escaping, unsupported dimensions, and replacement of stale quote forms.');
