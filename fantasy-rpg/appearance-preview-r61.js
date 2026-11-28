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
 const t=Math.max(0,Number.isFinite(time)?time:0);
 let col,asset;
 if(id==='leon'){col=Math.floor(t/(mode==='run'?100:mode==='idle'?240:160))%4;asset=mode;}
 else if(mode==='walk'){asset='walk';col=Math.floor(t/160)%4}
 else{asset='motion';col=mode==='idle'?3:Math.floor(t/95)%3}
 return {asset,x:col*96,y:dir*96,w:96,h:96};
}
