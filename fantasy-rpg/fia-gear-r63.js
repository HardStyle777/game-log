// New storage key; R59 gear remains readable. Exploration stays sheathed.
import * as old from './fia-outfit-r59.js?v=59';
import {makeDaggerPlans,applyDaggerPlans} from './fia-dagger-layer-r63.js?v=63';
export {outfitSource,cellCount,layerLayout} from './fia-outfit-r59.js?v=59';
export const KEY='fantasy-fia-appearance-r63';
export const slots=Object.freeze({...old.slots,main:Object.freeze([...old.slots.main,'moonfang']),offhand:Object.freeze([...old.slots.offhand,'moonfang'])});
export const defaults=old.defaults;
export function appearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid Fia appearance');
 for(const [k,v] of Object.entries(value))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid Fia appearance '+k);
 return {...defaults,...value};
}
export function previousAppearance(value={}){const g=appearance(value);return {...g,main:g.main==='moonfang'?'dagger':g.main,offhand:g.offhand==='moonfang'?'dagger':g.offhand}}
export function readAppearance(storage){try{const raw=storage.getItem(KEY);return raw===null?appearance(old.readAppearance(storage)):appearance(JSON.parse(raw))}catch{return appearance()}}
export function saveAppearance(storage,value){const g=appearance(value);try{storage.setItem(KEY,JSON.stringify(g))}catch{}return g}
function raster(im){const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;Object.defineProperties(c,{naturalWidth:{value:c.width},naturalHeight:{value:c.height}});const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(im,0,0);return ctx}
const cache=new WeakMap();
function plans(source,asset,kind){
 const old=cache.get(source);if(old?.asset===asset&&old.kind===kind)return old.plans;
 const ctx=raster(source),tex=raster(asset).getImageData(0,0,416,104).data,rows=[];
 for(let i=0;i<ctx.canvas.width/240;i++)rows.push(makeDaggerPlans(ctx.getImageData(i*240,0,240,216).data,tex,kind,i));
 cache.set(source,{asset,kind,plans:rows});return rows;
}
export function equippedImage(source,kind,value={},ornaments=null,asset=null,outfit=null){
 const g=appearance(value),active=[g.main==='moonfang',g.offhand==='moonfang'],base=old.equippedImage(source,kind,previousAppearance(g),ornaments,asset,outfit);
 if(!active.some(Boolean)||kind==='field'||kind==='motion')return base;
 const ctx=raster(base);
 for(const [i,p] of plans(source,asset,kind).entries()){const d=ctx.getImageData(i*240,0,240,216);d.data.set(applyDaggerPlans(p,d.data,active).pixels);ctx.putImageData(d,i*240,0)}
 return ctx.canvas;
}
