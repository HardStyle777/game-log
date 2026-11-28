// R58: presentation-only celebration loop. Time continues after engine settlement.
export const cheerCell=Object.freeze({x:720,y:648,w:240,h:216,ms:360});
const durations=Object.freeze({leon:[430,360,220],glen:[260,420,200],lucia:[400,300,280]});
export function configureLoop(actor,id){
 const old=actor.clips.victory;
 if(!old?.length)throw Error('missing victory '+id);
 let frames;
 if(id==='fia'){const [a,b,c]=old;frames=[{...a,ms:190},{...b,ms:200},{...c,ms:410},{...b,ms:200}]}
 else{const base=actor.resultFrame??old.at(-1),[a,b,c]=durations[id];frames=[{...base,ms:a},{...cheerCell,ms:b},{...base,ms:c}]}
 return {...actor,resultFrame:frames.at(-1),clips:{...actor.clips,victory:frames}};
}
export function loopFrame(actor,elapsed){
 const fs=actor.clips.victory,total=fs.reduce((n,f)=>n+f.ms,0);
 if(!Number.isFinite(elapsed)||!total)throw Error('invalid victory clock');
 let k=((elapsed%total)+total)%total;
 for(let i=0;i<fs.length;i++){if(k<fs[i].ms)return {frame:fs[i],index:i,count:fs.length};k-=fs[i].ms}
 return {frame:fs.at(-1),index:fs.length-1,count:fs.length};
}
export function heldResultPose(view,id,actor){
 const hp=view.vitals[id]?.hp,m=view.motion[id];
 if(view.outcome&&hp<=0)return {clip:'down',frame:actor.clips.down[0],file:actor.file};
 if(hp>0&&(view.outcome==='win'||(!view.outcome&&m?.clip==='victory'&&view.clock>=m.start))){
 const elapsed=Math.max(0,view.clock-(m?.clip==='victory'?m.start:0));
 return {clip:'victory',frame:loopFrame(actor,elapsed).frame,file:actor.file};
 }
 return null;
}
