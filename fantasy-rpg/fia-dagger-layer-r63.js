// R63: independently selectable curved daggers. Preserve hands and previously equipped layers.
import {weaponAnchors,weaponRects,bladeMatrix} from './fia-appearance-r48.js?v=48';
import {bladeMask} from './fia-blades-r54.js?v=54';
import {materialMasks} from './fia-blades-r55.js?v=55';
const W=240,H=216;
const clamp=x=>Math.max(0,Math.min(255,Math.round(x)));
export function makeDaggerPlans(raw,texture,kind,cell){
 if(raw.length!==W*H*4||texture.length!==416*104*4)throw Error('dagger source dimensions');
 const anchors=weaponAnchors(kind)[cell];if(!anchors)throw Error('dagger anchors');
 const overlapping=materialMasks(raw,kind,cell);
 const plans=[];
 for(let slot=0;slot<2;slot++){
  const cut=[],draw=[],ink=[];
  if(overlapping){
   const mask=overlapping[slot],accent=slot===0?[.63,1.15,.90]:[1.22,1.02,.63];
   for(let i=0;i<mask.length;i++)if(mask[i]){
    const j=i*4,l=.299*raw[j]+.587*raw[j+1]+.114*raw[j+2];
    ink.push(j,...accent.map((v,k)=>clamp(raw[j+k]*.34+l*v*.66)));
   }
  }else{
   const mask=bladeMask(kind,cell,slot);if(!mask)throw Error('missing exposed mask');
   const seg=anchors[slot],[rx,ry,tx,ty]=seg,dx=tx-rx,dy=ty-ry,L=Math.hypot(dx,dy);
   const [sx,sy,sw,sh]=weaponRects[slot],m=bladeMatrix(seg,slot),[a,b,c,d,e,f]=m,det=a*d-b*c;
   // Keep existing hand and hilt near the grip. Only the audited blade mask can remove original pixels.
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x,j=i*4,t=((x-rx)*dx+(y-ry)*dy)/(L*L);
    const cross=((x-rx)*-dy+(y-ry)*dx)/L;
    if(mask[i]&&raw[j+3]&&t>=.06)cut.push(j);
    if(t<-.06||t>1.14||Math.abs(cross)>13||x===0||x===239||y===0||y===215)continue;
    // A wider curved edge, fitted around the same blade axis. No paint on the hand.
    const yy=(y-f),xx=(x-e),u=Math.round((d*xx-c*yy)/det),v=Math.round((-b*xx+a*yy)/det);
    if(u<0||u>=sw||v<0||v>=sh)continue;
    const q=((sy+v)*416+sx+u)*4;if(texture[q+3]<128)continue;
    draw.push(j,q);
   }
  }
  plans.push({cut:Uint32Array.from(cut),draw:Uint32Array.from(draw),ink:Uint32Array.from(ink)});
 }
 return {raw:new Uint8ClampedArray(raw),texture,plans,overlapping:!!overlapping};
}
export function applyDaggerPlans(plan,base,active){
 if(base.length!==plan.raw.length||active.length!==2)throw Error('dagger base dimensions');
 const out=new Uint8ClampedArray(base),same=i=>base[i+3]===plan.raw[i+3]&&(!base[i+3]||[0,1,2].every(k=>Math.abs(base[i+k]-plan.raw[i+k])<=2));
 const stats=[];
 for(let slot=0;slot<2;slot++){
  let removed=0,placed=0,material=0,protectedCount=0;
  if(active[slot]){
   const {cut,draw,ink}=plan.plans[slot];
   for(const i of cut){if(!same(i)){protectedCount++;continue}out.fill(0,i,i+4);removed++}
   for(let k=0;k<draw.length;k+=2){const i=draw[k],q=draw[k+1];if(out[i+3]||(!base[i+3]&&plan.raw[i+3]))continue;out.set(plan.texture.subarray(q,q+4),i);placed++}
   for(let k=0;k<ink.length;k+=4){const i=ink[k];if(!same(i)){protectedCount++;continue}out.set(ink.subarray(k+1,k+4),i);material++}
  }
  stats.push({removed,placed,material,protectedCount});
 }
 return {pixels:out,stats};
}
