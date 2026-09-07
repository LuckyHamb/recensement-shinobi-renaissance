export function drawVillage(ctx,data,location,camera){
  const s=camera.baseScale*camera.zoom,z=camera.zoom,center=camera.worldToScreen(location.x,location.y);
  const p=(x,y)=>({x:center.x+x*s,y:center.y+y*s});
  ctx.save();
  // All detail geometry stays attached to world coordinates, including building shadows.
  const outer=data.radius*s;
  ctx.beginPath();ctx.ellipse(center.x,center.y,outer,outer*.87,0,0,Math.PI*2);
  ctx.fillStyle="#b6b58a";ctx.fill();ctx.strokeStyle="#5e6651";ctx.lineWidth=4*s;ctx.stroke();ctx.strokeStyle="#e4d6ac";ctx.lineWidth=1.3*s;ctx.stroke();
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,t=p(Math.cos(a)*data.radius,Math.sin(a)*data.radius*.87);ctx.fillStyle="#79806a";ctx.fillRect(t.x-2*s,t.y-2*s,4*s,4*s);}
  for(const district of data.districts){const t=p(district.x,district.y);ctx.beginPath();ctx.ellipse(t.x,t.y,18*s,13*s,0,0,Math.PI*2);ctx.fillStyle=district.color+"75";ctx.fill();}
  ctx.lineCap="round";
  for(const road of data.roads){ctx.beginPath();road.forEach(([x,y],i)=>{const t=p(x,y);i?ctx.lineTo(t.x,t.y):ctx.moveTo(t.x,t.y);});ctx.strokeStyle="#ece0b6";ctx.lineWidth=2.4*s;ctx.stroke();}
  if(z>=5){
    for(const [x,y] of data.trees){const t=p(x,y);ctx.beginPath();ctx.arc(t.x,t.y,1.9*s,0,Math.PI*2);ctx.fillStyle="#64804e";ctx.fill();}
    for(const b of [...data.buildings].sort((a,b)=>a.y-b.y)){
      const t=p(b.x,b.y),w=b.w*s,d=b.d*s,h=(z>=8?b.h:0)*s;
      ctx.fillStyle="#35463735";ctx.fillRect(t.x-w/2+2*s,t.y-d/2+2*s,w+h,d+h);
      if(h){ctx.fillStyle="#725e46";ctx.fillRect(t.x-w/2,t.y-d/2,w,d);ctx.beginPath();ctx.moveTo(t.x+w/2,t.y-d/2-h);ctx.lineTo(t.x+w/2+h*.4,t.y-d/2);ctx.lineTo(t.x+w/2+h*.4,t.y+d/2);ctx.lineTo(t.x+w/2,t.y+d/2-h);ctx.fill();}
      ctx.fillStyle=b.color;ctx.fillRect(t.x-w/2,t.y-d/2-h,w,d);ctx.strokeStyle="#f3ddb577";ctx.lineWidth=.7;ctx.strokeRect(t.x-w/2,t.y-d/2-h,w,d);
      ctx.beginPath();ctx.moveTo(t.x-w/2,t.y-h);ctx.lineTo(t.x+w/2,t.y-h);ctx.strokeStyle="#e5ba83";ctx.stroke();
    }
  }
  const gate=p(0,44);ctx.fillStyle="#664c36";ctx.fillRect(gate.x-5*s,gate.y-2*s,10*s,3*s);
  if(z>=8){ctx.font="600 11px system-ui";ctx.textAlign="center";for(const d of data.districts){const t=p(d.x,d.y+9);ctx.lineWidth=4;ctx.strokeStyle="#efe5bf";ctx.strokeText(d.name,t.x,t.y);ctx.fillStyle="#354332";ctx.fillText(d.name,t.x,t.y);}ctx.fillText("Porte principale",gate.x,gate.y+5*s);}
  ctx.restore();
}
