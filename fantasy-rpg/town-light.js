// Sunlight, glazed tiles and shopfronts for the starting village.
import {W as VIEW_W,H as VIEW_H} from './field-model.js?v=28';

const groundCache=new WeakMap();
const houseCache=new WeakMap();
const gardenBeds=[[231,204],[345,204],[231,277],[345,277],[230,306],[346,306]];
const fountainCenter=[288,248];
const gold={dark:'#887356',rim:'#debc79',light:'#fff0bc'};
const houseStyles={
 inn:{roof:'#5e9ec6',shade:'#3a6e9b',shine:'#c5eaf1',trim:'#d3bb81',linen:['#b2e5dd','#eac98c','#87b9d5'],flowers:['#faaff0','#f5d67e','#e287b4']},
 shop:{roof:'#ca8763',shade:'#9b5d54',shine:'#ffe1a5',trim:'#e5bd80',linen:['#f1d898','#e69a89','#aed8bc'],flowers:['#ffb2ba','#f3dea2','#f2a484']},
 hall:{roof:'#71a6ae',shade:'#487b8d',shine:'#c2eddd',trim:'#dec083',linen:['#bbdad5','#e2c17a','#a6aee1'],flowers:['#c5b2f5','#ebd99b','#f3aab8']},
 home:{roof:'#c18761',shade:'#a16851',shine:'#ffe0a1',trim:'#d7ad75',linen:['#d7c6ad','#a8c8bd','#e2a489'],flowers:['#eeb5d5','#f3d381','#ec9fa8']}
};

function panel(w,h,scale){
 const tile=document.createElement('canvas');
 tile.width=w*scale;
 tile.height=h*scale;
 const c=tile.getContext('2d');
 c.setTransform(scale,0,0,scale,0,0);
 return {tile,c}
}
function rect(c,x,y,w,h,paint){
 c.fillStyle=paint;
 c.fillRect(x,y,w,h)
}
function shape(c,points,paint){
 c.beginPath();
 for(const [i,[x,y]] of points.entries()){
  if(i)c.lineTo(x,y);else c.moveTo(x,y);
 }
 c.closePath();
 c.fillStyle=paint;
 c.fill()
}
function line(c,points,paint,width){
 c.beginPath();
 for(const [i,[x,y]] of points.entries()){
  if(i)c.lineTo(x,y);else c.moveTo(x,y);
 }
 c.lineWidth=width;
 c.strokeStyle=paint;
 c.stroke()
}
function oval(c,x,y,rx,ry,paint){
 c.beginPath();
 c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
 c.fillStyle=paint;
 c.fill()
}
function ring(c,x,y,rx,ry,paint,width){
 c.beginPath();
 c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
 c.strokeStyle=paint;
 c.lineWidth=width;
 c.stroke()
}
function diamond(c,x,y,rx,ry,paint){
 shape(c,[[x-rx,y],[x,y-ry],[x+rx,y],[x,y+ry]],paint)
}
function lamp(c,x,y){
 rect(c,x-2,y+4,4,2,'#604736');
 shape(c,[[x-4,y-1],[x-2,y-4],[x+2,y-4],[x+4,y-1],[x+3,y+4],[x-3,y+4]],'#6c5341');
 rect(c,x-2.5,y-1.4,5,4.7,'#efaf63');
 rect(c,x-1.2,y-1,2.6,3.6,'#fff2ba');
 rect(c,x-2,y-3.3,4,1,'#b78b5e');
 rect(c,x-.6,y-5,1.2,2,'#d8ad72')
}

function flowers(c,x,y,count,colors){
 for(let i=0;i<count;i++){
  const u=x+i*2.7,v=y-(i%3)*.8;
  line(c,[[u-.6,v+2],[u,v-1],[u+.3,v-2]],i%2?'#6f9561':'#477653',.7);
  rect(c,u-.9,v-.8,2.2,1.4,colors[i%colors.length]);
  rect(c,u-.25,v-1.1,.9,.8,'#fff2b6');
  rect(c,u+.35,v+1.1,1.3,.65,'#85a66a')
 }
}
function bed(c,x,y,index){
 shape(c,[[x-13,y],[x-10,y-5],[x+10,y-5],[x+13,y],[x+10,y+4],[x-10,y+4]],'#817d66');
 shape(c,[[x-11,y-.8],[x-9,y-4],[x+9,y-4],[x+11,y-.8],[x+9,y+2.6],[x-9,y+2.6]],'#e4cda0');
 rect(c,x-9.5,y-2.6,19,4.2,'#6c8c53');
 rect(c,x-9,y-2.4,18,1,'#9ba66a');
 flowers(c,x-8,y-.5,7,index%2?['#deb3e8','#fff3a2','#edabac']:['#f4abc2','#eebf6f','#e3d2fb']);
 line(c,[[x-10,y+3.5],[x+10,y+3.5]],'#aea181',.6)
}

function pavement(c){
 for(const x of [250,326]){
  for(const [top,bottom] of [[156,218],[278,473]]){
   rect(c,x-1.6,top,3.2,bottom-top,'#82918b');
   rect(c,x-1,top,2,bottom-top,'#c7cdc0');
   rect(c,x-.7,top,.55,bottom-top,'#f4dfae');
   for(let y=top+4;y<bottom-4;y+=12)diamond(c,x,y,1.45,2,'#e5d9a6')
  }
 }
 for(const side of [-1,1]){
  for(const y of [195,286]){
   const x=288+side*39,end=288+side*172;
   line(c,[[x,y+2],[x+side*5,y],[end,y]],'#aaad92',1.4);
   line(c,[[x+side*6,y-.2],[end,y-.2]],'#e3d0a3',.7);
   for(let a=76;a<173;a+=11)diamond(c,288+side*a,y,1.7,1.05,'#f1dfb6')
  }
 }
}

function plaza(c,x,y){
 oval(c,x+1.5,y+3,55,37,'#7b8c82a8');
 oval(c,x,y,55,37,'#d3b98c');
 oval(c,x,y-.7,53,35.4,'#f4e0b8');
 oval(c,x,y-.7,50.4,33.2,'#819fa2');
 oval(c,x,y-.8,47.7,31.4,'#add3cb');
 oval(c,x,y-.65,41,27.9,'#f5e5c5');
 for(let i=0;i<32;i++){
  const a=i*Math.PI/16,k=i%4===0;
  const sin=Math.sin(a),cos=Math.cos(a);
  diamond(c,x+cos*44.5,y-.6+sin*29.5,k?2.2:1.3,k?1.7:.9,k?'#f4dc9a':'#e5edcf');
  if(i%2===0){
   line(c,[[x+cos*49.2,y+sin*32.2],[x+cos*51.5,y+sin*34.6]],'#bda87d',.7)
  }
 }
 ring(c,x,y-.6,40.2,27.6,'#d3b87f',.7);
 for(const side of [-1,1]){
  shape(c,[[x+side*30,y-3],[x+side*43,y],[x+side*30,y+3],[x+side*34,y]],'#9bb8b2');
  diamond(c,x,y+side*25,3.4,2.4,'#c2a06d');
  diamond(c,x,y+side*25-.35,1.9,1.1,'#fff1c6')
 }
}

export function townGround(ground,map,scale){
 const existing=groundCache.get(ground);
 if(existing)return existing;
 const {tile,c}=panel(map.w,map.h,scale);
 c.drawImage(ground,0,0,map.w,map.h);
 const light=c.createLinearGradient(10,32,518,472);
 light.addColorStop(0,'#ffdc956d');
 light.addColorStop(.51,'#ffe5a442');
 light.addColorStop(1,'#86abc932');
 rect(c,0,0,map.w,map.h,light);
 pavement(c);
 plaza(c,...fountainCenter);
 for(const [i,[x,y]] of gardenBeds.entries())bed(c,x,y,i);
 groundCache.set(ground,tile);
 return tile
}

function glass(c,x,y,style){
 rect(c,x-.75,y-1,13.5,18.5,'#6c543f');
 rect(c,x,y,12,16,'#447180');
 rect(c,x+.55,y+.65,10.8,15,'#85bfc1');
 shape(c,[[x+.6,y+.7],[x+11.1,y+.7],[x+6.4,y+7.7],[x+.6,y+11.7]],'#d3e1c8');
 shape(c,[[x+7.6,y+1],[x+10.2,y+1],[x+1.3,y+12],[x+1.3,y+9]],'#f6eabf');
 rect(c,x+5.2,y,.9,16,style.trim);
 rect(c,x,y+7.5,12,1,style.trim);
 rect(c,x+.1,y+14.5,11.8,.8,'#a5d9d1');
 rect(c,x-1.5,y+16.1,15,2.2,'#8c6745');
 rect(c,x-.8,y+16.1,13.5,.7,'#ddba82')
}
function sash(c,x,y,style){
 rect(c,x-6.5,y-.3,13,3.7,'#835844');
 rect(c,x-6.1,y,12.2,1.2,'#d2a26f');
 flowers(c,x-4.6,y+.25,4,style.flowers)
}
function ridge(c,w,style){
 shape(c,[[4,29],[15,6],[w-15,6],[w-6,28],[w-17,31],[6,31]],style.shade+'54');
 for(let j=0;j<6;j++){
  const y=6.8+j*4.25,left=15-j*1.8,right=w-15+j*1.8;
  const shift=(j%2)*2.2;
  for(let x=left+shift;x<right-4.2;x+=6.8){
   const lit=x<w*.55;
   rect(c,x,y,4.6,1.4,style.roof+(lit?'a8':'58'));
   if((Math.floor(x/3)+j)%4===0)rect(c,x+.45,y-.05,2.5,.58,style.shine+'bc');
   rect(c,x+4.8,y+.65,.55,2.1,style.shade+'75');
  }
 }
 line(c,[[1,31.8],[14.5,5],[w-14.5,5],[w-1,31.8]],style.shine+'a0',.75);
 rect(c,16,2.1,w-32,1,style.shine+'d2');
 rect(c,11,32.6,w-22,.6,'#f1d9af85')
}
function pennants(c,w,style){
 line(c,[[15,37],[w*.3,42],[w*.5,43.5],[w*.7,42],[w-15,37]],'#745843',.65);
 for(let j=0;j<7;j++){
  const x=19+j*(w-38)/6;
  const y=37.7+5.1*Math.sin(j*Math.PI/6);
  const color=style.linen[j%style.linen.length];
  shape(c,[[x-3.1,y],[x+2.7,y],[x+1.5,y+5.9],[x-1.3,y+4.3]],color);
  line(c,[[x-2.6,y+.3],[x+2.3,y+.3]],'#fff1c4a3',.65)
 }
}
function facade(b,scale){
 const cached=houseCache.get(b);
 if(cached)return cached;
 const style=houseStyles[b.id],{tile,c}=panel(b.w+20,b.h+19,scale);
 const door=b.door[0]-b.x;
 c.translate(10,12);
 ridge(c,b.w,style);
 c.save();
 c.globalAlpha=.8;
 for(const u of [12,b.w-27]){
  rect(c,u-3,45,3,12,style.shade);
  rect(c,u-.6,46,.6,10,style.trim);
  rect(c,u+14,45,3,12,style.shade);
  rect(c,u+14,48,3,.65,style.shine);
  glass(c,u+1.2,44,style);
  sash(c,u+7.2,60,style);
 }
 c.restore();
 if(b.id==='inn'||b.id==='shop')pennants(c,b.w,style);
 if(b.id==='hall'){
  shape(c,[[door-12,21],[door-11,8],[door,2],[door+11,8],[door+12,21]],'#365968');
  line(c,[[door-12,20],[door-11,8],[door,2],[door+11,8],[door+12,20]],'#adccbf',1);
  oval(c,door,12.7,6.5,5.9,'#294a61');
  oval(c,door,12.6,5,4.9,'#b8b57a');
  diamond(c,door,12.6,4,4,'#80c7c6');
  diamond(c,door,12.4,2.5,2.7,'#e3edcc');
  rect(c,door-11,20.2,22,1.25,'#cfb57d');
 }
 line(c,[[door-9,b.h-1],[door-9,b.h-25],[door-6,b.h-29],[door+6,b.h-29],
         [door+9,b.h-25],[door+9,b.h-1]],style.trim+'cc',.85);
 rect(c,door-12,b.h-1.45,24,.75,'#f6dfa8');
 lamp(c,door-13,b.h-23);
 lamp(c,door+13,b.h-23);
 houseCache.set(b,tile);
 return tile
}

function ambient(c,x,y,r,palette){
 const glow=c.createRadialGradient(x,y,0,x,y,r);
 glow.addColorStop(0,palette[0]);
 glow.addColorStop(.38,palette[1]);
 glow.addColorStop(1,palette[2]);
 rect(c,x-r,y-r,2*r,2*r,glow)
}
function glint(c,t,x,y,delay,size,color){
 const period=3800;
 const p=((t+delay)%period)/period;
 if(p>=.21)return;
 const alpha=Math.sin(p*Math.PI/.21);
 const d=size*(.56+.64*alpha);
 c.save();
 c.globalAlpha=alpha*.93;
 shape(c,[[x-d,y],[x-.45,y-.38],[x,y-d*.8],[x+.45,y-.38],
          [x+d,y],[x+.45,y+.38],[x,y+d*.8],[x-.45,y+.38]],color);
 c.restore()
}

export function sunOnStreet(c,cam,t){
 const phases=[[258,326,360,2.2],[317,378,1300,1.7],[267,446,2230,1.3],
  [244,224,560,2],[323,266,1000,2],[306,219,2180,1.9],[288,162,760,1.7],
  [138,166,1390,1.6],[409,170,2420,1.8],[245,289,2850,1.7]];
 for(const [x,y,d,r] of phases){
  if(x<cam.x-4||x>cam.x+VIEW_W+4||y<cam.y-4||y>cam.y+VIEW_H+4)continue;
  glint(c,t,x,y,d,r,'#ffefb1')
 }
}
function fountainLight(c,o,t){
 const {x,y}=o;
 const pulse=(t%2400)/2400;
 for(const [side,delay] of [[-1,420],[1,1930]]){
  const a=x+side*13,b=y-7;
  line(c,[[a-side*7,b+1.6],[a-side*3,b+.35],[a+side*3,b-.9]],'#92d6d7',.75);
  line(c,[[a-side*4,b+1.45],[a+side*(3+2*pulse),b+.25]],'#e2fcdd',.48);
  glint(c,t,a+side*3,b-.25,delay,2.6,'#e9fff1')
 }
 ambient(c,x,y-34,10,['#d2ffee48','#a1e9e92a','#80dada00']);
 glint(c,t,x-1.1,y-37,2770,3.3,'#f6fff2');
 line(c,[[x-21,y-12],[x-14,y-16],[x-6,y-17]],'#fff3cd',.75)
}
function gateLight(c,o,t){
 for(const side of [-1,1]){
  const x=o.x+side*35,y=o.y-19;
  ambient(c,x,y,11,['#ffe4a966','#ffcc862c','#ffc37c00']);
  lamp(c,x,y);
 }
 line(c,[[o.x-11,o.y-27],[o.x,o.y-31],[o.x+11,o.y-27]],gold.light,.82);
 diamond(c,o.x,o.y-27,3,2.4,gold.dark);
 diamond(c,o.x,o.y-27.4,1.95,1.4,'#c0e6df');
 glint(c,t,o.x+.3,o.y-28,990,2.25,'#fff5c3')
}

function streetLamp(c,o,t){
 const {x,y}=o;
 oval(c,x+1.7,y+1.2,5,2.05,'#526b5270');
 rect(c,x-2.5,y-1,5,2.3,'#626f62');
 rect(c,x-1.1,y-10,2.2,10,'#67756b');
 rect(c,x-.65,y-9.5,.6,9.5,'#d8c692');
 ambient(c,x,y-12,8,['#fff0b561','#ffd8942a','#ffc97800']);
 lamp(c,x,y-12);
 glint(c,t,x+.7,y-13,(y*3+x*13)%3800,1.7,'#fff3c1')
}

export function decorateTownProp(c,o,t,scale){
 if(o.kind==='house'){
  const plan=facade(o,scale),x=o.x,y=o.y,door=o.door[0];
  c.drawImage(plan,x-10,y-12,o.w+20,o.h+19);
  for(const side of [-1,1]){
   const sx=door+side*13,sy=y+o.h-23;
   ambient(c,sx,sy,8,['#ffebad56','#ffd28627','#ffc97e00']);
  }
  glint(c,t,x+o.w*.26,y+9,(x*23)%3800,3.1,'#f6ffd9');
  glint(c,t,x+o.w-18,y+49,(x*13+1100)%3800,1.85,'#fff1b5');
  return;
 }
 if(o.kind==='fountain')fountainLight(c,o,t);
 if(o.kind==='gate')gateLight(c,o,t);
 if(o.kind==='streetLamp')streetLamp(c,o,t)
}
