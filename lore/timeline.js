import {el,paragraph} from './common.js';
export function renderTimeline(entries,phase='V1'){const list=el('ol','timeline');for(const e of entries){const li=el('li',e.future?'future':'');li.append(el('p','section-kicker',e.period),el('h3','',e.title),paragraph(e.text));if(e.future)li.append(el('p','technique-meta',phase==='V1'?'Horizon RP · non activé en V1':'V2 · destination soumise aux accords RP'));list.append(li);}return list;}

