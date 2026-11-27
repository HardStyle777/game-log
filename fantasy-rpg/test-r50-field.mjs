// node --experimental-default-type=module fantasy-rpg/test-r50-field.mjs
import * as actor from './field-actor-r50.js';
import {fieldFrame as legacyFrame} from './field-actor-r42.js';
import * as model from './field-model-r34.js';
function verify(api){
 let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
 const s=api.newState(),dirs=['south','east','north','west'],images={leon:{id:'leon'},leonRun:{id:'leonRun'},leonIdle:{id:'leonIdle'},fia:{id:'fia'},fiaMotion:{id:'fiaMotion'}};
 for(let row=0;row<4;row++)for(const moving of [false,true])for(const run of [false,true])for(const actor of ['leon','fia'])for(let t=0;t<2000;t+=17){
 const st={...s,spriteFacing:dirs[row],moving},f=api.fieldFrame(st,t,run,actor,t),old=api.legacyFrame(st,t,run);
 ok(f.row===row&&f.sy===row*96&&f.sx===f.col*96&&f.sw===96&&f.sh===96,'source cell');
 ok(f.dx===old.dx&&f.dy===old.dy&&f.dw===48&&f.dh===48,'anchor');
 if(actor==='leon'&&moving&&run){ok(f.asset==='leonRun'&&f.col===Math.floor(t/70)%8,'Leon run cycle');ok(f.col>=0&&f.col<8,'Leon run bounds')}
 else if(actor==='leon'&&!moving){ok(f.asset==='leonIdle'&&f.col===Math.floor(t/240)%4,'Leon idle cycle');ok(f.col>=0&&f.col<4,'Leon idle bounds')}
 else if(moving&&!run){ok(f.col===old.col,'original animation');ok(f.asset===actor,'original asset')}
 else if(moving){ok(f.asset==='fiaMotion'&&f.col===[0,1,2,1][Math.floor(t/83)%4],'run cycle')}
 else{ok(f.asset===(t%1800>=1350?'fiaMotion':'fia')&&f.col===(t%1800>=1350?3:0),'idle cycle')}
 let calls=[];const d=api.drawFieldActor({drawImage:(...x)=>calls.push(x)},st,images,t,run,actor,t);
 ok(calls.length===1&&calls[0][0]===images[f.asset]&&d.sx===f.sx,'draw image');
 }
 let m=null;const a={...s,moving:true,spriteFacing:'east'};
 m=api.motionClock(m,a,'fia',true,16);ok(m.elapsed===0,'start');
 m=api.motionClock(m,a,'fia',true,83);ok(m.elapsed===83,'advance');
 m=api.motionClock(m,{...a,moving:false},'fia',true,17);ok(m.elapsed===0,'stop');
 m=api.motionClock(m,{...a,moving:false},'fia',true,1400);ok(m.elapsed===1400,'idle');
 m=api.motionClock(m,a,'fia',true,17);ok(m.elapsed===0,'restart');
 m=api.motionClock(m,a,'leon',true,17);ok(m.elapsed===0,'actor reset');
 m=api.motionClock(m,{...a,spriteFacing:'west'},'leon',true,17);ok(m.elapsed===0,'direction reset');
 m=api.motionClock(m,{...a,spriteFacing:'west'},'leon',false,17);ok(m.elapsed===0,'walk toggle');
 m=api.motionClock(m,{...a,spriteFacing:'west',map:'meadow'},'leon',false,17);ok(m.elapsed===0,'map reset');
 for(const run of [false,true])for(let k=0;k<8;k++){const start={...s,map:'meadow',x:288,y:100};const theta=k*Math.PI/4,st=api.move(start,Math.cos(theta),Math.sin(theta),.05,run);ok(Math.abs(Math.hypot(st.x-start.x,st.y-start.y)-(run?146:90)*.05)<1e-8,'movement speed');ok(st.moving,'movement');const stop=api.move(st,0,0,.05,run);ok(!stop.moving&&stop.x===st.x&&stop.y===st.y,'stop')}
 return {version:'R50',checks,failures:0,scope:'real field model, frame selection, anchor, mode resets, source image routing; not browser operation'};
}
console.log(JSON.stringify(verify({...actor,...model,legacyFrame}),null,2));
