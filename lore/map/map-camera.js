export class MapCamera {
  constructor(canvas, world, onChange) {
    this.canvas = canvas; this.world = world; this.onChange = onChange;
    this.x = world.worldWidth / 2; this.y = world.worldHeight / 2; this.zoom = 1;
    this.baseScale = 1; this.drag = null; this.moved = false;
    this.bind(); this.resize();
  }
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * ratio)); this.canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    this.canvas.style.width = `${rect.width}px`; this.canvas.style.height = `${rect.height}px`;
    this.baseScale = Math.min(this.canvas.width / ratio / this.world.worldWidth, this.canvas.height / ratio / this.world.worldHeight) * 0.94;
    this.ratio = ratio; this.changed();
  }
  screenToWorld(sx, sy) { const rect = this.canvas.getBoundingClientRect(); return { x: this.x + (sx - rect.left - rect.width / 2) / (this.baseScale * this.zoom), y: this.y + (sy - rect.top - rect.height / 2) / (this.baseScale * this.zoom) }; }
  worldToScreen(x, y) { const rect = this.canvas.getBoundingClientRect(); return { x: rect.width / 2 + (x - this.x) * this.baseScale * this.zoom, y: rect.height / 2 + (y - this.y) * this.baseScale * this.zoom }; }
  setZoom(next, anchorX, anchorY) {
    const before = anchorX == null ? null : this.screenToWorld(anchorX, anchorY);
    this.zoom = Math.max(0.75, Math.min(10, next));
    if (before) { const after = this.screenToWorld(anchorX, anchorY); this.x += before.x - after.x; this.y += before.y - after.y; }
    this.clamp(); this.changed();
  }
  pan(dx, dy) { this.x -= dx / (this.baseScale * this.zoom); this.y -= dy / (this.baseScale * this.zoom); this.clamp(); this.changed(); }
  clamp() { this.x = Math.max(0, Math.min(this.world.worldWidth, this.x)); this.y = Math.max(0, Math.min(this.world.worldHeight, this.y)); }
  reset() { this.flyTo(this.world.worldWidth / 2, this.world.worldHeight / 2, 1); }
  flyTo(x, y, zoom = 3) {
    const start = { x: this.x, y: this.y, zoom: this.zoom }; const began = performance.now(); const duration = 720;
    const step = (now) => { const raw = Math.min(1, (now - began) / duration); const t = 1 - Math.pow(1 - raw, 3); this.x = start.x + (x - start.x) * t; this.y = start.y + (y - start.y) * t; this.zoom = start.zoom + (Math.max(.75, Math.min(10, zoom)) - start.zoom) * t; this.changed(); if (raw < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  bind() {
    const stage = this.canvas.parentElement;
    stage.addEventListener("wheel", (event) => { event.preventDefault(); this.setZoom(this.zoom * (event.deltaY < 0 ? 1.16 : 0.86), event.clientX, event.clientY); }, { passive: false });
    stage.addEventListener("pointerdown", (event) => { if (event.target.closest?.("button, input, select, a, .event-sheet")) return; this.drag = { x: event.clientX, y: event.clientY }; this.moved = false; stage.setPointerCapture(event.pointerId); });
    stage.addEventListener("pointermove", (event) => { if (!this.drag) return; const dx = event.clientX - this.drag.x; const dy = event.clientY - this.drag.y; if (Math.abs(dx) + Math.abs(dy) > 2) this.moved = true; this.pan(dx, dy); this.drag = { x: event.clientX, y: event.clientY }; });
    stage.addEventListener("pointerup", () => { this.drag = null; });
    stage.addEventListener("keydown", (event) => { const amount = 45; if (event.key === "+") this.setZoom(this.zoom * 1.2); else if (event.key === "-") this.setZoom(this.zoom / 1.2); else if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)) { event.preventDefault(); this.pan(event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0, event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0); } });
  }
  changed() { this.onChange?.(this); }
}
