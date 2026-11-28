import {fieldFrame} from './field-actor-r52.js?v=52';
// R61: one current equipped preview bundle, no atlas allocations during playback.
export function createPreviewCache(){
 let key=null,bundle=null;
 return {get(next,build){if(next!==key||bundle===null){const candidate=build();key=next;bundle=candidate}return bundle},current(){return bundle},clear(){key=null;bundle=null}};
}
export function timedClipFrame(frames,time){
 if(!Array.isArray(frames)||!frames.length||frames.some(f=>!Number.isFinite(f.ms)||f.ms<=0))throw Error('invalid preview clip');
 const total=frames.reduce((n,f)=>n+f.ms,0);let t=((Number.isFinite(time)?time:0)%total+total)%total;
 for(let i=0;i<frames.length;i++){if(t<frames[i].ms)return {frame:frames[i],index:i,count:frames.length};t-=frames[i].ms}
 return {frame:frames[0],index:0,count:frames.length};
}
export function explorationFrame(id,mode,dir,time=0){
 if(!['leon','fia'].includes(id)||!['walk','run','idle'].includes(mode)||!Number.isInteger(dir)||dir<0||dir>3)throw Error('invalid exploration preview');
 const moving=mode!=='idle',t=Math.max(0,Number.isFinite(time)?time:0),state={x:0,y:0,spriteFacing:['south','east','north','west'][dir],moving};
 const f=fieldFrame(state,moving?t:0,mode==='run',id,moving?0:t);
 const asset={leon:'walk',leonRun:'run',leonIdle:'idle',fia:'walk',fiaMotion:'motion'}[f.asset];
 return {asset,x:f.sx,y:f.sy,w:f.sw,h:f.sh};
}
