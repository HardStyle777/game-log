import * as old from './leon-gear-r62.js?v=62';
import {applyMantle, makeMantlePlan, mantleSource, poseCounts} from './leon-mantle-layer-r65.js?v=65';

export {fieldMotion, outfitSource} from './leon-gear-r62.js?v=62';
export {mantleSource};
export const KEY = 'fantasy-leon-appearance-r65';
export const defaults = old.defaults;
export const slots = Object.freeze({...old.slots, body: Object.freeze([...old.slots.body, 'crimsonmantle'])});

export function appearance(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Leon appearance');
  for (const [slot, option] of Object.entries(value)) {
    if (!Object.hasOwn(slots, slot) || !slots[slot].includes(option)) throw new Error(`Invalid Leon appearance ${slot}`);
  }
  return {...defaults, ...value};
}

export function previousAppearance(value = {}) {
  const gear = appearance(value);
  return gear.body === 'crimsonmantle' ? {...gear, body: 'blue'} : gear;
}

export function readAppearance(storage) {
  try {
    const raw = storage.getItem(KEY);
    if (raw !== null) return appearance(JSON.parse(raw));
  } catch {
    // A damaged current value can still recover the previous settings.
  }
  return appearance(old.readAppearance(storage));
}

export function saveAppearance(storage, value) {
  const gear = appearance(value);
  try { storage.setItem(KEY, JSON.stringify(gear)); } catch {}
  return gear;
}

function raster(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth ?? image.width;
  canvas.height = image.naturalHeight ?? image.height;
  Object.defineProperties(canvas, {naturalWidth: {value: canvas.width}, naturalHeight: {value: canvas.height}});
  const context = canvas.getContext('2d', {willReadFrequently: true});
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0);
  return context;
}

const sourceCache = new WeakMap();
const textureCache = new WeakMap();

function plansFor(source, mantle, kind, resultPose = null) {
  const cached = sourceCache.get(source);
  if (cached?.mantle === mantle && cached.kind === kind && cached.resultPose === resultPose) return cached.plans;
  if (!mantle || (mantle.naturalWidth ?? mantle.width) !== 384 || (mantle.naturalHeight ?? mantle.height) !== 96) {
    throw new Error('Invalid Leon mantle atlas dimensions');
  }
  if (!textureCache.has(mantle)) textureCache.set(mantle, raster(mantle).getImageData(0, 0, 384, 96).data);
  const texture = textureCache.get(mantle);
  const context = raster(source);
  const width = kind === 'battle' || kind === 'result' ? 240 : 96;
  const height = width === 240 ? 216 : 96;
  const columns = context.canvas.width / width;
  const plans = Array.from({length: resultPose === null ? poseCounts[kind] : 1}, (_, index) => {
    const x = index % columns * width;
    const y = Math.floor(index / columns) * height;
    const sourcePixels = context.getImageData(x, y, width, height).data;
    return {x, y, width, height, plan: makeMantlePlan(sourcePixels, texture, kind, resultPose ?? index)};
  });
  sourceCache.set(source, {mantle, kind, resultPose, plans});
  return plans;
}

function renderPlans(context, plans) {
  for (const {x, y, width, height, plan} of plans) {
    const image = context.getImageData(x, y, width, height);
    applyMantle(plan, image.data);
    context.putImageData(image, x, y);
  }
}

export function equippedImage(source, kind, value = {}, equipment, outfit, mantle) {
  const gear = appearance(value);
  const base = old.equippedImage(source, kind, previousAppearance(gear), equipment, outfit);
  if (gear.body !== 'crimsonmantle') return base;
  const context = raster(base);
  renderPlans(context, plansFor(source, mantle, kind));
  return context.canvas;
}

export function equipBattleMantle(base, {battle, victory, cheer, mantle}) {
  const context = raster(base);
  renderPlans(context, plansFor(battle, mantle, 'battle'));
  for (const [source, pose, x] of [[victory, 0, 480], [cheer, 1, 720]]) {
    const [cell] = plansFor(source, mantle, 'result', pose);
    renderPlans(context, [{...cell, x, y: 648}]);
  }
  return context.canvas;
}
