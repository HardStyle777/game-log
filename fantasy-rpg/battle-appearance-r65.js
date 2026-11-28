import * as old from './battle-appearance-r64.js?v=64';
import * as leon from './leon-gear-r65.js?v=65';
import {victorySource} from './victory-art-r57.js?v=57';
import {victorySource as cheerSource} from './cheer-art-r58.js?v=58';

export const appearanceSources = Object.freeze([...old.appearanceSources, leon.mantleSource]);
export const configureBattleMeta = old.configureBattleMeta;

export function savedBattleAppearance(storage) {
  return {...old.savedBattleAppearance(storage), leon: leon.readAppearance(storage)};
}

export function buildBattleAppearance(id, assets, value) {
  if (id !== 'leon') return old.buildBattleAppearance(id, assets, value);
  const gear = leon.appearance(value);
  const base = old.buildBattleAppearance(id, assets, leon.previousAppearance(gear));
  if (gear.body !== 'crimsonmantle') return base;
  return leon.equipBattleMantle(base, {
    battle: assets['r26/leon-battle'], victory: assets[victorySource],
    cheer: assets[cheerSource], mantle: assets[leon.mantleSource],
  });
}
