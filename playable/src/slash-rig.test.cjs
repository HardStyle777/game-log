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
test('hands cross from shoulder side to opposite hip and finish behind the leg plane',()=>{
 const a=r.sample(.16),b=r.sample(.72);
 assert.ok(a.hand[0]>a.shoulderR[0]);assert.ok(b.hand[0]<b.hipL[0]-25);
 assert.ok(b.hand[1]<a.hand[1]-65);assert.ok(b.hand[2]<b.ankleL[2]-25);
 assert.ok(a.tip[0]>a.head[0]+90);assert.ok(b.tip[0]<b.hipL[0]-90);
 let prev=a;for(let i=1;i<=500;i++){const s=r.sample(.16+.56*i/500);assert.ok(s.hand[0]<=prev.hand[0]);assert.ok(s.hand[1]<=prev.hand[1]);prev=s;}
});
test('blade clears approximate torso and head volumes throughout the cut',()=>{
 for(let i=0;i<=1000;i++){
  const p=r.sample(i/1000);
  for(let j=0;j<=80;j++){
   const q=p.guard.map((v,k)=>v+(p.tip[k]-v)*j/80);
   const torso=((q[0]-5*p.t)/28)**2+((q[1]-130)/40)**2+(q[2]/18)**2;
   const head=((q[0]-p.head[0])/20)**2+((q[1]-p.head[1])/27)**2+(q[2]/20)**2;
   assert.ok(torso>1&&head>1,`blade intersects proxy at ${i}, ${j}`);
  }
 }
});
