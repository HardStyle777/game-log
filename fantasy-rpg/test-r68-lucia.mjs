import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {core} from './engine/src/core/combat-math.js';
import {battle} from './engine/src/core/battle-engine.js';
import {PartySession, makePartyConfig} from './party-session-r57.js';
import {configureBattleMeta} from './battle-appearance-r68.js';
import {luciaPose, luciaClips, luciaPoses as poses} from './lucia-motion-r68.js';
import {luciaGear} from './lucia-options-r68.js';
import {fieldActor, nextFieldActor, fieldFrame, explorationFrame, motionClock} from './field-actor-r68.js';
import {fieldFrame as oldField} from './field-actor-r67.js';
const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const meta = configureBattleMeta(load('./assets/r26/motion.json'));
const lucia = meta.actors.lucia;
const index = frame => frame.y / 216 * 4 + frame.x / 240;
const reference = load('./engine/data/core/reference-input-v0.4.json'), fixture = load('./engine/tests/fixtures/personal-contracts-v0.5.json');
let checks = 0;
function ok(actual, expected, label) {checks++; assert.deepEqual(actual, expected, label);}
const poseAt = (time, clip, expected, hp = 100, magic = false) => ok(index(luciaPose({clock: time, motion: {lucia: {
  clip, start: 0, duration: 760, contact: 360, magic,
}}, vitals: {lucia: {hp}}}, lucia).frame), expected, `${clip} ${time}`);
poseAt(359,'attack',poses.idle);poseAt(360,'attack',poses.strike);poseAt(494,'attack',poses.strike);poseAt(495,'attack',poses.idle);
poseAt(0,'attack',poses.open,100,true);poseAt(359,'attack',poses.charge,100,true);poseAt(360,'attack',poses.release,100,true);poseAt(495,'attack',poses.open,100,true);
poseAt(400,'guard',poses.guard);poseAt(500,'knockout',poses.down,0);poseAt(180,'revive',poses.kneel);poseAt(460,'revive',poses.rise);
const allFrames = new Set(Object.values(luciaClips).flat().map(index));
ok(allFrames.size, 12, 'Every newly authored battle pose has a clip');
ok(nextFieldActor('fia'), 'leon');ok(nextFieldActor('leon'), 'glen');ok(nextFieldActor('glen'),'lucia');ok(nextFieldActor('lucia'), 'fia');ok(fieldActor('unknown'), 'fia');
for (const [direction, facing] of ['south','east','north','west'].entries()) {
  for (const actor of ['leon', 'fia', 'glen', 'lucia']) for (let t = 0; t < 640; t += 20) {
    const state = {x:152,y:208,spriteFacing:facing,moving:true,map:'town'};
    const drawn = fieldFrame(state,t,true,actor), base = oldField(state,t,true,actor);
    if (actor !== 'lucia') ok(drawn, base, actor);
    else {
      ok([drawn.dx,drawn.dy,drawn.dw,drawn.dh], [base.dx,base.dy,base.dw,base.dh]);
      ok(explorationFrame(actor,'run',direction,t), {asset:'walk',x:drawn.sx,y:drawn.sy,w:96,h:96});
      ok(drawn.row, direction);
    }
  }
}
const state = {map:'town',spriteFacing:'south',moving:true};
const step = motionClock(null,state,'lucia',false,10);
ok(motionClock(step,state,'lucia',false,10).elapsed,10);
ok(motionClock(step,{...state,spriteFacing:'east'},'lucia',false,10).elapsed,0);

const storage = new Map(), store = {getItem: key => storage.get(key),setItem: (key,value) => storage.set(key,value)};
const all = Object.entries(luciaGear.slots).reduce((rows,[slot,values]) =>
  rows.flatMap(row => values.map(value => ({...row,[slot]:value}))), [{}]);
ok(all.length, 64);
for (const gear of all) {luciaGear.saveAppearance(store,gear);ok(luciaGear.readAppearance(store),gear);}
storage.set(luciaGear.key,'{');ok(luciaGear.readAppearance(store),luciaGear.defaults);

// Real engine KO and resurrection events schedule independent art for Lucia.
const config = makePartyConfig(core,reference,fixture,{seed:1});
const tank = config.actors.find(a=>a.id==='lucia'), wolf = config.actors.find(a=>a.id==='wolf');
tank.hp = 1;tank.stats = {...tank.stats, eva:0};wolf.stats = {...wolf.stats,patk:250,acc:1000};
config.skills.claw.reach = 'ranged';
config.skills.raise = {kind:'revive',ratioBp:5000,target:'ally_dead',mp:0};config.actors[0].skills.push('raise');
const session = new PartySession(battle,config,meta.actors.leon.clips,{lucia:luciaClips});
const revived = new Set();
for (let round = 0; round < 12 && !session.outcome && !revived.size; round++) {
  for (const id of session.active) {
    const legal = session.legal(id);
    const command = (id === 'leon' && legal.find(c=>c.skill==='raise' && c.target?.id==='lucia')) || legal.find(c=>c.skill==='guard') || legal[0];
    session.select(id,command.skill,command.target?.id??null);
  }
  session.submit();
  let ticks = 0;
  while (session.busy) {
    assert.ok(++ticks < 3000,'session settles');
    const view = session.advance(20), pose = luciaPose(view,lucia);
    if (pose.clip === 'revive') revived.add(index(pose.frame));
  }
}
ok([...revived],[poses.down,poses.kneel,poses.rise,poses.idle]);
ok(session.events.some(event=>event.type==='knockout'&&event.target==='lucia'),true);
ok(session.events.some(event=>event.type==='revive'&&event.target==='lucia'),true);
ok(session.seq,session.state.eventSeq);
const real=new PartySession(battle,makePartyConfig(core,reference,fixture),meta.actors.leon.clips,{lucia:luciaClips});
for(const id of real.active){
 const list=real.legal(id);
 const cmd=list.find(c=>c.skill===(id==='lucia'?'spell':'guard'));
 real.select(id,cmd.skill,cmd.target?.id??null);
}
real.submit();
let cast=false,ticks=0;
while(real.busy){
 assert.ok(++ticks<3000,'cast timeline completes');
 const v=real.advance(10),m=v.motion.lucia;
 if(m?.magic&&v.clock>=m.start+m.contact&&v.clock<m.start+m.contact+10){
  ok(index(luciaPose(v,lucia).frame),poses.release,'real spell impact agrees with animation');
  cast=true;
 }
}
ok(cast,true,'real cast observed');
console.log(JSON.stringify({checks, savedConfigurations:all.length, revived:[...revived], failures:0}));
