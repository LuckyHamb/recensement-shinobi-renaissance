import { MapCamera } from "./map/map-camera.js";
import { MapLayers } from "./map/map-layers.js";
import { LocationScene3D } from "./map/location-3d.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const safe = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const norm = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const categoryNames = { battle:"Bataille", alliance:"Alliance", discovery:"Découverte", catastrophe:"Catastrophe", politics:"Politique", migration:"Migration" };
const state = { map:null, events:[], clans:[], techniques:[], year:400, selected:null, camera:null, layers:null, scene3d:null, detailLoading:false };

function showLorePanel(id, updateHash=true){
  $$('[data-lore-panel]').forEach(panel=>{const active=panel.dataset.lorePanel===id;panel.hidden=!active;panel.classList.toggle("is-active",active)});
  $$('[data-lore-target]').forEach(button=>{const active=button.dataset.loreTarget===id;button.classList.toggle("is-active",active);button.setAttribute("aria-pressed",String(active))});
  if(updateHash) history.replaceState(null,"",`#lore/${id}${state.selected&&id==="map"?`/${state.selected.id}`:""}`);
  if(id==="map") requestAnimationFrame(()=>state.camera?.resize());
}

function populateClanFilter(){const select=$("#clan-filter");state.clans.forEach(clan=>{const option=document.createElement("option");option.value=clan.id;option.textContent=clan.name;select.append(option)})}

function filteredEvents(){
  const query=norm($("#lore-search").value),clan=$("#clan-filter").value,category=$("#category-filter").value,importance=$("#importance-filter").value,period=$("#period-filter").value;
  return state.events.filter(event=>{
    if(!event.enabled)return false;if(clan!=="all"&&!event.clans.includes(clan))return false;if(category!=="all"&&event.category!==category)return false;
    if(importance==="historic"&&event.importance!=="historic")return false;if(importance==="major"&&!['major','historic'].includes(event.importance))return false;
    if(period!=="all"){const [from,to]=period.split("-").map(Number);if(event.year<from||event.year>to)return false}
    const locations=event.locations.map(point=>state.map.locations.find(location=>location.id===point.locationId)?.name||"");
    return !query||norm([event.year,event.title,event.summary,event.details,...event.clans,...event.figures,...locations].join(" ")).includes(query);
  });
}

function renderTimeline(){
  const track=$("#timeline-track");track.replaceChildren();
  for(let year=300;year<=400;year+=10){const tick=document.createElement("span");tick.className="timeline-tick";tick.style.left=`${year-300}%`;tick.textContent=year;track.append(tick)}
  const events=filteredEvents();const levels={minor:0,important:1,major:2,historic:3};
  const mapState=state.map.states.find(entry=>state.year>=entry.from&&state.year<=entry.to);
  events.forEach((event,index)=>{const button=document.createElement("button");button.type="button";button.className=`timeline-marker timeline-marker--${event.importance}${state.selected?.id===event.id?" is-selected":""}`;button.style.left=`${event.year-300}%`;button.style.setProperty("--stack",String(index%3));button.title=`${event.year} — ${event.title}`;button.setAttribute("aria-label",`${event.year} — ${event.title}, importance ${levels[event.importance]??1}`);button.addEventListener("click",()=>selectEvent(event.id));track.append(button)});
  $("#timeline-status").textContent=`${events.length} événement${events.length>1?"s":""} visible${events.length>1?"s":""} · carte en l’an ${state.year}${mapState?` · ${mapState.title}`:""}`;
}

function relationButtons(ids,label){if(!ids?.length)return"";return `<div class="event-relations"><span>${safe(label)}</span>${ids.map(id=>{const e=state.events.find(item=>item.id===id);return e?`<button type="button" data-event-link="${safe(e.id)}">${e.year} · ${safe(e.title)}</button>`:""}).join("")}</div>`}

function bindEventLinks(root){root.querySelectorAll("[data-event-link]").forEach(button=>button.addEventListener("click",()=>{showLorePanel("map");selectEvent(button.dataset.eventLink)}))}

function renderEventSheet(event){
  const sheet=$("#event-sheet"),image=event.image?`<img src="${safe(event.image)}" alt="Illustration originale — ${safe(event.title)}">`:"";
  sheet.innerHTML=`<button class="event-sheet__close" type="button" aria-label="Fermer la fiche">×</button>${image}<div class="event-sheet__body"><p class="event-sheet__meta">AN ${event.year} · ${safe(categoryNames[event.category])} · ${safe(event.importance)}</p><h3>${safe(event.title)}</h3><p class="event-sheet__summary">${safe(event.summary)}</p><p>${safe(event.details)}</p><dl><div><dt>Clans impliqués</dt><dd>${event.clans.map(id=>safe(state.clans.find(c=>c.id===id)?.name||id)).join(" · ")}</dd></div><div><dt>Figures</dt><dd>${event.figures.map(safe).join(" · ")}</dd></div></dl>${relationButtons(event.causes,"Événements précédents")}${relationButtons(event.consequences,"Événements déclenchés")}${relationButtons(event.relatedEvents,"Événements liés")}</div>`;
  sheet.hidden=false;sheet.querySelector(".event-sheet__close").addEventListener("click",()=>sheet.hidden=true);bindEventLinks(sheet);
}

function selectEvent(id,updateHash=true){
  const event=state.events.find(item=>item.id===id);if(!event)return;state.selected=event;state.year=event.year;$("#year-slider").value=event.year;$("#timeline-year-label").textContent=event.year===400?"An 400 · Début du RP":`An ${event.year}`;state.layers.setYear(event.year);state.layers.setEvent(event);renderEventSheet(event);renderTimeline();
  const location=event.locations[0];state.camera.flyTo(location.x,location.y,location.zoom||3);if(updateHash)history.replaceState(null,"",`#lore/map/${event.id}`);requestAnimationFrame(()=>document.querySelector(`.timeline-marker.is-selected`)?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"}));
}

function renderClanDetail(clan){
  const events=state.events.filter(event=>event.clans.includes(clan.id));const detail=$("#lore-clan-detail"),illustrated=events.find(event=>event.image);
  detail.innerHTML=`<div class="clan-detail__head"><span>${safe(clan.emoji)}</span><div><p>${safe(clan.motto)}</p><h3>${safe(clan.name)}</h3></div></div><div class="clan-story"><section><h4>Origines</h4><p>${safe(clan.origin)}</p></section><section><h4>Traditions</h4><p>${safe(clan.traditions)}</p></section><section><h4>Conflits & conséquences</h4><p>${safe(clan.conflicts)}</p></section><section><h4>Alliances et rivalités</h4><p>${safe(clan.alliances)}</p></section><section><h4>Héritage en l’an 400</h4><p>${safe(clan.legacy)}</p></section><section><h4>Spécialités</h4><p>${clan.specialties.map(safe).join(" · ")}</p></section><section><h4>Figures historiques</h4><p>${clan.figures.map(safe).join(" · ")}</p></section></div><div class="clan-timeline"><h4>Chronologie du clan</h4>${events.map(event=>`<button type="button" data-event-link="${safe(event.id)}"><b>${event.year}</b><span>${safe(event.title)}</span></button>`).join("")}</div>`;
  if(illustrated){const image=document.createElement("img");image.className="clan-detail__image";image.src=illustrated.image;image.alt=`Illustration originale — ${illustrated.title}`;image.loading="lazy";detail.prepend(image)}
  bindEventLinks(detail);
}

function renderClans(){const grid=$("#lore-clan-grid");state.clans.forEach((clan,index)=>{const button=document.createElement("button");button.type="button";button.innerHTML=`<span>${safe(clan.emoji)}</span><strong>${safe(clan.name)}</strong><small>${state.events.filter(e=>e.clans.includes(clan.id)).length} événements</small>`;button.addEventListener("click",()=>{$$("#lore-clan-grid button").forEach(b=>b.classList.remove("is-active"));button.classList.add("is-active");renderClanDetail(clan)});if(index===0)button.classList.add("is-active");grid.append(button)});renderClanDetail(state.clans[0])}

function renderChronicles(){const grid=$("#chronicle-grid");state.events.filter(e=>e.importance==="historic").forEach(event=>{const article=document.createElement("article");article.className="chronicle-card";article.innerHTML=`${event.image?`<img src="${safe(event.image)}" alt="Illustration originale — ${safe(event.title)}">`:"<div class='chronicle-card__year'>"+event.year+"</div>"}<div><p>AN ${event.year} · ${safe(categoryNames[event.category])}</p><h3>${safe(event.title)}</h3><span>${safe(event.summary)}</span><button type="button" data-event-link="${safe(event.id)}">Voir sur la carte</button></div>`;bindEventLinks(article);grid.append(article)})}

function renderTechniques(){const grid=$("#technique-grid");state.techniques.forEach(technique=>{const clan=state.clans.find(c=>c.id===technique.clan);const article=document.createElement("article");article.innerHTML=`<div><span>${safe(clan?.emoji||"")}</span><p>${safe(clan?.name||technique.clan)} · AN ${technique.year}</p></div><h3>${safe(technique.name)}</h3><strong>${safe(technique.type)}</strong><p>${safe(technique.description)}</p>`;grid.append(article)})}

function updateYear(year){state.year=Number(year);state.layers.setYear(state.year);state.selected=null;state.layers.setEvent(null);$("#event-sheet").hidden=true;$("#timeline-year-label").textContent=state.year===400?"An 400 · Début du RP":`An ${state.year}`;renderTimeline()}

function updateHud(camera){
  if(!state.layers)return;const lod=camera.zoom<1.5?"Monde":camera.zoom<3?"Pays":camera.zoom<5?"Région":camera.zoom<8?"Village":"Village 3D";$("#zoom-level").textContent=`${lod} · ${camera.zoom.toFixed(1).replace(".",",")}×`;$("#map-coordinates").textContent=`${Math.round(camera.x)} · ${Math.round(camera.y)}`;$("#lod-notice").textContent=lod==="Village 3D"?"Konoha détaillée · rendu WebGL progressif":`Vue ${lod.toLowerCase()}`;const km=Math.max(10,Math.round(180/camera.zoom/10)*10);$("#scale-label").textContent=`${km} km`;$("#scale-bar").style.width=`${Math.max(34,Math.min(100,km*camera.baseScale*camera.zoom/state.map.kilometersPerUnit))}px`;
  const konoha=state.map.locations.find(l=>l.id==="konoha"),distance=Math.hypot(camera.x-konoha.x,camera.y-konoha.y);if(camera.zoom>=6.5&&distance<120&&!state.scene3d.data&&!state.detailLoading){state.detailLoading=true;state.scene3d.load(konoha.detailSource).then(()=>{state.layers.setLocationDetail(state.scene3d.data);state.detailLoading=false}).catch(()=>state.detailLoading=false)}state.scene3d.show(Boolean(state.scene3d.data&&camera.zoom>=8&&distance<80));
}

function initMap(){
  const canvas=$("#world-map-canvas");state.camera=new MapCamera(canvas,state.map,camera=>updateHud(camera));state.layers=new MapLayers(canvas,state.map,state.camera);state.scene3d=new LocationScene3D($("#location-3d-canvas"));
  const frame=()=>{state.layers.draw();requestAnimationFrame(frame)};requestAnimationFrame(frame);
  $("#zoom-in").addEventListener("click",()=>state.camera.setZoom(state.camera.zoom*1.25));$("#zoom-out").addEventListener("click",()=>state.camera.setZoom(state.camera.zoom/1.25));$("#reset-map").addEventListener("click",()=>state.camera.reset());
  $("#map-stage").addEventListener("click",event=>{if(state.camera.moved||event.target.closest("button,.event-sheet"))return;const location=state.layers.hitTest(state.camera.screenToWorld(event.clientX,event.clientY));if(!location)return;const sheet=$("#event-sheet");sheet.innerHTML=`<button class="event-sheet__close" type="button" aria-label="Fermer la fiche">×</button><div class="event-sheet__body"><p class="event-sheet__meta">${safe(location.type)}</p><h3>${safe(location.name)}</h3><p>${safe(location.description)}</p></div>`;sheet.hidden=false;sheet.querySelector("button").addEventListener("click",()=>sheet.hidden=true)});
  addEventListener("resize",()=>state.camera.resize());window.addEventListener("app:viewchange",event=>{if(event.detail.view!=="lore")return;if(location.hash==="#lore")showLorePanel("map",false);requestAnimationFrame(()=>state.camera.resize())});
}

function bind(){
  $$('[data-lore-target]').forEach(button=>button.addEventListener("click",()=>showLorePanel(button.dataset.loreTarget)));
  ["#clan-filter","#category-filter","#importance-filter","#period-filter"].forEach(selector=>$(selector).addEventListener("change",renderTimeline));
  $("#lore-search").addEventListener("input",()=>{renderTimeline();const query=$("#lore-search").value.trim(),events=filteredEvents();if(/^\d{3}$/.test(query)&&events.length===1)selectEvent(events[0].id)});
  $("#year-slider").addEventListener("input",event=>updateYear(event.target.value));
  $("#validate-json").addEventListener("click",()=>{const out=$("#validation-result");try{const value=JSON.parse($("#json-validator-input").value);if(!Array.isArray(value))throw new Error("La racine doit être un tableau.");out.className="is-valid";out.textContent=`JSON valide · ${value.length} entrée${value.length>1?"s":""}.`}catch(error){out.className="is-invalid";out.textContent=`JSON invalide · ${error.message}`}});
}

async function init(){
  try{const [map,events,loreClans,techniques,registryClans]=await Promise.all(["world-map","world-timeline","lore-clans","techniques","clans"].map(name=>fetch(`./data/${name}.json`,{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error(name);return response.json()})));state.map=map;state.events=events.sort((a,b)=>a.year-b.year);state.clans=registryClans.map(registry=>{const lore=loreClans.find(item=>item.id===registry.id)||{};return {...registry,motto:lore.motto||"Une histoire encore à écrire",origin:lore.origin||"Les archives détaillées de ce clan restent accessibles depuis le registre.",traditions:lore.traditions||"Les traditions de ce clan sont conservées dans ses archives détaillées.",specialties:Array.isArray(lore.specialties)?lore.specialties:[],figures:Array.isArray(lore.figures)?lore.figures:[],conflicts:lore.conflicts||"Aucun conflit supplémentaire n’est encore indexé dans la chronologie interactive.",alliances:lore.alliances||"Relations à compléter dans la chronologie interactive.",legacy:lore.legacy||"Présent en l’an 400 dans le registre officiel.",...lore};});state.techniques=techniques;populateClanFilter();renderClans();renderChronicles();renderTechniques();bind();initMap();renderTimeline();const rawRoute=location.hash.replace(/^#lore\/?/,"");const route=(rawRoute||"map").split("/"),panel=$$('[data-lore-panel]').some(item=>item.dataset.lorePanel===route[0])?route[0]:"map";showLorePanel(panel,false);const eventId=route[1]||"rp-begins";selectEvent(eventId,panel==="map")}catch(error){console.error("Erreur Lore",error);$("#lore-error").hidden=false;$(".map-panel").hidden=true}}
init();
