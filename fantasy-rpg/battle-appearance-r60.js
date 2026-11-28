// Shared R60 appearance route. Old Leon and Fia settings retain their previous renderers.
import * as old from './battle-appearance-r59.js?v=59';
import * as leon from './leon-outfit-r60.js?v=60';
import {victorySource} from './victory-art-r57.js?v=57';
import {victorySource as cheerSource} from './cheer-art-r58.js?v=58';
export const appearanceSources=Object.freeze([...old.appearanceSources,leon.outfitSource]);
export const configureBattleMeta=old.configureBattleMeta;
export const fiaSources=old.fiaSources;
export function savedBattleAppearance(storage){return {...old.savedBattleAppearance(storage),leon:leon.readAppearance(storage)}}
export function buildBattleAppearance(id,assets,gear){
 if(id!=='leon')return old.buildBattleAppearance(id,assets,gear);
 const g=leon.appearance(gear),base=old.buildBattleAppearance(id,assets,leon.legacyAppearance(g));
 return leon.applyBattleOutfit(base,assets['r26/leon-battle'],assets[victorySource],assets[cheerSource],g,assets[leon.outfitSource]);
}
