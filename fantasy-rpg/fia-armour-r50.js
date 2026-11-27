// R50: independent illustrated shoulder/shin reinforcement for the approved Fia source art.
// Complete gear replacement and full clothing remodelling remain separate work.
import {equippedImage as previousImage,dimensions,defaults as previousDefaults,slots as previousSlots,readAppearance as previousRead} from './fia-appearance-r48.js?v=48';
export {dimensions};
export const KEY='fantasy-fia-appearance-r50';
export const slots=Object.freeze({...previousSlots,body:Object.freeze(['green','blue','armoured']),feet:Object.freeze(['brown','black','greaves'])});
export const defaults=Object.freeze({...previousDefaults});
export function appearance(overrides={}){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('invalid appearance');
 for(const [k,v] of Object.entries(overrides))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid appearance '+k);
 return {...defaults,...overrides};
}
export function readAppearance(storage){try{const raw=storage.getItem(KEY);return raw===null?appearance(previousRead(storage)):appearance(JSON.parse(raw))}catch{return appearance()}}
export function saveAppearance(storage,value){const g=appearance(value);try{storage.setItem(KEY,JSON.stringify(g))}catch{}return g}
const anchors={"battle":[[[150,102,23,20,12,0],[[100,167,13,15,18,0],[170,169,13,15,-22,1]]]],"recovery":[[[132,105,21,18,10,0],[[98,168,13,14,10,0],[145,175,13,14,-22,1]]],[[134,132,21,18,22,0],[[163,178,12,12,-75,1]]],[[113,142,19,16,72,0],[[170,172,14,15,-85,1]]],[[135,123,21,18,18,0],[[106,172,13,14,0,0]]]],"attack":[[[151,105,23,19,12,0],[[103,169,13,14,25,0],[171,171,13,14,-20,1]]],[[151,103,22,18,0,0],[[111,165,13,14,5,0],[201,172,13,14,-40,1]]],[[145,111,22,18,12,0],[[110,166,13,14,0,0],[180,172,13,14,-35,1]]],[[145,100,18,17,0,0],[[104,169,13,14,17,0],[174,173,13,14,-25,1]]],[[141,103,22,19,14,0],[[96,168,13,14,20,0],[164,172,13,14,-20,1]]],[[142,106,22,19,14,0],[[103,168,13,14,20,0],[167,172,13,14,-25,1]]]],"stance":[[[144,109,17,17,15,0],[[93,168,13,14,18,0],[163,173,13,14,-18,1]]],[[140,118,18,17,15,0],[[100,168,13,14,12,0],[163,173,13,14,-25,1]]],[[145,107,21,18,15,0],[[107,168,13,14,16,0],[162,173,13,14,-20,1]]],[[144,96,19,17,10,0],[[111,171,13,14,0,0],[151,171,13,14,0,1]]],[[144,95,19,17,10,0],[[104,171,13,14,12,0],[154,172,13,14,-12,1]]],[[145,95,19,17,10,0],[[110,171,13,14,0,0],[151,171,13,14,0,1]]]],"field":[[[56,45,9,8,0,0],[[42,80,6,7,0,0],[54,80,6,7,0,0]]],[[56,45,9,8,0,0],[[51,81,6,7,0,0]]],[[56,45,9,8,0,0],[[51,81,6,7,0,0]]],[[56,45,9,8,0,0],[[51,81,6,7,0,0]]],[[48,45,9,8,0,0],[[47,81,6,7,0,0]]],[[47,45,9,8,0,0],[[40,80,6,7,0,0],[57,80,6,7,0,0]]],[[49,45,9,8,0,0],[[51,81,6,7,0,0]]],[[49,45,9,8,0,0],[[40,80,6,7,0,0],[57,80,6,7,0,0]]],[[56,45,9,8,0,0],[[42,81,6,7,0,0],[55,81,6,7,0,0]]],[[56,46,9,8,0,0],[[45,81,6,7,0,0]]],[[56,45,9,8,0,0],[[48,76,6,7,0,0]]],[[56,45,9,8,0,0],[[43,76,6,7,0,0]]],[[48,46,9,8,0,1],[[49,81,6,7,0,1]]],[[48,45,9,8,0,1],[[41,80,6,7,0,1],[57,80,6,7,0,1]]],[[48,45,9,8,0,1],[[43,81,6,7,0,1]]],[[48,45,9,8,0,1],[[39,81,6,7,0,1],[58,80,6,7,0,1]]]],"motion":[[[57,46,9,8,0,0],[[49,81,6,7,0,0]]],[[56,50,9,8,0,0],[[49,77,6,7,0,0]]],[[56,46,9,8,0,0],[[49,81,6,7,0,0]]],[[56,45,9,8,0,0],[[42,81,6,7,0,0],[54,81,6,7,0,0]]],[[53,50,9,8,0,0],[[30,78,6,7,0,0],[53,76,6,7,0,0]]],[[57,55,9,8,0,0],[[29,79,6,7,0,0],[53,75,6,7,0,0]]],[[53,50,9,8,0,0],[[54,81,6,7,0,0],[30,73,6,7,0,0]]],[[48,45,9,8,0,0],[[47,81,6,7,0,0]]],[[56,46,9,8,0,0],[[49,81,6,7,0,0]]],[[56,50,9,8,0,0],[[48,79,6,7,0,0]]],[[56,46,9,8,0,0],[[48,79,6,7,0,0]]],[[56,45,9,8,0,0],[[42,81,6,7,0,0],[55,81,6,7,0,0]]],[[42,47,9,8,0,1],[[43,73,6,7,0,1],[65,81,6,7,0,1]]],[[41,51,9,8,0,1],[[42,76,6,7,0,1],[65,80,6,7,0,1]]],[[42,47,9,8,0,1],[[43,81,6,7,0,1],[63,74,6,7,0,1]]],[[48,45,9,8,0,1],[[49,81,6,7,0,1]]]]};
const rects=[[210,2,89,78],[314,2,68,61]];
export function armourAnchors(kind){if(!Object.hasOwn(anchors,kind))throw Error('unknown Fia source');return anchors[kind].map(([a,b])=>[a.slice(),b.map(x=>x.slice())])}
function paint(ctx,source,part,spec){const [x,y,w,h,angle,flip]=spec;ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);if(flip)ctx.scale(-1,1);ctx.drawImage(source,...rects[part],-w/2,-h/2,w,h);ctx.restore()}
export function armourImage(base,kind,gear,asset){
 const g=appearance(gear);if(g.body!=='armoured'&&g.feet!=='greaves')return base;
 const [w,h]=dimensions[kind]??[],small=kind==='field'||kind==='motion',cw=small?96:240,ch=small?96:216,rows=armourAnchors(kind);
 if((base.naturalWidth??base.width)!==w||(base.naturalHeight??base.height)!==h||rows.length!==w*h/cw/ch||asset?.naturalWidth!==416||asset?.naturalHeight!==104)throw Error('Fia armour source dimensions');
 const out=document.createElement('canvas');out.width=w;out.height=h;Object.defineProperties(out,{naturalWidth:{value:w},naturalHeight:{value:h}});
 const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
 for(const [i,[shoulder,greaves]] of rows.entries()){
  ctx.save();ctx.translate(i%(w/cw)*cw,Math.floor(i/(w/cw))*ch);ctx.beginPath();ctx.rect(0,0,cw,ch);ctx.clip();
  if(g.body==='armoured')paint(ctx,asset,0,shoulder);
  if(g.feet==='greaves')for(const p of greaves)paint(ctx,asset,1,p);
  ctx.restore();
 }
 return out;
}
export function equippedImage(source,kind,value={},ornaments=null,asset=null){
 const g=appearance(value),base=previousImage(source,kind,{...g,body:g.body==='armoured'?'green':g.body,feet:g.feet==='greaves'?'brown':g.feet},ornaments,asset);
 return armourImage(base,kind,g,asset);
}
