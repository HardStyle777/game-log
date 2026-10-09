import {makeState,createMonster,act,startRift,riftRoom,riftEncounter,resolveRift,retireRift,validState,validBattle,enterRiftWalk,riftLayout,moveRiftWalk,collectRiftChest,riftAtExit} from '../dist/engine.js';

function path(map,start,target){const q=[{...start,path:[]}],seen=new Set([`${start.x},${start.y}`]);for(let i=0;i<q.length;i++){const p=q[i];if(p.x===target.x&&p.y===target.y)return p.path;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const key=`${p.x+dx},${p.y+dy}`;if(map.cells[p.y+dy]?.[p.x+dx]&&!seen.has(key)){seen.add(key);q.push({x:p.x+dx,y:p.y+dy,path:[...p.path,[dx,dy]]});}}}throw Error('unreachable destination');}
function explore(s){enterRiftWalk(s);const run=s.postgame.rift,map=riftLayout(run);let steps=0;for(const target of [...map.chests,map.exit]){for(const [dx,dy]of path(map,run.walk,target)){if(!moveRiftWalk(s,dx,dy)||!validState(JSON.parse(JSON.stringify(s))))throw Error('invalid walking save');steps++;}collectRiftChest(s);}if(!riftAtExit(s))throw Error('exit not reached');return steps;}

function fight(s,b){let turns=0;while(!b.result&&turns++<300){const m=s.party[b.active];act(s,b,m.hp<55&&s.potions?'potion':m.energy>=2?'skill':'attack');if(!validState(s)||!validBattle(b,s))throw Error('invalid rift battle state');}if(b.result!=='win')throw Error(`rift defeat at floor ${b.riftFloor}`);return turns;}

const reports=[];
for(let runIndex=1;runIndex<=3;runIndex++){
 const s=makeState(runIndex%3);s.seed=4400+runIndex;s.ended=true;s.badges=[0,1,2,3];s.potions=30;s.party=[0,2,5,7,12,15].map(id=>createMonster(id,40));startRift(s);const length=s.postgame.rift.maxFloor;let battles=0,turns=0,steps=0,rooms={battle:0,treasure:0,shrine:0,hazard:0};
 while(s.postgame.rift&&!s.postgame.rift.complete){steps+=explore(s);const room=riftRoom(s);rooms[room.kind]++;if(room.kind==='battle'){const b=riftEncounter(s);battles++;turns+=fight(s,b);}else{const choice={treasure:'record',shrine:'study',hazard:runIndex===1?'scout':'rush'}[room.kind];if(!resolveRift(s,choice))throw Error('room resolution failed');}if(!validState(s)||!validBattle(null,s))throw Error('invalid rift room state');}
 const pending=s.postgame.rift.pending;if(!retireRift(s))throw Error('rift retirement failed');reports.push({run:runIndex,length,battles,turns,steps,rooms,pending,banked:s.postgame.medals});
}
console.log(JSON.stringify(reports,null,2));
