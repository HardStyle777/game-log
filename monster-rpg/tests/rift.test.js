import test from 'node:test';
import assert from 'node:assert/strict';
import {makeState,createMonster,maxHP,act,startRift,riftRoom,riftEncounter,resolveRift,retireRift,startTower,validState,validBattle} from '../dist/engine.js';

function cleared(seed=1){const s=makeState();s.seed=seed;s.ended=true;s.badges=[0,1,2,3];s.party=[0,2,5,7,12,15].map(id=>createMonster(id,40));s.potions=30;return s;}
function win(s,b){let turns=0;while(!b.result&&turns++<200){const m=s.party[b.active];act(s,b,m.hp<55&&s.potions?'potion':m.energy>=2?'skill':'attack');}assert.equal(b.result,'win');}

test('rift unlocks after ending with deterministic 5-15 floor runs',()=>{
 assert.equal(startRift(makeState()),null);const s=cleared(123),room=startRift(s);assert.equal(room.kind,'battle');assert.ok(s.postgame.rift.maxFloor>=5&&s.postgame.rift.maxFloor<=15);
 const copy=JSON.parse(JSON.stringify(s));assert.deepEqual(riftRoom(copy),riftRoom(s));assert.ok(validState(copy));assert.ok(validBattle(null,copy));assert.equal(startTower(s),null);
});

test('treasure, shrine and hazard choices advance floors with distinct tradeoffs',()=>{
 const s=cleared();startRift(s);const run=s.postgame.rift,kinds=new Map();
 for(let seed=1;seed<500&&kinds.size<3;seed++){for(let floor=2;floor<8;floor++){Object.assign(run,{seed,floor,maxFloor:10,pending:0,waiting:true,complete:false});const room=riftRoom(s);if(room.kind!=='battle'&&!kinds.has(room.kind))kinds.set(room.kind,{seed,floor});}}
 assert.equal(kinds.size,3);
 let pos=kinds.get('treasure');Object.assign(run,{...pos,maxFloor:10,pending:0,waiting:true,complete:false});const balls=s.balls;assert.ok(resolveRift(s,'crystal'));assert.equal(s.balls,balls+2);assert.equal(run.pending,1);
 pos=kinds.get('shrine');Object.assign(run,{...pos,maxFloor:10,pending:0,waiting:true,complete:false});s.party[0].hp=1;assert.ok(resolveRift(s,'heal'));assert.equal(s.party[0].hp,maxHP(s.party[0]));
 pos=kinds.get('hazard');Object.assign(run,{...pos,maxFloor:10,pending:0,waiting:true,complete:false});const hp=s.party[0].hp;assert.ok(resolveRift(s,'rush'));assert.equal(run.pending,4);assert.ok(s.party[0].hp<hp);assert.equal(resolveRift(s,'bad'),false);
});

test('rift combat victory resumes exploration and completion banks bonus once',()=>{
 const s=cleared(77);startRift(s);let b=riftEncounter(s);assert.ok(b.rift);assert.equal(validBattle(null,s),false);assert.ok(validBattle(b,s));win(s,b);
 assert.ok(s.postgame.rift.waiting);assert.ok(s.postgame.rift.pending>=2);assert.ok(validBattle(b,s));assert.ok(validBattle(null,s));
 const run=s.postgame.rift;run.floor=run.maxFloor;run.waiting=true;run.complete=false;b=riftEncounter(s);win(s,b);assert.equal(run.complete,true);const pending=run.pending;
 assert.ok(retireRift(s));assert.equal(s.postgame.medals,pending+5);assert.equal(s.postgame.riftRuns,1);assert.equal(s.postgame.rift,null);assert.equal(retireRift(s),false);
});

test('rift defeat loses only pending rewards and corrupted resumes are rejected',()=>{
 const s=cleared();s.party=[createMonster(0,1)];s.party[0].hp=1;s.postgame.rift={seed:9,floor:15,maxFloor:15,pending:11,waiting:true,complete:false};let b=riftEncounter(s),turns=0;while(!b.result&&turns++<20)act(s,b,'attack');
 assert.equal(b.result,'lose');assert.equal(s.postgame.rift,null);assert.equal(s.postgame.medals,0);assert.equal(s.party[0].hp,maxHP(s.party[0]));assert.ok(validBattle(b,s));
 const good=cleared();startRift(good);b=riftEncounter(good);for(const bad of [{...b,riftFloor:16},{...b,riftModifier:9},{...b,rift:false},{...b,result:'capture'}])assert.equal(validBattle(bad,good),false);
 for(const bad of [{...good,postgame:{...good.postgame,riftBest:16}},{...good,postgame:{...good.postgame,rift:{...good.postgame.rift,maxFloor:4}}}])assert.equal(validState(bad),false);
});
