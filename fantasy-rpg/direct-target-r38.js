// Resolve the currently highlighted skill from the live engine, even before a command button is pressed.
import {targetSpec,tapTarget} from './battle-visuals-r38.js';
export function currentTargetChoice(session,actor,skill,prior=null){
 if(!session||session.busy||session.state.phase!=='planning'||!session.active.includes(actor))return null;
 if(Object.hasOwn(session.state.inventory??{},skill)){
  const used=Object.entries(session.selected??{}).filter(([id,c])=>id!==actor&&c.skill===skill).length;
  if(used>=session.state.inventory[skill])return null;
 }
 const spec=targetSpec(session,actor,skill);
 if(!spec||spec.mode==='none'||!spec.ids.length)return null;
 if(prior?.actor===actor&&prior.skill===skill&&prior.spec.mode===spec.mode&&prior.spec.ids.length===spec.ids.length&&prior.spec.ids.every((id,i)=>id===spec.ids[i]))return prior;
 return {actor,skill,spec,target:null,lastTap:null};
}
export function tapCurrentTarget(session,actor,skill,prior,id,now){
 const choice=currentTargetChoice(session,actor,skill,prior);
 if(!choice||!choice.spec.ids.includes(id)||!Number.isFinite(now))return {choice:prior,confirm:false};
 return tapTarget(choice,id,now);
}
