// node --experimental-default-type=module fantasy-rpg/test-r51-result.mjs
import {readFileSync} from 'node:fs';
import {core} from './engine/src/core/combat-math.js';
import {battle} from './engine/src/core/battle-engine.js';
import {PartySession,makePartyConfig} from './party-session-r49.js';
import {leonPose,fiaPose} from './party-motion-r51.js';
import {configureLeon,victoryFrame} from './result-pose-r51.js';
import {fiaMeta} from './fia-art-r46.js';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
export function verifyResult({core,battle,PartySession,makePartyConfig,leonPose,fiaPose,configureLeon,victoryFrame,reference,fixture,raw,fiaMeta}){
let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
const actors={...raw.actors,leon:configureLeon(raw.actors.leon),fia:fiaMeta},ids=['leon','fia'],pose=(id,v)=>id==='leon'?leonPose(v,actors[id]):fiaPose(v,actors[id]),eq=(a,b)=>a.x===b.x&&a.y===b.y&&a.w===b.w&&a.h===b.h;
ok(!eq(actors.leon.clips.idle[0],victoryFrame(actors.leon)),'Leon unique victory');
ok(raw.actors.leon.clips.victory.at(-1).y===0,'original unchanged');
ok(eq(actors.leon.clips.victory.at(-1),victoryFrame(actors.leon)),'hold from animation end');
const rows=[];
for(const [seed,boss,multi] of [[17,false,false],[41,false,false],[91,false,false],[17,false,true],[17,true,false]]){
 const s=new PartySession(battle,makePartyConfig(core,reference,fixture,{seed,boss,multi}),actors.leon.clips);
 let ticks=0,held=0;
 for(let r=0;r<30&&!s.outcome;r++){
  for(const id of s.active){const legal=s.legal(id),cmd=legal.find(c=>c.skill==='basic')??legal[0];s.select(id,cmd.skill,cmd.target?.id??null)}
  s.submit();while(s.busy){if(++ticks>30000)throw Error('timeout');const v=s.advance(20);
   for(const id of ids){const m=v.motion[id];if(m?.clip==='victory'&&v.vitals[id].hp>0&&v.clock>=m.start+m.duration){const p=pose(id,v);ok(p.clip==='victory'&&eq(p.frame,victoryFrame(actors[id])),'hold while other animation finishes');held++}}
  }
 }
 ok(s.outcome==='win','win case');
 const before=JSON.stringify(s.state);
 for(const dt of [0,1,20,120,700,2000,10000,120000]){
  const v=s.advance(dt);for(const id of ids){const p=pose(id,v);if(v.vitals[id].hp>0)ok(p.clip==='victory'&&eq(p.frame,victoryFrame(actors[id])),'stable result '+id);else ok(p.clip==='down'&&eq(p.frame,actors[id].clips.down[0]),'KO on result')}
  ok(!v.busy&&v.outcome==='win'&&JSON.stringify(s.state)===before,'settled state unchanged');
 }
 rows.push({seed,boss,multi,outcome:s.outcome,ticks,held,alive:Object.fromEntries(ids.map(id=>[id,s.view().vitals[id].hp>0]))});
}
for(const id of ids)for(const outcome of ['win','loss','draw'])for(const hp of [0,1])for(const clock of [0,100,10000]){const v={vitals:{[id]:{hp}},motion:{},outcome,clock},p=pose(id,v);ok(hp===0?p.clip==='down':outcome==='win'?p.clip==='victory':p.clip!=='victory','terminal condition '+id)}
for(const id of ids){const v={clock:1000,vitals:{[id]:{hp:1}},motion:{[id]:{clip:'victory',start:0,duration:900}},outcome:null};ok(pose(id,v).clip==='victory','completed parallel motion');v.motion={};ok(pose(id,v).clip!=='victory','new turn normal')}
return {checks,rows,failures:0};
}
console.log(JSON.stringify(verifyResult({core,battle,PartySession,makePartyConfig,leonPose,fiaPose,configureLeon,victoryFrame,reference:load('./engine/data/core/reference-input-v0.4.json'),fixture:load('./engine/tests/fixtures/personal-contracts-v0.5.json'),raw:load('./assets/r26/motion.json'),fiaMeta}),null,2));
