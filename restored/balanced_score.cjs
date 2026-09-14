'use strict';
// Fast ranking approximation, not a combat solver or proof of optimality.
// Duration uses cooldown-limited skill throughput and continuous CP budget.
// HP-percent effects use half enemy HP; risk reserves account for burst damage.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number(x)||0));
const controls=new Set(['cold','freeze','stun','petrify','confuse','sleep','charm','flee','knockout','knockback']);
const debuffs=new Set(['weaponBreak','armorBreak','blind','lightDebuff','aiDown']);
const statusChance=(q,rr={},boss=false)=>{
 if(boss&&['instant','charm','flee'].includes(q.type))return 0;
 const group=controls.has(q.type)?'state':debuffs.has(q.type)?'debuff':'curse';
 return clamp(q.chance)*(1-clamp((rr[q.type]||0)+(rr.all||0)+(rr[group]||0)))*(boss&&controls.has(q.type)?.25:1);
};
function metrics(p,e){
 const count=Math.max(1,e.count||1),speed=Math.max(.1,p.attackSpeed||1),hp=Math.max(1,p.hp||1),enemyHp=Math.max(1,e.hp||1);
 const hit=p.absoluteHit?1:clamp((p.hit??.95)-(p.ignoreEvade?0:e.evade||0),.05,1);
 const crit=clamp((p.crit||0)-(e.critResist||0));
 const raw=Math.max(0,(p.atk||0)+((p.minAttack||0)+Math.max(p.minAttack||0,p.maxAttack||0))/2);
 const physical=raw*100/(100+Math.max(0,e.def||0))*(1+crit*(Math.max(1,p.critMult||1.5)-1));
 const elemental=Object.entries(p.elementDamage||{}).reduce((s,[el,v])=>s+(v[0]+v[1])/2*(1-clamp(e.resist?.[el],-.5,.85))*(el==='earth'?1/Math.max(1,p.poisonDuration||2):1),0);
 const potion=(p.actions||p.skills||[]).find(s=>s.type==='potion');
 const initialHp=clamp(p.selectionHp??hp,0,hp);
 const potions=p.potionAvailable??p.potions??0;
 const potionStock=typeof potions==='boolean'?(potions?1:0):Math.max(0,potions);
 // Conservatively reserve an action every cooldown when potions are available.
 const potionRate=potion&&potionStock>0?1/Math.max(1,potion.cooldown||18):0;
 let castBudget=Math.max(0,1-potionRate*(potion?.cast||.5)),cpBudget=Math.max(0,p.cpRegen||0),multRate=0,attackRate=0;
 for(const s of (p.actions||p.skills||[]).filter(s=>s.type!=='potion')){
 const cast=Math.max(.05,(s.cast||.1)/speed),cost=Math.max(0,s.cost||0);
 let rate=Math.min(1/Math.max(cast,(s.cooldown||0)*(1-clamp(p.cdr,0,.6))),castBudget/cast);
 // CP from basic attacks is conservatively omitted until their remaining time is known.
 if(cost)rate=Math.min(rate,(cpBudget+Math.max(0,p.cp||0)/30)/cost);
 cpBudget=Math.max(0,cpBudget-rate*cost);castBudget=Math.max(0,castBudget-rate*cast);
 const targets=Math.min(count,Math.max(1,s.targets||1));
 multRate+=rate*(s.mult??1)*targets;attackRate+=rate*targets;
 }
 const basics=castBudget/Math.max(.05,1/speed);multRate+=basics;attackRate+=basics;
 let direct=(physical*multRate+elemental*attackRate)*hit;
 let control=0,damageProc=0;
 for(const q of p.procs||[]){const chance=statusChance(q,e.statusResist,e.boss),uptime=clamp(chance*attackRate/Math.max(1,count)*(q.duration||1),0,.7);
 if(q.type==='instant')damageProc+=chance*enemyHp*attackRate*hit;
 else if(q.type==='crush')damageProc+=chance*.125*enemyHp*attackRate*hit*(1-clamp(e.crushResist));
 else if(controls.has(q.type))control+=uptime*(q.type==='cold'?.25:['confuse','sleep','knockback'].includes(q.type)?.35:.6);
 else if(q.type==='armorBreak')direct*=1+uptime*.15;
 else if(debuffs.has(q.type))control+=uptime*.15;
 }
 damageProc+=clamp(p.crush)*(1-clamp(e.crushResist))*.125*enemyHp*attackRate*hit;
 for(const [k,type] of [['counterCold','cold'],['counterFreeze','freeze']])if(p[k]){
 const chance=statusChance({type,...p[k]},e.statusResist,e.boss);control+=clamp(chance*(p[k].duration||1)/Math.max(.1,e.interval||2),0,.6)*(type==='cold'?.25:.6);
 }
 const enemyHit=clamp((p.ignoreHit?(e.baseHit??.95):(e.hit??1))-(p.evade||0),.05,1),block=clamp(p.block);
 const mitigation=e.element==='physical'||!e.element?100/(100+Math.max(0,p.def||0)):1-clamp(p.resist?.[e.element],-.5,.85);
 const enemyCrit=clamp((e.crit||0)-(p.critResist||0));
 const landed=count/Math.max(.1,e.interval||2)*enemyHit*(1-block)*(1-clamp(control,0,.7));
 const damage=Math.max(0,e.atk||0)*mitigation*(1+enemyCrit*.7),absorb=clamp(p.absorb?.[e.element]);
 let incoming=landed*damage*Math.max(0,1-2*absorb);
 let disruption=0,instantRisk=0;
 for(const q of e.procs||[]){const chance=statusChance(q,p.statusResist,false);
 if(q.type==='instant'){instantRisk+=landed*chance;continue;}
 if(q.type==='crush'){incoming+=landed*chance*hp*.125*(1-clamp(p.crushResist));continue;}
 if(controls.has(q.type)||debuffs.has(q.type)||q.type==='curse')disruption+=clamp(landed*chance*(q.duration||1),0,.6)*.3;
 }
 incoming+=landed*clamp(e.crush)*hp*.125*(1-clamp(p.crushResist));
 direct*=1-clamp(disruption,0,.6);damageProc*=1-clamp(disruption,0,.6);
 const reflect=landed*damage*clamp(p.reflect);
 const dps=Math.max(.01,direct+damageProc+reflect-Math.max(0,e.hpRegen||0)*count),ttk=enemyHp*count/dps;
 // Potions are stock-limited, have a threshold, and can be interrupted.
 const healingPerPotion=hp*clamp(potion?.healRatio??.3);
 const potionHealing=Math.min(potionStock,ttk*potionRate)*healingPerPotion*.8;
 const sustain=Math.max(0,p.hpRegen||0)+direct*clamp(p.life)+landed*damage*.1*clamp(p.firstAid);
 const expectedLoss=Math.max(0,incoming-sustain)*ttk;
 const burstReserve=damage*(1+enemyCrit*.7)*Math.min(count,2)*.5;
 // Revival is useful insurance but not infinite effective HP.
 const revive=clamp(p.reviveChance);const effectiveHp=initialHp+potionHealing+hp*.3*revive;
 const safety=Math.max(.001,effectiveHp-burstReserve)/Math.max(1,expectedLoss);
 const deathRisk=instantRisk*ttk*(1-revive);
 const value=Math.log(dps)+Math.min(0,Math.log(safety))*4-deathRisk*2+.01*Math.log1p(Math.max(0,p.cp||0))+.005*Math.log1p(Math.max(0,p.magicFind||0))+.002*Math.log1p(Math.max(0,p.uniqueFind||0));
 return {value,dps,ttk,incoming,sustain,safety,deathRisk,potionHealing};
}
function score(p,e){return metrics(p,e).value;}
module.exports={score,metrics};
