/* Pure equipment preview: the same player calculation used when equipping. */
(function(root){
const fields=[['atk','攻撃力',1,''],['hp','最大HP',1,''],['def','防御力',1,''],['attackSpeed','攻撃速度',2,'倍'],['cp','最大CP',1,''],['hpRegen','HP回復',2,'/秒'],['cpRegen','CP回復',2,'/秒'],['hit','命中率',2,'%',100],['evade','回避率',2,'%',100],['crit','致命打率',2,'%',100],['life','HP吸収',2,'%',100]];
for(const k of ['力','敏捷','健康','知恵','知識','威厳','運'])fields.push(['stats.'+k,k,0,'']);
for(const [k,label]of Object.entries({fire:'火',water:'水',wind:'風',earth:'土',light:'光',dark:'闇'}))fields.push(['resist.'+k,label+'抵抗',2,'%',100]);
const get=(o,path)=>path.split('.').reduce((v,k)=>v?.[k],o)||0;
function compare(loot,level,gear,enhance,candidate){const slot=gear.findIndex(x=>x.slot===candidate.slot);if(slot<0)throw Error('Unknown equipment slot');const next=gear.slice();next[slot]=candidate;const before=loot.player(level,gear,enhance),after=loot.player(level,next,enhance);return{current:gear[slot],locked:candidate.req>level,before,after,rows:fields.map(([key,label,digits,unit,mult=1],i)=>{const a=get(before,key)*mult,b=get(after,key)*mult;const delta=+(b-a).toFixed(digits);return{key,label,digits,unit,before:a,after:b,delta,show:i<4||delta!==0};}).filter(x=>x.show)};}
const api={compare};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GearCompare=api;
})(typeof window!=='undefined'?window:this);
