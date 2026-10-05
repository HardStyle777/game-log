const test=require('node:test'),assert=require('node:assert/strict');
global.SlashRig=require('../slash-rig');const slash=require('../break-slash'),motion=require('../motion'),skills=require('../skills');
test('break has its own renderer; contact follows the existing combat hit fraction',()=>{
 assert.equal(motion.sample('break',.5).kind,'break');assert.equal(motion.sample('basic',.5).kind,'basic');
 assert.equal(slash.hit,skills.active.break.hitFractions[0]);
 const b=slash.blade(slash.hit,{x:160,y:14}),hit=slash.contact({x:160,y:14});
 for(let i=0;i<2;i++)assert.ok(Math.abs(hit[i]-(b.guard[i]+(b.tip[i]-b.guard[i])*.86))<1e-8);
 assert.ok(hit[0]>620&&hit[0]<670&&hit[1]>280&&hit[1]<340);
});
test('windup, planted step, rotation and follow through are continuous',()=>{
 let previous=0;
 for(let i=0;i<=1000;i++){const p=i/1000,q=slash.rigProgress(p);assert.ok(q>=previous);assert.ok(q-previous<.003);previous=q;}
 const start=SlashRig.sample(slash.rigProgress(.2)),hit=SlashRig.sample(slash.rigProgress(slash.hit)),end=SlashRig.sample(1);
 assert.ok(start.hand[1]>start.head[1]);assert.ok(hit.ankleR[2]>start.ankleR[2]+35);
 assert.ok(hit.twist>start.twist&&hit.hipTwist>start.hipTwist);assert.ok(end.tip[1]<hit.tip[1]);
});
