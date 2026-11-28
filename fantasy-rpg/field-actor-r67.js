import * as old from './field-actor-r52.js?v=52';
import {explorationFrame as previousPreview} from './appearance-preview-r61.js?v=61';

export const FIELD_ACTORS = Object.freeze(['fia', 'leon', 'glen']);
export function fieldActor(id) {return id === 'glen' ? id : old.fieldActor(id);}
export function nextFieldActor(id) {return FIELD_ACTORS[(FIELD_ACTORS.indexOf(fieldActor(id)) + 1) % FIELD_ACTORS.length];}
export function motionClock(previous, state, actor, running, dt) {
  if (actor !== 'glen') return old.motionClock(previous, state, actor, running, dt);
  const key = [state.map, actor, state.spriteFacing, state.moving ? running ? 'run' : 'walk' : 'idle'].join(':');
  return {key, elapsed: previous?.key === key ? clock(previous.elapsed) + clock(dt) : 0};
}
const clock = value => Number.isFinite(value) ? Math.max(0, value) : 0;
const directions = ['south', 'east', 'north', 'west'];
const walk = [0, 1, 0, 2];
const runCycle = [3, 1, 3, 2];

export function fieldFrame(state, elapsed = 0, running = false, actor = 'fia', idle = 0) {
  if (actor !== 'glen') return old.fieldFrame(state, elapsed, running, actor, idle);
  const base = old.fieldFrame(state, 0, false, 'leon');
  const mode = state.moving ? running ? 'run' : 'walk' : 'idle';
  const frames = running ? runCycle : walk;
  const col = state.moving ? frames[Math.floor(clock(elapsed) / (running ? 105 : 145)) % frames.length] : 0;
  return {...base, col, sx: col * 96, asset: 'glen', mode};
}

export function drawFieldActor(ctx, state, images, elapsed, run, actor, idle) {
  if (actor !== 'glen') return old.drawFieldActor(ctx, state, images, elapsed, run, actor, idle);
  const f = fieldFrame(state, elapsed, run, actor, idle);
  ctx.drawImage(images.glen, f.sx, f.sy, f.sw, f.sh, f.dx, f.dy, f.dw, f.dh);
  return f;
}

export function explorationFrame(id, mode, direction, time = 0) {
  if (id !== 'glen') return previousPreview(id, mode, direction, time);
  if (!['walk', 'run', 'idle'].includes(mode) || (!Number.isInteger(direction) || !directions[direction])) throw new Error('Invalid Glen field pose');
  const f = fieldFrame({x: 0, y: 0, spriteFacing: directions[direction], moving: mode !== 'idle'}, time, mode === 'run', id);
  return {asset: 'walk', x: f.sx, y: f.sy, w: f.sw, h: f.sh};
}
