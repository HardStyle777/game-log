import * as old from './battle-appearance-r62.js?v=62';
import * as fia from './fia-gear-r63.js?v=63';
import {makeFiaAtlas} from './fia-art-r46.js?v=46';
export const appearanceSources=old.appearanceSources,configureBattleMeta=old.configureBattleMeta,fiaSources=old.fiaSources;
export function savedBattleAppearance(storage){return {...old.savedBattleAppearance(storage),fia:fia.readAppearance(storage)}}
export function buildBattleAppearance(id,assets,value){
 if(id!=='fia')return old.buildBattleAppearance(id,assets,value);
 const g=fia.appearance(value);
 if(g.main!=='moonfang'&&g.offhand!=='moonfang')return old.buildBattleAppearance(id,assets,g);
 return makeFiaAtlas(...Object.entries(fiaSources).map(([kind,name])=>fia.equippedImage(assets[name],kind,g,assets['r47/fia-gear'],assets['r48/fia-equipment'],assets[fia.outfitSource])));
}
