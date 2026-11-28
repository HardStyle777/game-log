// Shared battle appearance assembly for actual gameplay and the field preview.
import {configureVictory,appendVictory,victorySource} from './victory-art-r57.js?v=57';
import {appendVictory as appendCheer,victorySource as cheerSource} from './cheer-art-r58.js?v=58';
import {configureLoop} from './victory-loop-r58.js?v=58';
import {fiaMeta,makeFiaAtlas} from './fia-art-r46.js?v=46';
import * as leon from './leon-equipment-r53.js?v=53';
import {equippedImage as improvedLeon} from './leon-blades-r56.js?v=56';
import * as fia from './fia-outfit-r59.js?v=59';
export const fiaSources=Object.freeze({battle:'r37/fia-sprite',recovery:'r41/fia-recovery',attack:'r45/fia-attack',stance:'r46/fia-guard-victory'});
export const appearanceSources=Object.freeze([...Object.values(fiaSources),'r47/fia-gear','r48/fia-equipment','r26/leon-battle','r53/leon-equipment',victorySource,cheerSource,fia.outfitSource]);
export function configureBattleMeta(meta){return {...meta,actors:{...meta.actors,leon:configureLoop(configureVictory(meta.actors.leon),'leon'),fia:configureLoop(fiaMeta,'fia'),glen:configureLoop(configureVictory(meta.actors.glen),'glen'),eris:configureLoop(configureVictory(meta.actors.eris),'lucia')}}}
export function savedBattleAppearance(storage){return {leon:leon.readAppearance(storage),fia:fia.readAppearance(storage)}}
export function buildBattleAppearance(id,assets,gear){
 if(id==='leon')return appendCheer(appendVictory(improvedLeon(assets['r26/leon-battle'],'battle',gear,assets['r53/leon-equipment']),id,assets[victorySource],gear,assets['r53/leon-equipment']),id,assets[cheerSource],gear,assets['r53/leon-equipment']);
 if(id==='glen'||id==='lucia')return appendCheer(appendVictory(assets['r26/'+(id==='lucia'?'eris':id)+'-battle'],id,assets[victorySource]),id,assets[cheerSource]);
 if(id!=='fia')throw Error('unknown appearance actor');
 const parts=Object.entries(fiaSources).map(([kind,name])=>fia.equippedImage(assets[name],kind,gear,assets['r47/fia-gear'],assets['r48/fia-equipment'],assets[fia.outfitSource]));
 return makeFiaAtlas(...parts);
}
