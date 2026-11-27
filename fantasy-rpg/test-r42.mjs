// node --experimental-default-type=module fantasy-rpg/test-r42.mjs
import {fieldActor,nextFieldActor,fieldFrame,drawFieldActor} from './field-actor-r42.js';
import {move,newState,MAPS,restore,camera} from './field-model-r34.js';
function verify({fieldActor,nextFieldActor,fieldFrame,drawFieldActor,move,newState,MAPS,restore,camera}){
 let checks=0;const ok=(x,m)=>{checks++;if(!x)throw Error(m)};
 const base=newState(),s={...base,x:288,y:364};const images={leon:{id:'leon'},fia:{id:'fia'}};
 ok(fieldActor(null)==='fia'&&fieldActor('bad')==='fia','safe default');ok(nextFieldActor('fia')==='leon'&&nextFieldActor('leon')==='fia','switch');
 const dirs=[[0,1,'south'],[1,0,'east'],[0,-1,'north'],[-1,0,'west'],[1,1,'south'],[-1,1,'south'],[-1,-1,'north'],[1,-1,'north']];
 for(const [dx,dy,expected] of dirs)for(const run of [false,true]){
  const moved=move(s,dx,dy,.05,run);ok(moved.moving&&moved.spriteFacing===expected,'direction');ok(Math.abs(Math.hypot(moved.x-s.x,moved.y-s.y)-(run?146:90)*.05)<1e-6,'unchanged speed');
  const cols=new Set();for(let t=0;t<600;t+=5){
   const f=fieldFrame(moved,t,run);cols.add(f.col);ok(f.sx===f.col*96&&f.sy===f.row*96&&f.sx+96<=384&&f.sy+96<=384,'source rectangle');ok(f.dx+24===Math.round(moved.x)&&f.dy+45===Math.round(moved.y),'foot anchor');
   for(const actor of ['leon','fia']){let args;drawFieldActor({drawImage(...a){args=a}},moved,images,t,run,actor);ok(args[0]===images[actor]&&args.slice(1).join(',')===[f.sx,f.sy,96,96,f.dx,f.dy,48,48].join(','),'correct image/frame');}
  }ok(cols.size===4,'four walk frames');
  const stopped=move(moved,0,0,.05,run);ok(!stopped.moving&&fieldFrame(stopped,500,run).col===0,'idle');ok(stopped.spriteFacing===expected,'retain facing');
 }
 const invalid=fieldFrame({...s,spriteFacing:'invalid',moving:true},NaN);ok(invalid.row===0&&invalid.col===1,'fallback');ok(restore({...s,actor:'fia'}).map===s.map,'save compatibility');ok(camera(s).x>=0&&camera(s).y>=0,'camera');
 return {version:'R42',checks,failures:0,scope:'actual field movement model, eight input directions, four sprite rows, walk cadence and run reuse, idle, actor switch and drawImage arguments; not browser integration'};
}
console.log(JSON.stringify(verify({fieldActor,nextFieldActor,fieldFrame,drawFieldActor,move,newState,MAPS,restore,camera}),null,2));
