/* Continuous 3D construction, projected as 2D strokes. Not final character art.
 * x: camera-right, y: up, z: toward camera. No mirroring of anatomical labels.
 */
(function(root){
'use strict';
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),length=a=>Math.hypot(...a),unit=a=>mul(a,1/length(a));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
function elbow(shoulder,wrist,pole){
 const delta=sub(wrist,shoulder),d=length(delta),u=unit(delta),upper=62,lower=58;
 if(d>=upper+lower||d<=Math.abs(upper-lower))throw Error('Wrist outside arm reach');
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(upper*upper-along*along);
 const perpendicular=unit(sub(pole,mul(u,dot(pole,u))));
 return add(add(shoulder,mul(u,along)),mul(perpendicular,height));
}
function sample(progress){
 const p=clamp(progress);
 // One diagonal cutting plane: blade projects forwards, then descends.
 // Timing/coordinates are an animation study, not captured reference motion.
 const keys=[
  [0, [12,143,65],-.25],
  [.16,[20,221,8],-1.95],
  [.29,[15,211,30],-1.20],
  [.43,[-2,176,74],-.10],
  [.56,[-22,133,68],.85],
  [.72,[-37,101,38],1.85],
  [1,[-37,101,38],1.85]
 ];
 let i=0;while(i<keys.length-2&&p>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],u=smooth((p-a[0])/(b[0]-a[0]));
 const hand=mix(a[1],b[1],u),angle=a[2]+(b[2]-a[2])*u;
 const dir=[-.6*Math.sin(angle),-.8*Math.sin(angle),Math.cos(angle)];
 const rear=add(hand,mul(dir,-18)),guard=add(hand,mul(dir,8)),tip=add(guard,mul(dir,123));
 const t=smooth((p-.16)/.56),step=smooth((p-.18)/.33);
 const twist=-.18+.30*t,hipTwist=-.10+.16*step;
 const bodyShift=7*step,bodyDrop=3*step;
 const rotate=(x,y,z,a)=>[x*Math.cos(a)+z*Math.sin(a),y-bodyDrop,z*Math.cos(a)-x*Math.sin(a)+bodyShift];
 const shoulderL=rotate(-27,158,0,twist),shoulderR=rotate(27,158,0,twist);
 const hipL=rotate(-16,94,0,hipTwist),hipR=rotate(16,94,0,hipTwist);
 const elbowL=elbow(shoulderL,rear,[-.7,-.5,.65]);
 const elbowR=elbow(shoulderR,hand,[.7,-.5,.65]);
 return {p,t,hand,rear,guard,tip,dir,shoulderL,shoulderR,elbowL,elbowR,hipL,hipR,twist,hipTwist,bodyShift,bodyDrop,
  head:[0,194-bodyDrop,bodyShift],ankleL:[-32,7,-23],ankleR:[34,7+5*Math.sin(Math.PI*step),-18+58*step],
  kneeL:[-28,48-bodyDrop,0],kneeR:[30,48-bodyDrop,8+30*step],
  phase:p<.16?'頭上へ振りかぶる':p<.29?'上段から始動':p<.56?'前方を斜めに切り下ろす':p<.72?'反対側へ振り抜く':'振り抜き保持'};
}
function project(point,{yaw=0,scale=1,x=0,y=0}={}){
 const [a,b,c]=point,depth=c*Math.cos(yaw)-a*Math.sin(yaw);
 return [x+scale*(a*Math.cos(yaw)+c*Math.sin(yaw)),y-scale*b,depth];
}
function draw(g,p,{x=300,y=360,scale=1.25,yaw=0,effects=false,guides=true}={}){
 const pose=sample(p),camera={x,y,scale,yaw},pr=q=>project(q,camera),segments=[];
 const segment=(a,b,color,width)=>{const n=Math.ceil(length(sub(b,a))/5);for(let i=0;i<n;i++){const u=mix(a,b,i/n),v=mix(a,b,(i+1)/n);segments.push({a:pr(u),b:pr(v),color,width:width*scale});}};
 const line=(a,b,color,width)=>{g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();};
 g.save();g.fillStyle='#07101955';g.beginPath();g.ellipse(x,y,65*scale,9*scale,0,0,Math.PI*2);g.fill();
 if(guides){
  for(const key of ['hand','tip']){g.strokeStyle=key==='hand'?'#6ebcd866':'#d5b46c66';g.lineWidth=1;g.setLineDash([4,5]);g.beginPath();for(let i=0;i<=64;i++){const q=pr(sample(.16+.56*i/64)[key]);i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);}g.stroke();g.setLineDash([]);}
 }
 segment(pose.hipL,pose.kneeL,'#526578',21);segment(pose.kneeL,pose.ankleL,'#8093a0',17);
 segment(pose.hipR,pose.kneeR,'#435569',21);segment(pose.kneeR,pose.ankleR,'#637989',17);
 segment(add(pose.ankleL,[-9,-4,0]),add(pose.ankleL,[12,-4,0]),'#a6b1b6',11);
 segment(add(pose.ankleR,[-9,-4,0]),add(pose.ankleR,[12,-4,0]),'#899aa7',11);
 // Body volume is multiple depth-sorted columns, rather than a flat overlay.
 const bodyPoint=(a,y,z,angle)=>[a*Math.cos(angle)+z*Math.sin(angle),y-pose.bodyDrop,z*Math.cos(angle)-a*Math.sin(angle)+pose.bodyShift];
 for(let z=-12;z<=12;z+=6)for(let a=-20;a<=20;a+=5)segment(bodyPoint(a,100,z,pose.hipTwist),bodyPoint(a,157,z,pose.twist),'#245e71',8);
 segment(add(pose.head,[0,-14,0]),add(pose.head,[0,9,0]),'#c9bdab',32);
 segment(add(pose.head,[-2,9,-1]),add(pose.head,[2,16,-1]),'#283949',32);
 segment(pose.shoulderL,pose.elbowL,'#589ebf',15);segment(pose.elbowL,pose.rear,'#7ebbd3',12);
 segment(pose.shoulderR,pose.elbowR,'#bb865d',15);segment(pose.elbowR,pose.hand,'#d0a681',12);
 segment(add(pose.rear,mul(pose.dir,-8)),pose.guard,'#846542',8);
 segment(pose.guard,pose.tip,'#dbeaf1',5);
 const normal=unit([-pose.dir[1],pose.dir[0],0]);segment(add(pose.guard,mul(normal,-13)),add(pose.guard,mul(normal,13)),'#d8b56c',5);
 segments.sort((a,b)=>(a.a[2]+a.b[2])-(b.a[2]+b.b[2]));
 for(const s of segments)line(s.a,s.b,s.color,s.width);
 if(effects&&p>.22&&p<.87){
  const begin=Math.max(.16,p-.105),end=Math.min(.72,p),fade=1-clamp((p-.72)/.15);
  g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<20;i++){
   const a=sample(begin+(end-begin)*i/20),b=sample(begin+(end-begin)*(i+1)/20);
   const pts=[a.tip,b.tip,mix(b.guard,b.tip,.72),mix(a.guard,a.tip,.72)].map(pr);
   g.globalAlpha=.55*fade*i/20;g.fillStyle='#f7c45d';g.beginPath();pts.forEach((q,j)=>j?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fill();
  }g.restore();
 }
 g.restore();return pose;
}
const api={sample,project,draw,length,sub};if(typeof module==='object'&&module.exports)module.exports=api;root.SlashRig=api;
})(typeof window==='object'?window:globalThis);
