// Sunlight, glazed tiles and shopfronts for the starting village.
import {W as VIEW_W,H as VIEW_H} from './field-model.js?v=28';

const groundCache=new WeakMap();
const gardenBeds=[[231,204],[345,204],[231,277],[345,277],[230,306],[346,306]];
const fountainCenter=[288,248];
const gold={dark:'#718198',light:'#f5f9ff'};

export function panel(w,h,scale){
 const tile=document.createElement('canvas');
 tile.width=w*scale;
 tile.height=h*scale;
 const c=tile.getContext('2d');
 c.setTransform(scale,0,0,scale,0,0);
 return {tile,c}
}
export function rect(c,x,y,w,h,paint){
 c.fillStyle=paint;
 c.fillRect(x,y,w,h)
}
export function shape(c,points,paint){
 c.beginPath();
 for(const [i,[x,y]] of points.entries()){
  if(i)c.lineTo(x,y);else c.moveTo(x,y);
 }
 c.closePath();
 c.fillStyle=paint;
 c.fill()
}
export function line(c,points,paint,width){
 c.beginPath();
 for(const [i,[x,y]] of points.entries()){
  if(i)c.lineTo(x,y);else c.moveTo(x,y);
 }
 c.lineWidth=width;
 c.strokeStyle=paint;
 c.stroke()
}
export function oval(c,x,y,rx,ry,paint){
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
export function diamond(c,x,y,rx,ry,paint){
 shape(c,[[x-rx,y],[x,y-ry],[x+rx,y],[x,y+ry]],paint)
}
export function lamp(c,x,y){
 rect(c,x-2,y+4,4,2,'#52647d');
 shape(c,[[x-4,y-1],[x-2,y-4],[x+2,y-4],[x+4,y-1],[x+3,y+4],[x-3,y+4]],'#586b88');
 rect(c,x-2.5,y-1.4,5,4.7,'#efaf63');
 rect(c,x-1.2,y-1,2.6,3.6,'#fff2ba');
 rect(c,x-2,y-3.3,4,1,'#a5a2be');
 rect(c,x-.6,y-5,1.2,2,'#c8c5df')
}

export function flowers(c,x,y,count,colors){
 for(let i=0;i<count;i++){
  const u=x+i*2.7,v=y-(i%3)*.8;
  line(c,[[u-.6,v+2],[u,v-1],[u+.3,v-2]],i%2?'#69b68c':'#468e77',.7);
  rect(c,u-.9,v-.8,2.2,1.4,colors[i%colors.length]);
  rect(c,u-.25,v-1.1,.9,.8,'#fff6e4');
  rect(c,u+.35,v+1.1,1.3,.65,'#92d0a1')
 }
}
function bed(c,x,y,index){
 shape(c,[[x-13,y],[x-10,y-5],[x+10,y-5],[x+13,y],[x+10,y+4],[x-10,y+4]],'#839bb0');
 shape(c,[[x-11,y-.8],[x-9,y-4],[x+9,y-4],[x+11,y-.8],[x+9,y+2.6],[x-9,y+2.6]],'#dbe7f0');
 rect(c,x-9.5,y-2.6,19,4.2,'#5ca782');
 rect(c,x-9,y-2.4,18,1,'#7dbd98');
 flowers(c,x-8,y-.5,7,index%2?['#d8a6f6','#ffe5a0','#f7a8be']:['#ed89b3','#ffce81','#c7b4f6']);
 line(c,[[x-10,y+3.5],[x+10,y+3.5]],'#9ab3c4',.6)
}

function pavement(c){
 for(const x of [250,326]){
  for(const [top,bottom] of [[156,218],[278,473]]){
   rect(c,x-1.6,top,3.2,bottom-top,'#89a2bb');
   rect(c,x-1,top,2,bottom-top,'#cadeec');
   rect(c,x-.7,top,.55,bottom-top,'#f5f7ff');
   for(let y=top+4;y<bottom-4;y+=12)diamond(c,x,y,1.45,2,'#e1f2f7')
  }
 }
 for(const side of [-1,1]){
  for(const y of [195,286]){
   const x=288+side*39,end=288+side*172;
   line(c,[[x,y+2],[x+side*5,y],[end,y]],'#a4b8cc',1.4);
   line(c,[[x+side*6,y-.2],[end,y-.2]],'#eff7fd',.7);
   for(let a=76;a<173;a+=11)diamond(c,288+side*a,y,1.7,1.05,'#e8effc')
  }
 }
}

function plaza(c,x,y){
 oval(c,x+1.5,y+3,55,37,'#7b8c82a8');
 oval(c,x,y,55,37,'#a1b9cd');
 oval(c,x,y-.7,53,35.4,'#e6eff6');
 oval(c,x,y-.7,50.4,33.2,'#619dbf');
 oval(c,x,y-.8,47.7,31.4,'#79c5da');
 oval(c,x,y-.65,41,27.9,'#dbe9f4');
 for(let i=0;i<32;i++){
  const a=i*Math.PI/16,k=i%4===0;
  const sin=Math.sin(a),cos=Math.cos(a);
  diamond(c,x+cos*44.5,y-.6+sin*29.5,k?2.2:1.3,k?1.7:.9,k?'#e9c9ef':'#f0fcff');
  if(i%2===0){
   line(c,[[x+cos*49.2,y+sin*32.2],[x+cos*51.5,y+sin*34.6]],'#aabbd1',.7)
  }
 }
 ring(c,x,y-.6,40.2,27.6,'#b2d1df',.7);
 for(const side of [-1,1]){
  shape(c,[[x+side*30,y-3],[x+side*43,y],[x+side*30,y+3],[x+side*34,y]],'#8bc2d2');
  diamond(c,x,y+side*25,3.4,2.4,'#ac9dca');
  diamond(c,x,y+side*25-.35,1.9,1.1,'#f5f4ff')
 }
}

export function townGround(ground,map,scale){
 const existing=groundCache.get(ground);
 if(existing)return existing;
 const {tile,c}=panel(map.w,map.h,scale);
 c.drawImage(ground,0,0,map.w,map.h);
 const light=c.createLinearGradient(10,32,518,472);
 light.addColorStop(0,'#f6fbff18');
 light.addColorStop(.51,'#fffaff08');
 light.addColorStop(1,'#65a6d113');
 rect(c,0,0,map.w,map.h,light);
 pavement(c);
 plaza(c,...fountainCenter);
 for(const [i,[x,y]] of gardenBeds.entries())bed(c,x,y,i);
 groundCache.set(ground,tile);
 return tile
}

export function ambient(c,x,y,r,palette){
 const glow=c.createRadialGradient(x,y,0,x,y,r);
 glow.addColorStop(0,palette[0]);
 glow.addColorStop(.38,palette[1]);
 glow.addColorStop(1,palette[2]);
 rect(c,x-r,y-r,2*r,2*r,glow)
}
export function glint(c,t,x,y,delay,size,color){
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
  glint(c,t,x,y,d,r,'#f3f5ff')
 }
}
function fountainLight(c,o,t){
 const {x,y}=o;
 const pulse=(t%2400)/2400;
 for(const [side,delay] of [[-1,420],[1,1930]]){
  const a=x+side*13,b=y-7;
  line(c,[[a-side*7,b+1.6],[a-side*3,b+.35],[a+side*3,b-.9]],'#78dde8',.75);
  line(c,[[a-side*4,b+1.45],[a+side*(3+2*pulse),b+.25]],'#e6fdff',.48);
  glint(c,t,a+side*3,b-.25,delay,2.6,'#e9fff1')
 }
 ambient(c,x,y-34,10,['#dcfbff48','#a3ecff2a','#80defa00']);
 glint(c,t,x-1.1,y-37,2770,3.3,'#f5fcff');
 line(c,[[x-21,y-12],[x-14,y-16],[x-6,y-17]],'#f1f8fd',.75)
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
 glint(c,t,o.x+.3,o.y-28,990,2.25,'#f8f6ed')
}

function streetLamp(c,o,t){
 const {x,y}=o;
 oval(c,x+1.7,y+1.2,5,2.05,'#52788670');
 rect(c,x-2.5,y-1,5,2.3,'#637896');
 rect(c,x-1.1,y-10,2.2,10,'#6b8099');
 rect(c,x-.65,y-9.5,.6,9.5,'#c9cddd');
 ambient(c,x,y-12,8,['#fff0b561','#ffd8942a','#ffc97800']);
 lamp(c,x,y-12);
 glint(c,t,x+.7,y-13,(y*3+x*13)%3800,1.7,'#fff3c1')
}

export function decorateTownProp(c,o,t){
 if(o.kind==='fountain')fountainLight(c,o,t);
 if(o.kind==='gate')gateLight(c,o,t);
 if(o.kind==='streetLamp')streetLamp(c,o,t)
}
