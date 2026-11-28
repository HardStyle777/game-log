import {heldResultPose} from './victory-loop-r58.js?v=58';

export const luciaBattle = 'r68/lucia-battle';
export const luciaField = 'r68/lucia-field';
export const luciaEquipment = 'r68/lucia-equipment';
export const luciaPortrait = 'assets/r68/lucia-portrait.png';
export const luciaPoses = Object.freeze({idle:0, open:1, charge:2, release:3, strike:4, guard:5,
  hit:6, down:7, kneel:8, rise:9, victory:10, turn:11});

function clip(...frames) {
  return frames.map(([i, ms]) => ({x:i%4*240,y:Math.floor(i/4)*216,w:240,h:216,ms}));
}
const p=luciaPoses;
export const luciaClips = Object.freeze({
  idle:clip([p.idle,540]),windup:clip([p.idle,110],[p.open,180]),
  attack:clip([p.idle,115],[p.strike,130],[p.idle,195]),
  cast:clip([p.open,145],[p.charge,190],[p.release,130],[p.open,170]),
  guard:clip([p.idle,95],[p.guard,320],[p.idle,105]),
  hit:clip([p.hit,170],[p.guard,110]),knockout:clip([p.hit,110],[p.kneel,135],[p.down,220]),
  down:clip([p.down,300]),revive:clip([p.down,110],[p.kneel,150],[p.rise,180],[p.idle,140]),
  victory:clip([p.victory,760],[p.turn,690],[p.victory,240]),
});
export function configureLucia(actor) {
  return {...actor,clips:luciaClips,resultFrame:luciaClips.victory[0]};
}
export function luciaPose(view,actor) {
  const result=heldResultPose(view,'lucia',actor);
  if(result)return result;
  const motion=view.motion.lucia,elapsed=motion?view.clock-motion.start:-1;
  if(!motion||elapsed<0||elapsed>=motion.duration||!actor.clips[motion.clip]){
    const clip=view.vitals.lucia.hp<=0?'down':'idle';
    return {clip,file:actor.file,frame:actor.clips[clip][0]};
  }
  const clip=motion.magic?'cast':motion.clip,frames=actor.clips[clip];
  if(clip==='cast'||clip==='attack'){
    const contact=Math.max(1,Math.min(motion.duration-1,motion.contact??motion.duration/2));
    const recovery=contact+Math.min(135,(motion.duration-contact)*.65);
    const index=clip==='cast'
      ? elapsed<contact*.44?0:elapsed<contact?1:elapsed<recovery?2:3
      : elapsed<contact?0:elapsed<recovery?1:2;
    return {clip,file:actor.file,frame:frames[index]};
  }
  let time=elapsed/motion.duration*frames.reduce((sum,f)=>sum+f.ms,0);
  const frame=frames.find(f=>{if(time<f.ms)return true;time-=f.ms;return false;})??frames.at(-1);
  return {clip,file:actor.file,frame};
}
