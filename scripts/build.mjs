import { build } from 'esbuild';
import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await build({entryPoints:['src/studio.js'],bundle:true,minify:true,format:'esm',target:['es2022'],outfile:'site/studio.bundle.js',legalComments:'linked'});
await rm('_site',{recursive:true,force:true});
await mkdir('_site',{recursive:true});
await cp('site','_site',{recursive:true,filter:path=>!path.endsWith('README.md')});
// Content versions prevent a returning visitor from mixing old controls with a new page.
const version=async file=>createHash('sha256').update(await readFile('_site/'+file)).digest('hex').slice(0,12);
let loader=await readFile('_site/studio-loader.js','utf8');
loader=loader.replace(/studio\.bundle\.js\?v=[\w.-]+/g,'studio.bundle.js?v='+await version('studio.bundle.js'));
await writeFile('_site/studio-loader.js',loader);
let shop=await readFile('_site/shop.js','utf8');
shop=shop.replace("fetch('catalogue.json')","fetch('catalogue.json?v="+await version('catalogue.json')+"')");
await writeFile('_site/shop.js',shop);
for(const page of ['index.html','collectie.html','checkout.html']){
 let html=await readFile('_site/'+page,'utf8');
 for(const file of ['styles.css','experience.css','refinement.css','configurator.css','configurator-model.js','configurator.js','app.js','integrations.js','customer-media.js','films.js','studio-loader.js','shop.css','shop.js','catalogue.js']){
  html=html.replaceAll(file+'?v=3',file+'?v='+await version(file));
 }
 for(const file of new Set(html.match(/assets\/[\w-]+\.mp4/g)||[])){
  html=html.replaceAll(file,file+'?v='+await version(file));
 }
 await writeFile('_site/'+page,html);
}
let review=await readFile('_site/review.html','utf8');
review=review.replace('src="./"','src="./?preview='+await version('index.html')+'"');
await writeFile('_site/review.html',review);
console.log('Care4Gardens MCC site built successfully.');
