// node --experimental-default-type=module fantasy-rpg/test-r40.mjs
import {readFileSync} from 'node:fs';
import {core} from './engine/src/core/combat-math.js';
import {battle} from './engine/src/core/battle-engine.js';
import {PartySession,makePartyConfig} from './party-session-r40.js';
import {fiaMeta} from './fia-art-r45.js';
import {fiaPose} from './party-motion-r41.js';
import {planningInputOpen,tapCurrentTarget} from './direct-target-r39.js';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
function verify({core,battle,PartySession,makePartyConfig,fiaMeta,fiaPose,planningInputOpen,tapCurrentTarget,reference,fixture,leonClips}){
 let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)},rows=[],counts={};
 const idx=f=>f.y/216*6+f.x/240;
 for(const [seed,boss,multi] of [[17,false,false],[41,false,false],[91,false,false],[17,false,true],[17,true,false]]){
 const s=new PartySession(battle,makePartyConfig(core,reference,fixture,{seed,boss,multi}),leonClips);let ticks=0;const observed=new Set();
 for(let r=0;r<30&&!s.outcome;r++){
 for(const id of s.active){
 const legal=s.legal(id);let c=id==='fia'&&r===0?legal.find(c=>c.skill==='guard'):id==='fia'?legal.find(c=>c.skill==='double'):null;c??=legal.find(c=>c.skill==='basic')??legal[0];
 ok(planningInputOpen(s,id),'input open');if(c.target?.mode==='actor'){const a=tapCurrentTarget(s,id,c.skill,null,c.target.id,0),b=tapCurrentTarget(s,id,c.skill,a.choice,c.target.id,100);ok(!a.confirm&&b.confirm&&b.target===c.target.id,'direct target');}
 s.select(id,c.skill,c.target?.id??null);
 }
 ok(s.complete,'complete');const last=s.active.at(-1),before=JSON.stringify(s.selected);
 ok(!planningInputOpen(s,last),'locked');for(let i=0;i<10;i++)ok(!tapCurrentTarget(s,last,'basic',null,s.config.enemies[0],i*50).confirm,'extra tap blocked');ok(before===JSON.stringify(s.selected),'commands unchanged');s.submit();
 while(s.busy){if(++ticks>30000)throw Error('timeline timeout');const v=s.advance(20),m=v.motion.fia,p=fiaPose(v,fiaMeta),i=idx(p.frame);ok(i>=0&&i<32,'frame range');if(m&&v.clock>=m.start&&v.clock<m.start+m.duration){const k=m.start+':'+m.clip;if(!observed.has(k)){observed.add(k);counts[m.clip]=(counts[m.clip]??0)+1;if(m.clip==='victory')ok(v.outcome===null&&v.busy,'victory before settlement');if(m.clip==='guard')ok([19,20].includes(i),'guard frame')}}}
 ok(s.seq===s.state.eventSeq,'seq');ok(JSON.stringify(s.shown)===JSON.stringify(Object.fromEntries(Object.entries(s.state.actors).map(([id,a])=>[id,a.vitals]))),'snapshot');
 if(!s.outcome)ok(planningInputOpen(s,s.active[0]),'next turn');
 }
 if(s.outcome==='win'&&s.state.actors.fia.vitals.hp>0){ok(idx(fiaPose(s.view(),fiaMeta).frame)===23,'victory hold');ok([...observed].some(x=>x.endsWith(':victory')),'victory played')}
 if(s.state.actors.fia.vitals.hp===0)ok(idx(fiaPose(s.view(),fiaMeta).frame)===16,'down stays down');rows.push({seed,boss,multi,outcome:s.outcome,round:s.round,ticks});
 }
 ok(counts.guard>0&&counts.attack>0&&counts.victory>0,'coverage');
 for(const [clip,expected,duration] of [['knockout',[14,25,16],650],['revive',[16,25,24,0],720]]){const seen=[];for(let t=0;t<duration;t++){const v={clock:t,motion:{fia:{clip,start:0,duration}},vitals:{fia:{hp:clip==='revive'?1:0}}};const n=idx(fiaPose(v,fiaMeta).frame);if(seen.at(-1)!==n)seen.push(n)}ok(JSON.stringify(seen)===JSON.stringify(expected),clip+' sequence');}
 const cfg=makePartyConfig(core,reference,fixture,{seed:1});const fia=cfg.actors.find(a=>a.id==='fia'),wolf=cfg.actors.find(a=>a.id==='wolf'),leon=cfg.actors.find(a=>a.id==='leon');fia.stats={...fia.stats,hp:1,eva:0};wolf.stats={...wolf.stats,patk:250,acc:1000};cfg.skills.raise={kind:'revive',ratioBp:5000,target:'ally_dead',mp:0};leon.skills.push('raise');
 const s=new PartySession(battle,cfg,leonClips);let seen=false;for(let r=0;r<12&&!s.outcome&&!seen;r++){const raise=s.legal('leon').find(c=>c.skill==='raise'&&c.target?.id==='fia');for(const id of s.active){const legal=s.legal(id),c=id==='leon'&&raise?raise:legal.find(c=>c.skill==='guard')??legal[0];s.select(id,c.skill,c.target?.id??null)}s.submit();let i=0;while(s.busy){if(++i>3000)throw Error('revive timeout');const v=s.advance(20),m=v.motion.fia;if(m?.clip==='revive'&&v.clock>=m.start&&v.clock<m.start+m.duration){seen=true;ok([16,25,24,0].includes(idx(fiaPose(v,fiaMeta).frame)),'revive frame')}}}
 const revive=s.events.filter(e=>['knockout','revive'].includes(e.type)&&e.target==='fia').map(e=>({type:e.type,seq:e.seq,hp:e.hp}));ok(seen&&revive.some(e=>e.type==='knockout')&&revive.some(e=>e.type==='revive'),'revive');
 return {version:'R45',checks,failures:0,battles:rows,counts,revive,scope:'actual engine and target input transitions, frame selection, snapshots; not full UI'};
}
console.log(JSON.stringify(verify({core,battle,PartySession,makePartyConfig,fiaMeta,fiaPose,planningInputOpen,tapCurrentTarget,reference:load('./engine/data/core/reference-input-v0.4.json'),fixture:load('./engine/tests/fixtures/personal-contracts-v0.5.json'),leonClips:load('./assets/r26/motion.json').actors.leon.clips}),null,2));
