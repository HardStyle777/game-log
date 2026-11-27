// R19 field vertical slice. All positions are foot anchors in native pixel coordinates.
export const TILE=16,W=320,H=400,R=5;
const rect=(id,x,y,w,h,kind,extra={})=>({id,x,y,w,h,kind,...extra});
const obj=(id,x,y,kind,extra={})=>({id,x,y,kind,...extra});
const townBuildings=[
 rect('inn',80,76,112,80,'house',{roof:'blue',door:[136,152],label:'宿屋'}),
 rect('shop',352,76,112,80,'house',{roof:'red',door:[408,152],label:'道具屋'}),
 rect('hall',224,40,96,86,'house',{roof:'blue',door:[272,122],label:'集会所'}),
 rect('home',64,296,96,80,'house',{roof:'red',door:[112,372],label:'民家'})
];
function trees(points){return points.map(([x,y],i)=>obj('tree'+i,x,y,'tree'))}
export const MAPS={
 town:{name:'始まりの村',w:576,h:496,spawn:[288,364],ground:'grass',paths:[[248,0,80,496],[0,184,576,112],[112,296,40,104],[112,148,48,44],[384,148,48,44]],buildings:townBuildings,
 objects:[...trees([[32,68],[48,144],[216,110],[344,40],[512,72],[544,128],[32,336],[208,380],[352,400],[496,348],[544,432],[160,440],[64,448]]),obj('fountain',288,248,'fountain'),obj('npc',204,282,'npc',{text:'村人：南の門を抜けると草原だよ。狼には気をつけて。'}),obj('sign',348,328,'sign',{text:'南：風渡りの草原　北：村の広場'}),obj('chest',464,312,'chest',{text:'古い宝箱。移動試験用のため報酬は未実装。'})],
 exits:[{id:'south',x:252,y:473,w:72,h:23,to:'meadow',spawn:[288,42]}]},
 meadow:{name:'風渡りの草原',w:576,h:544,spawn:[288,42],ground:'grass',paths:[[248,0,80,544],[128,208,320,48]],buildings:[],
 objects:[...trees([[48,60],[112,112],[200,60],[376,88],[496,72],[544,144],[56,244],[120,352],[464,320],[520,428],[208,448],[80,480],[392,480]]),obj('rock1',184,172,'rock'),obj('rock2',408,396,'rock'),obj('sign',338,80,'sign',{text:'北：始まりの村　南：巨狼の生息地'}),obj('wolf',288,224,'enemy',{encounter:'wolf'}),obj('boss',288,442,'enemy',{encounter:'boss'})],
 exits:[{id:'north',x:252,y:0,w:72,h:20,to:'town',spawn:[288,448]}]},
 room:{name:'村の建物・室内',w:256,h:320,spawn:[128,262],ground:'wood',paths:[],buildings:[],
 objects:[obj('table',128,126,'table'),obj('bed1',48,86,'bed'),obj('bed2',208,86,'bed'),obj('npc',186,206,'npc',{text:'店主：いらっしゃい。現在は室内移動の試験中です。'}),obj('chest',55,215,'chest',{text:'収納箱。アイテムの取得は本編実装時に追加します。'})],
 exits:[{id:'door',x:100,y:293,w:56,h:27,to:'town',spawn:null}]}
};
const roomLayouts={
 inn:{name:'宿屋・客室',objects:[obj('bed1',48,86,'bed'),obj('bed2',208,86,'bed'),obj('table',128,145,'table'),obj('npc',186,206,'npc',{text:'宿屋の主人：旅の疲れを癒やしていってください。宿泊機能は準備中です。'})]},
 shop:{name:'道具屋',objects:[obj('table',128,100,'table'),obj('npc',128,143,'npc',{text:'道具屋：薬草や旅の道具を取り扱っています。売買機能は準備中です。'}),obj('chest',48,100,'chest',{text:'店の商品が入った収納箱。'}),obj('chest2',208,100,'chest',{text:'店の商品が入った収納箱。'})]},
 hall:{name:'集会所',objects:[obj('table',128,105,'table'),obj('npc',128,155,'npc',{text:'村長：南の草原で魔物が増えている。旅立つなら十分に気をつけて。'})]},
 home:{name:'民家',objects:[obj('bed1',48,86,'bed'),obj('table',160,120,'table'),obj('npc',186,206,'npc',{text:'村人：広場の噴水は、この村の自慢なんですよ。'}),obj('chest',55,215,'chest',{text:'住人の私物が入った箱。'})]}
};
for(const [id,layout] of Object.entries(roomLayouts))MAPS['room_'+id]={...MAPS.room,...layout};
const inside=(x,y,b)=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
export function blockers(map){
 const b=map.buildings.map(o=>({x:o.x+3,y:o.y+24,w:o.w-6,h:o.h-24}));
 if(map.ground==='wood')b.push({x:0,y:0,w:256,h:27},{x:0,y:0,w:7,h:320},{x:249,y:0,w:7,h:320},{x:0,y:304,w:99,h:16},{x:157,y:304,w:99,h:16});
 if(map===MAPS.town)b.push({x:0,y:475,w:244,h:21},{x:332,y:475,w:244,h:21},{x:0,y:0,w:248,h:13},{x:328,y:0,w:248,h:13});
 for(const o of map.objects){const q={tree:[-7,-8,14,10],fountain:[-22,-14,44,28],rock:[-9,-8,18,11],npc:[-7,-8,14,12],chest:[-10,-7,20,12],sign:[-5,-5,10,8],table:[-24,-13,48,26],bed:[-14,-22,28,32]}[o.kind];if(q)b.push({x:o.x+q[0],y:o.y+q[1],w:q[2],h:q[3]})}
 return b;
}
export function walkable(map,x,y){return x>=R&&y>=R&&x<=map.w-R&&y<=map.h-R&&!blockers(map).some(b=>inside(x,y,{x:b.x-R,y:b.y-R,w:b.w+2*R,h:b.h+2*R}))}
export function direction(dx,dy){
 const m=Math.hypot(dx,dy);if(m<.18)return {x:0,y:0,dir:null};
 const i=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
 const names=['east','southeast','south','southwest','west','northwest','north','northeast'];
 return {x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4),dir:names[i]};
}
export function spriteDirection(dir,last='south'){if(!dir)return last;return dir==='east'||dir==='west'?dir:dir.includes('north')?'north':'south'}
export function move(state,dx,dy,dt,run=false){
 const map=MAPS[state.map],d=direction(dx,dy);if(!d.dir||dt<=0)return {...state,moving:false};
 const distance=Math.min(.1,dt)*(run?146:90),steps=Math.max(1,Math.ceil(distance/2)),sx=d.x*distance/steps,sy=d.y*distance/steps;let x=state.x,y=state.y;
 for(let i=0;i<steps;i++){
  if(walkable(map,x+sx,y))x+=sx;
  if(walkable(map,x,y+sy))y+=sy;
 }
 return {...state,x,y,facing:d.dir,spriteFacing:spriteDirection(d.dir,state.spriteFacing),moving:Math.hypot(x-state.x,y-state.y)>.001};
}
export function newState(){return {map:'town',x:288,y:364,facing:'south',spriteFacing:'south',moving:false,roomReturn:null,cleared:[],blockedEnemy:null}}
export function restore(raw){
 const base=newState();if(!raw||!MAPS[raw.map]||!Number.isFinite(raw.x)||!Number.isFinite(raw.y)||!walkable(MAPS[raw.map],raw.x,raw.y))return base;
 const validDirs=['north','south','east','west','northeast','northwest','southeast','southwest'];
 return {...base,map:raw.map,x:raw.x,y:raw.y,facing:validDirs.includes(raw.facing)?raw.facing:'south',spriteFacing:['north','south','east','west'].includes(raw.spriteFacing)?raw.spriteFacing:'south',roomReturn:Array.isArray(raw.roomReturn)&&raw.roomReturn.length===2&&walkable(MAPS.town,...raw.roomReturn)?raw.roomReturn:null,cleared:Array.isArray(raw.cleared)?raw.cleared.filter(x=>['wolf','boss'].includes(x)):[],blockedEnemy:['wolf','boss'].includes(raw.blockedEnemy)?raw.blockedEnemy:null};
}
export function transition(s){
 const map=MAPS[s.map],e=map.exits.find(b=>inside(s.x,s.y,b));if(!e)return s;
 const point=e.spawn??s.roomReturn??[288,364];return {...s,map:e.to,x:point[0],y:point[1],moving:false,roomReturn:e.to==='town'?null:s.roomReturn};
}
export function interact(s){
 const m=MAPS[s.map],candidates=m.objects.filter(o=>['npc','sign','chest'].includes(o.kind)).map(o=>({o,d:Math.hypot(o.x-s.x,o.y-s.y)}));
 for(const b of m.buildings)candidates.push({o:{id:b.id,x:b.door[0],y:b.door[1],kind:'door'},d:Math.hypot(s.x-b.door[0],s.y-b.door[1])});
 const near=candidates.filter(x=>x.d<=29).sort((a,b)=>a.d-b.d)[0]?.o;
 if(!near)return {state:s,text:'近くに調べられるものはありません。'};
 if(near.kind==='door')return {state:{...s,map:'room_'+near.id,x:128,y:262,roomReturn:[near.x,near.y+17],moving:false},text:'建物に入りました。'};
 return {state:s,text:near.text,object:near};
}
export function encounter(s){
 const enemies=MAPS[s.map].objects.filter(o=>o.kind==='enemy'&&!s.cleared.includes(o.id));
 const near=enemies.find(o=>Math.hypot(o.x-s.x,o.y-s.y)<=22);
 if(!near)return {state:{...s,blockedEnemy:null},enemy:null};
 if(s.blockedEnemy===near.id)return {state:s,enemy:null};
 return {state:{...s,blockedEnemy:near.id,moving:false},enemy:near};
}
export function returnBattle(s,outcome,id){
 if(!['wolf','boss'].includes(id))return s;
 return {...s,cleared:outcome==='win'?[...new Set([...s.cleared,id])]:s.cleared,blockedEnemy:id,moving:false};
}
export function camera(s){const m=MAPS[s.map];return {x:Math.round(m.w<W?(m.w-W)/2:Math.max(0,Math.min(m.w-W,s.x-W/2))),y:Math.round(m.h<H?(m.h-H)/2:Math.max(0,Math.min(m.h-H,s.y-H*(s.map==='town'?.75:.55))))}}
