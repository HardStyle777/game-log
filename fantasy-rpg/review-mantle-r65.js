import {appearanceSources, buildBattleAppearance, configureBattleMeta} from './battle-appearance-r65.js?v=65';
import {equippedImage, mantleSource, outfitSource} from './leon-gear-r65.js?v=65';
import {timedClipFrame} from './appearance-preview-r61.js?v=61';

const samples = [
  ['青の鎧', {}],
  ['緋陽騎士のマント', {body: 'crimsonmantle'}],
  ['王騎士の重装鎧', {body: 'royalplate', feet: 'sabaton'}],
  ['マント＋蒼王剣と盾', {body: 'crimsonmantle', main: 'royalsword', offhand: 'shield',
    head: 'circlet', feet: 'sabaton', accessory: 'brooch'}],
];
const labels = {idle: '通常', attack: '攻撃', guard: '防御', hit: '被弾', down: '戦闘不能', revive: '蘇生', victory: '勝利'};
const $ = id => document.getElementById(id);

function canvasFor(container, label, width, height) {
  const figure = document.createElement('figure');
  const canvas = document.createElement('canvas');
  const caption = document.createElement('figcaption');
  canvas.width = width;
  canvas.height = height;
  caption.textContent = label;
  figure.append(canvas, caption);
  container.append(figure);
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  return context;
}

function draw(context, image, x, y) {
  const {width, height} = context.canvas;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, x, y, width, height, 0, 0, width, height);
}

try {
  const [assets, metadata] = await Promise.all([
    Promise.all([...appearanceSources, 'field-atlas', 'r52/leon-run'].map(async key => {
      const image = new Image();
      image.src = `assets/${key}.png`;
      await image.decode();
      return [key, image];
    })).then(Object.fromEntries),
    fetch('assets/r26/motion.json').then(response => {
      if (!response.ok) throw new Error('戦闘モーション');
      return response.json();
    }),
  ]);
  const {clips} = configureBattleMeta(metadata).actors.leon;
  const pose = $('pose');
  const direction = $('direction');
  for (const [id, label] of Object.entries(labels)) {
    if (clips[id]?.length) pose.add(new Option(label, id));
  }

  const wardrobe = samples.map(([name, gear]) => {
    const card = document.createElement('article');
    const title = document.createElement('h2');
    title.textContent = name;
    card.append(title);
    const battle = canvasFor(card, '戦闘', 240, 216);
    const locomotion = document.createElement('div');
    locomotion.className = 'exploration';
    card.append(locomotion);
    const walk = canvasFor(locomotion, '歩行', 96, 96);
    const run = canvasFor(locomotion, '走行', 96, 96);
    $('outfits').append(card);
    const args = [gear, assets['r53/leon-equipment'], assets[outfitSource], assets[mantleSource]];
    return {battle, walk, run, atlas: buildBattleAppearance('leon', assets, gear),
      walkAtlas: equippedImage(assets['field-atlas'], 'field', ...args),
      runAtlas: equippedImage(assets['r52/leon-run'], 'run', ...args)};
  });
  let start = performance.now();
  let previous = '';
  for (const select of [pose, direction]) select.onchange = () => { start = performance.now(); previous = ''; };

  function frame(now) {
    const elapsed = Math.max(0, now - start);
    const {frame: battleFrame} = timedClipFrame(clips[pose.value], elapsed);
    const row = Number(direction.value) * 96;
    const walkX = Math.floor(elapsed / 120) % 4 * 96;
    const runX = Math.floor(elapsed / 100) % 4 * 96;
    const key = `${battleFrame.x}:${battleFrame.y}:${row}:${walkX}:${runX}`;
    if (key !== previous) {
      previous = key;
      for (const entry of wardrobe) {
        draw(entry.battle, entry.atlas, battleFrame.x, battleFrame.y);
        draw(entry.walk, entry.walkAtlas, walkX, row);
        draw(entry.run, entry.runAtlas, runX, row);
      }
    }
    requestAnimationFrame(frame);
  }
  $('status').hidden = true;
  requestAnimationFrame(frame);
} catch (error) {
  $('status').textContent = `読み込みエラー：${error.message}`;
  throw error;
}
