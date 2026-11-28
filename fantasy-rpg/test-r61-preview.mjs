import {fieldFrame} from './field-actor-r52.js';
import {createPreviewCache,timedClipFrame,explorationFrame} from './appearance-preview-r61.js';
let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
let calls=0;const c=createPreviewCache(),make=()=>({id:++calls}),v=c.get('a',make);for(let i=0;i<1000;i++)ok(c.get('a',make)===v,'cache');ok(calls===1,'single build');try{c.get('b',()=>{throw Error('bad')})}catch{}ok(c.current()===v,'failed build retains previous');ok(c.get('b',make)!==v&&calls===2,'switch');c.clear();ok(c.current()===null,'clear');
for(const id of ['leon','fia'])for(const mode of ['idle','walk','run'])for(let d=0;d<4;d++)for(let t=0;t<=3600;t+=17){const p=explorationFrame(id,mode,d,t),f=fieldFrame({x:0,y:0,spriteFacing:['south','east','north','west'][d],moving:mode!=='idle'},mode==='idle'?0:t,mode==='run',id,mode==='idle'?t:0);ok(p.x===f.sx&&p.y===f.sy,'actual field parity');ok(p.x>=0&&p.x<384&&p.y>=0&&p.y<384,'bounds')}
for(let t=-2000;t<2000;t++){const p=timedClipFrame([{ms:120},{ms:180},{ms:300}],t),q=(t%600+600)%600;ok(p.index===(q<120?0:q<300?1:2),'clock')}
console.log(JSON.stringify({checks,failures:0}));
