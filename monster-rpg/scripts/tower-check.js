import {makeState,createMonster,act,startTower,continueTower,retireTower,validState,validBattle} from '../dist/engine.js';

function playBattle(s,b){let turns=0;while(!b.result&&turns++<300){const m=s.party[b.active];act(s,b,m.hp<55&&s.potions?'potion':m.energy>=2?'skill':'attack');if(!validState(s)||!validBattle(b,s))throw Error('invalid tower state');}if(!b.result)throw Error('tower battle did not finish');return turns;}

const reports=[];
for(let run=1;run<=3;run++){
 const s=makeState(run%3);s.seed=9000+run;s.ended=true;s.badges=[0,1,2,3];s.potions=20;s.party=[0,2,5,7,12,15].map(id=>createMonster(id,40));
 let b=startTower(s),turns=0;
 for(let floor=1;floor<=10;floor++){
  turns+=playBattle(s,b);if(b.result!=='win')throw Error(`run ${run} lost at floor ${floor}`);
  if(floor<10)b=continueTower(s,floor===5?(run===2?'bonus':'heal'):'next');
 }
 const pending=s.postgame.tower.pending;if(!retireTower(s))throw Error('tower retirement failed');
 reports.push({run,floors:10,turns,pending,medals:s.postgame.medals,checkpoint:run===2?'bonus':'heal'});
}
console.log(JSON.stringify(reports,null,2));
