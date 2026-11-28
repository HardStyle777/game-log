import * as gear from './leon-gear-r65.js';
import * as legacyGear from './leon-gear-r62.js?v=62';
import * as current from './battle-appearance-r65.js';
import * as legacy from './battle-appearance-r64.js?v=64';

function pixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth ?? image.width;
  canvas.height = image.naturalHeight ?? image.height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height).data;
}

const battleCells = Array.from({length: 20}, (_, i) => [i % 6 * 240, Math.floor(i / 6) * 216]);
battleCells.push([480, 648], [720, 648]);
const fieldCells = Array.from({length: 16}, (_, i) => [i % 4 * 96, Math.floor(i / 4) * 96]);

export async function createVerifier() {
  const names = [...current.appearanceSources, 'r26/glen-battle', 'r26/eris-battle', 'field-atlas', 'r52/leon-run'];
  const assets = Object.fromEntries(await Promise.all(names.map(async name => {
    const image = new Image();
    image.src = `assets/${name}.png`;
    await image.decode();
    return [name, image];
  })));
  let configurations = [{}];
  for (const [slot, options] of Object.entries(gear.slots)) {
    configurations = configurations.flatMap(value => options.map(option => ({...value, [slot]: option})));
  }
  let checks = 0, frames = 0, oldCount = 0, newCount = 0;
  function ok(value, label, gear) {
    checks++;
    if (!value) throw new Error(`${label}: ${JSON.stringify(gear)}`);
  }

  function checkAtlas(before, after, cells, width, height, columns, changed, label, value) {
    const a = pixels(before), b = pixels(after);
    ok(a.length === b.length, `${label} dimensions`, value);
    if (!changed) ok(a.every((value, offset) => value === b[offset]), `${label} legacy pixel equality`, value);
    for (const [x, y] of cells) {
      let opaque = 0, added = 0, alphaLoss = 0, edge = 0;
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const offset = ((y + row) * columns + x + col) * 4 + 3;
          if (b[offset]) {
            opaque++;
            if (!a[offset]) added++;
            if (row === 0 || col === 0 || row === height - 1 || col === width - 1) edge++;
          } else if (a[offset]) alphaLoss++;
        }
      }
      ok(opaque > 0 && edge === 0 && alphaLoss === 0 && (!changed || added > 0), `${label} cell ${x},${y}`, value);
      frames++;
    }
  }

  function verifyOne(value) {
    const prior = gear.previousAppearance(value);
    const changed = value.body === 'crimsonmantle';
    const oldBattle = legacy.buildBattleAppearance('leon', assets, prior);
    const battle = current.buildBattleAppearance('leon', assets, value);
    checkAtlas(oldBattle, battle, battleCells, 240, 216, 1440, changed, 'battle', value);
    const oldArgs = [prior, assets['r53/leon-equipment'], assets[gear.outfitSource]];
    const newArgs = [value, assets['r53/leon-equipment'], assets[gear.outfitSource], assets[gear.mantleSource]];
    for (const [kind, asset] of [['field', 'field-atlas'], ['run', 'r52/leon-run']]) {
      const old = legacyGear.equippedImage(assets[asset], kind, ...oldArgs);
      const next = gear.equippedImage(assets[asset], kind, ...newArgs);
      checkAtlas(old, next, fieldCells, 96, 96, 384, changed, kind, value);
      if (kind === 'field') checkAtlas(legacyGear.fieldMotion(old, 'idle'), gear.fieldMotion(next, 'idle'),
        fieldCells, 96, 96, 384, changed, 'idle', value);
    }
    if (changed) newCount++;
    else oldCount++;
  }

  for (const [id, outfit] of [
    ['fia', {main:'moonfang', offhand:'moonfang', body:'royalcloak', feet:'rangerboots', head:'circlet', accessory:'brooch'}],
    ['glen', undefined], ['lucia', undefined],
  ]) {
    const a = pixels(legacy.buildBattleAppearance(id, assets, outfit));
    const b = pixels(current.buildBattleAppearance(id, assets, outfit));
    ok(a.length === b.length && a.every((value, offset) => value === b[offset]), `${id} atlas unchanged`, outfit);
  }
  return {configurations, verifyOne, summary: () => ({checks, frames, oldCount, newCount, failures: 0})};
}
