import * as api from './fia-outfit-r59.js';
import * as prior from './fia-armour-r50.js';
let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
const original=prior.saveAppearance(storage,{body:'armoured',feet:'greaves',main:'engraved',offhand:'dagger',head:'circlet',accessory:'brooch'});
ok(JSON.stringify(api.readAppearance(storage))===JSON.stringify(original),'migration');
let total=0;for(const main of api.slots.main)for(const offhand of api.slots.offhand)for(const head of api.slots.head)for(const body of api.slots.body)for(const feet of api.slots.feet)for(const accessory of api.slots.accessory){const gear={main,offhand,head,body,feet,accessory};const actual=api.saveAppearance(storage,gear);ok(JSON.stringify(api.readAppearance(storage))===JSON.stringify(actual),'round trip');const old=api.legacyAppearance(gear);ok(JSON.stringify(prior.appearance(old))===JSON.stringify(old),'old schema');ok(JSON.stringify(prior.readAppearance(storage))===JSON.stringify(original),'old save unchanged');total++}
ok(total===256,'all combinations');for(const kind of ['battle','recovery','attack','stance','field','motion'])for(const part of ['coat','boots'])for(let i=0;i<api.cellCount(kind);i++){const f=api.layerLayout(kind,i,part);ok(f.sx>=0&&f.sy>=0&&f.sx+f.w<=1440&&f.sy+f.h<=2064,'source bounds')}
for(const bad of [null,[],{body:'bad'},{feet:'bad'},{extra:1}]){let rejected=false;try{api.appearance(bad)}catch{rejected=true}ok(rejected,'bad value')}
storage.setItem(api.KEY,'{broken');ok(JSON.stringify(api.readAppearance(storage))===JSON.stringify(api.defaults),'corrupt save safe fallback');
console.log(JSON.stringify({checks,total,failures:0}));
