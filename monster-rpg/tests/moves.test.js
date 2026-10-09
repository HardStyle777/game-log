import test from 'node:test';
import assert from 'node:assert/strict';
import {MOVES,SPECIES,makeState,createMonster,maxHP,learnedMoves,equippedMoves,equipMove,migrateMoves,addXP,xpToNext,encounter,act,validState,validBattle} from '../dist/engine.js';

test('64 named moves provide eight distinct choices per element and level gates',()=>{
 assert.equal(MOVES.length,64);assert.equal(new Set(MOVES.map(v=>v.name)).size,64);
 for(let type=0;type<8;type++){
  const id=SPECIES.find(s=>s.type===type).id,m=createMonster(id,1);
  assert.equal(learnedMoves(m).length,1);m.level=28;assert.equal(learnedMoves(m).length,8);
  assert.equal(new Set(learnedMoves(m).map(v=>v.kind+':'+v.power)).size,8);
 }
});
test('equipment rejects locked, duplicate, cross-element and invalid slots',()=>{
 const m=createMonster(0,3);assert.equal(equipMove(m,2,0),false);assert.equal(equipMove(m,8,0),false);assert.equal(equipMove(m,0,1),false);
 m.level=28;assert.equal(equipMove(m,7,4),false);assert.equal(equipMove(m,7,0),true);assert.deepEqual(equippedMoves(m).map(v=>v.id),[7,1]);
});
test('legacy party, box and in-progress enemy saves migrate without losing progress',()=>{
 const s=makeState();s.box=[createMonster(2,20)];const b=encounter(s,2,true);
 for(const m of [...s.party,...s.box,b.enemy,...b.roster])delete m.moves;
 const hp=s.party[0].hp,coins=s.coins;assert.ok(validState(s));assert.ok(validBattle(b,s));migrateMoves(s,b);
 assert.equal(s.party[0].hp,hp);assert.equal(s.coins,coins);assert.ok(s.box[0].moves.length<=4);assert.ok(b.enemy.moves.length);assert.ok(validBattle(b,s));
});
test('level-up teaches moves without overwriting four equipped choices',()=>{
 const m=createMonster(0,5);const events=addXP(m,xpToNext(5));assert.equal(m.level,6);assert.ok(m.moves.includes(2));assert.ok(events.some(x=>x.includes('芽吹きの祈り')));
 const high=createMonster(0,21);high.moves=[0,1,3,5];addXP(high,xpToNext(21));assert.equal(high.level,22);assert.deepEqual(high.moves,[0,1,3,5]);assert.ok(learnedMoves(high).some(v=>v.id===6));
});
function setup(kind){const s=makeState();s.seed=123;s.party=[createMonster(0,28)];const id=MOVES.find(v=>v.type===0&&v.kind===kind).id;s.party[0].moves=[id];const b=encounter(s,3,true);return {s,b,m:s.party[0],id};}
test('unavailable or unaffordable moves consume no item, energy or turn',()=>{
 const {s,b,m,id}=setup('heal');m.hp-=30;m.energy=0;const hp=m.hp;act(s,b,'move',id);assert.equal(b.turn,0);assert.equal(m.hp,hp);
 act(s,b,'move',63);assert.equal(b.turn,0);m.energy=4;m.hp=maxHP(m);act(s,b,'move',id);assert.equal(b.turn,0);assert.equal(m.energy,4);
});
test('healing, drain, shield, weakening, focus and damage-over-time operate in real combat',()=>{
 let a=setup('heal');a.m.hp=100;act(a.s,a.b,'move',a.id);assert.ok(a.b.log.some(x=>x.includes('回復した')));assert.equal(a.m.energy,2);
 a=setup('drain');a.m.hp=100;act(a.s,a.b,'move',a.id);assert.ok(a.b.log.some(x=>x.includes('吸収した')));
 for(const [kind,key,value,side] of [['shield','shield',0,'ally'],['weaken','weaken',2,'enemy'],['focus','focus',3,'ally'],['poison','poison',2,'enemy']]){
  a=setup(kind);act(a.s,a.b,'move',a.id);assert.equal(a.b.effects[side][key],value);assert.ok(validBattle(JSON.parse(JSON.stringify(a.b)),a.s));
 }
 a=setup('poison');act(a.s,a.b,'move',a.id);assert.ok(a.b.log.some(x=>x.includes('印で')));act(a.s,a.b,'guard');act(a.s,a.b,'guard');assert.equal(a.b.effects.enemy.poison,0);
});
test('enemy uses equipped techniques and switching clears outgoing battle effects',()=>{
 const s=makeState();s.party=[createMonster(0,28),createMonster(2,28)];const b=encounter(s,0,true);b.turn=2;b.enemy.moves=[1];
 act(s,b,'guard');assert.ok(b.log.some(x=>x.includes('大樹の一撃')));b.effects.ally={poison:3,focus:3};act(s,b,'switch',1);assert.deepEqual(b.effects.ally,{});
});
test('move and temporary-effect corruption is rejected on resume',()=>{
 const s=makeState(),b=encounter(s,0);
 for(const moves of [[0,0],[8],[7],[],[0,1,2,3,4],'bad'])assert.equal(validState({...s,party:[{...s.party[0],moves}]}),false);
 for(const effects of [{ally:{poison:999},enemy:{}},{ally:{focus:-1},enemy:{}},{ally:{hack:1},enemy:{}},{ally:[],enemy:{}},{}])assert.equal(validBattle({...b,effects},s),false);
});
test('all 64 equipped moves preserve save invariants across seeded combat',()=>{
 for(const v of MOVES){const id=SPECIES.find(m=>m.type===v.type).id,s=makeState();s.seed=v.id+1;s.party=[createMonster(id,28)];s.party[0].moves=[v.id];s.party[0].hp=Math.floor(maxHP(s.party[0])*.65);const b=encounter(s,3,true);
  for(let turn=0;turn<8&&!b.result;turn++){act(s,b,s.party[b.active].energy>=v.cost?'move':'guard',v.id);assert.ok(validState(s),'move '+v.id);assert.ok(validBattle(b,s),'battle '+v.id);}
 }
});
test('knockout rounds still expire focus and resolve ongoing damage',()=>{
 const {s,b,m}=setup('hit');b.effects={ally:{focus:3,poison:2},enemy:{}};b.enemy.hp=1;const hp=m.hp;
 act(s,b,'attack');assert.equal(b.effects.ally.focus,2);assert.equal(b.effects.ally.poison,1);assert.ok(m.hp<hp);assert.equal(b.turn,1);assert.ok(validBattle(b,s));
});
test('long battle history stays bounded and can be resumed',()=>{
 const s=makeState(),b=encounter(s,0);b.log=Array.from({length:500},()=> '以前の行動');act(s,b,'guard');assert.ok(b.log.length<=500);assert.ok(validBattle(JSON.parse(JSON.stringify(b)),s));
});
