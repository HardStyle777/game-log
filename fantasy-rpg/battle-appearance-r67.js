import * as old from './battle-appearance-r66.js?v=66';
import {glenBattle, glenField, glenEquipment, configureGlen} from './glen-motion-r67.js';
import {glenGear} from './glen-options-r67.js';
import {equipGlen} from './glen-equipment-r67.js';

export const appearanceSources = Object.freeze([...old.appearanceSources, glenBattle, glenEquipment]);
export {equipLeonField, equipFiaSource, fieldMotion} from './battle-appearance-r66.js?v=66';
export function configureBattleMeta(meta) {
  const base = old.configureBattleMeta(meta);
  return {...base, actors: {...base.actors, glen: configureGlen(base.actors.glen)}};
}
export function savedBattleAppearance(storage) {
  return {...old.savedBattleAppearance(storage), glen: glenGear.readAppearance(storage)};
}
export function buildBattleAppearance(id, assets, value) {
  if (id !== 'glen') return old.buildBattleAppearance(id, assets, value);
  return equipGlen(assets[glenBattle], assets[glenEquipment], 'battle', value);
}
export function buildGlenField(assets, value) {
  return equipGlen(assets[glenField], assets[glenEquipment], 'field', value);
}
