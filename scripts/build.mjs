import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
await build({entryPoints:['src/studio.js'],bundle:true,minify:true,format:'esm',target:['es2022'],outfile:'site/studio.bundle.js',legalComments:'linked'});
await rm('_site',{recursive:true,force:true});
await mkdir('_site',{recursive:true});
await cp('site','_site',{recursive:true,filter:path=>!path.endsWith('README.md')});
console.log('Care4Gardens MCC site built successfully.');
