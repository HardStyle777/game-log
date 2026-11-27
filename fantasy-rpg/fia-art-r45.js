// R45 independent full-body attack keyframes, on top of unchanged R41 base atlas.
import {fiaMeta as legacyMeta,makeFiaAtlas as legacyAtlas} from './fia-art-r41.js?v=41';
const W=240,H=216,COLS=6;
const frame=(i,ms)=>({x:i%COLS*W,y:Math.floor(i/COLS)*H,w:W,h:H,ms});
const seq=(ids,times)=>ids.map((i,j)=>frame(i,times[j]));
export const attackCells=Object.freeze([26,27,28,29,30,31]);
export const fiaMeta={...legacyMeta,clips:{...legacyMeta.clips,windup:seq([26],[300]),attack:seq([26,27,28,29,30,31,28],[70,90,70,90,80,110,75])}};
export function makeFiaAtlas(source,recovery,attack){
 if(attack.naturalWidth!==1440||attack.naturalHeight!==216)throw Error('Fia R45 attack size');
 const base=legacyAtlas(source,recovery),out=document.createElement('canvas');out.width=COLS*W;out.height=Math.ceil(32/COLS)*H;
 const g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(base,0,0);
 for(let i=0;i<attackCells.length;i++){const f=frame(attackCells[i],0);g.drawImage(attack,i*W,0,W,H,f.x,f.y,W,H)}
 return out;
}
