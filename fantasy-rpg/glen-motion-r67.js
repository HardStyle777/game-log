import {heldResultPose} from './victory-loop-r58.js?v=58';

export const glenBattle = 'r67/glen-battle';
export const glenField = 'r67/glen-field';
export const glenEquipment = 'r67/glen-equipment';
export const glenPortrait = 'assets/r67/glen-portrait.png';
export const battleCell = Object.freeze([240, 216]);
export const fieldCell = Object.freeze([96, 96]);
export const poses = Object.freeze({idle:0, windup:1, swing:2, recovery:3, brace:4, block:5,
  hit:6, down:7, kneel:8, rise:9, victory:10, salute:11});

function frame(index, ms) {
  const [w, h] = battleCell;
  return {x: index % 4 * w, y: Math.floor(index / 4) * h, w, h, ms};
}
const P = poses;
const clip = (...frames) => frames.map(([index, ms]) => frame(index, ms));
export const glenClips = Object.freeze({
  idle: clip([P.idle, 540]), windup: clip([P.idle, 100], [P.windup, 190]),
  attack: clip([P.windup, 115], [P.swing, 125], [P.recovery, 165]),
  cast: clip([P.idle, 100], [P.brace, 160], [P.idle, 100]),
  guard: clip([P.brace, 100], [P.block, 320], [P.brace, 100]),
  hit: clip([P.hit, 160], [P.brace, 140]), down: clip([P.down, 300]),
  knockout: clip([P.hit, 110], [P.kneel, 125], [P.down, 180]),
  revive: clip([P.down, 100], [P.kneel, 170], [P.rise, 190], [P.idle, 120]),
  victory: clip([P.victory, 840], [P.salute, 600], [P.victory, 310]),
});

export function configureGlen(actor) {
  return {...actor, clips: glenClips, resultFrame: glenClips.victory[0]};
}

export function glenPose(view, actor) {
  const result = heldResultPose(view, 'glen', actor);
  if (result) return result;
  const motion = view.motion.glen;
  const elapsed = motion ? view.clock - motion.start : -1;
  const active = motion && elapsed >= 0 && elapsed < motion.duration;
  if (!active || !actor.clips[motion.clip]) {
    const clip = view.vitals.glen.hp <= 0 ? 'down' : 'idle';
    return {clip, file: actor.file, frame: actor.clips[clip][0]};
  }
  const clip = motion.clip, frames = actor.clips[clip];
  if (clip === 'attack') {
    const contact = Math.max(1, Math.min(motion.duration - 1, motion.contact ?? motion.duration / 2));
    const release = contact + Math.min(130, (motion.duration - contact) * 0.58);
    const frame = elapsed < contact ? frames[0] : elapsed < release ? frames[1] : frames[2];
    return {clip, file: actor.file, frame};
  }
  const total = frames.reduce((sum, frame) => sum + frame.ms, 0);
  let time = elapsed / motion.duration * total;
  const frame = frames.find(item => {
    if (time < item.ms) return true;
    time -= item.ms;
    return false;
  }) ?? frames.at(-1);
  return {clip, file: actor.file, frame};
}
