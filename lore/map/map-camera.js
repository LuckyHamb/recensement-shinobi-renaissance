export class MapCamera {
  constructor(canvas, world, onChange) {
    Object.assign(this,{canvas,world,onChange,x:world.worldWidth/2,y:world.worldHeight/2,zoom:1,baseScale:1,moved:false,revision:0,animation:0});
    this.pointers=new Map(); this.bind(); this.resize();
  }
  resize() {
    const rect=this.canvas.parentElement.getBoundingClientRect();
    this.width=rect.width; this.height=rect.height; this.ratio=Math.min(globalThis.devicePixelRatio||1,2);
    this.canvas.width=Math.max(1,Math.round(rect.width*this.ratio));this.canvas.height=Math.max(1,Math.round(rect.height*this.ratio));
    this.baseScale=Math.min(rect.width/this.world.worldWidth,rect.height/this.world.worldHeight)*.93;
    this.changed();
  }
  worldToScreen(x,y){const scale=this.baseScale*this.zoom;return {x:this.width/2+(x-this.x)*scale,y:this.height/2+(y-this.y)*scale};}
  screenToWorld(x,y){const r=this.canvas.getBoundingClientRect(),s=this.baseScale*this.zoom;return {x:this.x+(x-r.left-this.width/2)/s,y:this.y+(y-r.top-this.height/2)/s};}
  cancel(){this.animation++;}
  setZoom(next,ax,ay){this.cancel();const before=ax==null?null:this.screenToWorld(ax,ay);this.zoom=Math.max(.75,Math.min(18,next));if(before){const after=this.screenToWorld(ax,ay);this.x+=before.x-after.x;this.y+=before.y-after.y;}this.clamp();this.changed();}
  pan(dx,dy){this.cancel();const s=this.baseScale*this.zoom;this.x-=dx/s;this.y-=dy/s;this.clamp();this.changed();}
  clamp(){this.x=Math.max(0,Math.min(this.world.worldWidth,this.x));this.y=Math.max(0,Math.min(this.world.worldHeight,this.y));}
  reset(){this.flyTo(this.world.worldWidth/2,this.world.worldHeight/2,1);}
  flyTo(x,y,zoom=3){
    const token=++this.animation,start={x:this.x,y:this.y,zoom:this.zoom},began=performance.now();
    const duration=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches?0:700;
    const tick=now=>{if(token!==this.animation)return;const t=duration?Math.min(1,(now-began)/duration):1,k=1-(1-t)**3;this.x=start.x+(x-start.x)*k;this.y=start.y+(y-start.y)*k;this.zoom=start.zoom+(Math.max(.75,Math.min(18,zoom))-start.zoom)*k;this.clamp();this.changed();if(t<1)requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  }
  bind(){
    const stage=this.canvas.parentElement;
    stage.addEventListener("wheel",e=>{if(e.target.closest(".event-sheet"))return;e.preventDefault();this.setZoom(this.zoom*Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.002),e.clientX,e.clientY);},{passive:false});
    stage.addEventListener("pointerdown",e=>{if(e.target.closest("button,input,select,a,.event-sheet"))return;this.cancel();this.moved=false;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);stage.focus({preventScroll:true});});
    stage.addEventListener("pointermove",e=>{
      if(!this.pointers.has(e.pointerId))return;
      const old=this.pointers.get(e.pointerId),next={x:e.clientX,y:e.clientY};
      if(Math.hypot(next.x-old.x,next.y-old.y)>2)this.moved=true;
      if(this.pointers.size===2){const other=[...this.pointers.entries()].find(([id])=>id!==e.pointerId)[1],before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);if(before>5)this.setZoom(this.zoom*after/before,(next.x+other.x)/2,(next.y+other.y)/2);}
      else this.pan(next.x-old.x,next.y-old.y);
      this.pointers.set(e.pointerId,next);
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"])stage.addEventListener(type,e=>this.pointers.delete(e.pointerId));
    stage.addEventListener("keydown",e=>{if(e.target!==stage)return;const keys={ArrowLeft:[45,0],ArrowRight:[-45,0],ArrowUp:[0,45],ArrowDown:[0,-45]};if(keys[e.key]){e.preventDefault();this.pan(...keys[e.key]);}else if(e.key==="+"||e.key==="=")this.setZoom(this.zoom*1.25);else if(e.key==="-")this.setZoom(this.zoom/1.25);else if(e.key==="Home")this.reset();});
  }
  changed(){this.revision++;this.onChange?.(this);}
}
