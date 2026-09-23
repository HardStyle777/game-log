const test=require('node:test');
const assert=require('node:assert/strict');
const HeroMotion=require('../motion.js');

function harness(){
 const stack=[],calls=[];
 const g={globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},translate(){}};
 const record=kind=>(...args)=>calls.push({kind,args,alpha:g.globalAlpha});
 const motion=HeroMotion.create(g,{combo:record('combo'),other:record('other'),basic:record('basic'),support:record('support')});
 return {motion,calls};
}

test('a new cast blends from the prior terminal pose without inserting idle',()=>{
 const {motion,calls}=harness();
 motion.draw({id:'triple',progress:1,now:1,token:1});
 calls.length=0;
 motion.draw({id:'thrust',progress:0,now:1.03,token:2});
 assert.deepEqual(calls.map(x=>x.kind),['combo','other']);
 assert.equal(calls[0].alpha,1,'the hand-off begins on the exact previous pose');
 calls.length=0;
 motion.draw({id:'thrust',progress:.05,now:1.08,token:2});
 assert.deepEqual(calls.map(x=>x.kind),['combo','other']);
 assert.ok(calls[0].alpha>0&&calls[0].alpha<1,'previous pose fades out');
 assert.ok(calls[1].alpha>0&&calls[1].alpha<1,'new pose fades in');
 assert.ok(Math.abs(calls[0].alpha+calls[1].alpha-1)<1e-9);
 calls.length=0;
 motion.draw({id:'thrust',progress:.2,now:1.2,token:2});
 assert.deepEqual(calls.map(x=>x.kind),['other']);
 assert.equal(calls[0].alpha,1);
});

test('cast token connects repeated skills and potion poses',()=>{
 const {motion,calls}=harness();
 motion.draw({id:'thrust',progress:1,now:2,token:8});
 calls.length=0;
 motion.draw({id:'thrust',progress:0,now:2.02,token:9});
 assert.equal(calls.length,2,'same skill with a new cast token still connects');
 motion.draw({id:'heal_potion',progress:1,now:3,token:10});
 calls.length=0;
 motion.draw({id:'sweep',progress:0,now:3.02,token:11});
 assert.deepEqual(calls.map(x=>x.kind),['support','other']);
});
