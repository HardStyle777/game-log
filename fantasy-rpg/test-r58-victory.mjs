import {readFileSync} from 'node:fs';
import {core} from './engine/src/core/combat-math.js';
import {battle} from './engine/src/core/battle-engine.js';
import {PARTY,PartySession,makePartyConfig} from './party-session-r57.js';
import {leonPose,fiaPose,atlasPose} from './party-motion-r58.js';
import {configureLoop,loopFrame} from './victory-loop-r58.js';
import {configureVictory} from './victory-art-r57.js';
import {fiaMeta} from './fia-art-r46.js';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
function verifyLoop({core,battle,PARTY,PartySession,makePartyConfig,leonPose,fiaPose,atlasPose,configureLoop,loopFrame,configureVictory,fiaMeta,reference,fixture,raw}){
let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
const actors=Object.fromEntries(PARTY.map(id=>[id,configureLoop(id==='fia'?fiaMeta:configureVictory(raw.actors[id==='lucia'?'eris':id]),id)]));
const pose=(v,id)=>id==='leon'?leonPose(v,actors[id]):id==='fia'?fiaPose(v,actors[id]):atlasPose(v,id,actors[id]),key=f=>f.x+':'+f.y;
const rows=[];
for(const [seed,boss,multi,skip] of [[17,false,false,false],[41,false,false,true],[17,false,true,false],[17,true,false,false],[91,false,false,false]]){
 const s=new PartySession(battle,makePartyConfig(core,reference,fixture,{seed,boss,multi}),actors.leon.clips);let ticks=0;
 for(let round=0;round<30&&!s.outcome;round++){for(const id of s.active){const legal=s.legal(id),c=legal.find(x=>x.skill==='basic')??legal[0];s.select(id,c.skill,c.target?.id??null)}s.submit();while(s.busy){if(++ticks>30000)throw Error('timeline');s.advance(skip?120000:20)}}
 ok(s.outcome==='win','expected win');const state=JSON.stringify(s.state),alive=PARTY.filter(id=>s.state.actors[id].vitals.hp>0),dead=PARTY.filter(id=>!alive.includes(id)),seen=Object.fromEntries(PARTY.map(id=>[id,new Set()]));
 for(let i=0;i<240;i++){const v=s.advance(25);ok(!v.busy&&v.outcome==='win','settled');for(const id of PARTY){const p=pose(v,id);seen[id].add(key(p.frame));if(alive.includes(id)){ok(p.clip==='victory','alive cheer');const start=v.motion[id].start;ok(key(p.frame)===key(loopFrame(actors[id],v.clock-start).frame),'same loop')}else ok(p.clip==='down'&&key(p.frame)===key(actors[id].clips.down[0]),'dead stays down')}}
 for(const id of alive)ok(seen[id].size>1,'distinct repeated frames '+id);
 for(const id of dead)ok(seen[id].size===1,'down static');
 ok(JSON.stringify(s.state)===state,'no engine changes');const v=s.advance(120000);for(const id of alive)ok(pose(v,id).clip==='victory','long duration');rows.push({seed,boss,multi,skip,alive,dead,distinct:Object.fromEntries(PARTY.map(id=>[id,seen[id].size]))})
}
return {checks,rows,failures:0}}

console.log(JSON.stringify(verifyLoop({core,battle,PARTY,PartySession,makePartyConfig,leonPose,fiaPose,atlasPose,configureLoop,loopFrame,configureVictory,fiaMeta,reference:load('./engine/data/core/reference-input-v0.4.json'),fixture:load('./engine/tests/fixtures/personal-contracts-v0.5.json'),raw:load('./assets/r26/motion.json')}),null,2));