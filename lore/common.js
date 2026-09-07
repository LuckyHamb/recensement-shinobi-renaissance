import {validateClan} from './validation.js';
export const ROOT = new URL('../', import.meta.url);
export const url = path => new URL(path, ROOT).href;
export const clanURL = id => url(`lore/clan/?id=${encodeURIComponent(id)}`);
export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function el(tag, className, text) { const node = document.createElement(tag); if(className) node.className = className; if(text != null) node.textContent = text; return node; }
export function link(text, href, className) { const node = el('a',className,text); node.href = href; return node; }
export function paragraph(text) { return el('p','',text); }
export async function json(path) { const response = await fetch(url(path),{cache:'no-cache'}); if(!response.ok) throw new Error(`Lecture impossible : ${path} (${response.status}).`); return response.json(); }
export function village(clan, config) { return config.SERVER_PHASE === 'V2' ? clan.v2Village : clan.v1Village; }
export function isOpen(record) { return !!record?.enabled && record.maxMembers > record.members.length; }
export function emblem(clan) { const image = el('img','emblem'); image.src = url(clan.emblem); image.alt = `Emblème ${clan.name}`; image.width = 96; image.height = 96; return image; }
export function showError(error) { const block=document.querySelector('#error-message'); if(block) block.hidden=false; const detail=document.querySelector('#error-detail'); if(detail) detail.textContent='La lecture des données a échoué. Vous pouvez réessayer ou contacter un archiviste.'; console.error('Archives :',error); }
export async function loadArchive() { const [config,records,manifest]=await Promise.all([json('data/lore-config.json'),json('data/clans.json'),json('data/clan-lore.json')]); if(!['V1','V2'].includes(config.SERVER_PHASE))throw new Error('Phase invalide.'); if(!Array.isArray(records)||!Array.isArray(manifest.clans)||new Set(manifest.clans).size!==manifest.clans.length||manifest.clans.some(id=>!(/^[a-z0-9-]+$/.test(id)))) throw new Error('Index invalide.'); const clans=await Promise.all(manifest.clans.map(id=>json(`data/lore/${id}.json`))); for(const [i,clan] of clans.entries()){validateClan(clan,manifest.clans);if(clan.id!==manifest.clans[i]||!records.some(r=>r.id===clan.id&&Array.isArray(r.members)&&r.members.every(m=>typeof m==='string')&&Number.isInteger(r.maxMembers)&&r.maxMembers>=0&&typeof r.enabled==='boolean'))throw new Error('Recensement incompatible.');} return {config,clans,records}; }
export function navigation(active='Clans') { const nav=el('nav','site-nav'); nav.setAttribute('aria-label','Navigation principale'); for(const [title,path] of [['Recensement',''],['Clans','lore/'],['Chroniques','lore/chroniques/'],['Techniques','lore/techniques/'],['⚙ Administration','lore/administration/']]){const a=link(title,url(path));if(title.includes(active))a.setAttribute('aria-current','page');nav.append(a);}return nav; }
export function footer() { const f=el('footer'); for(const text of ['Shinobi Renaissance','•','Archives publiques en lecture seule','•','© 2026 Shinobi Renaissance / LuckyHamb — Tous droits réservés.']){const span=el('span','',text);if(text==='•')span.setAttribute('aria-hidden','true');f.append(span);}return f; }

