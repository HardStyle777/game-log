import test from 'node:test';
import assert from 'node:assert/strict';
import {makeState,createMonster,encounter,act,researchGoals,claimResearch,claimCaptureResearch,migrateResearch,researchTraining,validState,validBattle} from '../dist/engine.js';

test('research unlocks after ending, counts unique species and awards each milestone once',()=>{
 const s=makeState();s.caught=[0,1,2,3,0];assert.equal(researchGoals(s).find(g=>g.key==='dex-4').progress,4);assert.equal(claimResearch(s,'dex-4'),false);
 s.ended=true;assert.ok(claimResearch(s,'dex-4'));assert.equal(s.postgame.medals,5);assert.equal(claimResearch(s,'dex-4'),false);
 const resumed=JSON.parse(JSON.stringify(s));assert.ok(validState(resumed));assert.equal(claimResearch(resumed,'dex-4'),false);assert.equal(claimResearch(s,'unknown'),false);
});
test('the 32-species milestone appears only when implemented and survives claiming',()=>{
 const s=makeState();s.ended=true;s.caught=Array.from({length:32},(_,i)=>i);const goal=researchGoals(s).find(g=>g.key==='dex-32');
 assert.deepEqual({progress:goal.progress,goal:goal.goal,medals:goal.medals,ready:goal.ready},{progress:32,goal:32,medals:40,ready:true});assert.ok(claimResearch(s,'dex-32'));assert.equal(s.postgame.medals,40);
 const resumed=JSON.parse(JSON.stringify(s));assert.ok(validState(resumed));assert.equal(claimResearch(resumed,'dex-32'),false);
});
test('the 40-species milestone awards fifty medals once and survives reload',()=>{
 const s=makeState();s.ended=true;s.caught=Array.from({length:40},(_,i)=>i);const goal=researchGoals(s).find(g=>g.key==='dex-40');
 assert.deepEqual({progress:goal.progress,goal:goal.goal,medals:goal.medals,ready:goal.ready},{progress:40,goal:40,medals:50,ready:true});assert.ok(claimResearch(s,'dex-40'));assert.equal(s.postgame.medals,50);
 const resumed=JSON.parse(JSON.stringify(s));assert.ok(validState(resumed));assert.equal(claimResearch(resumed,'dex-40'),false);
});
test('the fifty-species completion milestone awards sixty-five medals once',()=>{
 const s=makeState();s.ended=true;s.caught=Array.from({length:50},(_,i)=>i);const goal=researchGoals(s).find(g=>g.key==='dex-50');
 assert.deepEqual({progress:goal.progress,goal:goal.goal,medals:goal.medals,ready:goal.ready},{progress:50,goal:50,medals:65,ready:true});assert.ok(claimResearch(s,'dex-50'));assert.equal(s.postgame.medals,65);
 const resumed=JSON.parse(JSON.stringify(s));assert.ok(validState(resumed));assert.equal(claimResearch(resumed,'dex-50'),false);
});
test('element and star collection rewards fund training without allowing duplicate rewards',()=>{
 const s=makeState();s.ended=true;s.caught=[0,4];s.party.push(createMonster(2,3,true));
 assert.ok(claimResearch(s,'type-0'));assert.equal(s.postgame.medals,8);assert.ok(claimResearch(s,'star'));assert.equal(s.postgame.medals,20);
 assert.ok(researchTraining(s));assert.equal(s.postgame.medals,10);assert.ok(validState(s));
 assert.equal(claimResearch(s,'type-0'),false);assert.equal(claimResearch(s,'type-1'),false);assert.equal(claimResearch(s,'star'),false);
});
test('recurring capture research banks only earned batches across three cycles and reloads',()=>{
 let s=makeState();s.ended=true;const balls=s.balls;
 for(let cycle=1;cycle<=3;cycle++){s.captures=cycle*10;assert.ok(claimCaptureResearch(s));assert.equal(s.postgame.medals,cycle*3);assert.equal(s.balls,balls+cycle*2);assert.equal(claimCaptureResearch(s),false);s=JSON.parse(JSON.stringify(s));assert.ok(validState(s));}
 s.captures=39;assert.equal(claimCaptureResearch(s),false);s.captures=40;assert.ok(claimCaptureResearch(s));assert.equal(s.postgame.medals,12);
});
test('legacy saves gain research records and corrupt or duplicated claims are rejected',()=>{
 const s=makeState();s.captures=25;assert.ok(validState(s));migrateResearch(s);assert.deepEqual(s.research,{claimed:[],captureBatches:0});
 for(const research of [{claimed:['star','star'],captureBatches:0},{claimed:['type-8'],captureBatches:0},{claimed:[],captureBatches:3},{claimed:[],captureBatches:-1},{claimed:[],captureBatches:1.5}])assert.equal(validState({...s,research}),false);
});
test('successful captures preserve rolled aptitudes and earn the next research batch',()=>{
 const s=makeState();s.ended=true;s.captures=9;let b;
 for(let attempt=0;attempt<30;attempt++){b=encounter(s,0);b.enemy.hp=1;s.balls=30;const aptitude={...b.enemy.aptitudes};act(s,b,'capture');if(b.result==='capture'){assert.deepEqual(s.party.at(-1).aptitudes,aptitude);break;}}
 assert.equal(b.result,'capture');assert.equal(s.captures,10);assert.ok(validBattle(b,s));assert.ok(claimCaptureResearch(s));assert.ok(validState(s));
});
