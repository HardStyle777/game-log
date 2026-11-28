import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {core} from './engine/src/core/combat-math.js';
import {battle} from './engine/src/core/battle-engine.js';
import {PartySession, makePartyConfig} from './party-session-r57.js';
import {configureBattleMeta} from './battle-appearance-r67.js';
import {glenPose, glenClips, poses} from './glen-motion-r67.js';
import {glenGear} from './glen-options-r67.js';
import {fieldActor, nextFieldActor, fieldFrame, explorationFrame, motionClock} from './field-actor-r67.js';
import {fieldFrame as oldField} from './field-actor-r52.js';
const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const meta = configureBattleMeta(load('./assets/r26/motion.json'));
const glen = meta.actors.glen;
const index = frame => frame.y / 216 * 4 + frame.x / 240;
const reference = load('./engine/data/core/reference-input-v0.4.json'), fixture = load('./engine/tests/fixtures/personal-contracts-v0.5.json');
let checks = 0;
function ok(actual, expected, label) {checks++; assert.deepEqual(actual, expected, label);}
const poseAt = (time, clip, expected, hp = 100) => ok(index(glenPose({clock: time, motion: {glen: {
  clip, start: 0, duration: 760, contact: 360,
}}, vitals: {glen: {hp}}}, glen).frame), expected, `${clip} ${time}`);
poseAt(359, 'attack', poses.windup);poseAt(360,'attack',poses.swing);poseAt(489,'attack',poses.swing);poseAt(490,'attack',poses.recovery);
poseAt(400,'guard',poses.block);poseAt(500,'knockout',poses.down,0);poseAt(180,'revive',poses.kneel);poseAt(460,'revive',poses.rise);
const allFrames = new Set(Object.values(glenClips).flat().map(index));
ok(allFrames.size, 12, 'Every newly authored battle pose has a clip');
ok(nextFieldActor('fia'), 'leon');ok(nextFieldActor('leon'), 'glen');ok(nextFieldActor('glen'), 'fia');ok(fieldActor('unknown'), 'fia');
for (const [direction, facing] of ['south','east','north','west'].entries()) {
  for (const actor of ['leon', 'fia', 'glen']) for (let t = 0; t < 640; t += 20) {
    const state = {x:152,y:208,spriteFacing:facing,moving:true,map:'town'};
    const drawn = fieldFrame(state,t,true,actor), base = oldField(state,t,true,actor);
    if (actor !== 'glen') ok(drawn, base, actor);
    else {
      ok([drawn.dx,drawn.dy,drawn.dw,drawn.dh], [base.dx,base.dy,base.dw,base.dh]);
      ok(explorationFrame(actor,'run',direction,t), {asset:'walk',x:drawn.sx,y:drawn.sy,w:96,h:96});
      ok(drawn.row, direction);
    }
  }
}
const state = {map:'town',spriteFacing:'south',moving:true};
const step = motionClock(null,state,'glen',false,10);
ok(motionClock(step,state,'glen',false,10).elapsed,10);
ok(motionClock(step,{...state,spriteFacing:'east'},'glen',false,10).elapsed,0);

const storage = new Map(), store = {getItem: key => storage.get(key),setItem: (key,value) => storage.set(key,value)};
const all = Object.entries(glenGear.slots).reduce((rows,[slot,values]) =>
  rows.flatMap(row => values.map(value => ({...row,[slot]:value}))), [{}]);
ok(all.length, 64);
for (const gear of all) {glenGear.saveAppearance(store,gear);ok(glenGear.readAppearance(store),gear);}
storage.set(glenGear.key,'{');ok(glenGear.readAppearance(store),glenGear.defaults);

// Real engine KO and resurrection events schedule independent art for Glen.
const config = makePartyConfig(core,reference,fixture,{seed:1});
const tank = config.actors.find(a=>a.id==='glen'), wolf = config.actors.find(a=>a.id==='wolf');
tank.hp = 1;tank.stats = {...tank.stats, eva:0};wolf.stats = {...wolf.stats,patk:250,acc:1000};
config.skills.claw.reach = 'ranged';
config.skills.raise = {kind:'revive',ratioBp:5000,target:'ally_dead',mp:0};config.actors[0].skills.push('raise');
const session = new PartySession(battle,config,meta.actors.leon.clips,{glen:glenClips});
const revived = new Set();
for (let round = 0; round < 12 && !session.outcome && !revived.size; round++) {
  for (const id of session.active) {
    const legal = session.legal(id);
    const command = (id === 'leon' && legal.find(c=>c.skill==='raise' && c.target?.id==='glen')) || legal.find(c=>c.skill==='guard') || legal[0];
    session.select(id,command.skill,command.target?.id??null);
  }
  session.submit();
  let ticks = 0;
  while (session.busy) {
    assert.ok(++ticks < 3000,'session settles');
    const view = session.advance(20), pose = glenPose(view,glen);
    if (pose.clip === 'revive') revived.add(index(pose.frame));
  }
}
ok([...revived],[poses.down,poses.kneel,poses.rise,poses.idle]);
ok(session.events.some(event=>event.type==='knockout'&&event.target==='glen'),true);
ok(session.events.some(event=>event.type==='revive'&&event.target==='glen'),true);
ok(session.seq,session.state.eventSeq);
console.log(JSON.stringify({checks, savedConfigurations:all.length, revived:[...revived], failures:0}));
