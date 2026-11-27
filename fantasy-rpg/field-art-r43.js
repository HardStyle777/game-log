import {drawFieldActor} from './field-actor-r43.js?v=43';
import {MAPS,W,H} from './field-model-r34.js?v=34';
import {townGround,sunOnStreet,decorateTownProp} from './town-light.js?v=30';

import {houseImage,houseLights} from './town-houses-r32.js?v=32';

function artFor(object,map){
 if(object.kind==='enemy')return object.encounter;
 if(object.kind!=='tree')return object.kind;
 const variant=Number(object.id.slice(4));
 return map==='meadow'&&variant%2===0?'pine'+(variant%4===0?0:1):'tree'+(variant%3)
}

const scene=Object.fromEntries(Object.entries(MAPS).map(([name,map])=>{
 const props=[
  ...map.buildings.map(b=>({...b,art:b.id,depth:b.y+b.h})),
  ...map.objects.map(o=>({...o,art:artFor(o,name),depth:o.y}))
 ];
 if(name==='town'){
  props.push({kind:'gate',art:'gate',x:288,y:484,depth:484});
  for(const y of [332,412])for(const x of [245,331]){
   props.push({kind:'streetLamp',x,y,depth:y});
  }
 }
 return [name,props.sort((a,b)=>a.depth-b.depth)];
}));

function visible(cam,x,y,w,h){
 return x+w>cam.x&&x<cam.x+W&&y+h>cam.y&&y<cam.y+H
}
function prop(c,images,o,cam,inTown){
 const {scale,props}=images.art,s=props[o.art],x=o.x+s.dx,y=o.y+s.dy;
 if(!visible(cam,x,y,s.w,s.h))return false;
 if(inTown&&o.kind==='house')c.drawImage(houseImage(o,scale),x,y,s.w,s.h);
 else c.drawImage(inTown?images.townProps:images.props,s.x*scale,s.y*scale,s.w*scale,s.h*scale,x,y,s.w,s.h);
 return true
}
function shadow(c,x,y,rx,ry){
 c.fillStyle='#22372a83';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()
}
function water(c,o,t){
 const phase=t/1000;
 c.fillStyle='#d3ece6';
 for(let i=0;i<6;i++){
  const p=(phase*1.55+i/6)%1;
  const x=o.x+Math.sin(i*2.5)*p*8,y=o.y-39-p*12+17*p*p;
  c.fillRect(Math.round(x*3)/3,Math.round(y*3)/3,.66,1.33);
 }
 const spread=(phase*18)%13;
 c.fillStyle='#b7dedbaa';c.fillRect(o.x-18+spread,o.y-7,5,2/3)
}

function player(c,s,images,anim,run,actor,idleAnim){
 const x=Math.round(s.x),y=Math.round(s.y);
 shadow(c,x,y,9,3);
 drawFieldActor(c,s,images,anim,run,actor,idleAnim);
}

function drawObject(c,o,cam,t,images,cleared,inTown){
 if(o.kind==='streetLamp'){
  if(visible(cam,o.x-9,o.y-24,18,28))decorateTownProp(c,o,t);
  return;
 }
 if(o.kind==='enemy'&&cleared.includes(o.id))return;
 const sprite=o.kind==='enemy'?{...o,y:o.y+Math.round(Math.sin(t/240))}:o;
 if(!prop(c,images,sprite,cam,inTown))return;
 if(o.kind==='fountain')water(c,o,t);
 if(!inTown)return;
 if(o.kind==='house')houseLights(c,o,t);
 else decorateTownProp(c,o,t)
}

export function render(c,s,cam,t,images,anim,run,actor='fia',idleAnim=0){
 const map=MAPS[s.map], scale=images.art.scale,inTown=s.map==='town';
 const ground=inTown?townGround(images.town,map,scale):images[s.map];
 c.fillStyle='#1a2826';c.fillRect(0,0,W,H);
 const x=Math.max(0,cam.x),y=Math.max(0,cam.y);
 const w=Math.min(map.w,cam.x+W)-x,h=Math.min(map.h,cam.y+H)-y;
 c.drawImage(ground,x*scale,y*scale,w*scale,h*scale,x-cam.x,y-cam.y,w,h);
 c.save();c.translate(-cam.x,-cam.y);
 if(inTown)sunOnStreet(c,cam,t);
 let drawn=false;
 for(const o of scene[s.map]){
  if(!drawn&&o.depth>s.y){player(c,s,images,anim,run,actor,idleAnim);drawn=true}
  drawObject(c,o,cam,t,images,s.cleared,inTown);
 }
 if(!drawn)player(c,s,images,anim,run,actor,idleAnim);
 c.restore()
}
