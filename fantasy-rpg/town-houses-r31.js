// Four building types share the same viewpoint, tile size and door anchors.
import {panel,rect,shape,line,oval,diamond,lamp,flowers,ambient,glint} from './town-light.js?v=30';

const artwork=new WeakMap();
const stone=['#40506f','#7188a6','#a7bed1','#e1ebec'];
const timber=['#3c344e','#675069','#a47a76','#dbb58e'];
const palettes={
 inn:{base:'#e8e1e4',wall:'#f6ece4',side:'#c8bdd1',roof:['#1c335f','#294d8c','#3f77bd','#63a5dc','#a8d8f1'],cloth:['#5266a7','#ede5d2','#94bdc7'],petals:['#e86e9a','#edc676','#aedcef']},
 shop:{base:'#e4d5df',wall:'#f6e7e5',side:'#c6a9c5',roof:['#512d4c','#833e5b','#af5370','#dc7081','#f6a4a2'],cloth:['#b34361','#f9e4d9','#4b96a5'],petals:['#f07189','#fae194','#c6a4ed']},
 hall:{base:'#cee1e2',wall:'#e8f1ed',side:'#a0bdc8',roof:['#17485d','#226a78','#328b93','#56aeb2','#9bdad5'],cloth:['#318c93','#efe5ca','#28677e'],petals:['#c799ea','#ede1a1','#ecc3d6']},
 home:{base:'#efdcd2',wall:'#fbecdc',side:'#d0b5c5',roof:['#4d304f','#774459','#a75565','#ce756e','#eda287'],cloth:['#7d506d','#f6dec1','#639b83'],petals:['#ef9bad','#f5cc89','#aea5e8']}
};

function planks(c,x,y,w,h,palette=timber){
 rect(c,x,y,w,h,palette[0]);
 rect(c,x+1,y+1,w-2,h-2,palette[1]);
 for(let n=2;n<w-1;n+=2.8){
  rect(c,x+n,y+1.5,.48,h-3,palette[0]);
  rect(c,x+n+.55,y+2,.47,h-4,palette[2]);
 }
}
function masonry(c,x,y,w,h){
 rect(c,x,y,w,h,stone[0]);
 for(let row=0;row<Math.ceil(h/3.6);row++){
  const top=y+row*3.6;
  for(let u=x-(row%2)*3;u<x+w;u+=6){
   const left=Math.max(x,u+.3),right=Math.min(x+w,u+5.55),height=Math.min(3.1,y+h-top-.35);
   if(right<=left||height<=0)continue;
   rect(c,left,top+.2,right-left,height,stone[1+(row+Math.round(u))%2]);
   rect(c,left+.2,top+.25,Math.max(0,right-left-.4),.5,stone[3]+'aa');
  }
 }
}
function wall(c,w,h,top,a,edge=12){
 const end=h-1;
 shape(c,[[4,top+3],[w-edge,top],[w-3,top+7],[w-3,end-4],[w-edge,end],[4,end]],timber[0]);
 shape(c,[[7,top+5],[w-edge,top+1],[w-edge,end-2],[7,end-2]],a.base);
 shape(c,[[7,top+6],[w-edge,top+4],[w-edge,end-10],[7,end-10]],a.wall);
 shape(c,[[w-edge,top+1],[w-4,top+7],[w-4,end-5],[w-edge,end-2]],a.side);
 rect(c,7,top+6,w-edge-7,3,a.side+'ad');
 masonry(c,7,end-10,w-edge-7,9);
 rect(c,7,end-10,w-edge-7,1,stone[3]);
 for(let n=12;n<w-edge-3;n+=17){
  rect(c,n,top+12,4,.65,'#d3bfcc');
  rect(c,n+5,top+13,2,.65,'#fff3eacc');
 }
}
function shadow(c,w,h){
 oval(c,w*.52,h+1,w*.48,6,'#30445762');
 oval(c,w*.55,h-1,w*.43,4,'#2b415b3d')
}
function beam(c,x,y,w,h){
 rect(c,x,y,w,h,timber[0]);
 rect(c,x+.65,y,w-1.3,h,timber[1]);
 if(w>=h)rect(c,x+.7,y+.6,w-1.4,.6,timber[2]);
 else rect(c,x+.7,y+1,.58,h-2,timber[2])
}
function steps(c,x,y,w){
 shape(c,[[x-w/2,y-1],[x+w/2,y-1],[x+w/2+3,y+5],[x-w/2-3,y+5]],stone[0]);
 for(let k=0;k<3;k++){
  const a=x-w/2-k*.7,b=y-1+k*2;
  rect(c,a,b,w+k*1.4,1.7,stone[2]);
  rect(c,a+.65,b+.15,w+k*1.4-1.3,.52,stone[3])
 }
}

function door(c,x,foot,w,h,wood=timber){
 const left=x-w/2,top=foot-h;
 shape(c,[[left-2,foot],[left-2,top+4],[left+1,top],[x+w/2-1,top],[x+w/2+2,top+4],[x+w/2+2,foot]],wood[0]);
 shape(c,[[left,foot-1],[left,top+5],[left+1.5,top+2],[x+w/2-1.5,top+2],[x+w/2,top+5],[x+w/2,foot-1]],wood[2]);
 planks(c,left+1,top+5,w-2,h-6,wood);
 rect(c,left+1,foot-7,w-2,1.2,wood[2]);
 rect(c,x+w*.23,foot-10,1.8,1.6,'#ebc586');
 rect(c,left-1,foot-1,w+2,1,wood[3])
}
function windowPane(c,x,y,w,h,mode='blue'){
 rect(c,x-1,y-1,w+2,h+3,'#54445c');
 rect(c,x,y,w,h,mode==='warm'?'#786291':'#2f628a');
 rect(c,x+.75,y+.75,w-1.5,h-1.5,mode==='warm'?'#d9a6ac':'#6eafd0');
 shape(c,[[x+.8,y+.9],[x+w-.8,y+.9],[x+w*.6,y+h*.53],[x+.8,y+h*.73]],mode==='warm'?'#ffe1ad':'#c1edf4');
 line(c,[[x+w*.43,y+.85],[x+1,y+h*.52]],'#f6fcf5',.7);
 rect(c,x+w/2-.5,y,1,h,'#d0bfd1');
 rect(c,x,y+h*.52,w,1,'#d0bfd1');
 rect(c,x-1.7,y+h,w+3.4,1.55,'#9784a0');
 rect(c,x-1.2,y+h+.05,w+2.4,.5,'#efd2bc')
}
function windowBox(c,x,y,n,a){
 rect(c,x-1.7,y,n*2.7+2,3,'#a06378');
 rect(c,x-1.4,y,n*2.7+1.3,.85,'#dba4b0');
 flowers(c,x,y-.8,n,a.petals)
}
function chimney(c,x,y,h){
 masonry(c,x,y+1,10,h-1);
 rect(c,x+7,y+1,3,h-1,'#57617c99');
 rect(c,x-1,y,12,2.6,'#646787');
 rect(c,x-.45,y+.25,10.8,.68,'#cdaebf');
 rect(c,x+1,y-.6,8,.62,'#433e5b')
}

function tiles(c,left,right,top,bottom,colors,course=4.3,pitch=.5){
 for(let r=0,y=top;y<bottom;y=top+ ++r*course){
  const start=left(y),end=right(y);
  for(let i=0,x=start-(r%2)*3.4;x<end;x=start+ ++i*6.8-(r%2)*3.4){
   const a=Math.max(start,x),b=Math.min(end,x+6.4);
   if(b-a<.8)continue;
   const lit=(i+r*3)&7,shade=colors[lit<1?3:lit<5?2:1];
   const h=Math.min(course-.5,bottom-y);
   shape(c,[[a,y],[b,y],[b+.25,y+h-.8],[b-pitch,y+h],[a-pitch,y+h]],shade);
   rect(c,a+.42,y+.2,Math.max(0,b-a-1),.58,colors[3]+'a2');
   rect(c,b-.61,y+1.01,.43,Math.max(0,h-1.3),colors[0]+'a8');
  }
 }
}
function hipRoof(c,w,peak,top,eaves,a){
 const q=a.roof,inset=Math.min(14,w*.19),run=eaves-top-3;
 shape(c,[[-3,eaves],[inset,top+2],[peak,top-1],[w-inset,top+2],[w+3,eaves]],q[0]);
 shape(c,[[.2,eaves-2],[inset,top+3],[w-inset,top+3],[w-4,eaves-2]],q[1]);
 tiles(c,y=>inset*(1-(y-top-3)/run),y=>w-inset+inset*(y-top-3)/run,top+3,eaves-2,q);
 shape(c,[[w-inset,top+2],[w+3,eaves],[w-7,eaves]],q[0]+'8f');
 line(c,[[.6,eaves-1],[inset,top+2],[w-inset,top+2],[w-2,eaves-1]],q[4],.8);
 rect(c,inset+2,top+.9,w-2*inset-4,1.3,q[3]);
 rect(c,-3,eaves,w+6,2.4,q[0]);
 rect(c,-2,eaves+.35,w+4,.62,q[3]);
}
function pediment(c,x,y,w,h,a){
 const q=a.roof;
 shape(c,[[x,y+h],[x+w/2,y],[x+w,y+h]],q[0]);
 shape(c,[[x+3,y+h-1],[x+w/2,y+2],[x+w-3,y+h-1]],a.wall);
 line(c,[[x+1,y+h-.65],[x+w/2,y+.7],[x+w-1,y+h-.65]],q[3],1.3);
 rect(c,x+2,y+h-1.1,w-4,.8,a.side)
}
function plaque(c,x,y,icon){
 shape(c,[[x-6,y-2],[x-4,y-4],[x+4,y-4],[x+6,y-2],[x+6,y+4],[x-6,y+4]],'#574e71');
 rect(c,x-5,y-2.9,10,5.8,'#c7abc1');
 if(icon==='bed'){
  rect(c,x-3.1,y+.3,6.2,1.4,'#615979');
  rect(c,x-3.15,y-1.55,.9,3.55,'#615979');
  rect(c,x-1.6,y-1,1.4,1.1,'#f8e2d0');
 }else{
  shape(c,[[x-1,y-2],[x+1,y-2],[x+1,y-.7],[x+2.6,y+1.8],[x-2.6,y+1.8],[x-1,y-.7]],'#50768a');
  rect(c,x-.9,y+.45,2.1,.6,'#ace7e1')
 }
}
function awning(c,x,y,w,a,drop=6){
 shape(c,[[x,y],[x+w,y],[x+w+4,y+drop],[x-4,y+drop]],'#795466');
 for(let i=0;i<8;i++){
  const u=x+i*w/8,s=x-4+i*(w+8)/8,n=(i%2?1:(i===4?2:0));
  shape(c,[[u,y+.6],[u+w/8,y+.6],[s+(w+8)/8,y+drop],[s,y+drop]],a.cloth[n]);
  rect(c,s+.3,y+drop,(w+8)/8-.6,1.7,a.cloth[n]);
  rect(c,s+.4,y+drop+.55,(w+8)/8-.8,.54,'#78516b75')
 }
 line(c,[[x+.6,y+.64],[x+w-.6,y+.64]],'#f4e6e3',.58)
}

function inn(c,w,h,d,foot,a){
 shadow(c,w,h);wall(c,w,h,31,a,13);
 for(const x of [9,32,48,65,92])beam(c,x,32,2.8,39);
 for(const y of [46,70])beam(c,8,y,w-21,2.2);
 for(const x of [15,36,70,84])windowPane(c,x,34,9,10,'warm');
 for(const x of [16,76]){
  windowPane(c,x,58,12,10);
  windowBox(c,x+.8,68,4,a);
 }
 hipRoof(c,w,54,3,29,a);
 chimney(c,w-27,-4,17);
 pediment(c,37,-1,38,29,a);windowPane(c,51.5,16,9,8);
 beam(c,14,50,19,1.5);plaque(c,24,55,'bed');
 awning(c,d-12,55,24,a,5);
 door(c,d,foot,14,17, ['#38384f','#605d70','#8c879b','#cdbcc0']);
 steps(c,d,foot,21);
}
function display(c,x,y,w){
 windowPane(c,x,y,w,19);
 for(const top of [y+9,y+14]){
  rect(c,x+1,top,w-2,1.3,'#7a5d78');
  rect(c,x+1,top+.12,w-2,.34,'#cf9bb7');
 }
 for(let i=0;i<5;i++){
  const u=x+2.1+i*(w-4)/5,h=3.7+((i*3)%4)*.55;
  rect(c,u,y+14-h,2.5,h,['#bf708e','#6daeb4','#c9ac6d'][i%3]);
  rect(c,u+.7,y+13.1-h,1.1,.9,'#dfe8d8');
 }
}
function shop(c,w,h,d,foot,a){
 shadow(c,w,h);wall(c,w,h,32,a,10);
 hipRoof(c,w,53,4,32,a);
 chimney(c,w-24,-2,17);
 masonry(c,9,41,4,33);masonry(c,w-18,41,4,33);
 display(c,16,51,25);display(c,72,51,20);
 pediment(c,36,5,40,27,a);windowPane(c,51,18,10,9,'warm');
 awning(c,12,42,w-28,a,7);
 beam(c,w-25,35,12,1.4);plaque(c,w-13,39,'flask');
 door(c,d,foot,14,23,['#4f3755','#96607a','#b8849c','#eac4ca']);
 steps(c,d,foot,19);
}
function hall(c,w,h,d,foot,a){
 shadow(c,w,h);wall(c,w,h,33,a,12);
 hipRoof(c,w,47,6,38,a);
 masonry(c,d-7,-5,14,17);
 shape(c,[[d-9,-5],[d,-11],[d+9,-5],[d+7,-3],[d-7,-3]],a.roof[0]);
 line(c,[[d-8,-5.1],[d,-10.1],[d+8,-5.1]],a.roof[4],.78);
 rect(c,d-3,-.8,6,4.5,'#356b88');
 rect(c,d-2.6,-.4,5.2,.55,'#b7e3dc');
 pediment(c,d-23,4,46,27,a);
 for(const x of [17,69]){
  masonry(c,x-2,42,17,36);
  windowPane(c,x,46,13,23);
  line(c,[[x,53],[x+6.5,48],[x+13,53]],'#e5ece2',.95);
 }
 masonry(c,d-18,37,36,foot-38);
 door(c,d,foot,16,26,['#35475f','#4e647d','#7997aa','#c4d4da']);
 for(const x of [d-16,d+13]){
  rect(c,x,42,3.4,foot-42,stone[2]);
  rect(c,x+.5,42,1.1,foot-42,stone[3]);
  rect(c,x-1.1,40.4,5.5,2.4,stone[2]);
 }
 pediment(c,d-19,24,38,18,a);
 oval(c,d,21,6.1,6.1,'#386181');
 oval(c,d,21,4.5,4.5,'#d1badb');
 diamond(c,d,21,3.6,3.6,'#73cadb');
 diamond(c,d,20.65,1.55,2.45,'#f4ffef');
 steps(c,d,foot,31);
}
function home(c,w,h,d,foot,a){
 shadow(c,w,h);wall(c,w,h,35,a,16);
 hipRoof(c,w,47,6,35,a);
 chimney(c,20,-3,17);
 pediment(c,48,9,38,27,a);
 windowPane(c,67,24,10,9);
 beam(c,61,38,2.8,29);beam(c,81,38,2.6,29);
 windowPane(c,20,48,15,18,'warm');
 beam(c,16,47,3.3,18);beam(c,36,47,3.3,18);
 windowBox(c,21.4,65,5,a);
 windowPane(c,67,49,10,12);
 windowBox(c,67.6,61,3,a);
 door(c,d,foot,12,23);
 pediment(c,d-11,40,22,12,a);
 steps(c,d,foot,17)
}

const builders={inn,shop,hall,home};
export function houseImage(b,scale){
 const previous=artwork.get(b);
 if(previous)return previous;
 const {tile,c}=panel(b.w+20,b.h+19,scale);
 c.translate(10,12);
 const builder=builders[b.id]??home;
 builder(c,b.w,b.h,b.door[0]-b.x,b.door[1]-b.y,palettes[b.id]??palettes.home);
 artwork.set(b,tile);
 return tile
}
export function houseLights(c,b,t){
 const door=b.door[0],y=b.door[1]-(b.id==='inn'?13:18);
 for(const side of [-1,1]){
  const x=door+side*(b.id==='hall'?17:12);
  ambient(c,x,y,8,['#ffe4aa48','#ffd48d26','#ffdb9900']);lamp(c,x,y)
 }
 glint(c,t,b.x+b.w*.26,b.y+9,(b.x*23)%3800,3,'#f0faff');
 glint(c,t,b.x+b.w-25,b.y+51,(b.x*13+1100)%3800,1.9,'#fff1e5')
}
