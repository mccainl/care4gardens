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
for(const page of ['index.html','collectie.html']){
 let html=await readFile('_site/'+page,'utf8');
 for(const file of ['styles.css','experience.css','app.js','studio-loader.js']){
  html=html.replaceAll(file+'?v=3',file+'?v='+await version(file));
 }
 await writeFile('_site/'+page,html);
}
console.log('Care4Gardens MCC site built successfully.');
