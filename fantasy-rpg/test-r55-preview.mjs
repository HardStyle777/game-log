import {readFileSync} from 'node:fs';
import {configureLeon,victoryFrame} from './result-pose-r51.js';
import {fiaMeta} from './fia-art-r46.js';
import {availableModes,poseSelection} from './pose-preview-r55.js';
function verify({actors,availableModes,poseSelection,victoryFrame}){
 let checks=0,rows=[];const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
 for(const [id,actor] of Object.entries(actors)){const modes=availableModes(actor);for(const m of ['normal','attack','guard','hit','down','revive','victory'])ok(modes.includes(m),'required '+id+' '+m);let n=0;
 for(const mode of modes){const p=poseSelection(actor,mode),frames=actor.clips[mode==='normal'?'idle':mode];ok(p.mode===mode&&p.count===frames.length,'count');ok(p.index===(mode==='victory'?frames.length-1:0),'default index');
 for(let j=-frames.length*2;j<=frames.length*2;j++){const q=poseSelection(actor,mode,j);ok(q.index>=0&&q.index<frames.length,'wrap');const expected=mode==='victory'&&q.index===frames.length-1?victoryFrame(actor):frames[q.index];ok(q.frame===expected,'actual source reference');ok(q.frame.x+q.frame.w<=1440&&q.frame.y+q.frame.h<=(id==='leon'?864:1512),'atlas bounds');n++}}
 ok(poseSelection(actor,'invalid').mode==='normal','fallback');ok(poseSelection(actor,'victory').frame===victoryFrame(actor),'terminal');rows.push({id,modes,frameChecks:n})}
 return {checks,rows,failures:0};
}
const raw=JSON.parse(readFileSync(new URL('./assets/r26/motion.json',import.meta.url),'utf8'));console.log(JSON.stringify(verify({actors:{leon:configureLeon(raw.actors.leon),fia:fiaMeta},availableModes,poseSelection,victoryFrame}),null,2));