'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {master,natural}=require('./full_op_model.cjs');const {item,player,chooseZone,preview,transfer,zones}=require('./balanced_loot.cjs');const {battle}=require('./revised_combat.cjs');const {purchase}=require('./town_shop.cjs');
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const els=['physical','fire','water','wind','earth','light','dark'];
const types=['cold','freeze','stun','petrify','confuse','sleep','charm','knockback','weaponBreak','armorBreak','blind','curse','instant'];
function enemies(level,boss,count=1){const stage=Math.floor(level/10),element=els[stage%7];return Array.from({length:count},(_,i)=>({hp:(50+level*15)*(boss?7:count===1?1:.64),atk:(7+level*.67)*(boss?1.5:count===1?1:.57),def:(5+level*.10)*(boss?1.2:1),interval:boss?1.8:2.2+i*.3,element,boss,hit:.96,evade:stage%5===0?.12:0,crit:stage%4===0?.15:.03,crush:stage%11===0?.04:0,cpDrain:stage%6===0?8:0,hpRegen:stage%9===0?(50+level*15)*.002:0,resist:{[element]:.25,[els[(stage+2)%7]]:-.15},statusResist:{state:boss?.4:stage%4===0?.25:0},procs:level>=30?[{type:types[stage%types.length],chance:types[stage%types.length]==='instant'?.005:.12,duration:2}]:[]}));}
const {score}=require('./balanced_score.cjs');
function select(level,stash,enhance,e,old,state){let gear=old&&old.every(g=>g.req<=level)?[...old]:['weapon','armor','charm'].map(slot=>stash.find(g=>g.slot===slot&&g.req<=level));const rated=gs=>{const pp=player(level,gs,enhance);pp.potionAvailable=(state?.potions??20)>0;pp.selectionHp=Math.min(pp.hp,state?.hp??pp.hp);return score(pp,e);};let best=rated(gear);for(let round=0;round<2;round++)for(let s=0;s<3;s++)for(const it of stash){if(it.slot!==gear[s].slot||it.req>level)continue;const test=[...gear];test[s]=it;const v=rated(test);if(v>best+1e-9){best=v;gear=test;}}return gear;}
function dist(a){const x=[...a].sort((a,b)=>a-b);return{n:x.length,mean:x.length?x.reduce((s,v)=>s+v,0)/x.length:0,p50:x[Math.floor(x.length*.5)]||0,p90:x[Math.floor(x.length*.9)]||0,max:x.at(-1)||0};}
function trial(seed,cap=100,noOP=false,{craft=false,hunt='auto'}={}){
 const craftR=rng(seed^0xb27a431),zoneLog=[],craftLog=[];let lastCraftLevel=0;const r=rng(seed),er=rng(seed^0x137f29a1),cr=rng(seed^0xa511e9b3),sr=rng(seed^0x4527beef);
 let level=1,xp=0,hours=0,cleared=0,losses=0,kills=0,id=3,generated=0,drops=0,excluded=0,materials=0,gold=200,spent=0,updates=0,lastUpdate=0,maxGap=0,retreat=0,farm=1,state,usedPotions=0,maxAhead=0,locked=0,lockedUnused=0;
 let stash=['weapon','armor','charm'].map((slot,i)=>({id:i,slot,baseLevel:1,quality:1,req:1,ops:[]})),gear=[...stash];const enhance={weapon:0,armor:0,charm:0};
 const defeatLog=[];const seen=new Set(),waits=[],equipLog=[],bossLog=[],dropLog=[],found={},equipped={},fight=[],bossTimes=[];let lastKey='',p;
 for(let n=0;n<150000&&hours<500;n++){
 if(state){const tx=purchase({gold,potions:state.potions});gold=tx.gold;state.potions=tx.potions;spent+=tx.spent;}
 const bl=(cleared+1)*100,boss=level>=bl&&!retreat,el=boss?bl:retreat?farm:Math.max(1,Math.min(Math.floor(level/10)*10,bl-10));
 const zone=hunt==='auto'?chooseZone(gear):hunt;if(!zones[zone])throw Error('Unknown zone');if(zoneLog.at(-1)?.zone!==zone)zoneLog.push({level,hours,zone});
 const key=level+':'+drops+':'+materials+':'+el+':'+boss;
 if(key!==lastKey){const next=select(level,stash,enhance,enemies(el,boss)[0],gear,state);if(next.some((g,i)=>g.id!==gear[i].id)){updates++;maxGap=Math.max(maxGap,hours-lastUpdate);lastUpdate=hours;}
 gear=next;p=player(level,gear,enhance);for(const g of gear)if(!seen.has(g.id)){seen.add(g.id);if(g.locked)waits.push(hours-g.foundAt);for(const o of g.ops)equipped[o.family]=(equipped[o.family]||0)+1;equipLog.push({hours,level,id:g.id,req:g.req,names:g.ops.map(o=>o.name)});}lastKey=key;}
 assert(gear.every(g=>g.req<=level));const count=boss?1:1+Math.floor(er()*3);const result=battle({player:p,enemies:enemies(el,boss,count),state,seed:Math.floor(cr()*4294967296)});state=result.state;hours+=result.seconds/3600;usedPotions+=result.potionsUsed;(boss?bossTimes:fight).push(result.seconds);
 if(!result.win){defeatLog.push({level,hours,el,boss,reason:result.reason,potions:state.potions,gear:gear.map(g=>g.id)});losses++;hours+=45/3600;retreat=30;farm=Math.max(1,Math.floor((el-10)/10)*10);state={...state,hp:p.hp,cp:p.cp,statuses:{},hots:[],cooldowns:Object.fromEntries(Object.entries(state.cooldowns).map(([k,v])=>[k,Math.max(0,v-45)])),potionCooldown:Math.max(0,state.potionCooldown-45)};continue;}
 kills+=count;if(retreat)retreat--;gold+=count*(2+Math.floor(el/50))*(boss?5:1);for(let i=0;i<count;i++)if(sr()<.03)state.potions++;
 if(boss){cleared++;bossLog.push({level,hours,seconds:result.seconds,losses});console.log(JSON.stringify({cap:cap===Infinity?'none':cap,noOP,chapter:cleared,hours,losses}));if(cleared===10)break;}
 xp+=(boss?20:count)*Math.min(1.2,el/level);while(level<1000&&xp>=8+Math.floor(level/25)){xp-=8+Math.floor(level/25);level++;}
 for(let d=0;d<count;d++)if(r()<.10){const it=item(r,el,id++,noOP,p.magicFind,p.uniqueFind,zone);generated++;maxAhead=Math.max(maxAhead,it.req-level);const rejected=it.req>level+cap;dropLog.push({id:it.id,level,hours,base:it.baseLevel,req:it.req,rejected,ops:it.ops.map(o=>({id:o.id,name:o.name,tier:o.tier,req:o.req,rolled:o.rolled}))});if(rejected){excluded++;continue;}drops++;it.foundAt=hours;it.locked=it.req>level;if(it.locked)locked++;stash.push(it);for(const o of it.ops)found[o.family]=(found[o.family]||0)+1;}
 // Keep whole-item alternatives across elements plus rolled family exemplars.
 if(stash.length>400){
 const keep=new Set(gear.map(g=>g.id));
 const foes=els.map(element=>({...enemies(Math.max(1,level),true)[0],element}));
 const current=player(level,gear,enhance);
 for(let si=0;si<3;si++){
 const list=stash.filter(g=>g.slot===gear[si].slot);
 list.filter(g=>g.req>level||g.id<3).forEach(g=>keep.add(g.id));
 list.sort((a,b)=>b.baseLevel*b.quality-a.baseLevel*a.quality).slice(0,3).forEach(g=>keep.add(g.id));
 const rated=list.filter(g=>g.req<=level).map(g=>{const gs=[...gear];gs[si]=g;const pp=player(level,gs,enhance);return {g,values:foes.map(e=>score(pp,e))};});
 for(let ei=0;ei<foes.length;ei++)rated.sort((a,b)=>b.values[ei]-a.values[ei]).slice(0,3).forEach(x=>keep.add(x.g.id));
 const groups={};for(const g of list)for(const o of g.ops)(groups[o.family]??=[]).push({g,o});
 const strength=o=>o.mode==='ratio'?(o.nums[0]||0)/Math.max(1,o.nums[1]||1):o.kind==='elementDamage'?(o.nums[0]||0)+(o.nums[1]||0):(o.nums[0]||0);
 for(const arr of Object.values(groups)){arr.sort((a,b)=>strength(b.o)-strength(a.o)||b.g.baseLevel*b.g.quality-a.g.baseLevel*a.g.quality);arr.slice(0,2).forEach(x=>keep.add(x.g.id));}
 }
 const removed=stash.filter(g=>!keep.has(g.id));materials+=removed.length;stash=stash.filter(g=>keep.has(g.id));
 }
 if(zone==='materials')for(let j=0;j<count;j++)if(sr()<.15)materials++;
 if(craft&&level>=100&&Math.floor(level/100)>lastCraftLevel&&gold>=2000&&materials>=20){
 lastCraftLevel=Math.floor(level/100);const foe=enemies(el,false)[0];let best=score(player(level,gear,enhance),foe)+.01,candidate;const candidates=[];
 for(let si=0;si<gear.length;si++)for(const donor of stash){if(gear.some(g=>g.id===donor.id))continue;for(let oi=0;oi<donor.ops.length;oi++)for(let ti=0;ti<=Math.min(2,gear[si].ops.length);ti++){
 const plan=preview(gear[si],donor,oi,ti,{gold,materials});if(!plan.ok||plan.successReq>level)continue;const test=[...gear];test[si]={...gear[si],ops:plan.resultOps,req:plan.successReq};const value=score(player(level,test,enhance),foe);if(value>best)candidates.push({si,donor,oi,ti,value,test});
 }}
 // Confirm candidates against every element before consuming a rare donor.
 const probe=gs=>{const pp=player(level,gs,enhance);return els.map((element,i)=>battle({player:pp,enemies:enemies(el,false,3).map(e=>({...e,element})),state:{hp:pp.hp*.7,cp:pp.cp*.5,potions:5},seed:901+i,maxSeconds:120}));};
 if(candidates.length){const baseline=probe(gear);for(const c of candidates.sort((a,b)=>b.value-a.value).slice(0,12)){const pp=player(level,c.test,enhance),oldp=player(level,gear,enhance),out=probe(c.test);const safe=out.every((v,i)=>v.win&&(!baseline[i].win||v.hp/pp.hp>=baseline[i].hp/oldp.hp-.02));const before=baseline.reduce((s,v)=>s+v.seconds,0),after=out.reduce((s,v)=>s+v.seconds,0);if(safe&&after<before*.99){candidate=c;break;}}}
 if(candidate){const c=candidate,base=gear[c.si],tx=transfer({base,donor:c.donor,donorIndex:c.oi,targetIndex:c.ti,resources:{gold,materials},rng:craftR,id:id++});gold=tx.resources.gold;materials=tx.resources.materials;stash=stash.filter(g=>g.id!==c.donor.id);if(tx.success){stash=stash.filter(g=>g.id!==base.id);tx.item.foundAt=hours;tx.item.locked=false;stash.push(tx.item);gear[c.si]=tx.item;p=player(level,gear,enhance);updates++;lastUpdate=hours;}lastKey='';craftLog.push({level,hours,success:tx.success,base:base.id,donor:c.donor.id,op:c.donor.ops[c.oi].name,req:tx.item.req,cost:tx.plan.cost});}
 }
 for(const slot of ['weapon','armor','charm']){const cost=20*(enhance[slot]+1);if(enhance[slot]<10&&materials>=cost){materials-=cost;enhance[slot]++;}}
 }
 maxGap=Math.max(maxGap,hours-lastUpdate);lockedUnused=locked-waits.length;
 return{defeatLog,craft,hunt,craftLog,zoneLog,seed,cap:cap===Infinity?null:cap,noOP,clear:cleared===10,level,hours,losses,kills,generated,drops,excluded,maxAhead,locked,lockedUnused,updates,maxGap,waitHours:dist(waits),fightSeconds:dist(fight),bossSeconds:dist(bossTimes),gold,spent,usedPotions,enhance,found,equipped,equipLog,bossLog,dropLog,finalGear:gear};
}
module.exports={trial,enemies,score,select};
if(require.main===module){const craft=process.argv[2]==='craft';const r=trial(1,100,false,{craft});fs.writeFileSync('revised_run_'+(craft?'craft':'no_craft')+'.json',JSON.stringify(r,null,2));console.log(JSON.stringify({...r,dropLog:undefined,equipLog:undefined,finalGear:undefined,found:undefined,equipped:undefined,zoneLog:undefined}));}
