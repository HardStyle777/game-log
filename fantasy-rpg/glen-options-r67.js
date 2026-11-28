export const glenOptions = Object.freeze({
  main: [['iron','灰鉄剣'], ['fortressblade','城塞の長剣']],
  offhand: [['chipped','欠けた盾'], ['fortressshield','城塞の紋盾']],
  head: [['none','なし'], ['helm','開面兜']],
  body: [['iron','鉄肩鎧'], ['gunmetal','鋼の胸甲']],
  feet: [['leather','濃紺の編み上げ靴'], ['sabaton','城塞の鋼靴']],
  accessory: [['none','なし'], ['oath','防衛騎士の勲章']],
});
const slots = Object.freeze(Object.fromEntries(Object.entries(glenOptions).map(([slot, choices]) => [slot, choices.map(([id]) => id)])));
const defaults = Object.freeze(Object.fromEntries(Object.entries(slots).map(([slot, values]) => [slot, values[0]])));
const key = 'fantasy-glen-appearance-r67';
function appearance(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Glen appearance');
  for (const [slot, choice] of Object.entries(value)) {
    if (!Object.hasOwn(slots, slot) || !slots[slot].includes(choice)) throw new Error(`Invalid Glen appearance ${slot}`);
  }
  return {...defaults, ...value};
}
function readAppearance(storage) {
  try {return appearance(JSON.parse(storage.getItem(key) ?? '{}'));} catch {return appearance();}
}
function saveAppearance(storage, value) {
  const gear = appearance(value);
  try {storage.setItem(key, JSON.stringify(gear));} catch { /* The current rendered selection still applies. */ }
  return gear;
}
export const glenGear = Object.freeze({key, slots, defaults, appearance, readAppearance, saveAppearance});
