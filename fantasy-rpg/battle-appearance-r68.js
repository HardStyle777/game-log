import * as old from './battle-appearance-r67.js?v=67';
import {luciaBattle,luciaField,luciaEquipment,configureLucia} from './lucia-motion-r68.js';
import {luciaGear} from './lucia-options-r68.js';
import {equipLucia} from './lucia-equipment-r68.js';

export const appearanceSources=Object.freeze([...old.appearanceSources,luciaBattle,luciaEquipment]);
export {equipLeonField,equipFiaSource,fieldMotion,buildGlenField} from './battle-appearance-r67.js?v=67';
export function configureBattleMeta(meta){
 const base=old.configureBattleMeta(meta),lucia=configureLucia(base.actors.eris);
 return {...base,actors:{...base.actors,eris:lucia,lucia}};
}
export function savedBattleAppearance(storage){
 return {...old.savedBattleAppearance(storage),lucia:luciaGear.readAppearance(storage)};
}
export function buildBattleAppearance(id,assets,value){
 return id==='lucia'?equipLucia(assets[luciaBattle],assets[luciaEquipment],'battle',value):
   old.buildBattleAppearance(id,assets,value);
}
export function buildLuciaField(assets,value){
 return equipLucia(assets[luciaField],assets[luciaEquipment],'field',value);
}
