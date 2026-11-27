// R51: terminal pose contract. The actual battle atlas is the source of both previews and results.
export function configureLeon(meta){
 const old=meta.clips.victory;
 // R26 dedicated sword-raised artwork, not the trailing ready frame.
 const raised=old.find(f=>f.x===240&&f.y===648&&f.w===240&&f.h===216);
 if(!raised)throw Error('Leon victory artwork missing');
 const hold={...raised};
 const clips={...meta.clips,victory:old.map((f,i)=>i>=old.length-2?{...hold,ms:f.ms}:({...f}))};
 return {...meta,clips,resultFrame:hold};
}
export function victoryFrame(actor){
 const frame=actor.resultFrame??actor.clips.victory?.at(-1);
 if(!frame||frame.w!==240||frame.h!==216||!Number.isInteger(frame.x)||!Number.isInteger(frame.y)||frame.x<0||frame.y<0)throw Error('missing victory frame');
 return frame;
}
export function heldResultPose(view,id,actor){
 const hp=view.vitals[id]?.hp;
 // A defeated participant never celebrates; do not interrupt the active knockout animation.
 if(view.outcome&&hp<=0)return {clip:'down',frame:actor.clips.down[0],file:actor.file};
 const m=view.motion[id];
 if(hp>0&&(view.outcome==='win'||(!view.outcome&&m?.clip==='victory'&&view.clock>=m.start+m.duration)))
  return {clip:'victory',frame:victoryFrame(actor),file:actor.file};
 return null;
}
