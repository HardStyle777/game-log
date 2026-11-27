// R43 presentation only. Existing movement and R42 walking frames remain unchanged.
import {fieldActor,nextFieldActor,fieldFrame as legacyFrame} from './field-actor-r42.js?v=42';
export {fieldActor,nextFieldActor};
export const RUN_MS=83,IDLE_MS=1800;
const finite=n=>Number.isFinite(n)?Math.max(0,n):0;
// Idle: retain original neutral for most of the period; briefly settle into alternate original pose.
export function fieldFrame(state,anim=0,run=false,actor='fia',idleAnim=0){
 const id=fieldActor(actor),f=legacyFrame(state,anim,run);
 if(id==='leon')return {...f,asset:'leon',mode:state.moving?(run?'run':'walk'):'idle'};
 if(state.moving&&run){
  const col=[0,1,2,1][Math.floor(finite(anim)/RUN_MS)%4];
  return {...f,col,sx:col*96,asset:'fiaMotion',mode:'run'};
 }
 if(!state.moving&&finite(idleAnim)%IDLE_MS>=1350)return {...f,col:3,sx:288,asset:'fiaMotion',mode:'idle'};
 return {...f,asset:'fia',mode:state.moving?'walk':'idle'};
}
// Reset phase on actor, direction, locomotion mode and map changes. No saved state mutation.
export function motionClock(previous,state,actor,run,dt){
 const key=[state.map,fieldActor(actor),state.spriteFacing,state.moving?(run?'run':'walk'):'idle'].join(':');
 const elapsed=previous?.key===key?finite(previous.elapsed)+finite(dt):0;
 return {key,elapsed};
}
export function drawFieldActor(ctx,state,images,anim,run,actor,idleAnim=0){
 const f=fieldFrame(state,anim,run,actor,idleAnim),image=images[f.asset];
 if(!image)throw Error('field actor asset missing: '+f.asset);
 ctx.drawImage(image,f.sx,f.sy,f.sw,f.sh,f.dx,f.dy,f.dw,f.dh);
 return f;
}
