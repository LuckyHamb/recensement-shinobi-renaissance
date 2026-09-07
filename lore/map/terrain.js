// Seeded geometry keeps terrain identical across resolutions and zoom levels.
export function createTerrain(zones) {
  return zones.flatMap((zone,index)=>{
    let seed=(index+1)*1879;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    return Array.from({length:zone.count},()=>{
      const t=random()*(zone.points.length-1),i=Math.floor(t),a=zone.points[i],b=zone.points[Math.min(i+1,zone.points.length-1)];
      return {type:zone.type,x:a[0]+(b[0]-a[0])*(t-i)+(random()-.5)*zone.spread*2,y:a[1]+(b[1]-a[1])*(t-i)+(random()-.5)*zone.spread*2,size:3+random()*10,tone:random()};
    });
  }).sort((a,b)=>a.y-b.y);
}
export function drawTerrain(ctx,items,camera){
  const s=camera.baseScale*camera.zoom,z=camera.zoom;
  for(const item of items){
    const p=camera.worldToScreen(item.x,item.y),r=item.size*s;
    if(p.x < -r*3||p.x>camera.width+r*3||p.y< -r*3||p.y>camera.height+r*3)continue;
    if(item.type==="forest"){
      const h=Math.max(2, r*.75);ctx.fillStyle=item.tone>.5?"#667e53":"#587549";
      ctx.beginPath();ctx.ellipse(p.x+h*.15,p.y+h*.35,h*.82,h*.36,0,0,Math.PI*2);ctx.fillStyle="#48614455";ctx.fill();
      ctx.beginPath();ctx.moveTo(p.x,p.y-h);ctx.lineTo(p.x-h*.6,p.y+h*.35);ctx.lineTo(p.x+h*.6,p.y+h*.35);ctx.closePath();ctx.fillStyle=item.tone>.5?"#70874f":"#53734b";ctx.fill();
      if(z>2){ctx.beginPath();ctx.moveTo(p.x,p.y-h);ctx.lineTo(p.x,p.y+h*.35);ctx.lineTo(p.x-h*.6,p.y+h*.35);ctx.fillStyle="#99a66a88";ctx.fill();}
    }else if(item.type==="mountain"||item.type==="plateau"){
      const h=r*(item.type==="plateau"?.55:1.25);
      ctx.fillStyle="#454e3c25";ctx.beginPath();ctx.ellipse(p.x+r*.5,p.y+r*.2,r*1.5,r*.4,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(p.x-r,p.y);ctx.lineTo(p.x-r*.13,p.y-h);ctx.lineTo(p.x+r,p.y);ctx.closePath();ctx.fillStyle="#777e6b";ctx.fill();
      ctx.beginPath();ctx.moveTo(p.x-r,p.y);ctx.lineTo(p.x-r*.13,p.y-h);ctx.lineTo(p.x+r*.15,p.y-h*.2);ctx.closePath();ctx.fillStyle="#c6c4a7";ctx.fill();
      if(z>1.5){ctx.beginPath();ctx.moveTo(p.x-r*.13,p.y-h);ctx.lineTo(p.x+r*.18,p.y-h*.64);ctx.lineTo(p.x-r*.27,p.y-h*.72);ctx.closePath();ctx.fillStyle="#e5ddbd";ctx.fill();}
    }else if(item.type==="dune"){
      ctx.beginPath();ctx.ellipse(p.x,p.y,r*1.5,r*.38,-.2,Math.PI,Math.PI*2);ctx.strokeStyle="#ac92554a";ctx.lineWidth=Math.max(.7,s*.7);ctx.stroke();
      if(z>1.4){ctx.translate(0,2*s);ctx.strokeStyle="#ede0ac88";ctx.stroke();ctx.translate(0,-2*s);}
    }else if(item.type==="marsh"){
      ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.32,0,0,Math.PI*2);ctx.fillStyle="#638b7b30";ctx.fill();
      if(z>2){ctx.strokeStyle="#536f57";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-2*s,p.y-3*s);ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+s,p.y-4*s);ctx.stroke();}
    }else{
      const g=ctx.createRadialGradient(p.x-r*.4,p.y-r*.3,0,p.x,p.y,r*1.6);g.addColorStop(0,"#e2d6a655");g.addColorStop(.55,"#727f4b22");g.addColorStop(1,"#62704600");ctx.fillStyle=g;ctx.fillRect(p.x-r*2,p.y-r*2,r*4,r*4);
    }
  }
}
