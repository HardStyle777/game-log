// R55: seven formerly overlapping blade poses; keep the steel silhouette and grips.
import {equippedImage as exposedImage} from './fia-blades-r54.js?v=54';
import {equippedImage as armourImage,appearance} from './fia-armour-r50.js?v=50';
const W=240,H=216;
const segments={recovery:{0:[[91,145,70,169],[158,138,183,168]],1:[[83,182,52,186],[166,160,187,190]],2:[[72,178,99,188],[127,179,162,188]],3:[[84,168,58,185],[168,154,194,181]]},attack:{3:[[103,134,62,148],[119,104,80,118]]},stance:{0:[[113,117,88,98],[126,117,150,94]],1:[[88,119,70,137],[113,125,80,136]]}};
const rects=[[31,2,71,34],[136,2,70,33]];
export function materialCells(kind){return Object.keys(segments[kind]??{}).map(Number)}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;Object.defineProperties(c,{naturalWidth:{value:w},naturalHeight:{value:h}});return c}
function context(c){const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;return g}
function raster(im){const c=canvas(im.naturalWidth??im.width,im.naturalHeight??im.height),g=context(c);g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height)}
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
function coordinate(x,y,[rx,ry,tx,ty]){const dx=tx-rx,dy=ty-ry,L=Math.hypot(dx,dy);return [((x-rx)*dx+(y-ry)*dy)/(L*L),((x-rx)*(-dy)+(y-ry)*dx)/L,L]}
export function materialMasks(source,kind,cell){
 const segs=segments[kind]?.[cell];if(!segs)return null;
 if(source.length!==W*H*4)throw Error('R55 material source size');
 const masks=[new Uint8Array(W*H),new Uint8Array(W*H)];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x,j=i*4,r=source[j],g=source[j+1],b=source[j+2],a=source[j+3],lo=Math.min(r,g,b),hi=Math.max(r,g,b);
  if(!a||lo<42||hi-lo>Math.max(17,hi*.23)||b<r-14||b<g-19)continue;
  for(let slot=0;slot<2;slot++){const [t,d]=coordinate(x,y,segs[slot]);if(t>=0&&t<=1.07&&Math.abs(d)<=4.8-2*Math.max(0,Math.min(t,1))){masks[slot][i]=1;break}}
 }
 return masks;
}
function textureRGB(original,j,x,y,spec,slot,asset){
 const [t,d,L]=coordinate(x,y,spec),[sx,sy,w,h]=rects[slot],ax=0,ay=20,bx=w-1,by=3,sl=Math.hypot(bx-ax,by-ay),ex=(bx-ax)/sl,ey=(by-ay)/sl;
 const px=Math.round(ax+Math.max(0,Math.min(t,1))*(bx-ax)-ey*d*sl/L),py=Math.round(ay+Math.max(0,Math.min(t,1))*(by-ay)+ex*d*sl/L);
 const q=((sy+py)*asset.width+sx+px)*4,inside=px>=0&&px<w&&py>=0&&py<h&&asset.data[q+3]>127;
 const r=original[j],g=original[j+1],b=original[j+2],lum=.299*r+.587*g+.114*b,accent=slot===0?[.75,1.10,.97]:[1.13,.96,.77];
 let delta=[0,0,0];if(inside){const a=asset.data,light=.299*a[q]+.587*a[q+1]+.114*a[q+2];delta=[a[q]-light,a[q+1]-light,a[q+2]-light]}
 return [r,g,b].map((v,i)=>clamp(v*.52+lum*.48*accent[i]+delta[i]*.42));
}
export function equippedImage(source,kind,value={},ornaments=null,asset=null){
 const g=appearance(value),active=[g.main==='engraved',g.offhand==='engraved'],cells=materialCells(kind);
 const prior=exposedImage(source,kind,g,ornaments,asset);if(!cells.length||!active.some(Boolean))return prior;
 if(!asset||(asset.naturalWidth??asset.width)!==416||(asset.naturalHeight??asset.height)!==104)throw Error('R55 material asset');
 const bare=armourImage(source,kind,{...g,main:'dagger',offhand:'dagger'},ornaments,asset),src=raster(source),material=raster(asset),base=raster(bare);
 const out=canvas(src.width,src.height),ctx=context(out);ctx.drawImage(prior,0,0);
 for(const cell of cells){
  const raw=new Uint8ClampedArray(W*H*4),p=new ImageData(W,H);
  for(let y=0;y<H;y++){const j=(y*src.width+cell*W)*4;raw.set(src.data.subarray(j,j+W*4),y*W*4);p.data.set(base.data.subarray(j,j+W*4),y*W*4)}
  const masks=materialMasks(raw,kind,cell);
  for(let slot=0;slot<2;slot++)if(active[slot])for(let i=0;i<W*H;i++)if(masks[slot][i]){const j=i*4;
   // Preserve pixels covered by separately equipped armour or ornaments.
   if(p.data[j+3]!==raw[j+3]||[0,1,2].some(k=>Math.abs(p.data[j+k]-raw[j+k])>2))continue;
   p.data.set(textureRGB(raw,j,i%W,Math.floor(i/W),segments[kind][cell][slot],slot,material),j);
  }
  ctx.putImageData(p,cell*W,0);
 }
 return out;
}
