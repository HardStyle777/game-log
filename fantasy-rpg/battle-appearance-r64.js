import * as old from './battle-appearance-r63.js?v=63.1';
import * as fia from './fia-gear-r64.js?v=64';
import {makeFiaAtlas} from './fia-art-r46.js?v=46';
export const appearanceSources=Object.freeze([...old.appearanceSources,fia.cloakSource]),configureBattleMeta=old.configureBattleMeta,fiaSources=old.fiaSources;
export function savedBattleAppearance(storage){return {...old.savedBattleAppearance(storage),fia:fia.readAppearance(storage)}}
export function buildBattleAppearance(id,assets,value){
 if(id!=='fia')return old.buildBattleAppearance(id,assets,value);
 const g=fia.appearance(value);if(g.body!=='royalcloak')return old.buildBattleAppearance(id,assets,g);
 return makeFiaAtlas(...Object.entries(fiaSources).map(([kind,name])=>fia.equippedImage(assets[name],kind,g,assets['r47/fia-gear'],assets['r48/fia-equipment'],assets[fia.outfitSource],assets[fia.cloakSource])));
}
