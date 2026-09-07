import fs from 'node:fs';import path from 'node:path';import {root,validateAll} from './validate.mjs';
validateAll();const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','style.css','script.js','roster.js','roster-tab.js','registry-lore.css','LICENSE','.nojekyll','404.html'])fs.copyFileSync(path.join(root,file),path.join(out,file));
for(const dir of ['lore','data','assets'])fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true});
console.log('Static build ready: dist/ — HTML, CSS, JavaScript, JSON, assets.');

