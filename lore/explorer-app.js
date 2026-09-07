import { MapCamera } from "./map/map-camera.js";
import { MapLayers } from "./map/map-layers.js";
import { LocationScene3D } from "./map/location-3d.js";

const ROOT = new URL("../", import.meta.url);
const $ = (selector) => document.querySelector(selector);
const safe = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const norm = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const url = (path) => new URL(path.replace(/^\.\//, ""), ROOT).href;
const categoryNames = { battle:"Bataille", alliance:"Alliance", discovery:"Découverte", catastrophe:"Catastrophe", politics:"Politique", migration:"Migration" };
const state = { map:null, events:[], clans:[], year:400, selected:null, camera:null, layers:null, scene3d:null, detailLoading:false };

function normalizeAssets() {
  state.events.forEach((event) => { if (event.image) event.image = url(event.image); });
  state.map.locations.forEach((location) => { if (location.detailSource) location.detailSource = url(location.detailSource); });
}

function filteredEvents() {
  const query=norm($("#lore-search").value),clan=$("#clan-filter").value,category=$("#category-filter").value,importance=$("#importance-filter").value,period=$("#period-filter").value;
  return state.events.filter(event=>{
    if(!event.enabled)return false;
    if(clan!=="all"&&!event.clans.includes(clan))return false;
    if(category!=="all"&&event.category!==category)return false;
    if(importance==="historic"&&event.importance!=="historic")return false;
    if(importance==="major"&&!['major','historic'].includes(event.importance))return false;
    if(period!=="all"){const [from,to]=period.split("-").map(Number);if(event.year<from||event.year>to)return false;}
    const locations=event.locations.map(point=>state.map.locations.find(location=>location.id===point.locationId)?.name||"");
    const clanNames=event.clans.map(id=>state.clans.find(c=>c.id===id)?.name||id);
    return !query||norm([event.year,event.title,event.summary,event.details,...clanNames,...event.figures,...locations].join(" ")).includes(query);
  });
}

function renderTimeline() {
  const track=$("#timeline-track");track.replaceChildren();
  for(let year=300;year<=400;year+=10){const tick=document.createElement("span");tick.className="timeline-tick";tick.style.left=`${year-300}%`;tick.textContent=year;track.append(tick);}
  const events=filteredEvents();
  const mapState=state.map.states.find(entry=>state.year>=entry.from&&state.year<=entry.to);
  events.forEach((event,index)=>{const button=document.createElement("button");button.type="button";button.className=`timeline-marker timeline-marker--${event.importance}${state.selected?.id===event.id?" is-selected":""}`;button.style.left=`${event.year-300}%`;button.style.setProperty("--stack",String(index%3));button.title=`${event.year} — ${event.title}`;button.setAttribute("aria-label",`${event.year} — ${event.title}`);button.addEventListener("click",()=>selectEvent(event.id));track.append(button);});
  $("#timeline-status").textContent=`${events.length} événement${events.length>1?"s":""} visible${events.length>1?"s":""} · carte en l’an ${state.year}${mapState?` · ${mapState.title}`:""}`;
  $("#timeline-summary").textContent=`${events.length} événement${events.length>1?"s":""} affiché${events.length>1?"s":""}`;
}

function relationButtons(ids,label){if(!ids?.length)return"";return `<div class="event-relations"><span>${safe(label)}</span>${ids.map(id=>{const e=state.events.find(item=>item.id===id);return e?`<button type="button" data-event-link="${safe(e.id)}">${e.year} · ${safe(e.title)}</button>`:""}).join("")}</div>`;}
function bindEventLinks(root){root.querySelectorAll("[data-event-link]").forEach(button=>button.addEventListener("click",()=>selectEvent(button.dataset.eventLink)));}

function clanLinks(event) {
  return event.clans.map(id=>{
    const clan=state.clans.find(c=>c.id===id);const name=clan?.name||id;
    return `<a href="${url(`lore/clan/?id=${encodeURIComponent(id)}`)}">${safe(name)}</a>`;
  }).join(" · ");
}

function renderEventSheet(event){
  const sheet=$("#event-sheet"),image=event.image?`<img src="${safe(event.image)}" alt="Illustration originale — ${safe(event.title)}">`:"";
  sheet.innerHTML=`<button class="event-sheet__close" type="button" aria-label="Fermer la fiche">×</button>${image}<div class="event-sheet__body"><p class="event-sheet__meta">AN ${event.year} · ${safe(categoryNames[event.category])} · ${safe(event.importance)}</p><h3>${safe(event.title)}</h3><p class="event-sheet__summary">${safe(event.summary)}</p><p>${safe(event.details)}</p><dl><div><dt>Clans impliqués</dt><dd>${clanLinks(event)}</dd></div><div><dt>Figures</dt><dd>${event.figures.map(safe).join(" · ")}</dd></div></dl>${relationButtons(event.causes,"Événements précédents")}${relationButtons(event.consequences,"Événements déclenchés")}${relationButtons(event.relatedEvents,"Événements liés")}</div>`;
  sheet.hidden=false;sheet.querySelector(".event-sheet__close").addEventListener("click",()=>sheet.hidden=true);bindEventLinks(sheet);
}

function selectEvent(id, updateHash=true){
  const event=state.events.find(item=>item.id===id);if(!event)return;
  state.selected=event;state.year=event.year;$("#year-slider").value=event.year;$("#timeline-year-label").textContent=event.year===400?"An 400 · Début du RP":`An ${event.year}`;
  state.layers.setYear(event.year);state.layers.setEvent(event);renderEventSheet(event);renderTimeline();
  const location=event.locations[0];state.camera.flyTo(location.x,location.y,location.zoom||3);
  if(updateHash)history.replaceState(null,"",`#${event.id}`);
  requestAnimationFrame(()=>document.querySelector(".timeline-marker.is-selected")?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"}));
}

function updateYear(year){state.year=Number(year);state.layers.setYear(state.year);state.selected=null;state.layers.setEvent(null);$("#event-sheet").hidden=true;$("#timeline-year-label").textContent=state.year===400?"An 400 · Début du RP":`An ${state.year}`;renderTimeline();}

function updateHud(camera){
  if(!state.layers)return;
  const lod=camera.zoom<1.5?"Monde":camera.zoom<3?"Pays":camera.zoom<5?"Région":camera.zoom<8?"Village":"Village 3D";
  $("#zoom-level").textContent=`${lod} · ${camera.zoom.toFixed(1).replace(".",",")}×`;$("#map-coordinates").textContent=`${Math.round(camera.x)} · ${Math.round(camera.y)}`;$("#lod-notice").textContent=lod==="Village 3D"?"Konoha détaillée · rendu WebGL progressif":`Vue ${lod.toLowerCase()}`;
  const km=Math.max(10,Math.round(180/camera.zoom/10)*10);$("#scale-label").textContent=`${km} km`;$("#scale-bar").style.width=`${Math.max(34,Math.min(100,km*camera.baseScale*camera.zoom/state.map.kilometersPerUnit))}px`;
  const konoha=state.map.locations.find(l=>l.id==="konoha"),distance=Math.hypot(camera.x-konoha.x,camera.y-konoha.y);
  if(camera.zoom>=6.5&&distance<120&&!state.scene3d.data&&!state.detailLoading){state.detailLoading=true;state.scene3d.load(konoha.detailSource).then(()=>{state.layers.setLocationDetail(state.scene3d.data);state.detailLoading=false;}).catch(()=>state.detailLoading=false);}
  state.scene3d.show(Boolean(state.scene3d.data&&camera.zoom>=8&&distance<80));
}

function initMap(){
  const canvas=$("#world-map-canvas");state.camera=new MapCamera(canvas,state.map,camera=>updateHud(camera));state.layers=new MapLayers(canvas,state.map,state.camera);state.scene3d=new LocationScene3D($("#location-3d-canvas"));
  const frame=()=>{state.layers.draw();requestAnimationFrame(frame);};requestAnimationFrame(frame);
  $("#zoom-in").addEventListener("click",()=>state.camera.setZoom(state.camera.zoom*1.25));$("#zoom-out").addEventListener("click",()=>state.camera.setZoom(state.camera.zoom/1.25));$("#reset-map").addEventListener("click",()=>state.camera.reset());
  $("#map-stage").addEventListener("click",event=>{if(state.camera.moved||event.target.closest("button,a,.event-sheet"))return;const location=state.layers.hitTest(state.camera.screenToWorld(event.clientX,event.clientY));if(!location)return;const sheet=$("#event-sheet");sheet.innerHTML=`<button class="event-sheet__close" type="button" aria-label="Fermer la fiche">×</button><div class="event-sheet__body"><p class="event-sheet__meta">${safe(location.type)}</p><h3>${safe(location.name)}</h3><p>${safe(location.description)}</p></div>`;sheet.hidden=false;sheet.querySelector("button").addEventListener("click",()=>sheet.hidden=true);});
  addEventListener("resize",()=>state.camera.resize());
}

function bind(){
  ["#clan-filter","#category-filter","#importance-filter","#period-filter"].forEach(selector=>$(selector).addEventListener("change",renderTimeline));
  $("#lore-search").addEventListener("input",()=>{renderTimeline();const query=$("#lore-search").value.trim(),events=filteredEvents();if(/^\d{3}$/.test(query)&&events.length===1)selectEvent(events[0].id);});
  $("#year-slider").addEventListener("input",event=>updateYear(event.target.value));
}

async function init(){
  try{
    const fetchJson=async(path)=>{const response=await fetch(url(path),{cache:"no-store"});if(!response.ok)throw new Error(path);return response.json();};
    const [map,events,registryClans]=await Promise.all([fetchJson("data/world-map.json"),fetchJson("data/world-timeline.json"),fetchJson("data/clans.json")]);
    state.map=map;state.events=events.sort((a,b)=>a.year-b.year);state.clans=registryClans;normalizeAssets();
    const select=$("#clan-filter");state.clans.forEach(clan=>{const option=document.createElement("option");option.value=clan.id;option.textContent=clan.name;select.append(option);});
    bind();initMap();renderTimeline();
    const requested=new URLSearchParams(location.search).get("clan");if(requested&&state.clans.some(c=>c.id===requested)){select.value=requested;renderTimeline();}
    const hash=location.hash.slice(1);selectEvent(state.events.some(e=>e.id===hash)?hash:"rp-begins",false);
  }catch(error){console.error("Erreur carte & chronologie",error);$("#lore-error").hidden=false;$("#world-explorer").hidden=true;}
}
init();
