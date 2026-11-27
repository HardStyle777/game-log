// R22: role-specific motion frames, pixel-native 80x72 atlas, planted feet.
// Animation clock only; no mutation of damage, actions or initiative.
export const artActors={fia:'fia',glen:'glen',lucia:'eris'};
export const motionScale=1.4;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function choose(fs,p){return fs[Math.min(fs.length-1,Math.floor(clamp(p,0,.99999)*fs.length))]}
export function atlasPose(v,id,meta){
 const actor=meta.actors[artActors[id]],c=actor.clips,m=v.motion[id],phase={leon:0,fia:110,glen:270,lucia:420}[id]??0;
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
  else if(m.clip==='victory'||m.clip==='revive'){clip='idle';p=progress}
 }else if(v.vitals[id].hp<=0){clip='down';p=0}
 return {clip,frame:choose(c[clip],p),file:actor.file};
}
export function leonPose(v,meta){
 const m=v.motion.leon,t=m?v.clock-m.start:-1,active=m&&t>=0&&t<m.duration;
 if(!active&&v.vitals.leon.hp>0){
  const f=meta.clips.guard,seq=[f[0],f[1],f[2],f[1]],p=((v.clock%720)+720)%720/720;
  return {frame:choose(seq,p),effect:false,clip:'ready'};
 }
 const clip=active&&meta.clips[m.clip]?m.clip:v.vitals.leon.hp===0?'down':'idle',fs=meta.clips[clip]??meta.clips.idle;
 let k=active?Math.max(0,t):v.clock;const total=fs.reduce((n,f)=>n+f.ms,0);
 k=clip==='idle'||clip==='down'?k%total:Math.min(k,total-1);
 const frame=fs.find(f=>{if(k<f.ms)return true;k-=f.ms;return false})??fs.at(-1);
 return {frame,effect:active,clip};
}
