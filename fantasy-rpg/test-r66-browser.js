import * as current from './battle-appearance-r66.js';
import * as prior from './battle-appearance-r65.js?v=65';
import * as priorLeon from './leon-gear-r65.js?v=65';
import * as priorFia from './fia-gear-r64.js?v=64';
import {leonGear, fiaGear, leonOptions, fiaOptions} from './gear-options-r66.js';

function allValues(slots) {
  return Object.entries(slots).reduce((rows, [slot, choices]) =>
    rows.flatMap(row => choices.map(choice => ({...row, [slot]: choice}))), [{}]);
}
function pairKeys(gear) {
  const values = Object.entries(gear), keys = [];
  for (let a = 0; a < values.length; a++) for (let b = a + 1; b < values.length; b++) {
    keys.push(`${values[a].join('=')}/${values[b].join('=')}`);
  }
  return keys;
}
function verificationCases(api, options) {
  const full = Object.fromEntries(Object.entries(api.slots).map(([slot, choices]) => [slot, choices.at(-1)]));
  const newSlots = Object.keys(options);
  const selected = Array.from({length: 1 << newSlots.length}, (_, mask) => ({...full,
    ...Object.fromEntries(newSlots.map((slot, i) => [slot, mask & (1 << i) ? full[slot] : api.slots[slot].at(-2)])),
  }));
  // Include the original look and every pair of choices among the six slots.
  selected.push(api.defaults);
  const candidates = allValues(api.slots).map(gear => ({gear, pairs: pairKeys(gear)}));
  const uncovered = new Set(candidates.flatMap(item => item.pairs));
  for (const gear of selected) for (const pair of pairKeys(gear)) uncovered.delete(pair);
  const pairCount = new Set(candidates.flatMap(item => item.pairs)).size;
  while (uncovered.size) {
    let best, score = 0;
    for (const candidate of candidates) {
      const coverage = candidate.pairs.reduce((n, pair) => n + Number(uncovered.has(pair)), 0);
      if (coverage > score) {best = candidate; score = coverage;}
    }
    if (!best) throw Error('Missing coverage candidate');
    selected.push(best.gear);
    for (const pair of best.pairs) uncovered.delete(pair);
  }
  return {selected, pairCount};
}

function canvasPixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth ?? image.width; canvas.height = image.naturalHeight ?? image.height;
  const g = canvas.getContext('2d', {willReadFrequently: true});
  g.drawImage(image, 0, 0);
  return {width: canvas.width, height: canvas.height, data: g.getImageData(0, 0, canvas.width, canvas.height).data};
}
const leonCells = [...Array.from({length:20}, (_, i) => i), 20, 21];
// Leon's appended victory art occupies two otherwise empty atlas cells.
const battleXY = (id, i) => id === 'leon' && i >= 20 ? [480 + (i - 20) * 240, 648] : [i % 6 * 240, Math.floor(i / 6) * 216];
const fieldCells = Array.from({length:16}, (_, i) => [i % 4 * 96, Math.floor(i / 4) * 96]);

export async function verifyEquipment() {
  const keys = [...current.appearanceSources, 'field-atlas', 'r52/leon-run', 'r42/fia-field', 'r43/fia-motion', 'r26/glen-battle', 'r26/eris-battle'];
  const art = Object.fromEntries(await Promise.all(keys.map(async key => {
    const image = new Image(); image.src = `assets/${key}.png`; await image.decode(); return [key, image];
  })));
  let frames = 0, checks = 0;
  function ok(condition, label) {checks++; if (!condition) throw Error(label);}
  function scan(image, reference, coordinates, w, h, shouldChange, label) {
    const {width, height, data} = canvasPixels(image), old = canvasPixels(reference);
    ok(width === old.width && height === old.height, `${label}: canvas size`);
    const delta = [];
    for (const [x, y] of coordinates) {
      let count = 0, changed = 0, edge = 0;
      for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) {
        const i = ((y + row) * width + x + col) * 4;
        if (data[i + 3]) {
          count++;
          if (!row || !col || row === h - 1 || col === w - 1) edge++;
        }
        if (data[i] !== old.data[i] || data[i + 1] !== old.data[i + 1] || data[i + 2] !== old.data[i + 2] || data[i + 3] !== old.data[i + 3]) changed++;
      }
      ok(count > 0 && !edge, `${label}: nonempty, unclipped ${x},${y}`);
      if (!shouldChange) ok(changed === 0, `${label}: legacy pixels ${x},${y}`);
      delta.push(changed); frames++;
    }
    if (shouldChange) ok(delta.some(n => n > 0), `${label}: new art visible`);
    return delta;
  }

  const records = {};
  for (const [id, api, additions] of [['leon', leonGear, leonOptions], ['fia', fiaGear, fiaOptions]]) {
    const {selected, pairCount} = verificationCases(api, additions);
    const coords = (id === 'leon' ? leonCells : Array.from({length:38}, (_, i) => i)).map(i => battleXY(id, i));
    const battleDelta = {};
    function compare(gear, reference, active, name) {
      const label = `${id} ${name} ${JSON.stringify(gear)}`;
      return scan(current.buildBattleAppearance(id, art, gear), prior.buildBattleAppearance(id, art, reference),
        coords, 240, 216, active, label);
    }
    for (const [slot, option] of Object.entries(additions)) {
      const delta = compare(api.appearance({[slot]:option.id}), api.defaults, true, slot);
      battleDelta[slot] = delta.filter(x => x > 0).length;
      ok(battleDelta[slot] >= (id === 'leon' ? 22 : 36), `${id} ${slot} coverage ${battleDelta[slot]}`);
    }
    for (const gear of selected) {
      const reference = api.previousAppearance(gear), active = Object.keys(additions).some(slot => api.active(gear, slot));
      compare(gear, reference, active, 'battle');
      if (id === 'leon') {
        const fieldActive = api.active(gear, 'offhand') || api.active(gear, 'accessory');
        for (const [kind, name] of [['field','field-atlas'],['run','r52/leon-run']]) {
          const before = priorLeon.equippedImage(art[name], kind, reference, art['r53/leon-equipment'], art[priorLeon.outfitSource], art[priorLeon.mantleSource]);
          const after = current.equipLeonField(art[name], kind, gear, art);
          scan(after, before, fieldCells, 96, 96, fieldActive, `${id} ${kind}`);
          if (kind === 'field') scan(current.fieldMotion(after, 'idle'), priorLeon.fieldMotion(before, 'idle'), fieldCells, 96, 96, fieldActive, `${id} idle`);
        }
      } else for (const [kind, name] of [['field','r42/fia-field'],['motion','r43/fia-motion']]) {
        const before = priorFia.equippedImage(art[name], kind, reference, art['r47/fia-gear'], art['r48/fia-equipment'], art[priorFia.outfitSource], art[priorFia.cloakSource]);
        const delta = scan(current.equipFiaSource(art[name], kind, gear, art), before, fieldCells, 96, 96, api.active(gear, 'head'), `${id} ${kind}`);
        if (api.active(gear, 'head')) ok(delta.slice(8, 12).every(n => n === 0), 'Fia hair from behind');
      }
    }
    records[id] = {configurations: selected.length, pairCount, changedBattleCellsByNewSlot: battleDelta};
  }
  return {frames, checks, actors: records, failures: 0};
}
