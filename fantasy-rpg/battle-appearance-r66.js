import * as previous from './battle-appearance-r65.js?v=65';
import * as leonOld from './leon-gear-r65.js?v=65';
import * as fiaOld from './fia-gear-r64.js?v=64';
import {fiaSources} from './battle-appearance-r64.js?v=64';
import {makeFiaAtlas} from './fia-art-r46.js?v=46';
import {victorySource} from './victory-art-r57.js?v=57';
import {victorySource as cheerSource} from './cheer-art-r58.js?v=58';
import {placements} from './leon-equipment-r53.js?v=53';
import {resultSegment} from './leon-sword-layer-r62.js?v=62';
import {anchors as headAnchors} from './fia-appearance-r47.js?v=47';
import {weaponAnchors} from './fia-appearance-r48.js?v=48';
import {applyLayers, readGearTexture, rectanglePlan, weaponPlan} from './gear-layer-r66.js';
import {gearArt, leonGear, fiaGear, leonOptions, fiaOptions} from './gear-options-r66.js';

export const appearanceSources = Object.freeze([...previous.appearanceSources, gearArt]);
export const configureBattleMeta = previous.configureBattleMeta;
export const fieldMotion = leonOld.fieldMotion;

const leonResult = [
  {blade: resultSegment, shield: [150, 132, 36, 49, -10], brooch: [119, 111, 13, 14, 0]},
  {blade: resultSegment, shield: [157, 113, 31, 43, 12], brooch: [119, 111, 13, 14, 0]},
];
const leonSizes = {battle: [240, 216], result: [240, 216], field: [96, 96], run: [96, 96]};
const plansBySource = new WeakMap();
const textures = new WeakMap();

function contextFor(image) {
  const canvas = document.createElement('canvas');
  const width = image.naturalWidth ?? image.width, height = image.naturalHeight ?? image.height;
  canvas.width = width;
  canvas.height = height;
  Object.defineProperties(canvas, {naturalWidth: {value: width}, naturalHeight: {value: height}});
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  return ctx;
}

function textureFor(image) {
  if (!image) throw new Error('Missing R66 gear art');
  if (!textures.has(image)) textures.set(image, readGearTexture(contextFor(image)));
  return textures.get(image);
}

function describeLeon(kind, result) {
  const dimensions = leonSizes[kind];
  const poses = kind === 'result' ? [leonResult[result]] : placements(kind);
  return {dimensions, poses, make(raw, texture, pose, index, width, height) {
    const {blade, shield, brooch} = pose;
    return {
      main: blade ? weaponPlan(raw, texture, blade, {tile: leonOptions.main.tile, kind, pose: index,
        fallen: kind === 'battle' && index >= 15 && index <= 18, result: kind === 'result'}) : null,
      offhand: rectanglePlan(raw, width, height, texture, leonOptions.offhand.tile, shield, 'over'),
      accessory: rectanglePlan(raw, width, height, texture, leonOptions.accessory.tile,
        brooch && [brooch[0], brooch[1], brooch[2] * 1.25, brooch[3] * 1.16, brooch[4]]),
    };
  }};
}

function describeFia(kind) {
  const small = kind === 'field' || kind === 'motion';
  const weapons = weaponAnchors(kind);
  return {dimensions: small ? [96, 96] : [240, 216], poses: headAnchors(kind),
    make(raw, texture, pose, index, width, height) {
      const [x, y, w, angle, , , , view] = pose;
      const [main, offhand] = weapons[index] ?? [];
      const side = small && (view === 1 || view === 2);
      const head = small && view === 3 ? null : [x, y + w * .09, w * (side ? .68 : 1), w * .20, angle];
      const section = !side ? [0, 1] : view === 1 ? [0, .66] : [.34, 1];
      return {
        main: main ? weaponPlan(raw, texture, main, {tile: fiaOptions.main.tile, kind, pose: index, slot: 0}) : null,
        offhand: offhand ? weaponPlan(raw, texture, offhand, {tile: fiaOptions.offhand.tile, kind, pose: index, slot: 1}) : null,
        head: rectanglePlan(raw, width, height, texture, fiaOptions.head.tile, head, 'ink', section),
      };
    }};
}

function preparePlans(source, texture, actor, kind, result = 0) {
  const key = `${actor}:${kind}:${result}`;
  let entries = plansBySource.get(source);
  if (!entries) {entries = new Map(); plansBySource.set(source, entries);}
  const cached = entries.get(key);
  if (cached?.texture === texture) return cached.plans;
  const {dimensions: [w, h], poses, make} = actor === 'leon' ? describeLeon(kind, result) : describeFia(kind);
  const ctx = contextFor(source);
  const columns = ctx.canvas.width / w;
  const plans = poses.map((pose, index) => {
    const x = index % columns * w, y = Math.floor(index / columns) * h;
    const raw = ctx.getImageData(x, y, w, h).data;
    return {raw, x, y, w, h, slots: make(raw, texture, pose, index, w, h)};
  });
  entries.set(key, {texture, plans});
  return plans;
}

function applyPlans(ctx, plans, texture, active, target) {
  for (const plan of plans) {
    const {raw, w, h, slots} = plan;
    const {x, y} = target ?? plan;
    const layers = active.map(slot => slots[slot]).filter(Boolean);
    if (!layers.length) continue;
    const dst = ctx.getImageData(x, y, w, h);
    dst.data.set(applyLayers(raw, dst.data, texture, layers));
    ctx.putImageData(dst, x, y);
  }
}

function newLayers(actor, value, kind) {
  const config = actor === 'leon' ? leonGear : fiaGear;
  const options = actor === 'leon' ? leonOptions : fiaOptions;
  const field = ['field', 'run', 'motion'].includes(kind);
  return Object.keys(options).filter(slot => config.active(value, slot) && (!field ||
    (actor === 'leon' ? slot !== 'main' : slot === 'head')));
}

function equipLeonBattle(base, assets, slots) {
  const texture = textureFor(assets[gearArt]), ctx = contextFor(base);
  applyPlans(ctx, preparePlans(assets['r26/leon-battle'], texture, 'leon', 'battle'), texture, slots);
  for (const [index, key] of [victorySource, cheerSource].entries()) {
    applyPlans(ctx, preparePlans(assets[key], texture, 'leon', 'result', index), texture, slots,
      {x: index === 0 ? 480 : 720, y: 648});
  }
  return ctx.canvas;
}

function equipSource(source, base, art, actor, kind, slots) {
  if (!slots.length) return base;
  const texture = textureFor(art), ctx = contextFor(base);
  applyPlans(ctx, preparePlans(source, texture, actor, kind), texture, slots);
  return ctx.canvas;
}

export function equipLeonField(source, kind, value, assets) {
  const gear = leonGear.appearance(value);
  const base = leonOld.equippedImage(source, kind, leonGear.previousAppearance(gear), assets['r53/leon-equipment'],
    assets[leonOld.outfitSource], assets[leonOld.mantleSource]);
  return equipSource(source, base, assets[gearArt], 'leon', kind, newLayers('leon', gear, kind));
}

export function equipFiaSource(source, kind, value, assets) {
  const gear = fiaGear.appearance(value);
  const base = fiaOld.equippedImage(source, kind, fiaGear.previousAppearance(gear), assets['r47/fia-gear'],
    assets['r48/fia-equipment'], assets[fiaOld.outfitSource], assets[fiaOld.cloakSource]);
  return equipSource(source, base, assets[gearArt], 'fia', kind, newLayers('fia', gear, kind));
}

export function savedBattleAppearance(storage) {
  return {leon: leonGear.readAppearance(storage), fia: fiaGear.readAppearance(storage)};
}

export function buildBattleAppearance(id, assets, value) {
  if (id === 'leon') {
    const gear = leonGear.appearance(value), slots = newLayers(id, gear, 'battle');
    const base = previous.buildBattleAppearance(id, assets, leonGear.previousAppearance(gear));
    return slots.length ? equipLeonBattle(base, assets, slots) : base;
  }
  if (id === 'fia') {
    const gear = fiaGear.appearance(value);
    if (!newLayers(id, gear, 'battle').length) return previous.buildBattleAppearance(id, assets, gear);
    return makeFiaAtlas(...Object.entries(fiaSources).map(([kind, key]) => equipFiaSource(assets[key], kind, gear, assets)));
  }
  return previous.buildBattleAppearance(id, assets, value);
}
