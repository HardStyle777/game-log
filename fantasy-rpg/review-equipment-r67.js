import {appearanceSources, buildBattleAppearance, configureBattleMeta, equipLeonField, equipFiaSource, buildGlenField} from './battle-appearance-r67.js?v=67';
import {leonOptions, fiaOptions} from './gear-options-r66.js?v=66';
import {timedClipFrame} from './appearance-preview-r61.js?v=61';
import {explorationFrame} from './field-actor-r67.js';
import {glenField} from './glen-motion-r67.js';
import {glenOptions} from './glen-options-r67.js';

const presets = {
  glen: {},
  leon: {main: 'royalsword', offhand: 'shield', head: 'circlet', body: 'crimsonmantle', feet: 'sabaton', accessory: 'brooch'},
  fia: {main: 'moonfang', offhand: 'moonfang', head: 'circlet', body: 'royalcloak', feet: 'rangerboots', accessory: 'brooch'},
};
const optionsByActor = {leon: leonOptions, fia: fiaOptions, glen: Object.fromEntries(
  Object.entries(glenOptions).map(([slot, [, [id, label]]]) => [slot, {id, label}]),
)};
const labels = {idle: '通常', attack: '攻撃', guard: '防御', hit: '被弾', down: '戦闘不能', revive: '蘇生', victory: '勝利'};
const $ = id => document.getElementById(id);

function canvasFor(container, label, width, height) {
  const figure = document.createElement('figure'), canvas = document.createElement('canvas');
  const caption = document.createElement('figcaption');
  canvas.width = width;
  canvas.height = height;
  caption.textContent = label;
  canvas.setAttribute('aria-label', label);
  figure.append(canvas, caption);
  container.append(figure);
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  return context;
}

function makeCard(name) {
  const card = document.createElement('article'), heading = document.createElement('h2');
  heading.textContent = name;
  card.append(heading);
  const battle = canvasFor(card, '戦闘', 240, 216), field = document.createElement('div');
  field.className = 'exploration';
  card.append(field);
  const walk = canvasFor(field, '歩行', 96, 96), run = canvasFor(field, '走行', 96, 96);
  $('outfits').append(card);
  return {heading, battle, walk, run};
}

function draw(context, image, x, y) {
  const {width, height} = context.canvas;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, x, y, width, height, 0, 0, width, height);
}

try {
  const [assets, metadata] = await Promise.all([
    Promise.all([...appearanceSources, 'field-atlas', 'r52/leon-run', 'r42/fia-field', 'r43/fia-motion', glenField].map(async key => {
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
  const meta = configureBattleMeta(metadata).actors;
  const actor = $('actor'), selection = $('gear'), pose = $('pose'), direction = $('direction'), playback = $('playback');
  const base = makeCard('従来の装備'), changed = makeCard('新しい装備');
  let wardrobe, elapsed = 0, previousTime = 0, previousKey = '', paused = false;

  function build(id, gear) {
    const atlas = buildBattleAppearance(id, assets, gear);
    if (id === 'glen') {const field = buildGlenField(assets, gear);return {atlas, walk: field, run: field};}
    return id === 'leon' ? {atlas, walk: equipLeonField(assets['field-atlas'], 'field', gear, assets),
      run: equipLeonField(assets['r52/leon-run'], 'run', gear, assets)} : {atlas,
      walk: equipFiaSource(assets['r42/fia-field'], 'field', gear, assets),
      run: equipFiaSource(assets['r43/fia-motion'], 'motion', gear, assets)};
  }

  function reset() {elapsed = 0; previousKey = '';}
  function selectGear() {
    const id = actor.value, options = optionsByActor[id];
    const slots = selection.value === 'all' ? Object.values(options) : [options[selection.value]];
    const equipped = {...presets[id]};
    for (const [slot, option] of Object.entries(options)) if (slots.includes(option)) equipped[slot] = option.id;
    changed.heading.textContent = selection.value === 'all' ? `装備${slots.length}点` : slots[0].label;
    wardrobe = [build(id, presets[id]), build(id, equipped)];
    reset();
  }

  function selectActor() {
    const model = meta[actor.value];
    const options = optionsByActor[actor.value];
    base.heading.textContent = actor.value === 'glen' ? '初期装備' : '従来の装備';
    selection.replaceChildren(new Option(`装備${Object.keys(options).length}点`, 'all'), ...Object.entries(options).map(([id, option]) => new Option(option.label, id)));
    pose.replaceChildren(...Object.entries(labels).filter(([id]) => model.clips[id]?.length).map(([id, label]) => new Option(label, id)));
    selectGear();
  }

  actor.onchange = selectActor;
  selection.onchange = selectGear;
  pose.onchange = direction.onchange = reset;
  playback.onclick = () => {
    paused = !paused;
    playback.setAttribute('aria-pressed', String(paused));
    playback.textContent = paused ? '再生' : '一時停止';
  };
  selectActor();

  function frame(now) {
    if (!paused && previousTime) elapsed += Math.min(100, now - previousTime);
    previousTime = now;
    const id = actor.value, dir = Number(direction.value);
    const {frame: battleFrame} = timedClipFrame(meta[id].clips[pose.value], elapsed);
    const walk = explorationFrame(id, 'walk', dir, elapsed), run = explorationFrame(id, 'run', dir, elapsed);
    const key = `${battleFrame.x}:${battleFrame.y}:${walk.x}:${walk.y}:${run.x}:${run.y}`;
    if (key !== previousKey) {
      previousKey = key;
      for (const [index, view] of [base, changed].entries()) {
        const art = wardrobe[index];
        draw(view.battle, art.atlas, battleFrame.x, battleFrame.y);
        draw(view.walk, art.walk, walk.x, walk.y);
        draw(view.run, art.run, run.x, run.y);
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
