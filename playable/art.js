window.SwordArt={};
SwordArt.load=async function(url){const im=new Image();im.src=url;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height);SwordArt.removeMatte(d,c.width,c.height);g.putImageData(d,0,0);return c;};

// Remove only the connected white backdrop; unmatte its antialiased contour.
SwordArt.removeMatte=function(image,w,h){const d=image.data,n=w*h,bg=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;
const push=i=>{if(i<0||i>=n||bg[i])return;const j=i*4;if(Math.min(d[j],d[j+1],d[j+2])<=232)return;bg[i]=1;q[tail++]=i;};
for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
while(head<tail){const i=q[head++],x=i%w;if(x)push(i-1);if(x<w-1)push(i+1);push(i-w);push(i+w);}
for(let i=0;i<n;i++){const j=i*4;if(bg[i]){d[j+3]=0;continue;}const x=i%w,y=Math.floor(i/w);let distance=3;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&bg[i+dy*w+dx])distance=Math.min(distance,Math.max(Math.abs(dx),Math.abs(dy)));}if(distance>2)continue;const low=Math.min(d[j],d[j+1],d[j+2]),floor=distance===1?85:125;if(low<=floor)continue;const a=Math.min(1,(255-low)/(255-floor));for(let c=0;c<3;c++)d[j+c]=Math.max(0,Math.min(255,(d[j+c]-255*(1-a))/Math.max(.01,a)));d[j+3]=Math.round(d[j+3]*a);}
};
SwordArt.combo=function(g,sprite){let f=0,showEffects=true;
const crops=[[0,0,390,331,310,329],[390,0,385,331,680,329],[780,0,365,331,1037,329],[1152,0,384,331,1428,329],[0,332,401,349,301,677],[402,332,370,349,672,677],[782,330,360,351,1034,677],[1152,332,384,349,1450,677],[0,688,390,320,335,993],[391,688,383,320,678,993],[780,688,385,320,1063,993],[1165,688,371,320,1433,993]];
const durations=[200,65,85,85,65,65,85,90,130,60,160,220];const names=['振り下ろしの構え','第一撃','低い振り抜き','斬り上げへ切り返し','下から斬り上げ','上へ振り抜く','頭上へ','剣を返す','最後の溜め','第三撃','深く振り抜く','回収'];
const starts=durations.map((_,i)=>durations.slice(0,i).reduce((a,b)=>a+b,0));
// Manually read guard and tip coordinates from each of the 12 source poses.
const bladePixels=[[201,35,341,86],[658,214,759,291],[1029,270,1119,328],[1311,258,1410,310],[281,497,397,470],[645,415,733,344],[935,398,966,332],[1393,426,1287,382],[193,735,87,701],[650,870,759,941],[1061,908,1157,983],[1363,818,1488,745]];
const blades=bladePixels.map((b,i)=>{const r=crops[i];return [340+(b[0]-r[4])*.88,360+(b[1]-r[5])*.88,340+(b[2]-r[4])*.88,360+(b[3]-r[5])*.88];});
const clamp=v=>Math.max(0,Math.min(1,v));
function bladeAt(time,lo,hi){let i=lo;while(i<hi-1&&time>starts[i+1])i++;const q=clamp((time-starts[i])/(starts[i+1]-starts[i])),a=blades[i],b=blades[i+1];let aa=Math.atan2(a[3]-a[1],a[2]-a[0]),ab=Math.atan2(b[3]-b[1],b[2]-b[0]);if(lo===8){while(ab<aa)ab+=Math.PI*2;}else{while(ab-aa>Math.PI)ab-=Math.PI*2;while(ab-aa<-Math.PI)ab+=Math.PI*2;}const angle=aa+(ab-aa)*q,len=Math.hypot(a[2]-a[0],a[3]-a[1])*(1-q)+Math.hypot(b[2]-b[0],b[3]-b[1])*q,hx=a[0]+(b[0]-a[0])*q,hy=a[1]+(b[1]-a[1])*q;return [hx,hy,hx+Math.cos(angle)*len,hy+Math.sin(angle)*len];}
function trails(t){
 for(const [lo,hi,life,power] of [[0,2,160,.8],[3,6,150,.65],[8,10,220,1]]){
 const begin=starts[lo],end=starts[hi],head=Math.min(t,end),tail=Math.max(begin,t-life);if(head<=tail||t<begin)continue;
 const fade=1-clamp((t-end)/life),samples=[];for(let k=0;k<=50;k++)samples.push(bladeAt(tail+(head-tail)*k/50,lo,hi));
 g.save();g.globalCompositeOperation='lighter';
 // The luminous surface follows the outer section of the moving blade, not a preset arc.
 for(const [inner,color,opacity,blur] of [[.46,'#bc7413',.1,15],[.72,'#ffbd42',.28,8],[.91,'#fff5bd',.8,3]]){
 g.fillStyle=color;g.globalAlpha=fade*opacity*power;g.shadowColor=color;g.shadowBlur=blur;g.beginPath();samples.forEach((p,k)=>k?g.lineTo(p[2],p[3]):g.moveTo(p[2],p[3]));for(let k=50;k>=0;k--){const p=samples[k],taper=Math.sin(Math.PI*k/50),r=1-(1-inner)*taper;g.lineTo(p[0]+(p[2]-p[0])*r,p[1]+(p[3]-p[1])*r);}g.closePath();g.fill();
 }
 g.restore();
 }
 // Blade highlight is pinned to the visible sprite, including its exact hand and tip.
 if((f>=1&&f<=2)||(f>=4&&f<=6)||(f>=9&&f<=10)){const p=blades[f];g.save();g.globalCompositeOperation='lighter';g.strokeStyle='#fff8d0';g.lineWidth=2;g.shadowColor='#ffc75f';g.shadowBlur=9;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[2],p[3]);g.stroke();g.restore();}
}

function draw(i,t=starts[i]+durations[i]*.5){f=i;g.imageSmoothingEnabled=false;const [x,y,w,h,ax,ay]=crops[i];g.drawImage(sprite,x,y,w,h,340+(x-ax)*.88,360+(y-ay)*.88,w*.88,h*.88);if(showEffects)trails(t);}
return(time,idle=false,options={})=>{showEffects=options.effects!==false;let f=0,left=time;while(f<11&&left>=durations[f])left-=durations[f++];draw(idle?11:f,idle?-1000:time);};};
SwordArt.other=function(g,sprite){
let showEffects=true;
const rects=[[0,60,370,307,290,361],[390,60,411,307,674,361],[780,100,467,267,1077,361],[1200,60,336,307,1455,361],[0,399,384,271,307,662],[414,394,338,276,607,653],[766,420,477,250,1077,663],[1190,393,346,277,1455,666],[0,690,370,303,153,978],[410,671,280,314,587,980],[767,690,382,303,991,982],[1165,737,371,256,1350,978]];
const times=[[260,65,150,240],[230,85,160,260],[210,220,100,290]],names=['踏み込み突き','低い横薙ぎ','跳び込み斬り'];
function draw(k,f,t=0){const i=k*4+f,[x,y,w,h,ax,ay]=rects[i],scale=.8,dx=k===2?[0,20,45,60][f]:k===0?[0,8,22,0][f]:0;g.imageSmoothingEnabled=false;g.save();g.translate(340,360);if(f===2&&k<2){g.beginPath();const bx=k===0?800:770,edge=k===0?1135:1115,sy=k===0?192:540,sh=k===0?26:29;g.rect((bx-ax)*scale,(y-ay)*scale,(edge-bx)*scale,h*scale);g.rect((edge-ax)*scale,(sy-ay)*scale,(x+w-edge)*scale,sh*scale);g.clip();}g.drawImage(sprite,x,y,w,h,(x-ax)*scale,(y-ay)*scale,w*scale,h*scale);g.restore();
if(showEffects&&f===2){g.save();g.globalCompositeOperation='lighter';g.shadowColor='#ffc957';g.shadowBlur=10;g.strokeStyle='#fff4c2';g.lineWidth=2;g.beginPath();if(k===0){g.moveTo(381,231);g.lineTo(498,231);}else if(k===1){g.ellipse(353,272,107,18,-.06,.15,2.6);}else{g.moveTo(402,243);g.lineTo(499,329);}g.stroke();g.restore();}}
return(k,time,idle=false,options={})=>{showEffects=options.effects!==false;let f=0,left=time;while(f<3&&left>=times[k][f])left-=times[k][f++];draw(k,idle?0:f,time);};};
