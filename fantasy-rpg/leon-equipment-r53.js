// R53 Leon: independent sapphire equipment overlays. Cosmetic only.
// Old sword and grip remain; the selectable blade is a reinforcement, not a full replacement.
import * as old from './leon-appearance-r50.js?v=50';
import {runningImage} from './leon-run-r52.js?v=52';
export const KEY='fantasy-leon-appearance-r53';
export const slots=Object.freeze({main:Object.freeze(['iron','sapphire']),offhand:Object.freeze(['none','shield']),head:Object.freeze(['none','circlet']),body:old.choices.body,feet:old.choices.feet,accessory:Object.freeze(['none','brooch'])});
export const defaults=Object.freeze({main:'iron',offhand:'none',head:'none',...old.defaults,accessory:'none'});
export function appearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid Leon appearance');
 for(const [k,v] of Object.entries(value))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid Leon appearance '+k);
 return {...defaults,...value};
}
export function readAppearance(storage){try{const raw=storage.getItem(KEY);return raw===null?appearance(old.readAppearance(storage)):appearance(JSON.parse(raw))}catch{return appearance()}}
export function saveAppearance(storage,value){const g=appearance(value);try{storage.setItem(KEY,JSON.stringify(g))}catch{}return g}
export const rects=Object.freeze({blade:Object.freeze([2,12,63,14]),shield:Object.freeze([102,2,64,90]),circlet:Object.freeze([172,19,80,23]),brooch:Object.freeze([172,48,43,43])});
// Per-cell anchors: blade root, blade tip; free arm shield; forehead; chest.
const blades=[[69,136,26,132],[68,134,25,128],[70,140,26,135],[70,132,30,103],[66,120,49,76],[63,129,28,95],
 [62,141,20,144],[76,143,34,161],[67,139,24,131],[66,130,34,97],[73,141,29,141],[66,136,27,117],
 [63,134,22,115],[81,145,35,145],[75,148,34,150],[88,153,52,176],[105,154,80,189],[112,161,58,162],[102,164,68,161],[65,129,30,94]];
const heads=[[100,82],[99,80],[101,84],[100,83],[100,80],[99,83],[93,82],[97,83],[96,82],[101,84],[100,80],[99,82],[96,83],[103,82],[101,84],[79,91],[70,98],[78,108],[84,112],[98,80]];
const arms=[[145,143],[144,141],[146,146],[145,142],[144,139],[145,142],[140,148],[146,146],[141,144],[145,144],[144,142],[144,143],[141,143],[151,147],[148,147],[149,135],[152,126],[162,137],[154,145],[145,141]];
const chests=[[103,117],[102,115],[104,119],[103,118],[103,115],[102,118],[97,118],[100,118],[99,117],[104,119],[103,115],[102,117],[99,118],[106,117],[104,120],[105,119],[103,122],[114,130],[111,135],[101,115]];
export function placements(kind){
 if(kind==='battle')return blades.map((blade,i)=>({blade:blade.slice(),shield:[...arms[i],i>=15&&i<=18?30:36,i>=15&&i<=18?42:49,i>=15&&i<=18?-48:-9],circlet:[...heads[i],42,12,i>=15&&i<=18?-48:0],brooch:[...chests[i],10,10,i>=15&&i<=18?-48:0]}));
 if(!['field','run'].includes(kind))throw Error('Leon source kind');
 const rows=[];for(let row=0;row<4;row++)for(let col=0;col<4;col++){
 const run=kind==='run',hx=run?(row===1?58:row===3?38:48):48,hy=run?27:30,cy=run?48:51;
 const shieldX=row===0?61:row===1?(run?58:48):row===2?48:(run?40:47),shieldY=row===2?61:cy+10;
 rows.push({blade:null,shield:[shieldX,shieldY,row===2?19:15,row===2?24:21,row===1?-12:row===3?12:0],circlet:row===2?null:[hx,hy,row===0?23:16,7,0],brooch:row===2?null:[row===1?hx+2:row===3?hx-2:48,cy,5,5,0]});
 }return rows;
}
export function bladeMatrix(seg){
 const [x,y,u,v]=seg,dx=x-u,dy=y-v,L=Math.hypot(dx,dy),sx=L/62,sy=sx*.68;
 return [dx/L*sx,dy/L*sx,-dy/L*sy,dx/L*sy,u+dy/L*sy*7,v-dx/L*sy*7];
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;Object.defineProperties(c,{naturalWidth:{value:w},naturalHeight:{value:h}});return c}
function paint(ctx,asset,key,p){if(!p)return;const [x,y,w,h,angle]=p;ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);ctx.drawImage(asset,...rects[key],-w/2,-h/2,w,h);ctx.restore()}
function layer(ctx,asset,p,g,ink){
 if(!ink){if(g.main==='sapphire'&&p.blade){ctx.save();ctx.transform(...bladeMatrix(p.blade));ctx.drawImage(asset,...rects.blade,0,0,63,14);ctx.restore()}if(g.offhand==='shield')paint(ctx,asset,'shield',p.shield)}
 else{if(g.head==='circlet')paint(ctx,asset,'circlet',p.circlet);if(g.accessory==='brooch')paint(ctx,asset,'brooch',p.brooch)}
}
export function addEquipment(base,kind,gear={},asset=null){
 const g=appearance(gear);
 if(g.main==='iron'&&g.offhand==='none'&&g.head==='none'&&g.accessory==='none')return base;
 const battle=kind==='battle',w=battle?1440:384,h=battle?864:384,cw=battle?240:96,ch=battle?216:96,cols=w/cw;
 if((base.naturalWidth??base.width)!==w||(base.naturalHeight??base.height)!==h||asset?.naturalWidth!==256||asset?.naturalHeight!==96)throw Error('Leon R53 source dimensions');
 const out=canvas(w,h),overlay=canvas(w,h),ctx=out.getContext('2d'),ink=overlay.getContext('2d');
 ctx.imageSmoothingEnabled=false;ink.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
 for(const [i,p] of placements(kind).entries())for(const [gctx,inside] of [[ctx,false],[ink,true]]){
  gctx.save();gctx.translate(i%cols*cw,Math.floor(i/cols)*ch);gctx.beginPath();gctx.rect(0,0,cw,ch);gctx.clip();layer(gctx,asset,p,g,inside);gctx.restore();
 }
 // Face/chest ornaments change RGB only, not the original character outline.
 const dst=ctx.getImageData(0,0,w,h),src=ink.getImageData(0,0,w,h).data;
 for(let i=0;i<src.length;i+=4)if(dst.data[i+3]&&src[i+3]){const a=src[i+3]/255;for(let j=0;j<3;j++)dst.data[i+j]=Math.round(dst.data[i+j]*(1-a)+src[i+j]*a)}
 ctx.putImageData(dst,0,0);return out;
}
export function equippedImage(source,kind,value={},asset=null){
 const g=appearance(value),colours={body:g.body,feet:g.feet},base=kind==='run'?runningImage(source,colours):old.equippedImage(source,kind,colours);
 return addEquipment(base,kind,g,asset);
}
export {fieldMotion} from './leon-appearance-r50.js?v=50';
