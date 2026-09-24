/* Dedicated right-upper to left-lower cut. Coordinates measured on the new sheet. */
(function(root){
const frames=[0,1,2,3,4,5,6],starts=[0,.08,.18,165/405,.54,.70,.88];
const anchors=[[337,484],[331,484],[324,484],[334,484],[354,953],[342,953],[336,953],[333,953]];
const blades=[[280,249,376,89],[548,161,742,42],[974,166,1123,238],[1265,347,1141,439],[159,808,33,902],[641,833,523,923],[944,832,824,920]];
function create(g,sprite){
 return function(progress,{effects=true}={}){
 const p=Math.max(0,Math.min(1,progress));let i=0;while(i<6&&p>=starts[i+1])i++;
 const f=frames[i],col=f%4,row=Math.floor(f/4),[ax,ay]=anchors[f],layout=window.SwordArt?.layout||{x:340,ground:360,scales:{basic:.74}},scale=layout.scales.basic;
 g.imageSmoothingEnabled=false;
 const sx=f===3?1140:col*384,sw=f===2?364:f===3?396:384;g.drawImage(sprite,sx,row*512,sw,512,layout.x+(sx-(col*384+ax))*scale,layout.ground+(row*512-ay)*scale,sw*scale,512*scale);
 // Sweep the luminous blade surface through measured hand/tip coordinates.
 // The head advances during the downstroke; its tail ages out independently.
 if(effects&&p>=.365&&p<.76){
 const clamp=x=>Math.max(0,Math.min(1,x));
 const bladeAt=q=>{
  const hit=starts[3];
  const j=q<hit?2:3,k=j+1;
  const u=clamp((q-(j===2?.365:hit))/((j===2?hit:starts[4])-(j===2?.365:hit)));
  const pts=n=>{const c=n%4,[ax,ay]=anchors[n],b=blades[n];return [layout.x+(b[0]-c*384-ax)*scale,layout.ground+(b[1]-ay)*scale,layout.x+(b[2]-c*384-ax)*scale,layout.ground+(b[3]-ay)*scale];};
  const a=pts(j),b=pts(k),hx=a[0]+(b[0]-a[0])*u,hy=a[1]+(b[1]-a[1])*u;
  let aa=Math.atan2(a[3]-a[1],a[2]-a[0]),ab=Math.atan2(b[3]-b[1],b[2]-b[0]);
  while(ab-aa>Math.PI)ab-=Math.PI*2;
  while(ab-aa<-Math.PI)ab+=Math.PI*2;
  const angle=aa+(ab-aa)*u,len=Math.hypot(a[2]-a[0],a[3]-a[1])*(1-u)+Math.hypot(b[2]-b[0],b[3]-b[1])*u;
  return [hx,hy,hx+Math.cos(angle)*len,hy+Math.sin(angle)*len];
 };
 const head=Math.min(p,.54),tail=Math.max(.365,p-.14),fade=1-clamp((p-.54)/.22);
 if(head>tail){
 const points=Array.from({length:33},(_,n)=>bladeAt(tail+(head-tail)*n/32));
 g.save();g.globalCompositeOperation='lighter';
 for(const [width,color,alpha,blur] of [[.38,'#ce7417',.20,16],[.23,'#ffbd45',.65,7],[.075,'#fff8d6',.96,2]]){
  g.beginPath();points.forEach((q,n)=>n?g.lineTo(q[2],q[3]):g.moveTo(q[2],q[3]));
  for(let n=32;n>=0;n--){const q=points[n],taper=Math.sin(Math.PI*n/32),r=1-width*taper;g.lineTo(q[0]+(q[2]-q[0])*r,q[1]+(q[3]-q[1])*r);}
  g.closePath();g.fillStyle=color;g.globalAlpha=fade*alpha;g.shadowColor=color;g.shadowBlur=blur;g.fill();
 }
 // Highlight the actual blade in the current source pose, not a detached line.
 const b=blades[f];
 g.globalAlpha=fade*.9;g.strokeStyle='#fff7cd';g.shadowBlur=7;g.lineWidth=1.8;
 g.beginPath();g.moveTo(layout.x+(b[0]-col*384-ax)*scale,layout.ground+(b[1]-ay)*scale);g.lineTo(layout.x+(b[2]-col*384-ax)*scale,layout.ground+(b[3]-ay)*scale);g.stroke();
 g.restore();
 }
 }

 };
}
root.DiagonalSlash={create,starts,anchors};
})(typeof window==='object'?window:globalThis);
