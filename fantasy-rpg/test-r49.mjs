import {readFileSync} from 'node:fs';
import {core} from './engine/src/core/combat-math.js';
import {battle} from './engine/src/core/battle-engine.js';
import {PartySession,makePartyConfig} from './party-session-r49.js';
import {leonPose,fiaPose} from './party-motion-r41.js';
import {fiaMeta} from './fia-art-r46.js';
import {character,normalBattleFrame,drawPreview,actorIds,slotIds} from './character-visual-r49.js';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
function verifyParity({core,battle,PartySession,makePartyConfig,leonPose,fiaPose,fiaMeta,meta,reference,fixture,character,normalBattleFrame,drawPreview,actorIds,slotIds}){
let checks=0;const ok=(x,m)=>{checks++;if(!x)throw Error(m)};
const leonClips=meta.actors.leon.clips;
for(const id of actorIds){const c=character(id);ok(Object.keys(c.slots).join()===slotIds.join(),'six slots');const f=normalBattleFrame(id,meta);ok(f.w===240&&f.h===216,'battle dimensions');let called;const g={clearRect(){},drawImage(...a){called=a}};drawPreview(g,{naturalWidth:1440,naturalHeight:864},f,120,108);ok(called.slice(1).join()===[f.x,f.y,f.w,f.h,0,0,120,108].join(),'preview actual frame');ok(g.imageSmoothingEnabled===false,'no smoothing')}
const wins=[];
for(const [seed,boss,multi] of [[17,false,false],[41,false,false],[17,false,true],[17,true,false]]){
const s=new PartySession(battle,makePartyConfig(core,reference,fixture,{seed,boss,multi}),leonClips);let ticks=0,seen={leon:false,fia:false};
for(let r=0;r<30&&!s.outcome;r++){for(const id of s.active){const legal=s.legal(id),c=legal.find(x=>x.skill==='basic')??legal[0];s.select(id,c.skill,c.target?.id??null)}s.submit();
while(s.busy){if(++ticks>30000)throw Error('timeout');const v=s.advance(20);for(const id of ['leon','fia']){const m=v.motion[id];if(m?.clip==='victory'&&v.clock>=m.start&&v.clock<m.start+m.duration){seen[id]=true;ok(v.vitals[id].hp>0,'living only');ok(v.outcome===null,'before outcome');const p=id==='leon'?leonPose(v,meta.actors.leon):fiaPose(v,fiaMeta);ok(p.clip==='victory','actual victory frame')}}}}
if(s.outcome==='win')for(const id of ['leon','fia'])ok(seen[id]===(s.state.actors[id].vitals.hp>0),'victory coverage');wins.push({seed,boss,multi,outcome:s.outcome,seen})}
const revives=[];
for(const id of ['leon','fia']){const cfg=makePartyConfig(core,reference,fixture,{seed:1});const actor=cfg.actors.find(a=>a.id===id),wolf=cfg.actors.find(a=>a.id==='wolf'),healer=cfg.actors.find(a=>a.id==='lucia');actor.stats={...actor.stats,hp:1,eva:0};wolf.stats={...wolf.stats,patk:250,acc:1000};cfg.skills.raise={kind:'revive',ratioBp:5000,target:'ally_dead',mp:0};healer.skills.push('raise');const s=new PartySession(battle,cfg,leonClips);let seen=false;
for(let r=0;r<12&&!s.outcome&&!seen;r++){const raise=s.legal('lucia').find(c=>c.skill==='raise'&&c.target?.id===id);for(const a of s.active){const legal=s.legal(a),c=a==='lucia'&&raise?raise:legal.find(x=>x.skill==='guard')??legal[0];s.select(a,c.skill,c.target?.id??null)}s.submit();let ticks=0;while(s.busy){if(++ticks>3000)throw Error('revive timeout');const v=s.advance(20),m=v.motion[id];if(m?.clip==='revive'&&v.clock>=m.start&&v.clock<m.start+m.duration){seen=true;const p=id==='leon'?leonPose(v,meta.actors.leon):fiaPose(v,fiaMeta);ok(p.clip==='revive','actual revive frame')}}}
const ev=s.events.filter(e=>e.target===id&&['knockout','revive'].includes(e.type));ok(seen&&ev.some(e=>e.type==='revive'),'revive coverage '+id);revives.push({id,events:ev.map(e=>e.type)})}
return {checks,failures:0,wins,revives}}

console.log(JSON.stringify(verifyParity({core,battle,PartySession,makePartyConfig,leonPose,fiaPose,fiaMeta,character,normalBattleFrame,drawPreview,actorIds,slotIds,meta:load('./assets/r26/motion.json'),reference:load('./engine/data/core/reference-input-v0.4.json'),fixture:load('./engine/tests/fixtures/personal-contracts-v0.5.json')}),null,2));