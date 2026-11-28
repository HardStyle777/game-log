import * as prior from './leon-outfit-r61.js?v=61';
export {fieldMotion,outfitSource} from './leon-outfit-r61.js?v=61';
export const KEY='fantasy-leon-appearance-r62';
export const slots=Object.freeze({...prior.slots,main:Object.freeze([...prior.slots.main,'royalsword'])});
export const defaults=prior.defaults;
export function appearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid Leon appearance');
 for(const [k,v] of Object.entries(value))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid Leon appearance '+k);
 return {...defaults,...value};
}
export function previousAppearance(value={}){const g=appearance(value);return {...g,main:g.main==='royalsword'?'iron':g.main}}
export function readAppearance(storage){try{const raw=storage.getItem(KEY);return raw===null?appearance(prior.readAppearance(storage)):appearance(JSON.parse(raw))}catch{return appearance()}}
export function saveAppearance(storage,value){const g=appearance(value);try{storage.setItem(KEY,JSON.stringify(g))}catch{}return g}
export function equippedImage(source,kind,value={},asset=null,outfit=null){return prior.equippedImage(source,kind,previousAppearance(value),asset,outfit)}
