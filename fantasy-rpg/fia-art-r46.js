// R46: independent full-body guard/victory art. Preserve all 32 R45 cells.
import {fiaMeta as legacyMeta,makeFiaAtlas as legacyAtlas} from './fia-art-r45.js?v=45';
const W=240,H=216,COLS=6;
const frame=(i,ms)=>({x:i%COLS*W,y:Math.floor(i/COLS)*H,w:W,h:H,ms});
const seq=(ids,times)=>ids.map((i,j)=>frame(i,times[j]));
export const stanceCells=Object.freeze([32,33,34,35,36,37]);
export const fiaMeta={...legacyMeta,clips:{...legacyMeta.clips,guard:seq([32,33,33,34],[100,150,170,100]),victory:seq([35,36,37,37],[160,220,260,260])}};
export function makeFiaAtlas(source,recovery,attack,stance){
 if(stance.naturalWidth!==1440||stance.naturalHeight!==216)throw Error('Fia R46 guard/victory size');
 const base=legacyAtlas(source,recovery,attack),out=document.createElement('canvas');out.width=COLS*W;out.height=Math.ceil(38/COLS)*H;
 const g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(base,0,0);
 for(let i=0;i<stanceCells.length;i++){const f=frame(stanceCells[i],0);g.drawImage(stance,i*W,0,W,H,f.x,f.y,W,H)}
 return out;
}
