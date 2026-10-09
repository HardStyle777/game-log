import {SPECIES,effectiveness,equippedMoves,makeState,createMonster,maxHP,power,masterEncounter,act,validState,validBattle} from '../dist/engine.js';

function play(s,b){
 let turns=0;
 while(!b.result&&turns++<300){
  const scores=s.party.map(m=>m.hp>0?power(m)*effectiveness(SPECIES[m.id].type,SPECIES[b.enemy.id].type):-1);
  const best=scores.indexOf(Math.max(...scores)),m=s.party[b.active];
  if(best!==b.active&&scores[best]>scores[b.active]*1.25)act(s,b,'switch',best);
  else if(m.hp<maxHP(m)*.35&&s.potions)act(s,b,'potion');
  else{
   const move=equippedMoves(m).filter(v=>v.power>0&&v.cost<=m.energy).sort((a,c)=>c.power*effectiveness(c.type,SPECIES[b.enemy.id].type)-a.power*effectiveness(a.type,SPECIES[b.enemy.id].type))[0];
   act(s,b,move?'move':m.energy<2?'guard':'attack',move?.id);
  }
  if(!validState(s)||!validBattle(b,s))throw Error('invalid enhanced guardian state');
 }
 if(!b.result)throw Error('enhanced guardian battle did not finish');
 return {result:b.result,turns};
}

const reports=[];
for(const rank of [1,5,10])for(let region=0;region<4;region++){
 let wins=0,turns=0;
 for(let seed=1;seed<=25;seed++){
  const s=makeState();s.seed=seed;s.ended=true;s.badges=[0,1,2,3];s.potions=8;s.postgame.guardianRanks[region]=rank-1;
  s.party=[1,2,3,5,13,14].map((id,i)=>createMonster(id,Math.min(40,30+rank+i%2),false,{vitality:Math.min(3,1+Math.floor(rank/4)),force:Math.min(3,1+Math.floor(rank/4))},i%4));
  const out=play(s,masterEncounter(s,region));turns+=out.turns;if(out.result==='win')wins++;
 }
 reports.push({region,rank,wins,attempts:25,averageTurns:Math.round(turns/25)});
}
console.log(JSON.stringify(reports));
