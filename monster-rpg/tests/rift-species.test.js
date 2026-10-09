import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,REGIONS,RIFT_SPECIES,makeState,createMonster,riftEncounter,act,migrateResearch,researchGoals,claimResearch,validState,validBattle} from '../dist/engine.js';

const cleared=()=>{const s=makeState();s.ended=true;s.badges=[0,1,2,3];s.party=[0,2,5,7,12,15].map(id=>createMonster(id,40));return s;};
const runAt=(seed,floor,maxFloor=floor)=>{const s=cleared();s.postgame.rift={seed,floor,maxFloor,pending:0,waiting:true,complete:false};return s;};

test('six illustrated rift species extend the codex without entering normal wild pools',()=>{
 assert.equal(SPECIES.length,56);assert.deepEqual(RIFT_SPECIES,[50,51,52,53,54,55]);
 assert.equal(new Set(SPECIES.slice(50).map(v=>v.name)).size,6);
 assert.ok(SPECIES.slice(50).every(v=>v.description.length>=20));
 assert.ok(REGIONS.every(r=>r.pool.every(id=>id<50)));
});

test('rift-exclusive species unlock by depth and all six can appear at floor 13',()=>{
 const shallow=new Set(),deep=new Set();
 for(let seed=1;seed<=300;seed++){
  let s=runAt(seed,2);let b=riftEncounter(s);for(const m of [b.enemy,...b.roster])if(m.id>=50)shallow.add(m.id);
  s=runAt(seed,13);b=riftEncounter(s);const last=b.roster.at(-1);assert.ok(last.id>=50);deep.add(last.id);
 }
 assert.equal(shallow.size,0);assert.deepEqual([...deep].sort((a,b)=>a-b),RIFT_SPECIES);
});

test('last rift-exclusive foe can be captured and resumes a valid saved run',()=>{
 const s=runAt(99,13);const b=riftEncounter(s),exclusive=b.roster.at(-1);b.enemy=exclusive;b.roster=[];b.enemy.hp=1;s.seed=0;
 act(s,b,'capture');assert.equal(b.result,'capture');assert.ok(s.caught.includes(exclusive.id));assert.equal(s.postgame.rift.complete,true);
 assert.ok(validState(s));assert.ok(validBattle(b,s));assert.ok(validBattle(null,s));
});

test('collecting all 56 species unlocks the final one-time codex reward',()=>{
 const s=cleared();s.caught=Array.from({length:56},(_,i)=>i);s.seen=[...s.caught];migrateResearch(s);
 const goal=researchGoals(s).find(g=>g.key==='dex-56');assert.ok(goal.ready);assert.equal(goal.medals,70);
 assert.ok(claimResearch(s,'dex-56'));assert.equal(s.postgame.medals,70);assert.equal(claimResearch(s,'dex-56'),false);assert.ok(validState(s));
});
