// Node 22: node --experimental-default-type=module fantasy-rpg/test-fia-r36.mjs
import {fiaPixels,fiaMeta} from './fia-art-r36.js';
import {fiaPose} from './party-motion-r36.js';
import {actorPosition,visibleBounds} from './battle-visuals-r36.js';
import assert from 'node:assert/strict';
let checks=0;function ok(x,msg){checks++;assert.ok(x,msg)}
const index=f=>f.y/216*6+f.x/240;
for(let i=0;i<18;i++){const a=fiaPixels(i),b=fiaPixels(i);let n=0;ok(a.length===120*108*4,'size');for(let y=0;y<108;y++)for(let x=0;x<120;x++){const o=(y*120+x)*4;ok(a[o+3]===0||a[o+3]===255,'alpha');if(a[o+3]){n++;ok(x>=4&&x<=112&&y>=10&&y<=96,'bounds')}}ok(n>2400,'area');ok(a.every((v,k)=>v===b[k]),'deterministic')}
const v=(clock,strikeCount,hp=100,clip='attack')=>({clock,vitals:{fia:{hp}},motion:{fia:{start:0,duration:760,contact:360,strikeCount,clip}}});
for(let t=0;t<760;t++){ok(![8,9,10].includes(index(fiaPose(v(t,1),fiaMeta).frame)),'basic extra strike');ok(index(fiaPose(v(t,2),fiaMeta).frame)>=0,'double frame')}
ok(index(fiaPose(v(360,2),fiaMeta).frame)===7,'first impact');ok(index(fiaPose(v(455,2),fiaMeta).frame)===9,'second impact');ok(index(fiaPose(v(455,1),fiaMeta).frame)===11,'single recovery');ok(index(fiaPose({clock:800,vitals:{fia:{hp:0}},motion:{}},fiaMeta).frame)===16,'down');
for(const box of [{x:12,y:172,w:156,h:98},{x:10,y:79,w:252,h:258}])for(let t=0;t<760;t++){const p=actorPosition(v(t,2),'fia',box),b=visibleBounds('fia',p);ok(b.x>=0&&b.y>=0&&b.x+b.w<=480&&b.y+b.h<=400,'stage bounds')}
console.log(JSON.stringify({version:'R36',checks,frames:18,failures:0}));
