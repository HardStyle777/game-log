const test=require('node:test'),assert=require('node:assert/strict');
const {purchase}=require('./town_shop.cjs');
test('restock at threshold, retain reserve, no input mutation',()=>{const x={gold:500,potions:5};assert.deepEqual(purchase(x),{gold:250,potions:30,bought:25,spent:250,reason:'purchased'});assert.equal(x.gold,500);});
test('partial purchase respects reserve and integer stock',()=>{const r=purchase({gold:127,potions:0});assert.equal(r.bought,2);assert.equal(r.gold,107);});
test('no affordable purchase cannot create money or supplies',()=>{const r=purchase({gold:99,potions:0});assert.equal(r.spent,0);assert.equal(r.potions,0);});
test('automatic toggle and manual request',()=>{assert.equal(purchase({gold:500,potions:10}).bought,0);assert.equal(purchase({gold:500,potions:0},{enabled:false}).bought,0);assert.equal(purchase({gold:500,potions:10},{enabled:false},true).bought,20);});
test('invalid settings rejected',()=>{assert.throws(()=>purchase({gold:500,potions:0},{price:0}));assert.throws(()=>purchase({gold:500,potions:0},{target:5}));});
test('journey money and potion accounting with town enabled',()=>{const {trial}=require('./journey_v2.cjs');const r=trial(1,{maxHours:1});assert(r.townVisits>0);assert.equal(r.gold,200+r.earnedGold-r.spentGold);assert.equal(r.combatState.potions,20+r.foundPotions+r.boughtPotions-r.usedPotions);assert(r.townLog.every(t=>t.gold>=r.shopSettings.reserve));});
