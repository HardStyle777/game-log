export const luciaOptions = Object.freeze({
  main: [['codex','基礎魔導書'], ['proof','紫晶の論証書']],
  offhand: [['none','なし'], ['astrolabe','真鍮の星盤']],
  head: [['none','なし'], ['fillet','菫晶の髪飾り']],
  body: [['academic','紫紺の研究外套'], ['midnight','黄銅縁の長外套']],
  feet: [['leather','短革靴'], ['plum','紫鉄の短靴']],
  accessory: [['none','なし'], ['prism','観測のプリズム']],
});
const slots = Object.freeze(Object.fromEntries(Object.entries(luciaOptions).map(([slot, choices]) => [slot, choices.map(([id]) => id)])));
const defaults = Object.freeze(Object.fromEntries(Object.entries(slots).map(([slot, values]) => [slot, values[0]])));
const key = 'fantasy-lucia-appearance-r68';
function appearance(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Lucia appearance');
  for (const [slot, choice] of Object.entries(value)) {
    if (!Object.hasOwn(slots, slot) || !slots[slot].includes(choice)) throw new Error(`Invalid Lucia appearance ${slot}`);
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
export const luciaGear = Object.freeze({key, slots, defaults, appearance, readAppearance, saveAppearance});
