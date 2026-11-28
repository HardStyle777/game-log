// R26: role-specific motion frames, 240×216 sprite cells, planted feet.
// Animation clock only; no mutation of damage, actions or initiative.
import {heldResultPose} from './victory-loop-r58.js?v=58';
export const motionScale=7/15;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function choose(fs,p){return fs[Math.min(fs.length-1,Math.floor(clamp(p,0,.99999)*fs.length))]}
export function atlasPose(v,id,actor){
 const held=heldResultPose(v,id,actor);if(held)return held;
 const c=actor.clips,m=v.motion[id],phase={leon:0,fia:110,glen:270,lucia:420}[id]??0;
 const t=m?v.clock-m.start:-1,active=m&&t>=0&&t<m.duration;
 let clip='idle',p=((v.clock+phase)%680+680)%680/680;
 if(active){
  const progress=t/m.duration,contact=clamp(m.contact??m.duration*.5,1,m.duration-1);
  if(m.clip==='attack'||m.clip==='cast'){
   const prep=Math.max(1,contact*.43);
   if(t<prep){clip='windup';p=t/prep}
   else{clip=m.clip;const q=t<contact?.5*(t-prep)/(contact-prep):.5+.5*(t-contact)/(m.duration-contact);p=q}
  }else if(m.clip==='knockout'){clip=progress<.24?'hit':'down';p=progress<.24?progress/.24:0}
  else if(m.clip==='guard'||m.clip==='hit'){clip=m.clip;p=progress}
  else if((m.clip==='victory'||m.clip==='revive')&&c[m.clip]?.length){const fs=c[m.clip],total=fs.reduce((n,f)=>n+f.ms,0);let k=progress*total;const frame=fs.find(f=>{if(k<f.ms)return true;k-=f.ms;return false})??fs.at(-1);return {clip:m.clip,frame,file:actor.file}}
 }else if(v.vitals[id].hp<=0){clip='down';p=0}
 return {clip,frame:choose(c[clip],p),file:actor.file};
}
export function leonPose(v,meta){
 const held=heldResultPose(v,'leon',meta);if(held)return held;
 const m=v.motion.leon,t=m?v.clock-m.start:-1,active=m&&t>=0&&t<m.duration;
 const clip=active&&meta.clips[m.clip]?m.clip:v.vitals.leon.hp<=0?'down':'idle';
 const fs=meta.clips[clip],total=fs.reduce((n,f)=>n+f.ms,0);
 let k=active?Math.min(t,total-1):v.clock%total;
 const frame=fs.find(f=>{if(k<f.ms)return true;k-=f.ms;return false})??fs.at(-1);
 return {frame,clip:clip==='idle'?'ready':clip,file:meta.file};
}


 // First impact at engine contact, second at contact + 95 ms, only for double.
 export function fiaPose(v,actor){
 const held=heldResultPose(v,'fia',actor);if(held)return held;
 const m=v.motion.fia,t=m?v.clock-m.start:-1,fs=actor.clips;
 if(!m||t<0||t>=m.duration)return atlasPose(v,'fia',actor);
 if(m.clip==='victory'||m.clip==='revive'||m.clip==='guard'||m.clip==='knockout'||m.clip==='hit'){const frames=fs[m.clip],total=frames.reduce((n,f)=>n+f.ms,0);let k=t/m.duration*total;const frame=frames.find(f=>{if(k<f.ms)return true;k-=f.ms;return false})??frames.at(-1);return {clip:m.clip,frame,file:actor.file}}
 if(m.clip!=='attack')return atlasPose(v,'fia',actor);
 const contact=clamp(m.contact??m.duration*.5,1,m.duration-1),d=t-contact,dual=m.strikeCount===2;
 let frame;if(d< -55)frame=choose(fs.windup,t/Math.max(1,contact-55));
 else if(d<0)frame=fs.attack[0];
 else if(d<40)frame=fs.attack[1];
 else if(dual&&d<95)frame=fs.attack[2];
 else if(dual&&d<150)frame=fs.attack[3];
 else if(dual&&d<210)frame=fs.attack[4];
 else if(!dual&&d<115)frame=fs.attack[6]??fs.attack[5];
 else frame=fs.attack[5];
 return {clip:'attack',frame,file:actor.file};
 }
