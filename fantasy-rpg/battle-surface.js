// Keep the battle in stage coordinates while drawing at the display's pixel density.
const MAX_STAGE_SCALE = 4;

export function createBattleSurface(canvas, context, {w, h}) {
 let cssWidth = canvas.getBoundingClientRect().width;
 const measure = () => { cssWidth = canvas.getBoundingClientRect().width; };
 if (typeof ResizeObserver === 'function') {
  const observer = new ResizeObserver(([entry]) => { cssWidth = entry.contentRect.width; });
  observer.observe(canvas);
 } else {
  window.addEventListener('resize', measure);
 }

 return {
  fit() {
   const ratio = (window.devicePixelRatio || 1) * (window.visualViewport?.scale || 1);
   const requested = Math.min(w * MAX_STAGE_SCALE, Math.max(w, cssWidth * ratio));
   // A multiple of six preserves the 6:5 stage aspect ratio in physical pixels.
   const width = Math.ceil(requested / 6) * 6;
   const scale = width / w;
   const height = Math.round(h * scale);
   if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
   }
   context.setTransform(scale, 0, 0, scale, 0, 0);
   context.imageSmoothingEnabled = false;
   return scale;
  }
 };
}
