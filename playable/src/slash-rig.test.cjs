const test=require('node:test'),assert=require('node:assert/strict');
const r=require('../slash-rig'),distance=(a,b)=>r.length(r.sub(a,b));
test('continuous cut preserves both arms, grip spacing and blade length',()=>{
 let prev=null;
 for(let i=0;i<=1000;i++){
  const p=r.sample(i/1000);
  for(const [a,b,expected] of [[p.shoulderL,p.elbowL,62],[p.elbowL,p.rear,58],[p.shoulderR,p.elbowR,62],[p.elbowR,p.hand,58],[p.hand,p.rear,18],[p.guard,p.tip,123]])assert.ok(Math.abs(distance(a,b)-expected)<1e-8);
  if(prev)for(const key of ['hand','rear','tip','elbowL','elbowR'])assert.ok(distance(p[key],prev[key])<3,'discontinuous '+key);
  prev=p;
 }
});
test('overhead preparation precedes forward diagonal descent',()=>{
 const start=r.sample(0),a=r.sample(.16),middle=r.sample(.43),end=r.sample(.72);
 assert.ok(a.hand[1]>a.head[1]+20);
 assert.ok(a.hand[1]>start.hand[1]+60);
 assert.ok(middle.tip[2]>middle.hand[2]+100);
 assert.ok(end.tip[0]<end.hand[0]&&end.tip[1]<end.hand[1]);
 assert.ok(end.hand[0]<end.hipL[0]&&end.hand[1]<a.hand[1]-100);
 assert.ok(end.ankleR[2]>a.ankleR[2]+40);
});
test('blade clears approximate torso and head volumes throughout the cut',()=>{
 for(let i=0;i<=1000;i++){
  const p=r.sample(i/1000);
  for(let j=0;j<=80;j++){
   const q=p.guard.map((v,k)=>v+(p.tip[k]-v)*j/80);
   const torso=(q[0]/30)**2+((q[1]-(130-p.bodyDrop))/40)**2+((q[2]-p.bodyShift)/22)**2;
   const head=((q[0]-p.head[0])/20)**2+((q[1]-p.head[1])/27)**2+((q[2]-p.head[2])/20)**2;
   assert.ok(torso>1&&head>1,`blade intersects proxy at ${i}, ${j}`);
  }
 }
});
