import * as old from './fia-gear-r63.js?v=63.1';
import {cloakSource,cloakPlacements,cloakPlan,applyCloak} from './fia-cloak-layer-r64.js?v=64';
export {cloakSource};
export {outfitSource,cellCount,layerLayout} from './fia-gear-r63.js?v=63.1';
export const KEY='fantasy-fia-appearance-r64',slots=Object.freeze({...old.slots,body:Object.freeze([...old.slots.body,'royalcloak'])}),defaults=old.defaults;
export function appearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid Fia appearance');
 for(const [k,v] of Object.entries(value))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid Fia appearance '+k);
 return {...defaults,...value};
}
export function previousAppearance(value={}){const g=appearance(value);return {...g,body:g.body==='royalcloak'?'green':g.body}}
export function readAppearance(storage){try{const raw=storage.getItem(KEY);return raw===null?appearance(old.readAppearance(storage)):appearance(JSON.parse(raw))}catch{return appearance()}}
export function saveAppearance(storage,value){const g=appearance(value);try{storage.setItem(KEY,JSON.stringify(g))}catch{}return g}
function raster(im){const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;Object.defineProperties(c,{naturalWidth:{value:c.width},naturalHeight:{value:c.height}});const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(im,0,0);return ctx}
const cache=new WeakMap(),textures=new WeakMap();
function plans(source,asset,kind){
 if(!asset||(asset.naturalWidth??asset.width)!==384||(asset.naturalHeight??asset.height)!==96)throw Error('cloak asset size');
 const entry=cache.get(source);if(entry?.asset===asset&&entry.kind===kind)return entry.plans;
 if(!textures.has(asset))textures.set(asset,raster(asset).getImageData(0,0,384,96).data);
 const ctx=raster(source),small=kind==='field'||kind==='motion',w=small?96:240,h=small?96:216,cols=ctx.canvas.width/w,rows=cloakPlacements(kind).map((_,i)=>{const x=i%cols*w,y=Math.floor(i/cols)*h;return {x,y,w,h,plan:cloakPlan(ctx.getImageData(x,y,w,h).data,textures.get(asset),kind,i)}});
 cache.set(source,{asset,kind,plans:rows});return rows;
}
export function equippedImage(source,kind,value={},ornaments=null,weapons=null,outfit=null,cloak=null){
 const g=appearance(value),base=old.equippedImage(source,kind,previousAppearance(g),ornaments,weapons,outfit);if(g.body!=='royalcloak')return base;
 const ctx=raster(base);for(const {x,y,w,h,plan} of plans(source,cloak,kind)){const p=ctx.getImageData(x,y,w,h);p.data.set(applyCloak(plan,p.data).pixels);ctx.putImageData(p,x,y)}
 return ctx.canvas;
}
