import {readFileSync} from 'node:fs';
import {core} from './engine/src/core/combat-math.js';
import {battle} from './engine/src/core/battle-engine.js';
import {PARTY,PartySession,makePartyConfig} from './party-session-r57.js';
import {leonPose,fiaPose,atlasPose} from './party-motion-r57.js';
import {victoryFrame} from './result-pose-r51.js';
import {configureVictory} from './victory-art-r57.js';
import {fiaMeta} from './fia-art-r46.js';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
function verifyVictory({core,battle,PARTY,PartySession,makePartyConfig,leonPose,fiaPose,atlasPose,victoryFrame,configureVictory,fiaMeta,reference,fixture,raw}){
 const actors={leon:configureVictory(raw.actors.leon),fia:fiaMeta,glen:configureVictory(raw.actors.glen),lucia:configureVictory(raw.actors.eris)};
 const pose=(v,id)=>id==='leon'?leonPose(v,actors[id]):id==='fia'?fiaPose(v,actors[id]):atlasPose(v,id,actors[id]);
 const eq=(a,b)=>a.x===b.x&&a.y===b.y&&a.w===b.w&&a.h===b.h;
 let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
 for(const id of PARTY){ok(!eq(actors[id].clips.idle[0],victoryFrame(actors[id])),'victory distinct '+id);ok(actors[id].clips.victory.length>0,'victory available')}
 const rows=[];
 for(const [seed,boss,multi] of [[17,false,false],[41,false,false],[91,false,false],[17,false,true],[17,true,false]]){
 const s=new PartySession(battle,makePartyConfig(core,reference,fixture,{seed,boss,multi}),actors.leon.clips);let ticks=0;
 const seen=new Set(),dedicated=new Set(),first={};
 for(let round=0;round<30&&!s.outcome;round++){
 for(const id of s.active){const legal=s.legal(id),c=legal.find(x=>x.skill==='basic')??legal[0];s.select(id,c.skill,c.target?.id??null)}
 s.submit();while(s.busy){if(++ticks>30000)throw Error('timeline timeout');const v=s.advance(20);
 for(const id of PARTY){const m=v.motion[id];if(m?.clip==='victory'&&v.vitals[id].hp>0&&v.clock>=m.start){seen.add(id);first[id]??=m.start;const p=pose(v,id);ok(p.clip==='victory','victory clip '+id);if(eq(p.frame,victoryFrame(actors[id])))dedicated.add(id)}}}
 }
 ok(s.outcome==='win','expected win '+seed);
 const snapshot=JSON.stringify(s.state),alive=PARTY.filter(id=>s.state.actors[id].vitals.hp>0),dead=PARTY.filter(id=>!alive.includes(id));
 for(const id of alive){ok(seen.has(id)&&dedicated.has(id),'dedicated frame shown '+id);ok(first[id]===first[alive[0]],'parallel start '+id)}
 for(const id of dead)ok(!seen.has(id),'dead cannot celebrate');
 for(const dt of [0,1,20,120,700,2000,10000,120000]){const v=s.advance(dt);for(const id of PARTY){const p=pose(v,id);ok(alive.includes(id)?p.clip==='victory'&&eq(p.frame,victoryFrame(actors[id])):p.clip==='down'&&eq(p.frame,actors[id].clips.down[0]),'held final '+id)}ok(!v.busy&&v.outcome==='win'&&JSON.stringify(s.state)===snapshot,'state stable')}
 rows.push({seed,boss,multi,alive,dead,ticks,celebrated:[...seen],dedicated:[...dedicated]})
 }
 for(const id of PARTY)for(const outcome of ['win','loss','draw'])for(const hp of [0,1])for(const clock of [0,100,10000]){const v={vitals:{[id]:{hp}},motion:{},outcome,clock},p=pose(v,id);ok(hp===0?p.clip==='down':outcome==='win'?p.clip==='victory':p.clip!=='victory','terminal condition '+id)}
 return {checks,rows,failures:0};
}
console.log(JSON.stringify(verifyVictory({core,battle,PARTY,PartySession,makePartyConfig,leonPose,fiaPose,atlasPose,victoryFrame,configureVictory,fiaMeta,reference:load('./engine/data/core/reference-input-v0.4.json'),fixture:load('./engine/tests/fixtures/personal-contracts-v0.5.json'),raw:load('./assets/r26/motion.json')}),null,2));
