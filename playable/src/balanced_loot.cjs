'use strict';
// This project's three-slot policy, inspired by RS; not an imported RS slot table.
const {master,roll,player:basePlayer}=require('./full_op_model.cjs');
const slots=['weapon','armor','charm'];
const zones={balanced:{label:'均等狩場',weights:[1,1,1],materialBonus:0},weapon:{label:'武器狩場',weights:[6,2,2],materialBonus:0},armor:{label:'防具狩場',weights:[2,6,2],materialBonus:0},charm:{label:'装飾狩場',weights:[2,2,6],materialBonus:0},materials:{label:'素材狩場',weights:[1,1,1],materialBonus:.15}};
function allowed(o,slot,route='drop'){
 if(o.kind==='system')return false;
 // Unsupported ranged/belt/terrain routes stay in the master, not this swordsman's loot pool.
 if(o.kind==='context')return false;
 if(o.kind==='skill'&&o.classId!==0&&o.classId!==-1)return false;
 const offense=['attack','minAttack','maxAttack','attackSpeed','life','crit','crush','absoluteHit','ignoreEvade'];
 if(offense.includes(o.family)||o.kind==='elementDamage'||o.kind==='proc'){
  if(slot==='armor')return false;
  if(slot==='charm'&&route==='drop')return false;
 }
 if(['defFlat','defPercent','block','blockSpeed','reflect'].includes(o.family)&&slot==='weapon')return false;
 if(slot==='charm'&&route==='drop'&&((o.mode==='ratio'&&o.rank>=2)||(o.kind==='skill'&&o.classId===-1&&o.req>=100)))return false;
 return true;
}
function rarity(o){let w=o.weight;
 if(['attack','hpPercent','defPercent','cpPercent'].includes(o.family)){w*=.4;if(o.tier==='normal'&&o.rank>=8)w*=o.rank===8?.1:o.rank===9?.03:.01;}
 // Normal low-rank speed is an attainable find; DX/ULT are separate rare tiers.
 if(o.family==='attackSpeed')w*=o.tier==='normal'?(o.rank===1?2:o.rank===2?.8:.1):.1;
 if(o.tier==='DX')w*=.2;if(o.tier==='ULT')w*=.05;
 return w;
}
const catalog=master.map(o=>({...o,dropSlots:slots.filter(s=>allowed(o,s)),craftSlots:slots.filter(s=>allowed(o,s,'craft')),adjustedWeight:rarity(o)}));
function pick(r,arr,weight=x=>x.weight){let v=r()*arr.reduce((s,x)=>s+weight(x),0);for(const x of arr)if((v-=weight(x))<=0)return x;return arr.at(-1);}
function requirement(base,ops,baseTier='normal'){
 const q=ops.map(o=>o.req).sort((a,b)=>b-a);if(!q.length)return base;
 const ult=baseTier==='ULT'||ops.some(o=>o.tier==='ULT'||/ULT/.test(o.name||''));
 if(q.length===1)return base+q[0];
 return base+Math.floor(ult?(q[0]*15+q[1]*5+(q[2]||0))/20:(q[0]*3+q[1]*2+(q[2]||0))/3);
}
function item(r,level,id,noOP=false,magicFind=0,uniqueFind=0,zone='balanced'){
 const z=zones[zone];if(!z)throw Error('Unknown hunting zone');
 const actualSlot=pick(r,slots,s=>z.weights[slots.indexOf(s)]);
 const baseLevel=Math.max(1,Math.floor(level*(.65+r()*.30))),quality=.9+r()*.2;
 const c=r();let count=c<.55?0:c<.90?1:c<.99?2:3;
 const mf=r();if(!count&&mf<Math.min(.9,.45*magicFind))count=1;
 const ops=[],used=new Set(),pool=catalog.filter(o=>o.dropSlots.includes(actualSlot));
 for(let i=0;i<count;i++){const o=pick(r,pool.filter(o=>!used.has(o.family)),o=>o.adjustedWeight);used.add(o.family);ops.push(roll(o,r));}
 const uniqueRoll=r();const unique=!noOP&&uniqueRoll<Math.min(.2,.002*(1+uniqueFind));
 return{id,slot:actualSlot,baseLevel,baseTier:'normal',quality:quality*(unique?1.2:1),unique,req:noOP?baseLevel:requirement(baseLevel,ops),ops:noOP?[]:ops};
}
function player(level,gear,enhance){const p=basePlayer(level,gear,enhance);p.attackSpeed=Math.min(2.5,p.attackSpeed);p.life=Math.min(.2,p.life);return p;}
function chooseZone(gear){return [...gear].sort((a,b)=>a.baseLevel*a.quality-b.baseLevel*b.quality)[0].slot;}
function preview(base,donor,donorIndex,targetIndex,resources){
 const op=donor.ops[donorIndex];let reason='';
 if(base.id===donor.id)reason='同じ装備は素材にできません';
 else if(!op||!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>base.ops.length||targetIndex>=3)reason='対象枠が不正です';
 else if(!allowed(op,base.slot,'craft'))reason='この部位へ移せないOPです';
 const ops=base.ops.filter((_,i)=>i!==targetIndex);if(op)ops.push(op);
 const same=op?ops.filter(o=>o.family===op.family).length:0;
 if(!reason&&same>(['attackSpeed','life'].includes(op.family)?1:2))reason='同系統OPの上限です';
 const cost={gold:2000,materials:20};
 if(!reason&&(resources.gold<cost.gold||resources.materials<cost.materials))reason='素材またはゴールドが不足しています';
 const resultOps=[...base.ops];if(op)resultOps[targetIndex]=op;
 return{ok:!reason,reason,cost,chance:.5,successReq:op?requirement(base.baseLevel,resultOps,base.baseTier):null,failure:'本体と既存OPは維持。素材装備・費用を消費。',resultOps};
}
function transfer({base,donor,donorIndex,targetIndex,resources,rng,id}){
 const plan=preview(base,donor,donorIndex,targetIndex,resources);if(!plan.ok)throw Error(plan.reason);
 const success=rng()<plan.chance;
 return{success,consumedDonor:donor.id,resources:{gold:resources.gold-plan.cost.gold,materials:resources.materials-plan.cost.materials},item:success?{...base,id,ops:plan.resultOps,req:plan.successReq,origin:'crafted'}:base,plan};
}
module.exports={catalog,zones,allowed,rarity,requirement,item,player,chooseZone,preview,transfer};
