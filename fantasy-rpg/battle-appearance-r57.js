// Shared battle appearance assembly for actual gameplay and the field preview.
import {configureVictory,appendVictory,victorySource} from './victory-art-r57.js?v=57';
import {fiaMeta,makeFiaAtlas} from './fia-art-r46.js?v=46';
import * as leon from './leon-equipment-r53.js?v=53';
import {equippedImage as improvedLeon} from './leon-blades-r56.js?v=56';
import * as fia from './fia-armour-r50.js?v=50';
import {equippedImage as improvedFia} from './fia-blades-r55.js?v=55';
export const fiaSources=Object.freeze({battle:'r37/fia-sprite',recovery:'r41/fia-recovery',attack:'r45/fia-attack',stance:'r46/fia-guard-victory'});
export const appearanceSources=Object.freeze([...Object.values(fiaSources),'r47/fia-gear','r48/fia-equipment','r26/leon-battle','r53/leon-equipment',victorySource]);
export function configureBattleMeta(meta){return {...meta,actors:{...meta.actors,leon:configureVictory(meta.actors.leon),fia:fiaMeta,glen:configureVictory(meta.actors.glen),eris:configureVictory(meta.actors.eris)}}}
export function savedBattleAppearance(storage){return {leon:leon.readAppearance(storage),fia:fia.readAppearance(storage)}}
export function buildBattleAppearance(id,assets,gear){
 if(id==='leon')return appendVictory(improvedLeon(assets['r26/leon-battle'],'battle',gear,assets['r53/leon-equipment']),id,assets[victorySource],gear,assets['r53/leon-equipment']);
 if(id==='glen'||id==='lucia')return appendVictory(assets['r26/'+(id==='lucia'?'eris':id)+'-battle'],id,assets[victorySource]);
 if(id!=='fia')throw Error('unknown appearance actor');
 const parts=Object.entries(fiaSources).map(([kind,name])=>improvedFia(assets[name],kind,gear,assets['r47/fia-gear'],assets['r48/fia-equipment']));
 return makeFiaAtlas(...parts);
}
