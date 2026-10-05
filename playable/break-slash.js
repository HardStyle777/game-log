/* 崩し斬り: a separate skill, not the basic diagonal sprite animation.
 * One rigid sword and two-handed IK drive both rendering and its swept trail. */
(function(root){
'use strict';
const hit=300/480,clamp=v=>Math.max(0,Math.min(1,v));
function rigProgress(p){p=clamp(p);return p<hit?.53*p/hit:.53+(.47*(p-hit)/(1-hit));}
const camera={x:340,y:360,scale:1.05,yaw:1.3};
function blade(p,offset={x:0,y:0}){const s=root.SlashRig.sample(rigProgress(p)),c={...camera,x:camera.x+(offset.x||0),y:camera.y+(offset.y||0)};return {guard:root.SlashRig.project(s.guard,c),tip:root.SlashRig.project(s.tip,c)};}
function contact(offset){const b=blade(hit,offset);return b.guard.map((v,i)=>v+(b.tip[i]-v)*.86);}
let skin=null;
function setSprite(sprite){
 const cut=(points,a,b)=>{const xs=points.map(q=>q[0]),ys=points.map(q=>q[1]),x=Math.min(...xs),y=Math.min(...ys),c=document.createElement('canvas');c.width=Math.max(...xs)-x;c.height=Math.max(...ys)-y;const t=c.getContext('2d');t.beginPath();points.forEach((q,i)=>i?t.lineTo(q[0]-x,q[1]-y):t.moveTo(q[0]-x,q[1]-y));t.closePath();t.clip();t.drawImage(sprite,-x,-y);return {image:c,a:[a[0]-x,a[1]-y],b:[b[0]-x,b[1]-y]};};
 skin={
 head:cut([[181,185],[209,163],[254,165],[279,185],[268,211],[252,245],[214,239],[194,219]], [224,226],[224,177]),
 body:cut([[161,241],[194,240],[210,270],[222,320],[209,352],[146,348],[140,319],[148,276]], [178,339],[176,248]),
 thigh:cut([[133,345],[165,350],[154,395],[124,422],[97,413],[104,388]], [148,355],[113,410]),
 shin:cut([[103,409],[130,423],[88,466],[79,480],[42,480],[45,457]], [114,417],[61,470]),
 upper:cut([[155,244],[174,241],[193,252],[209,279],[193,294],[172,282],[156,268]], [168,255],[199,280]),
 fore:cut([[194,274],[214,268],[237,266],[255,254],[277,263],[274,285],[244,297],[209,299]], [200,282],[259,272])
 };
}
function dressed(g,p){
 const pose=root.SlashRig.sample(rigProgress(p)),pr=q=>root.SlashRig.project(q,camera);
 const patch=(part,a,b,width=1)=>{const A=pr(a),B=pr(b),dx=part.b[0]-part.a[0],dy=part.b[1]-part.a[1],length=Math.hypot(dx,dy),scale=Math.hypot(B[0]-A[0],B[1]-A[1])/length;g.save();g.translate(A[0],A[1]);g.rotate(Math.atan2(B[1]-A[1],B[0]-A[0]));g.scale(scale,part===skin.upper?.44:part===skin.fore?.38:part===skin.head?.65:.70*width);g.rotate(-Math.atan2(dy,dx));g.imageSmoothingEnabled=false;g.drawImage(part.image,-part.a[0],-part.a[1]);g.restore();};
 g.save();g.fillStyle='#07101955';g.beginPath();g.ellipse(camera.x,camera.y,50,8,0,0,7);g.fill();
 patch(skin.thigh,pose.hipL,pose.kneeL);patch(skin.shin,pose.kneeL,pose.ankleL);patch(skin.thigh,pose.hipR,pose.kneeR);patch(skin.shin,pose.kneeR,pose.ankleR);
 const neck=pr([0,163-pose.bodyDrop,pose.bodyShift]);g.fillStyle='#982d38';g.strokeStyle='#e06761';g.lineWidth=2;g.beginPath();g.moveTo(neck[0],neck[1]);g.bezierCurveTo(neck[0]-55,neck[1]-10,neck[0]-68,neck[1]+20,neck[0]-110,neck[1]+32+Math.sin(p*7)*8);g.lineTo(neck[0]-72,neck[1]+10);g.lineTo(neck[0],neck[1]+12);g.fill();g.stroke();
 patch(skin.body,[0,94-pose.bodyDrop,pose.bodyShift],[0,158-pose.bodyDrop,pose.bodyShift],.85+Math.abs(pose.twist));
 patch(skin.head,[0,181-pose.bodyDrop,pose.bodyShift],[0,211-pose.bodyDrop,pose.bodyShift]);
 patch(skin.upper,pose.shoulderL,pose.elbowL,.85);patch(skin.fore,pose.elbowL,pose.rear,.85);
 patch(skin.upper,pose.shoulderR,pose.elbowR,.85);patch(skin.fore,pose.elbowR,pose.hand,.85);
 const b=blade(p),rear=pr(pose.rear),normal=[-(b.tip[1]-b.guard[1]),b.tip[0]-b.guard[0]],n=Math.hypot(...normal);normal[0]/=n;normal[1]/=n;
 g.strokeStyle='#725035';g.lineWidth=7;g.beginPath();g.moveTo(...rear);g.lineTo(...b.guard.slice(0,2));g.stroke();
 g.fillStyle='#dce5ef';g.strokeStyle='#526473';g.lineWidth=1;g.beginPath();g.moveTo(b.guard[0]+normal[0]*4,b.guard[1]+normal[1]*4);g.lineTo(...b.tip.slice(0,2));g.lineTo(b.guard[0]-normal[0]*4,b.guard[1]-normal[1]*4);g.closePath();g.fill();g.stroke();g.strokeStyle='#e6b85d';g.lineWidth=4;g.beginPath();g.moveTo(b.guard[0]-normal[0]*12,b.guard[1]-normal[1]*12);g.lineTo(b.guard[0]+normal[0]*12,b.guard[1]+normal[1]*12);g.stroke();g.restore();
}
function draw(g,p,{effects=true}={}){
 p=clamp(p);if(skin)dressed(g,p);else root.SlashRig.draw(g,rigProgress(p),{...camera,effects:false,guides:false});
 if(effects&&p>.32&&p<.92){
  const end=Math.min(p,.82),start=Math.max(.25,end-.11),fade=1-clamp((p-.82)/.1);
  g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<24;i++){
   const a=blade(start+(end-start)*i/24),b=blade(start+(end-start)*(i+1)/24);
   g.globalAlpha=fade*.6*(i/24);g.fillStyle=i>18?'#fff1c5':'#d9a451';g.beginPath();
   for(const [j,q] of [a.tip,b.tip,b.guard.map((v,k)=>v+(b.tip[k]-v)*.72),a.guard.map((v,k)=>v+(a.tip[k]-v)*.72)].entries())j?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);
   g.closePath();g.fill();
  }g.restore();
 }
}
function phase(p){return p<.2?'振りかぶり':p<.42?'踏み込み・腰から肩へ回転':p<hit?'斜めの振り下ろし':p<.82?'命中・振り抜き':'振り抜き保持';}
const api={hit,rigProgress,blade,contact,draw,phase,setSprite};root.BreakSlash=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
