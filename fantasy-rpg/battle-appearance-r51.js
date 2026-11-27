// Shared battle appearance assembly for actual gameplay and the field preview.
import {configureLeon} from './result-pose-r51.js?v=51';
import {fiaMeta,makeFiaAtlas} from './fia-art-r46.js?v=46';
import * as leon from './leon-appearance-r50.js?v=50';
import * as fia from './fia-armour-r50.js?v=50';
export const fiaSources=Object.freeze({battle:'r37/fia-sprite',recovery:'r41/fia-recovery',attack:'r45/fia-attack',stance:'r46/fia-guard-victory'});
export const appearanceSources=Object.freeze([...Object.values(fiaSources),'r47/fia-gear','r48/fia-equipment','r26/leon-battle']);
export function configureBattleMeta(meta){return {...meta,actors:{...meta.actors,leon:configureLeon(meta.actors.leon),fia:fiaMeta}}}
export function savedBattleAppearance(storage){return {leon:leon.readAppearance(storage),fia:fia.readAppearance(storage)}}
export function buildBattleAppearance(id,assets,gear){
 if(id==='leon')return leon.equippedImage(assets['r26/leon-battle'],'battle',gear);
 if(id!=='fia')throw Error('unknown appearance actor');
 const parts=Object.entries(fiaSources).map(([kind,name])=>fia.equippedImage(assets[name],kind,gear,assets['r47/fia-gear'],assets['r48/fia-equipment']));
 return makeFiaAtlas(...parts);
}
