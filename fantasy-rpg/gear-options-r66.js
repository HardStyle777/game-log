import * as leon from './leon-gear-r65.js?v=65';
import * as fia from './fia-gear-r64.js?v=64';

export const gearArt = 'r66/character-gear';
export const artSize = Object.freeze([384, 192]);
export const leonOptions = Object.freeze({
  main: {id: 'sunblade', label: '緋陽の長剣', fallback: 'iron', tile: 0},
  offhand: {id: 'sunshield', label: '緋陽の紋盾', fallback: 'none', tile: 1},
  accessory: {id: 'sunclasp', label: '緋陽の胸留め', fallback: 'none', tile: 2},
});
export const fiaOptions = Object.freeze({
  main: {id: 'ivyfang', label: '蔦牙の短剣', fallback: 'dagger', tile: 3},
  offhand: {id: 'amethystguard', label: '紫晶の受け短剣', fallback: 'dagger', tile: 4},
  head: {id: 'amethystband', label: '紫晶の額飾り', fallback: 'none', tile: 5},
});

function extendAppearance(previous, additions, key) {
  const defaults = previous.defaults;
  const slots = Object.freeze(Object.fromEntries(Object.entries(previous.slots).map(([slot, choices]) => [
    slot, additions[slot] ? Object.freeze([...choices, additions[slot].id]) : choices,
  ])));
  function appearance(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid character appearance');
    for (const [slot, choice] of Object.entries(value)) {
      if (!Object.hasOwn(slots, slot) || !slots[slot].includes(choice)) throw new Error(`Invalid appearance ${slot}`);
    }
    return {...defaults, ...value};
  }
  function active(gear, slot) {return gear[slot] === additions[slot]?.id;}
  function previousAppearance(gear) {
    const value = {...gear};
    for (const [slot, entry] of Object.entries(additions)) if (active(gear, slot)) value[slot] = entry.fallback;
    return value;
  }
  function readAppearance(storage) {
    try {
      const stored = storage.getItem(key);
      if (stored !== null) return appearance(JSON.parse(stored));
    } catch { /* Recover the most recent readable older value. */ }
    return appearance(previous.readAppearance(storage));
  }
  function saveAppearance(storage, value) {
    const gear = appearance(value);
    try {storage.setItem(key, JSON.stringify(gear));} catch { /* Keep the current rendered selection. */ }
    return gear;
  }
  return Object.freeze({key, slots, defaults, appearance, active, previousAppearance, readAppearance, saveAppearance});
}

export const leonGear = extendAppearance(leon, leonOptions, 'fantasy-leon-appearance-r66');
export const fiaGear = extendAppearance(fia, fiaOptions, 'fantasy-fia-appearance-r66');
