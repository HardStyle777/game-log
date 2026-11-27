import {fiaMeta} from './fia-art-r46.js';
import {fiaPose} from './party-motion-r41.js';
function verifyStance({fiaPose,fiaMeta}){
 let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)},idx=f=>f.y/216*6+f.x/240;
 for(const [clip,duration,expected] of [['guard',520,[32,33,34]],['victory',900,[35,36,37]]]){
  const seen=[];for(let t=0;t<duration;t++){const v={clock:t,vitals:{fia:{hp:100}},motion:{fia:{id:'fia',clip,start:0,duration}}},p=fiaPose(v,fiaMeta),i=idx(p.frame);ok(expected.includes(i),'stance range');if(seen.at(-1)!==i)seen.push(i)}
  ok(JSON.stringify(seen)===JSON.stringify(expected),'stance sequence');
 }
 const dead={clock:1000,vitals:{fia:{hp:0}},motion:{},outcome:'win'};ok(idx(fiaPose(dead,fiaMeta).frame)===16,'dead cannot celebrate');
 const alive={...dead,vitals:{fia:{hp:1}}};ok(idx(fiaPose(alive,fiaMeta).frame)===37,'victory hold');
 for(let t=0;t<760;t++)for(const k of [1,2]){
  const v={clock:t,vitals:{fia:{hp:100}},motion:{fia:{id:'fia',clip:'attack',start:0,duration:760,contact:360,strikeCount:k}}};
  const i=idx(fiaPose(v,fiaMeta).frame);ok(i>=26&&i<=31,'new attack preserved');if(k===1)ok(i!==29&&i!==30,'single no second slash');
 }
 return {checks,failures:0};
}
console.log(JSON.stringify(verifyStance({fiaMeta,fiaPose}),null,2));