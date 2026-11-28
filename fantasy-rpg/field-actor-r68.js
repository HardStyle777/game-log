import * as prior from './field-actor-r67.js';

export const FIELD_ACTORS=Object.freeze([...prior.FIELD_ACTORS,'lucia']);
export function fieldActor(id){return id==='lucia'?id:prior.fieldActor(id);}
export function nextFieldActor(id){return FIELD_ACTORS[(FIELD_ACTORS.indexOf(fieldActor(id))+1)%FIELD_ACTORS.length];}
const dirs=['south','east','north','west'];
const valid=n=>Number.isFinite(n)?Math.max(0,n):0;
export function motionClock(previous,state,id,running,dt){
 if(id!=='lucia')return prior.motionClock(previous,state,id,running,dt);
 const mode=state.moving?(running?'run':'walk'):'idle',key=[state.map,id,state.spriteFacing,mode].join(':');
 return {key,elapsed:previous?.key===key?valid(previous.elapsed)+valid(dt):0};
}
export function fieldFrame(state,elapsed=0,running=false,id='fia',idle=0){
 if(id!=='lucia')return prior.fieldFrame(state,elapsed,running,id,idle);
 const base=prior.fieldFrame(state,0,false,'glen');
 const cycle=running?[3,1,3,2]:[0,1,0,2];
 const col=state.moving?cycle[Math.floor(valid(elapsed)/(running?92:132))%4]:0;
 return {...base,col,sx:col*96,asset:'lucia',mode:state.moving?(running?'run':'walk'):'idle'};
}
export function drawFieldActor(ctx,state,images,t,run,id,idle){
 if(id!=='lucia')return prior.drawFieldActor(ctx,state,images,t,run,id,idle);
 const f=fieldFrame(state,t,run,id,idle);
 ctx.drawImage(images.lucia,f.sx,f.sy,f.sw,f.sh,f.dx,f.dy,f.dw,f.dh);
 return f;
}
export function explorationFrame(id,mode,direction,t=0){
 if(id!=='lucia')return prior.explorationFrame(id,mode,direction,t);
 if(!['walk','run','idle'].includes(mode)||!Number.isInteger(direction)||!dirs[direction])throw Error('Invalid Lucia field pose');
 const f=fieldFrame({x:0,y:0,spriteFacing:dirs[direction],moving:mode!=='idle'},t,mode==='run',id);
 return {asset:'walk',x:f.sx,y:f.sy,w:f.sw,h:f.sh};
}
