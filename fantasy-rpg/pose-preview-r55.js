// R55 shared equipped-atlas pose inspection. Same frame metadata as actual battle.
import {victoryFrame} from './result-pose-r51.js?v=51';
export const labels=Object.freeze({normal:'戦闘通常時',attack:'通常攻撃',windup:'予備動作',guard:'防御',cast:'詠唱',hit:'被弾',knockout:'戦闘不能動作',down:'戦闘不能',revive:'蘇生',victory:'勝利時',resolve:'闘志',awaken:'覚醒'});
const key=mode=>mode==='normal'?'idle':mode;
export function availableModes(actor){
 if(!actor?.clips?.idle?.length)throw Error('idle clip missing');
 const keys=Object.keys(labels).filter(m=>Array.isArray(actor.clips[key(m)])&&actor.clips[key(m)].length);
 return keys;
}
export function poseSelection(actor,requested='normal',index=null){
 const modes=availableModes(actor),mode=modes.includes(requested)?requested:'normal',frames=actor.clips[key(mode)],n=frames.length;
 const at=index===null?(mode==='victory'?n-1:0):Number.isFinite(index)?((Math.trunc(index)%n)+n)%n:0;
 const f=mode==='victory'&&at===n-1?victoryFrame(actor):frames[at];
 if(!f||f.w!==240||f.h!==216||!Number.isInteger(f.x)||!Number.isInteger(f.y)||f.x<0||f.y<0)throw Error('invalid preview frame');
 return {mode,index:at,count:n,frame:f};
}
