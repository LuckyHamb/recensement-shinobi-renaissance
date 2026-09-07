import {createTerrain,drawTerrain} from "./terrain.js";
import {drawVillage} from "./village.js";
export const visibleAt=(item,year,zoom)=>(item.major||((item.from??0)<=year&&(item.to??9999)>=year))&&zoom>=(item.minZoom??0);
export class MapLayers{
  constructor(canvas,world,camera){
    Object.assign(this,{canvas,world,camera,year:400,selected:null,locationDetail:null,dirty:true,lastRevision:-1});
    this.terrain=createTerrain(world.terrain||[]);this.cache=document.createElement("canvas");
    this.options={terrain:true,political:true,routes:true};this.reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  setYear(year){this.year=Number(year);this.dirty=true;}
  setEvent(event){this.selected=event;this.dirty=true;}
  setLocationDetail(detail){this.locationDetail=detail;this.dirty=true;}
  path(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>{const p=this.camera.worldToScreen(x,y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});}
  landPath(ctx){ctx.beginPath();for(const land of this.world.lands){land.points.forEach(([x,y],i)=>{const p=this.camera.worldToScreen(x,y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();}}
  draw(){
    const changed=this.dirty||this.lastRevision!==this.camera.revision;
    if(!changed&&!this.selected)return;
    if(changed){this.cache.width=this.canvas.width;this.cache.height=this.canvas.height;this.drawBase(this.cache.getContext("2d"));this.lastRevision=this.camera.revision;this.dirty=false;}
    const ctx=this.canvas.getContext("2d");ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.cache,0,0);
    ctx.setTransform(this.camera.ratio,0,0,this.camera.ratio,0,0);
    if(this.selected)this.drawEvent(ctx,this.selected);
  }
  drawBase(ctx){
    const c=this.camera,w=c.width,h=c.height,s=c.baseScale*c.zoom;
    ctx.setTransform(c.ratio,0,0,c.ratio,0,0);
    const sea=ctx.createLinearGradient(0,0,w,h);sea.addColorStop(0,"#7497a2");sea.addColorStop(1,"#385f72");ctx.fillStyle=sea;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="#d2e0d01b";ctx.lineWidth=.7;
    for(let x=0;x<=1200;x+=100){const a=c.worldToScreen(x,0),b=c.worldToScreen(x,800);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    for(let y=0;y<=800;y+=100){const a=c.worldToScreen(0,y),b=c.worldToScreen(1200,y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    this.landPath(ctx);ctx.strokeStyle="#c2d7c246";ctx.lineWidth=15*s;ctx.lineJoin="round";ctx.stroke();ctx.strokeStyle="#c4d3aa55";ctx.lineWidth=6*s;ctx.stroke();ctx.fillStyle="#a9b185";ctx.fill();
    ctx.save();this.landPath(ctx);ctx.clip();
    const current=this.world.states.find(v=>this.year>=v.from&&this.year<=v.to);
    for(const country of this.world.countries){this.path(ctx,country.points);ctx.closePath();ctx.fillStyle=this.options.political?country.color:"#adb38a";ctx.fill();}
    if(this.options.terrain)drawTerrain(ctx,this.terrain,c);
    if(c.zoom>1.25){for(const river of this.world.rivers.filter(v=>visibleAt(v,this.year,c.zoom))){this.path(ctx,river.points);ctx.lineJoin="round";ctx.lineCap="round";ctx.strokeStyle="#d9ddb1";ctx.lineWidth=4*s;ctx.stroke();ctx.strokeStyle="#5e9095";ctx.lineWidth=1.7*s;ctx.stroke();}}
    for(const lake of this.world.lakes||[]){const p=c.worldToScreen(lake.x,lake.y);ctx.beginPath();ctx.ellipse(p.x,p.y,lake.rx*s,lake.ry*s,-.3,0,Math.PI*2);ctx.fillStyle=lake.color;ctx.fill();}
    if(this.options.political){for(const country of this.world.countries){this.path(ctx,country.points);ctx.closePath();ctx.strokeStyle="#394b3f55";ctx.lineWidth=1.2;ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);}}
    ctx.restore();this.landPath(ctx);ctx.strokeStyle="#405e4f";ctx.lineWidth=1.4;ctx.stroke();
    if(this.options.routes&&c.zoom>=1.5){for(const route of this.world.routes.filter(v=>visibleAt(v,this.year,c.zoom)&&current.activeRoutes.includes(v.id))){this.path(ctx,route.points);ctx.strokeStyle="#62553c99";ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle="#ead8a3";ctx.lineWidth=1.2;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);}}
    if(c.zoom<2.3){
      ctx.textAlign="center";
      for(const country of this.world.countries){const p=c.worldToScreen(...country.label);ctx.font="600 "+Math.max(11,Math.min(19,14*s))+"px Georgia";ctx.strokeStyle="#e3dfb49c";ctx.lineWidth=4;ctx.strokeText(country.name,p.x,p.y);ctx.fillStyle="#354b3d";ctx.fillText(country.name,p.x,p.y);}
      const p=c.worldToScreen(837,709);ctx.font="italic 16px Georgia";ctx.fillStyle="#d2daccaa";ctx.fillText("Mer des Brumes",p.x,p.y);
    }
    if(this.locationDetail&&c.zoom>=3.8){
      const loc=this.world.locations.find(v=>v.id===this.locationDetail.id);
      const distance=Math.hypot(c.x-loc.x,c.y-loc.y);
      if(distance<180)drawVillage(ctx,this.locationDetail,loc,c);
    }
    this.labelBoxes=[];
    for(const location of [...this.world.locations].sort((a,b)=>Number(!!b.major)-Number(!!a.major)).filter(v=>visibleAt(v,this.year,c.zoom)))this.drawLocation(ctx,location);
    if(c.zoom<2){ctx.font="11px system-ui";ctx.textAlign="left";ctx.fillStyle="#e6e3cdbb";ctx.fillText("CINQ NATIONS · ARCHIVES DU MONDE",20,h-24);}
  }
  drawLocation(ctx,loc){
    const c=this.camera,p=c.worldToScreen(loc.x,loc.y),major=loc.major;
    if(p.x<0||p.y<0||p.x>c.width||p.y>c.height)return;
    if(loc.id===this.locationDetail?.id&&c.zoom>=5)return;
    ctx.beginPath();ctx.arc(p.x,p.y,major?10:3,0,Math.PI*2);ctx.fillStyle=major?"#1d3731":"#efdbab";ctx.fill();ctx.strokeStyle=major?"#efcf87":"#596445";ctx.lineWidth=major?2:1;ctx.stroke();
    if(major){ctx.font="12px Georgia";ctx.textAlign="center";ctx.fillStyle="#f2d695";ctx.fillText(loc.symbol||"◆",p.x,p.y+4);}
    if(major||c.zoom>=2.5){
      const name=loc.name,font=major?"700 14px system-ui":"11px system-ui";ctx.font=font;ctx.textAlign="center";
      const textWidth=Math.max(ctx.measureText(name).width,major?70:0),box={x:p.x-textWidth/2-8,y:p.y+(major?17:-23),w:textWidth+16,h:major?37:17};
      if(!major&&this.labelBoxes.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))return;
      this.labelBoxes.push(box);ctx.fillStyle=major?"#152a28e8":"#f1e6c3dd";ctx.beginPath();ctx.roundRect(box.x,box.y,box.w,box.h,4);ctx.fill();ctx.fillStyle=major?"#f4e4bc":"#344c3b";ctx.fillText(name,p.x,box.y+13);
      if(major){ctx.font="10px system-ui";ctx.fillStyle=loc.status==="Ouvert"?"#a5d19b":"#c4c6b9";ctx.fillText(loc.status,p.x,box.y+28);}
    }
  }
  drawEvent(ctx,event){
    const points=event.locations||[],c=this.camera;
    if(points.length>1){this.path(ctx,points.map(p=>[p.x,p.y]));ctx.strokeStyle="#9d372acc";ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.stroke();ctx.setLineDash([]);}
    points.forEach((loc,i)=>{const p=c.worldToScreen(loc.x,loc.y),r=12+(this.reduced?0:Math.sin(performance.now()/300+i)*3);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle="#c4483933";ctx.fill();ctx.strokeStyle="#ffde9d";ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle="#b2372c";ctx.fill();});
  }
  hitTest(point){
    const match=this.world.locations.filter(v=>visibleAt(v,this.year,this.camera.zoom)).map(location=>({location,d:Math.hypot(location.x-point.x,location.y-point.y)*this.camera.baseScale*this.camera.zoom})).sort((a,b)=>a.d-b.d)[0];
    return match?.d<20?match.location:null;
  }
}
