import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createTerrain} from "../lore/map/terrain.js";
import {visibleAt} from "../lore/map/map-layers.js";
const read=p=>JSON.parse(fs.readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const map=read("data/world-map.json"),events=read("data/world-timeline.json");
test("Five nations visible at every historical year; future remains unwritten",()=>{
 for(const id of ["konoha","suna","kiri","kumo","iwa"]){const loc=map.locations.find(l=>l.id===id);assert.ok(loc?.major);assert.ok(loc.status);for(const year of [300,350,399,400])assert.ok(visibleAt(loc,year,1));}
 assert.equal(Math.min(...events.map(e=>e.year)),300);assert.equal(Math.max(...events.map(e=>e.year)),400);
 const ids=new Set(events.map(e=>e.id));for(const e of events){for(const id of [...e.causes,...e.consequences,...e.relatedEvents])assert.ok(ids.has(id));for(const p of e.locations)assert.ok(map.locations.some(l=>l.id===p.locationId));}
});
test("Deterministic terrain and progressively loaded village use stable coordinates",()=>{
 assert.deepEqual(createTerrain(map.terrain),createTerrain(map.terrain));assert.ok(createTerrain(map.terrain).length>500);
 const village=read("data/locations/konoha.json");assert.ok(village.buildings.length>30);assert.ok(village.loadAtZoom<village.detailAtZoom);assert.ok(village.detailAtZoom<village.render3dAtZoom);
});
test("Navigation never restores the removed Techniques tab",()=>{
 for(const p of ["index.html","lore/index.html","lore/clan/index.html","lore/chroniques/index.html","lore/explorer/index.html"]){const html=fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");assert.doesNotMatch(html,/<(?:a|button)[^>]*>\s*Techniques?\s*</i);assert.doesNotMatch(html,/href=["'][^"']*\/techniques\//i);}
});
test("Historical state covers each year once",()=>{
 for(let y=300;y<=400;y++)assert.equal(map.states.filter(s=>y>=s.from&&y<=s.to).length,1);
});
