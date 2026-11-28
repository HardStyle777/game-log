// R62: old 144 Leon configurations and all other actors keep the exact R61 route.
import * as previous from './battle-appearance-r61.js?v=61';
import * as gear from './leon-gear-r62.js?v=62';
import {placements} from './leon-equipment-r53.js?v=53';
import {replacementPlan,applyReplacement,resultSegment} from './leon-sword-layer-r62.js?v=62';
import {victorySource} from './victory-art-r57.js?v=57';
import {victorySource as cheerSource} from './cheer-art-r58.js?v=58';
export const appearanceSources=previous.appearanceSources,configureBattleMeta=previous.configureBattleMeta,fiaSources=previous.fiaSources;
export function savedBattleAppearance(storage){return {...previous.savedBattleAppearance(storage),leon:gear.readAppearance(storage)}}
function raster(im){const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;Object.defineProperties(c,{naturalWidth:{value:c.width},naturalHeight:{value:c.height}});const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(im,0,0);return ctx}
const cached=new WeakMap();
function swordPlans(assets){
 const raw=assets['r26/leon-battle'],texture=assets['r53/leon-equipment'],victory=assets[victorySource],cheer=assets[cheerSource];
 const entry=cached.get(raw);if(entry&&entry.texture===texture&&entry.victory===victory&&entry.cheer===cheer)return entry.plans;
 const source=raster(raw),tex=raster(texture).getImageData(0,0,256,96).data;
 const plans=placements('battle').map((p,i)=>{const x=i%6*240,y=Math.floor(i/6)*216;return {x,y,plan:replacementPlan(source.getImageData(x,y,240,216).data,tex,p.blade,{fallen:i>=15&&i<=18})}});
 for(const [im,x] of [[victory,480],[cheer,720]])plans.push({x,y:648,plan:replacementPlan(raster(im).getImageData(0,0,240,216).data,tex,resultSegment,{result:true})});
 cached.set(raw,{texture,victory,cheer,plans});return plans;
}
export function buildBattleAppearance(id,assets,value){
 if(id!=='leon')return previous.buildBattleAppearance(id,assets,value);
 const g=gear.appearance(value),base=previous.buildBattleAppearance(id,assets,gear.previousAppearance(g));
 if(g.main!=='royalsword')return base;
 const dst=raster(base);
 for(const {x,y,plan} of swordPlans(assets)){const p=dst.getImageData(x,y,240,216);p.data.set(applyReplacement(plan,p.data).pixels);dst.putImageData(p,x,y)}
 return dst.canvas;
}
