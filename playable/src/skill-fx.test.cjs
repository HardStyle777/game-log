const test=require('node:test'),assert=require('node:assert/strict');
const fx=require('../skill-fx'),motion=require('../motion');
test('elemental effects meet the actual animation hit frames',()=>{
 for(const [id,d]of Object.entries(fx.definitions)){
 assert.equal(motion.sample(id,d.hit-1e-5).frame,1);
 assert.equal(motion.sample(id,d.hit+1e-5).frame,2);
 }
});
test('effects have finite geometry and expire without lingering drawings',()=>{
 let calls=0,stack=[];const g=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha)},restore(){this.globalAlpha=stack.pop()},createRadialGradient(){return {addColorStop(){}}}},{get(o,k){return k in o?o[k]:(...args)=>{calls++;for(const x of args)if(typeof x==='number')assert.ok(Number.isFinite(x),k)}}});
 for(const id of Object.keys(fx.definitions)){
 for(let i=0;i<101;i++){fx.cast(g,id,i/100);fx.impact(g,id,650,315,i/100);assert.equal(stack.length,0);assert.equal(g.globalAlpha,1);}
 const before=calls;fx.cast(g,id,1);fx.impact(g,id,650,315,.71);assert.equal(calls,before);
 }
});
