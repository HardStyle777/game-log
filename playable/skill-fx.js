/* Original Canvas VFX. Timing matches HeroMotion's existing combat profiles.
 * Deterministic particles permit seeking/replay without allocating emitters. */
(function(root){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x));
const definitions={thunder:{hit:145/375,hitY:232,color:'#8b91ff',core:'#edfaff',duration:.375},frost:{hit:165/405,hitY:278,color:'#45c8ed',core:'#e5ffff',duration:.405},flame:{hit:300/480,hitY:347,color:'#ff792f',core:'#fff1b2',duration:.48}};
function stroke(g,points,color,width,alpha=1){g.strokeStyle=color;g.lineWidth=width;g.globalAlpha*=alpha;g.beginPath();points.forEach((q,i)=>i?g.lineTo(...q):g.moveTo(...q));g.stroke();g.globalAlpha/=alpha||1;}
function glow(g,x,y,r,color,power){if(power<=0)return;g.save();g.globalAlpha*=power;const c=g.createRadialGradient(x,y,0,x,y,r);c.addColorStop(0,color);c.addColorStop(.3,color+'88');c.addColorStop(1,color+'00');g.fillStyle=c;g.fillRect(x-r,y-r,r*2,r*2);g.restore();}
function ring(g,x,y,rx,ry,color,width,alpha){g.save();g.globalAlpha*=alpha;g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);g.stroke();g.restore();}
function shard(g,x,y,h,w,color){g.fillStyle=color;g.beginPath();g.moveTo(x,y-h);g.lineTo(x+w,y-h*.28);g.lineTo(x+w*.55,y);g.lineTo(x-w*.7,y);g.closePath();g.fill();g.fillStyle='#f0ffff';g.beginPath();g.moveTo(x,y-h);g.lineTo(x+w*.1,y-h*.2);g.lineTo(x-w*.7,y);g.closePath();g.fill();}
function cast(g,id,p){const d=definitions[id];if(!d||p<0||p>=1)return;const charge=clamp(p/d.hit),q=clamp((p-d.hit)/(1-d.hit));g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
 if(p<d.hit){
  const power=Math.pow(charge,2);glow(g,390,248,35,d.color,power*.55);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,r=55*(1-charge)+13;g.save();stroke(g,[[390+Math.cos(a)*r,248+Math.sin(a)*r*.6],[390+Math.cos(a)*(r+9),248+Math.sin(a)*(r+9)*.6]],d.color,1.6,Math.max(.01,power*.6));g.restore();}
 }else if(id==='thunder'){
  const fade=1-q,head=490+60*clamp(q*4),y=218;
  glow(g,head,y,65,d.color,fade*.5);
  const pts=[[372,y],[head,y]];g.save();stroke(g,pts,d.color,22,fade*.18);stroke(g,pts,d.color,8,fade*.7);stroke(g,pts,d.core,2.5,fade);g.restore();
  for(let k=0;k<3;k++){const pts=[];for(let i=0;i<=9;i++)pts.push([365+i*(head-365)/9,y+Math.sin(i*3.7+k*4+Math.floor(q*8))* (i===0||i===9?0:9+k*4)]);g.save();stroke(g,pts,k===0?d.core:d.color,k===0?1.4:2,fade*.65);g.restore();}
  ring(g,430+q*75,y,8+q*12,29+q*30,d.color,2,fade*.6);
 }else if(id==='frost'){
  const head=-2.65+3.6*clamp(q*3+.15),tail=head-1.8*(1-q*.5),cx=354,cy=278;
  for(const [r,w,col,alpha] of [[143,24,d.color,.14],[147,9,d.color,.5],[151,2,d.core,.95]]){g.save();g.globalAlpha*=alpha*(1-q);g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.ellipse(cx,cy,r,r*.27,-.08,tail,head);g.stroke();g.restore();}
  for(let i=0;i<11;i++){const a=tail+(head-tail)*i/10;glow(g,cx+Math.cos(a)*150,cy+Math.sin(a)*41,5,d.core,(1-q)*.6);}
 }else{
  const fade=1-q;g.save();stroke(g,[[365,248],[420,291],[473,333]],d.color,32,fade*.15);stroke(g,[[365,248],[420,291],[473,333]],d.color,13,fade*.65);stroke(g,[[365,248],[420,291],[473,333]],d.core,3,fade);g.restore();
  ring(g,473,360,25+q*125,8+q*33,d.color,5*(1-q)+1,fade*.7);glow(g,473,345,90,d.color,fade*.4);
 }
 g.restore();
}
function impact(g,id,x,y,age){const d=definitions[id];if(!d||age<0||age>.7)return;const q=age/.7,fade=1-q,floor=374-d.hitY;g.save();g.translate(x,y);g.globalCompositeOperation='lighter';g.lineCap='round';
 glow(g,0,0,90,d.color,Math.pow(1-clamp(age/.2),2)*.9);
 if(age<.09){const a=1-age/.09;g.save();stroke(g,[[-32,-3],[35,3]],d.core,5,a);stroke(g,[[-6,-37],[6,31]],d.core,3,a);g.restore();}
 if(id==='thunder'){
  for(let k=0;k<9;k++){const a=k*2.399,pts=[[0,0]];for(let j=1;j<=5;j++){const r=j*(12+q*9),bend=Math.sin(j*13+k*5+Math.floor(age*22))*13;pts.push([Math.cos(a)*r-Math.sin(a)*bend,Math.sin(a)*r*.65+Math.cos(a)*bend]);}g.save();stroke(g,pts,d.color,4,Math.max(.001,fade*.32));stroke(g,pts,d.core,1,Math.max(.001,fade*.85));g.restore();}
  ring(g,0,5,12+q*90,20+q*45,d.color,2,fade*.6);
 }else if(id==='frost'){
  ring(g,0,floor,22+q*115,7+q*27,d.color,3,fade*.6);
  for(let i=0;i<7;i++){const start=i*.022,t=clamp((age-start)/.12),m=1-clamp((age-.32)/.38);g.save();g.globalAlpha*=m;shard(g,-66+i*22,floor,(28+(i%3)*16)*t,7,d.color);g.restore();}
 }else{
  ring(g,0,floor,22+q*135,8+q*35,d.color,5*fade+1,fade*.75);
  for(let k=0;k<6;k++){const a=k*1.04;g.save();stroke(g,[[0,floor],[Math.cos(a)*45,floor+Math.sin(a)*13],[Math.cos(a+.15)*(75+q*35),floor+Math.sin(a+.15)*28]],'#ffad55',2,Math.max(.001,fade*.65));g.restore();}
 }
 for(let i=0;i<24;i++){const a=i*2.399,speed=50+i%7*18,t=q,px=Math.cos(a)*speed*t,py=Math.sin(a)*speed*t*.6-70*t+120*t*t;g.save();g.globalAlpha*=fade*fade;if(id==='frost'){g.translate(px,py);g.rotate(a+q*3);shard(g,0,0,9,3,i%2?d.color:d.core);}else{stroke(g,[[px,py],[px-Math.cos(a)*(5+fade*8),py-Math.sin(a)*6]],i%3?d.color:d.core,i%4?2:3);}g.restore();}
 g.restore();
}
const api={definitions,cast,impact};if(typeof module==='object'&&module.exports)module.exports=api;root.SkillFX=api;
})(typeof window==='object'?window:globalThis);
