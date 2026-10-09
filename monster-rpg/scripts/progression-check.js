import assert from 'node:assert/strict';
import {makeState,createMonster,SPECIES,encounter,act,heal,equippedMoves,effectiveness,power,validState,validBattle} from '../dist/engine.js';
// Prepared-team combat check. This does not measure campaign length or award preparation XP.
const stages=[{level:5,count:3},{level:10,count:3},{level:15,count:4},{level:20,count:4},{level:24,count:6}];
const results=stages.map((stage,index)=>({...stage,stage:index+1,wins:0,losses:0,minTurns:Infinity,maxTurns:0}));
for(let starter=0;starter<3;starter++)for(let seed=1;seed<=100;seed++)for(let stage=0;stage<5;stage++){
 const s=makeState(starter);s.seed=seed;s.badges=Array.from({length:Math.min(stage,4)},(_,i)=>i);
 const setup=stages[stage],ids=[starter,...[0,1,2,3,8,11].filter(id=>id!==starter)].slice(0,setup.count);
 s.party=ids.map(id=>createMonster(setup.level>=10?SPECIES[id].evolve??id:id,setup.level));heal(s);
 const b=encounter(s,Math.min(stage,3),true,stage===4);let actions=0;
 while(!b.result&&actions++<200){
  const scores=s.party.map(m=>m.hp>0?power(m)*effectiveness(SPECIES[m.id].type,SPECIES[b.enemy.id].type):-1);
  const best=scores.indexOf(Math.max(...scores)),m=s.party[b.active];
  if(best!==b.active&&scores[best]>scores[b.active]*1.3)act(s,b,'switch',best);
  else if(m.hp<20&&s.potions)act(s,b,'potion');
  else {const move=equippedMoves(m).filter(v=>v.power>0&&v.cost<=m.energy).sort((a,c)=>c.power-a.power)[0];act(s,b,move?'move':'guard',move?.id);}
  assert.ok(validState(s));assert.ok(validBattle(b,s));
 }
 assert.ok(b.result,'combat turn limit');const result=results[stage];result[b.result==='win'?'wins':'losses']++;result.minTurns=Math.min(result.minTurns,b.turn);result.maxTurns=Math.max(result.maxTurns,b.turn);
}
console.log(JSON.stringify({kind:'prepared teams; not normal play duration',results},null,2));
assert.ok(results.every(r=>r.wins===300),'recommended team failed');
