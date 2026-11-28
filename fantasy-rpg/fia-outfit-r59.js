// R59 fitted independent outer-coat and tall-boot overlays. The original garment is preserved underneath.
import * as old from './fia-armour-r50.js?v=50';
import {equippedImage as oldBattle} from './fia-blades-r55.js?v=55';
export const outfitSource='r59/fia-outfit';
export const KEY='fantasy-fia-appearance-r59';
export const slots=Object.freeze({...old.slots,body:Object.freeze([...old.slots.body,'rangercoat']),feet:Object.freeze([...old.slots.feet,'rangerboots'])});
export const defaults=Object.freeze({...old.defaults});
export function appearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid Fia outfit');
 for(const [k,v] of Object.entries(value))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid Fia outfit '+k);
 return {...defaults,...value};
}
export function readAppearance(storage){try{const raw=storage.getItem(KEY);return raw===null?appearance(old.readAppearance(storage)):appearance(JSON.parse(raw))}catch{return appearance()}}
export function saveAppearance(storage,value){const g=appearance(value);try{storage.setItem(KEY,JSON.stringify(g))}catch{}return g}
export function legacyAppearance(value={}){const g=appearance(value);return {...g,body:g.body==='rangercoat'?'green':g.body,feet:g.feet==='rangerboots'?'brown':g.feet}}
// Packed atlas: 17 battle source cells at top, walk/run 4x4 sheets below; same layout for each layer.
const ranges=Object.freeze({battle:[0,1],recovery:[1,4],attack:[5,6],stance:[11,6]});
export function layerLayout(kind,index,part){
 if(!['coat','boots'].includes(part))throw Error('invalid outfit layer');
 const y0=part==='boots'?1032:0,small=kind==='field'||kind==='motion',count=small?16:ranges[kind]?.[1];
 if(!Number.isInteger(index)||index<0||index>=count||!count)throw Error('invalid outfit cell');
 if(small){const x=index%4*96,y=Math.floor(index/4)*96;return {sx:(kind==='motion'?384:0)+x,sy:y0+648+y,dx:x,dy:y,w:96,h:96}}
 const n=ranges[kind][0]+index;
 return {sx:n%6*240,sy:y0+Math.floor(n/6)*216,dx:index*240,dy:0,w:240,h:216};
}
export function cellCount(kind){if(kind==='field'||kind==='motion')return 16;if(!Object.hasOwn(ranges,kind))throw Error('invalid outfit kind');return ranges[kind][1]}
// Protect pre-existing weapon changes, recolouring, and other equipment layers, including pixels intentionally removed.
export function mergeOutfit(source,base,overlays){
 if(source.length!==base.length||source.length%4||overlays.some(p=>p.length!==source.length))throw Error('outfit dimensions');
 const result=new Uint8ClampedArray(base);
 for(let i=0;i<source.length;i+=4){
  const alpha=source[i+3],b=base[i+3];
  if(alpha!==b||(alpha>0&&[0,1,2].some(k=>Math.abs(source[i+k]-base[i+k])>2)))continue;
  for(const layer of overlays){if(layer[i+3]===255)result.set(layer.subarray(i,i+4),i);else if(layer[i+3]!==0)throw Error('outfit alpha must be binary')}
 }
 return result;
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;Object.defineProperties(c,{naturalWidth:{value:w},naturalHeight:{value:h}});return c}
function context(c){const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;return ctx}
function raster(im,w,h){const c=canvas(w,h),g=context(c);g.drawImage(im,0,0);return g.getImageData(0,0,w,h)}
export function applyOutfit(source,base,kind,value,outfit){
 const g=appearance(value),layers=[...(g.body==='rangercoat'?['coat']:[]),...(g.feet==='rangerboots'?['boots']:[])];if(!layers.length)return base;
 const [w,h]=old.dimensions[kind]??[];if((source.naturalWidth??source.width)!==w||(source.naturalHeight??source.height)!==h||(base.naturalWidth??base.width)!==w||(base.naturalHeight??base.height)!==h||outfit?.naturalWidth!==1440||outfit?.naturalHeight!==2064)throw Error('R59 outfit source size');
 const src=raster(source,w,h),b=raster(base,w,h),maps=[];
 for(const part of layers){const c=canvas(w,h),ctx=context(c);for(let i=0;i<cellCount(kind);i++){const {sx,sy,dx,dy,w:cw,h:ch}=layerLayout(kind,i,part);ctx.drawImage(outfit,sx,sy,cw,ch,dx,dy,cw,ch)}maps.push(ctx.getImageData(0,0,w,h).data)}
 b.data.set(mergeOutfit(src.data,b.data,maps));
 const out=canvas(w,h);context(out).putImageData(b,0,0);return out;
}
export function equippedImage(source,kind,value={},ornaments=null,asset=null,outfit=null){
 const g=appearance(value),legacy=legacyAppearance(g),prior=kind==='field'||kind==='motion'?old.equippedImage:oldBattle;
 const base=prior(source,kind,legacy,ornaments,asset);return applyOutfit(source,base,kind,g,outfit);
}
