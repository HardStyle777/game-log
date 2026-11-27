// R48 cosmetic blade reinforcements. Keep original grips and blade base. No combat-stat changes.
import {equippedImage as previousImage,dimensions,defaults as previousDefaults,slots as previousSlots,GEAR_KEY as previousKey,readAppearance as previousRead} from './fia-appearance-r47.js?v=47';
export {dimensions};
export const GEAR_KEY='fantasy-fia-appearance-r48';
export const slots=Object.freeze({...previousSlots,main:Object.freeze(['dagger','engraved']),offhand:Object.freeze(['dagger','engraved'])});
export const defaults=Object.freeze({...previousDefaults});
export function appearance(overrides={}){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('invalid appearance');
 for(const [k,v] of Object.entries(overrides))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid appearance: '+k);
 return {...defaults,...overrides};
}
export function readAppearance(storage){try{const raw=storage.getItem(GEAR_KEY);return raw===null?appearance(previousRead(storage)):appearance(JSON.parse(raw))}catch{return appearance()}}
export function saveAppearance(storage,overrides){const g=appearance(overrides);try{storage.setItem(GEAR_KEY,JSON.stringify(g))}catch{}return g}
// Source sheet contains two blade designs plus independent armour candidates (not equipped).
export const weaponRects=Object.freeze([[2,2,100,34],[106,2,100,33]].map(Object.freeze));
const anchors={
 battle:[[[82,123,36,135],[184,125,216,156]]],
 recovery:[[[95,142,69,171],[155,137,184,169]],[[86,181,53,186],[165,158,188,191]],[[69,179,100,190],[120,182,163,189]],[[85,168,59,188],[163,154,194,183]]],
 attack:[[[92,141,53,153],[178,124,200,154]],[[76,113,30,107],[186,105,215,126]],[[84,158,56,180],[177,121,196,151]],[[103,136,63,150],[124,110,81,122]],[[78,134,41,153],[178,125,210,146]],[[85,139,53,159],[173,135,199,161]]],
 stance:[[[125,121,152,93],[110,122,88,98]],[[115,126,80,138],[88,119,70,139]],[[97,143,70,166],[166,142,182,170]],[[95,135,80,158],[159,137,173,164]],[[94,50,68,73],[160,132,185,154]],[[94,132,73,155],[161,130,181,155]]]
};
export function weaponAnchors(kind){return (anchors[kind]??[]).map(row=>row.map(s=>s.slice()))}
export function bladeMatrix(seg,slot){
 const [x,y,u,v]=seg,dx=u-x,dy=v-y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
 const [, ,W,H]=weaponRects[slot],ax=.11*W,ay=.53*H,bx=.99*W,by=.08*H,sl=Math.hypot(bx-ax,by-ay),ex=(bx-ax)/sl,ey=(by-ay)/sl,s=L/sl,t=s*.70;
 const a=ux*s*ex+(-uy)*t*(-ey),c=ux*s*ey+(-uy)*t*ex,b=uy*s*ex+ux*t*(-ey),d=uy*s*ey+ux*t*ex;
 return [a,b,c,d,x-a*ax-c*ay,y-b*ax-d*ay];
}
export function equippedImage(source,kind,overrides={},ornaments=null,weapons=null){
 const g=appearance(overrides),base=previousImage(source,kind,{...g,main:'dagger',offhand:'dagger'},ornaments),rows=weaponAnchors(kind);
 // The sheath model is unchanged while the reinforced blades are sheathed.
 if(!rows.length||g.main==='dagger'&&g.offhand==='dagger')return base;
 if(!weapons||weapons.naturalWidth!==416||weapons.naturalHeight!==104)throw Error('Fia R48 weapon size');
 const [w,h]=dimensions[kind],out=document.createElement('canvas');out.width=w;out.height=h;Object.defineProperties(out,{naturalWidth:{value:w},naturalHeight:{value:h}});
 const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
 for(const [i,row] of rows.entries())for(let slot=0;slot<2;slot++){
  if(g[slot===0?'main':'offhand']!=='engraved')continue;
  ctx.save();ctx.translate(i*240,0);ctx.beginPath();ctx.rect(0,0,240,216);ctx.clip();
  ctx.transform(...bladeMatrix(row[slot],slot));const [sx,sy,sw,sh]=weaponRects[slot];ctx.drawImage(weapons,sx,sy,sw,sh,0,0,sw,sh);ctx.restore();
 }
 return out;
}
