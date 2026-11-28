import {applyLayers, readGearTexture, rectanglePlan, weaponPlan} from './gear-layer-r66.js';
import {glenGear} from './glen-options-r67.js';
import {battlePlacements, fieldPlacements} from './glen-anchors-r67.js';
import {battleCell, fieldCell} from './glen-motion-r67.js';

const configurations = {
  battle: {size: [960, 648], cell: battleCell, placements: battlePlacements},
  field: {size: [384, 384], cell: fieldCell, placements: fieldPlacements},
};
const order = ['main', 'body', 'feet', 'head', 'accessory', 'offhand'];
const allPlans = new WeakMap();
const textures = new WeakMap();

function raster(image) {
  const c = document.createElement('canvas');
  c.width = image.naturalWidth ?? image.width;
  c.height = image.naturalHeight ?? image.height;
  const ctx = c.getContext('2d', {willReadFrequently: true});
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  return ctx;
}

function planSlots(raw, w, h, texture, p, index, kind) {
  const field = kind === 'field', direction = Math.floor(index / 4);
  const helmetView = !field || direction === 0 || direction === 2 ? [0, 1] : direction === 1 ? [.21, 1] : [0, .79];
  const bootLayers = p.boots.map((boot, side) => rectanglePlan(raw, w, h, texture, 4, boot, 'ink',
    side || (field && direction === 1) ? [1, 0] : [0, 1]));
  return {
    main: [p.blade ? weaponPlan(raw, texture, p.blade, {tile: 0, kind, pose: index, fit: {root: .72, length: .70, width: 17, start: index === 7 ? .09 : .035}}) : null],
    body: [rectanglePlan(raw, w, h, texture, 3, p.torso)],
    feet: bootLayers,
    head: [rectanglePlan(raw, w, h, texture, 2, p.helmet, 'over', helmetView)],
    accessory: [rectanglePlan(raw, w, h, texture, 5, p.badge)],
    offhand: [rectanglePlan(raw, w, h, texture, 1, p.shield, 'over')],
  };
}

function prepare(source, atlas, kind, config) {
  const cached = allPlans.get(source);
  if (cached?.atlas === atlas && cached.kind === kind) return cached;
  if (!textures.has(atlas)) textures.set(atlas, readGearTexture(raster(atlas)));
  const texture = textures.get(atlas), ctx = raster(source), [w, h] = config.cell;
  const columns = ctx.canvas.width / w;
  const rows = config.placements.map((p, index) => {
    const x = index % columns * w, y = Math.floor(index / columns) * h;
    const raw = ctx.getImageData(x, y, w, h).data;
    return {x, y, raw, slots: planSlots(raw, w, h, texture, p, index, kind)};
  });
  const entry = {atlas, kind, texture, rows};
  allPlans.set(source, entry);
  return entry;
}

export function equipGlen(source, atlas, kind, value = {}) {
  const config = configurations[kind];
  if (!config || !source || (source.naturalWidth ?? source.width) !== config.size[0] ||
      (source.naturalHeight ?? source.height) !== config.size[1]) throw Error('Invalid Glen sprite sheet');
  const gear = glenGear.appearance(value);
  const selected = order.filter(slot => gear[slot] !== glenGear.defaults[slot] && (kind !== 'field' || slot !== 'main'));
  if (!selected.length) return source;
  const {texture, rows} = prepare(source, atlas, kind, config), [w, h] = config.cell;
  const ctx = raster(source);
  for (const {x, y, raw, slots} of rows) {
    const target = ctx.getImageData(x, y, w, h);
    target.data.set(applyLayers(raw, target.data, texture, selected.flatMap(slot => slots[slot])));
    ctx.putImageData(target, x, y);
  }
  return ctx.canvas;
}
