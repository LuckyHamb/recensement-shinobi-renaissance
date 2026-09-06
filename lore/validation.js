const text=v=>typeof v==='string'&&v.trim().length>0;
const fail=(condition,message)=>{if(!condition)throw new Error(message);};
export function validateClan(c,ids){
 fail(c&&typeof c==='object','Dossier absent.');
 for(const key of ['id','name','displayName','emblem','tagline','originVillage','v1Village','v2Village','currentVillage'])fail(text(c[key]),`${key} doit contenir du texte.`);
 fail(/^[a-z0-9-]+$/.test(c.id),'Identifiant invalide.');
 fail(['active','disappeared'].includes(c.status),'Statut invalide.');
 fail(c.v1Village==='Konoha','La V1 place tous les clans à Konoha.');
 fail(/^assets\/[a-zA-Z0-9_./-]+$/.test(c.emblem)&&!c.emblem.includes('..'),'Chemin d’emblème invalide.');
 for(const key of ['elements','specialties','tags','presentation','appearance','lifestyle'])fail(Array.isArray(c[key])&&c[key].every(text),`${key} doit être une liste de textes.`);
 for(const key of ['presentation','appearance','lifestyle','specialties'])fail(c[key].length>0,`${key} ne doit pas être vide.`);
 for(const key of ['traditions','powers'])fail(Array.isArray(c[key])&&c[key].length>0&&c[key].every(v=>text(v.title)&&text(v.text)),`${key} : titre et texte requis.`);
 fail(Array.isArray(c.timeline)&&c.timeline.length>0&&c.timeline.every(t=>text(t.id)&&text(t.period)&&text(t.title)&&text(t.text)&&typeof t.future==='boolean'),'Chronologie invalide.');
 fail(Array.isArray(c.hierarchy)&&c.hierarchy.length>0,'Hiérarchie vide.');
 const ranks=new Map(c.hierarchy.map(r=>[r.id,r]));
 fail(ranks.size===c.hierarchy.length,'Identifiant de grade en double.');
 for(const r of c.hierarchy){fail(text(r.id)&&text(r.title)&&typeof r.description==='string','Grade invalide.');fail(Number.isInteger(r.level)&&r.level>=0&&Number.isInteger(r.accessLevel)&&r.accessLevel>=0,'Les niveaux doivent être des entiers positifs ou nuls.');fail(r.parent===null||ranks.has(r.parent),'Parent de grade absent.');const visited=new Set([r.id]);let p=r.parent;while(p!==null){fail(!visited.has(p),'Cycle dans la hiérarchie.');visited.add(p);p=ranks.get(p).parent;}if(r.parent!==null)fail(r.level>ranks.get(r.parent).level,'Le niveau d’un enfant doit être supérieur à celui de son parent.');}
 fail(c.hierarchy.some(r=>r.parent===null),'Racine de hiérarchie absente.');
 fail(Array.isArray(c.techniques),'Techniques invalides.');
 fail(new Set(c.techniques.map(t=>t.id)).size===c.techniques.length,'Identifiant de technique en double.');
 for(const t of c.techniques){for(const k of ['id','name','japaneseName','rank','type','element','requirements','minimumGrade'])fail(text(t[k]),`Technique : ${k} requis.`);fail(['E','D','C','B','A','S'].includes(t.rank),'Rang de technique invalide.');fail(['public','name-only','classified','hidden'].includes(t.visibility),'Visibilité invalide.');fail(typeof t.description==='string','Description de technique invalide.');for(const k of ['secret','adminOnly','enabled'])fail(typeof t[k]==='boolean',`${k} doit être un booléen.`);fail(Number.isInteger(t.minimumHierarchyLevel)&&t.minimumHierarchyLevel>=0,'Niveau d’accès invalide.');}
 fail(Array.isArray(c.characters)&&c.characters.every(p=>text(p.id)&&text(p.name)&&text(p.role)&&text(p.biography)&&p.original===true),'Personnalités invalides.');
 fail(Array.isArray(c.relations),'Relations invalides.');for(const r of c.relations){fail(text(r.targetClan)&&r.targetClan!==c.id&&(!ids||ids.includes(r.targetClan)),'Clan cible invalide.');fail(['ALLIANCE','AMICAL','NEUTRE','MÉFIANCE','RIVALITÉ','ENNEMI'].includes(r.status),'Relation invalide.');fail(text(r.description)&&text(r.historicalReason),'Relation : contexte requis.');}
 fail(Array.isArray(c.illustrations),'Illustrations invalides.');for(const i of c.illustrations){fail(/^assets\/[a-zA-Z0-9_./-]+$/.test(i.image)&&!i.image.includes('..'),'Image invalide.');fail(text(i.caption)&&text(i.alt)&&text(i.section)&&Number.isInteger(i.width)&&Number.isInteger(i.height),'Métadonnées d’image invalides.');}
 return c;
}

