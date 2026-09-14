const test=require('node:test'),assert=require('node:assert/strict'),{battle}=require('./revised_combat.cjs');
const p={hp:100,cp:0,atk:10,def:0,hit:1,crit:0,potions:0};
const e={hp:100,atk:0,def:0,interval:2};
test('attack speed improves skill cast times',()=>{const base={...p,skills:[{id:'a',mult:1,cast:1,cooldown:0}]};assert.ok(battle({player:{...base,attackSpeed:2},enemies:[e]}).seconds<battle({player:base,enemies:[e]}).seconds);});
test('potion is finite HoT and persists across encounter',()=>{const r=battle({player:{...p,potions:1,atk:100,skills:[{id:'pot',type:'potion',hpBelow:.8,cast:.5,healRatio:.3}]},state:{hp:50,potions:1},enemies:[e]});assert.equal(r.potionsUsed,1);assert.ok(r.hp>50&&r.hp<80);assert.ok(r.state.hots.length);const b=battle({player:{...p,atk:100},state:r.state,enemies:[e]});assert.ok(b.hp>r.hp);});
test('dead character cannot revive from HoT',()=>{const r=battle({player:p,enemies:[e],state:{hp:0,hots:[{rate:100,until:100}]}});assert.equal(r.reason,'defeat');assert.equal(r.hp,0);});
test('boss instant death immunity, ordinary enemy vulnerable',()=>{const q={...p,atk:0,procs:[{type:'instant',chance:1}]};assert.equal(battle({player:q,enemies:[e],maxSeconds:2}).win,true);assert.equal(battle({player:q,enemies:[{...e,boss:true}],maxSeconds:2}).win,false);});
test('poison persists within fight and causes damage',()=>{const r=battle({player:{...p,atk:0,elementDamage:{earth:[100,100]},poisonDuration:1},enemies:[e],maxSeconds:5});assert.equal(r.win,true);});
test('reflection victory is recognized',()=>{const r=battle({player:{...p,atk:0,reflect:1},enemies:[{...e,hp:5,atk:10,interval:.1}]});assert.equal(r.win,true);});
test('full state resistance prevents frozen action suppression',()=>{const enemy={...e,procs:[{type:'freeze',chance:1,duration:5}],interval:.1};const a=battle({player:p,enemies:[enemy],maxSeconds:20}),b=battle({player:{...p,statusResist:{all:1}},enemies:[enemy],maxSeconds:20});assert.equal(a.win,false);assert.equal(b.win,true);});
test('CP floor protects drain without granting CP or allowing unaffordable skills',()=>{const q={...p,cp:10,atk:0,cpFloor:5,skills:[{id:'expensive',cost:20,cast:.1}]};const r=battle({player:q,state:{cp:2},enemies:[{...e,interval:.1,cpDrain:100}],maxSeconds:.5});assert.equal(r.cp,2);assert.equal(r.casts.expensive,undefined);});
test('lethal hit cannot be repaired by future HoT tick',()=>{const r=battle({player:p,state:{hp:1,hots:[{rate:1,until:6}]},enemies:[{...e,atk:1000,interval:.1}],maxSeconds:5});assert.equal(r.reason,'defeat');assert.ok(r.seconds<1);});
test('charmed foe damages another enemy but cannot attack player alone',()=>{const q={...p,atk:0,procs:[{type:'charm',chance:1,duration:100}]};const r=battle({player:q,enemies:[{...e,hp:1,atk:1000,interval:2},{...e,hp:1,atk:1000,interval:2}],maxSeconds:5});assert.equal(r.hp,100);assert.equal(r.win,false);});
test('taunt does not fabricate accuracy or evasion gains',()=>{const q={...p,atk:0,procs:[{type:'taunt',chance:1,duration:10}]};const r=battle({player:q,enemies:[e],maxSeconds:3});assert.equal(r.hp,100);assert.equal(r.win,false);});
test('curse reduces enemy regeneration and can break stalemate',()=>{const q={...p,atk:10},enemy={...e,hp:30,hpRegen:12};assert.equal(battle({player:q,enemies:[enemy],maxSeconds:20}).win,false);assert.equal(battle({player:{...q,procs:[{type:'curse',chance:1,duration:10}]},enemies:[enemy],maxSeconds:20}).win,true);});
for(const element of ['fire','water','wind','earth','light','dark']){
 test(`${element} skill uses magic power and bypasses physical defense`,()=>{
  const caster={...p,atk:0,magicPower:100,minAttack:999,maxAttack:999,skills:[{id:'spell',element,mult:1,cast:1}]};
  const target={...e,hp:100,def:100000};
  assert.equal(battle({player:caster,enemies:[target],maxSeconds:1.1}).win,true);
  assert.equal(battle({player:{...caster,magicPower:0,atk:1000},enemies:[target],maxSeconds:1.1}).win,false);
  assert.equal(battle({player:caster,enemies:[{...target,resist:{[element]:.5}}],maxSeconds:1.1}).win,false);
 });
 test(`${element} incoming damage ignores defense but uses resistance`,()=>{
  const defender={...p,hp:1000,atk:0,def:100000};
  const enemy={...e,atk:100,element,interval:.5};
  const first=battle({player:defender,enemies:[enemy],maxSeconds:.6});
  const resisted=battle({player:{...defender,resist:{[element]:.5}},enemies:[enemy],maxSeconds:.6});
  assert.equal(first.hp,900);assert.equal(resisted.hp,950);
 });
}
test('physical damage uses defense and ignores elemental resistance',()=>{
 const r=battle({player:{...p,atk:0,def:100,resist:{physical:.85,fire:.85}},enemies:[{...e,atk:100,interval:.5}],maxSeconds:.6});
 assert.equal(r.hp,50);
 const q={...p,atk:100,magicPower:10000};
 assert.equal(battle({player:q,enemies:[{...e,def:100}],maxSeconds:1.1}).win,false);
 assert.equal(battle({player:q,enemies:[{...e,resist:{physical:.85}}],maxSeconds:1.1}).win,true);
});
test('charmed elemental foe ignores other foe physical defense and respects resistance',()=>{
 // First foe is charmed at t=1 and kills second at t=2; only first remains.
 // With fire resistance, second foe survives and its same-timestamp attack defeats the player.
 const caster={...p,atk:0,procs:[{type:'charm',chance:1,duration:100}],reflect:0};
 const enemies=[{...e,hp:1,atk:100,element:'fire',interval:2},{...e,hp:100,atk:1000,def:100000,interval:2}];
 assert.equal(battle({player:caster,enemies,maxSeconds:2.1}).hp,100);
 assert.equal(battle({player:caster,enemies:[enemies[0],{...enemies[1],resist:{fire:.5}}],maxSeconds:2.1}).reason,'defeat');
});
