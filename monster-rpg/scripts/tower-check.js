import {makeState,createMonster,act,startTower,continueTower,retireTower,validState,validBattle,SPECIES,effectiveness,power,equippedMoves} from '../dist/engine.js';

function playBattle(s,b){let turns=0;while(!b.result&&turns++<300){const scores=s.party.map(m=>m.hp>0?power(m)*effectiveness(SPECIES[m.id].type,SPECIES[b.enemy.id].type):-1),best=scores.indexOf(Math.max(...scores)),m=s.party[b.active];if(best!==b.active&&scores[best]>scores[b.active]*1.3)act(s,b,'switch',best);else if(m.hp<55&&s.potions)act(s,b,'potion');else{const move=equippedMoves(m).filter(v=>v.power>0&&v.cost<=m.energy).sort((a,c)=>c.power-a.power)[0];act(s,b,move?'move':'guard',move?.id);}if(!validState(s)||!validBattle(b,s))throw Error('invalid tower state');}if(!b.result)throw Error('tower battle did not finish');return turns;}

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
