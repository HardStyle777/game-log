import test from 'node:test';
import assert from 'node:assert/strict';
import {makeState,createMonster,maxHP,power,traitName,natureOf,researchTraining,researchNature,act,encounter,startTower,continueTower,retireTower,buyResearch,migratePostgame,migrateAptitudes,towerEncounter,validState,validBattle} from '../dist/engine.js';

function clearedState(){const s=makeState();s.ended=true;s.badges=[0,1,2,3];s.party=Array.from({length:6},(_,i)=>createMonster(i<4?i:i+8,40));return s;}
function win(s,b){let turns=0;while(!b.result&&turns++<200){const m=s.party[b.active];act(s,b,m.energy>=2?'skill':'attack');}assert.equal(b.result,'win');}

test('tower unlock, encounter composition and resume invariants',()=>{
 const locked=makeState();assert.equal(startTower(locked),null);
 const s=clearedState();s.party[0].hp=1;const b=startTower(s);
 assert.ok(b?.tower);assert.equal(b.towerFloor,1);assert.equal(b.totalEnemies,2);assert.equal(s.party[0].hp,maxHP(s.party[0]));
 assert.ok(validState(s));assert.ok(validBattle(b,s));assert.equal(validBattle(null,s),false);
 const fifth={...s.postgame.tower,floor:5};s.postgame.tower=fifth;const boss=towerEncounter(s);assert.equal(boss.totalEnemies,3);assert.equal(boss.towerFloor,5);
});

test('tower wins stage rewards, checkpoints and safe retirement',()=>{
 const s=clearedState();let b=startTower(s);win(s,b);
 assert.equal(s.postgame.tower.waiting,true);assert.equal(s.postgame.tower.pending,2);assert.equal(s.postgame.bestFloor,1);assert.ok(validBattle(b,s));assert.ok(validBattle(null,s));
 b=continueTower(s,'next');assert.equal(b.towerFloor,2);win(s,b);
 s.postgame.tower.floor=5;s.postgame.tower.waiting=true;s.postgame.tower.pending=12;s.party[0].hp=1;
 assert.equal(continueTower(s,'next'),null);b=continueTower(s,'heal');assert.equal(b.towerFloor,6);assert.equal(s.party[0].hp,maxHP(s.party[0]));
 b.enemy.hp=1;win(s,b);const earned=s.postgame.tower.pending;assert.equal(retireTower(s),true);assert.equal(s.postgame.medals,earned);assert.equal(s.postgame.runs,1);assert.equal(s.postgame.tower,null);assert.equal(retireTower(s),false);
});

test('risk bonus, research exchange and defeat loss form a closed reward loop',()=>{
 const s=clearedState();s.postgame.tower={floor:5,pending:10,waiting:true};let b=continueTower(s,'bonus');assert.equal(b.towerFloor,6);assert.equal(s.postgame.tower.pending,15);b.enemy.hp=1;win(s,b);assert.ok(retireTower(s));
 const beforePotions=s.potions,beforeBalls=s.balls;s.postgame.medals=14;
 assert.ok(buyResearch(s,'potion'));assert.equal(s.potions,beforePotions+3);assert.equal(s.postgame.medals,8);
 assert.ok(buyResearch(s,'ball'));assert.equal(s.balls,beforeBalls+5);assert.equal(s.postgame.medals,0);assert.equal(buyResearch(s,'ball'),false);
 s.party=[createMonster(0,1)];s.party[0].hp=1;s.postgame.tower={floor:40,pending:9,waiting:false};b=towerEncounter(s);let turns=0;while(!b.result&&turns++<20)act(s,b,'attack');
 assert.equal(b.result,'lose');assert.equal(s.postgame.tower,null);assert.equal(s.postgame.medals,0);assert.equal(s.party[0].hp,maxHP(s.party[0]));assert.ok(validBattle(b,s));
});

test('legacy saves migrate while corrupt postgame and tower pairs are rejected',()=>{
 const legacy=makeState();delete legacy.postgame;assert.ok(validState(legacy));migratePostgame(legacy);assert.deepEqual(legacy.postgame,{medals:0,bestFloor:0,runs:0,tower:null,riftBest:0,riftRuns:0,rift:null});
 const s=clearedState();for(const bad of [{...s,postgame:{medals:-1,bestFloor:0,runs:0,tower:null}},{...s,postgame:{medals:0,bestFloor:1000,runs:0,tower:null}},{...s,postgame:{medals:0,bestFloor:0,runs:0,tower:{floor:0,pending:0,waiting:false}}}])assert.equal(validState(bad),false);
 const b=startTower(s);assert.equal(validBattle({...b,towerFloor:2},s),false);assert.equal(validBattle({...b,tower:false},s),false);assert.equal(validBattle({...b,result:'capture'},s),false);
});
test('individual aptitudes create collectable differences and research training has a cost',()=>{
 const s=clearedState(),m=s.party[0];m.aptitudes={vitality:0,force:2};m.hp=maxHP(m);const hp=maxHP(m),attack=power(m);s.postgame.medals=19;
 assert.equal(traitName(m),'勇猛');assert.ok(researchTraining(s));assert.equal(m.aptitudes.vitality,1);assert.equal(maxHP(m),hp+2);assert.equal(power(m),attack);assert.equal(s.postgame.medals,9);
 assert.equal(researchTraining(s),false);s.postgame.medals=30;m.aptitudes={vitality:3,force:3};assert.equal(traitName(m),'天賦');assert.equal(researchTraining(s),false);
 const legacy=clearedState();delete legacy.party[0].aptitudes;assert.ok(validState(legacy));migrateAptitudes(legacy);assert.deepEqual(legacy.party[0].aptitudes,{vitality:1,force:1});assert.ok(validState(legacy));
});
test('four natures change damage, defense, energy and healing with bounded effects',()=>{
 const attackDamage=nature=>{const s=makeState();s.seed=99;s.wins=1;s.party=[createMonster(0,12,false,{vitality:1,force:1},nature)];const b=encounter(s,0);b.enemy=createMonster(0,12,false,{vitality:1,force:1},3);const hp=b.enemy.hp;act(s,b,'attack');return hp-b.enemy.hp;};
 assert.ok(attackDamage(0)>attackDamage(3));
 const received=nature=>{const s=makeState();s.seed=55;s.wins=1;s.party=[createMonster(0,12,false,{vitality:1,force:1},nature)];const b=encounter(s,0);b.enemy=createMonster(0,12,false,{vitality:1,force:1},3);const hp=s.party[0].hp;act(s,b,'guard');return hp-s.party[0].hp;};
 assert.ok(received(1)<received(3));
 const energetic=makeState();energetic.wins=1;energetic.party=[createMonster(0,12,false,{vitality:1,force:1},2)];energetic.party[0].energy=0;let b=encounter(energetic,0);act(energetic,b,'attack');assert.equal(energetic.party[0].energy,2);
 const healing=nature=>{const s=makeState();s.seed=123;s.wins=1;s.party=[createMonster(0,12,false,{vitality:1,force:1},nature)];s.party[0].moves=[2];s.party[0].hp=1;const b=encounter(s,0);b.enemy=createMonster(0,1,false,{vitality:0,force:0},3);const hp=s.party[0].hp;act(s,b,'move',2);return s.party[0].hp-hp;};
 assert.ok(healing(3)>healing(0));assert.equal(natureOf(createMonster(0,3,false,null,0)).name,'勇敢');
});
test('nature research cycles the lead for six medals and legacy values migrate once',()=>{const s=clearedState();s.postgame.medals=12;s.party[0].nature=0;assert.ok(researchNature(s));assert.equal(s.party[0].nature,1);assert.equal(s.postgame.medals,6);assert.ok(researchNature(s));assert.equal(s.party[0].nature,2);assert.equal(s.postgame.medals,0);assert.equal(researchNature(s),false);const legacy=clearedState();delete legacy.party[0].nature;assert.ok(validState(legacy));migrateAptitudes(legacy);assert.ok(Number.isInteger(legacy.party[0].nature));const migrated=legacy.party[0].nature;migrateAptitudes(legacy);assert.equal(legacy.party[0].nature,migrated);assert.ok(validState(legacy));for(const bad of [-1,4,1.5])assert.equal(validState({...legacy,party:[{...legacy.party[0],nature:bad}]}),false);});
