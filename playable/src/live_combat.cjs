'use strict';
// Experimental combat semantics, not a reconstruction of Red Stone combat.
// Bosses ignore instant death/charm/flee; control proc chance is quartered.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
function* stream({player:p,enemies,state={},seed=1,maxSeconds=180}){
 let z=seed>>>0;const rnd=()=>{z+=0x6D2B79F5;let x=z;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296};
 const maxHp=p.hp,maxCp=p.cp||0;let hp=Math.min(maxHp,state.hp??maxHp),cp=Math.min(maxCp,state.cp??maxCp),t=0,potions=state.potions??p.potions??0,potionReady=state.potionCooldown||0,potionsUsed=0,pending,chaseDelay=0;
 let cursor=state.cursor||0,events=[],form=state.form||p.form||'swordsman',transformReady=state.transformReady||0,guardUntil=state.guardUntil||0,guardReduction=state.guardReduction||0,counterUntil=state.counterUntil||0,counterPower=state.counterPower||0,counterReduction=state.counterReduction||0,assaultUntil=state.assaultUntil||0,riposteUntil=state.riposteUntil||0,linkDamage=state.linkDamage||1,linkDiscount=state.linkDiscount||0,linkUntil=state.linkUntil||0;
 const rank=id=>p.training?.[id]||0;
 const snapshot=()=>({seconds:t,form,guardUntil,counterUntil,hp:Math.max(0,hp),cp,potions,cursor,action:pending?.s?.id||null,foes:foes.map(e=>({hp:Math.max(0,e.hp),maxHp:e.maxHp,element:e.element,statuses:{...e.statuses}})),events:events.splice(0)});
 const casts={},ps={...(state.statuses||{})},hots=(state.hots||[]).map(x=>({...x}));
 const skills=(p.actions||p.skills||[]).map(s=>({...s,ready:state.cooldowns?.[s.id]||0}));
 const warrior=p.skillRules?[{id:'warrior_heavy',mult:2.8,cost:18,cooldown:6,cast:.7,targets:1,hitFractions:[.6]},{id:'warrior_sweep',mult:1.8,cost:16,cooldown:7,cast:.65,targets:3,hitFractions:[.5]}].map(s=>({...s,ready:state.cooldowns?.[s.id]||0})):[];
 const foes=enemies.map(e=>({...e,hp:e.hp,maxHp:e.hp,statuses:{},next:Math.max(.1,e.interval||2)+(p.noAggro?1:0)}));
 const living=()=>foes.filter(e=>e.hp>0);const active=(s,k)=>s[k]>t;
 const disabled=s=>['freeze','stun','petrify','sleep','knockout','charm','flee','knockback'].some(k=>active(s,k));
 const resist=(o,k)=>clamp(o?.[k],-.5,.85);
 // Physical defense and elemental resistance are separate mitigation channels.
 const mitigate=(raw,element,target,statuses)=>element==='physical'
  ?raw*100/(100+Math.max(0,target.def||0)*(active(statuses,'armorBreak')?.7:1))
  :raw*(1-resist(target.resist,element));
 const out=(win,reason)=>({view:snapshot(),win,reason,seconds:+t.toFixed(6),hp:Math.max(0,hp),cp,casts,potionsUsed,state:{cursor,...(p.skillRules?{form,transformReady:Math.max(0,transformReady-t),guardUntil:Math.max(0,guardUntil-t),guardReduction,counterUntil:Math.max(0,counterUntil-t),counterPower,counterReduction,assaultUntil:Math.max(0,assaultUntil-t),riposteUntil:Math.max(0,riposteUntil-t),linkDamage,linkDiscount,linkUntil:Math.max(0,linkUntil-t)}:{}),hp:Math.max(0,hp),cp,potions,potionCooldown:Math.max(0,potionReady-t),cooldowns:Object.fromEntries([...skills,...warrior].map(s=>[s.id,Math.max(0,s.ready-t)])),statuses:Object.fromEntries(Object.entries(ps).filter(([,v])=>v>t).map(([k,v])=>[k,v-t])),hots:hots.filter(h=>h.until>t).map(h=>({rate:h.rate,until:h.until-t}))}});
 function* victory(){while(pending?.end>t+1e-8){const next=Math.min(pending.end,t+.1),dt=next-t;hp=Math.min(maxHp,hp+Math.max(0,p.hpRegen||0)*dt*(active(ps,'curse')?.5:1)+hots.reduce((v,h)=>v+h.rate*Math.max(0,Math.min(next,h.until)-t),0));cp=Math.min(maxCp,cp+Math.max(0,p.cpRegen||0)*dt*(active(ps,'curse')?.5:1));t=next;yield snapshot();}return out(true,'victory');}
 const control=['cold','freeze','stun','petrify','confuse','sleep','charm','flee','knockout','knockback'];
 function proc(list,target,isPlayer=false){for(const q of list||[]){if(!q)continue;const k=q.type,s=isPlayer?ps:target.statuses,rr=(isPlayer?p:target).statusResist||{};
 if(target.boss&&['instant','charm','flee'].includes(k))continue;
 const group=control.includes(k)?'state':['weaponBreak','armorBreak','blind','lightDebuff','aiDown'].includes(k)?'debuff':'curse';
 const chance=clamp(q.chance)*(1-clamp((rr[k]||0)+(rr.all||0)+(rr[group]||0)))*(target.boss&&control.includes(k)?.25:1);
 if(rnd()>=chance)continue;
 if(k==='instant'){if(isPlayer)hp=0;else target.hp=0;continue;}
 if(k==='crush'){if(isPlayer)hp-=hp*.25*(1-clamp(p.crushResist));else target.hp-=target.hp*.25*(1-clamp(target.crushResist));continue;}
 let d=Math.max(.1,q.duration||1);if(['flee','knockback'].includes(k)&&isPlayer)d/=Math.max(.1,p.moveSpeed||1);
 if(k==='flee'&&!isPlayer)chaseDelay+=.5/Math.max(.1,p.moveSpeed||1);
 s[k]=Math.max(s[k]||0,t+d);
 }}
 function begin(){if(disabled(ps)||(active(ps,'confuse')&&rnd()<.5)){pending={done:t+.1,wait:true};return;}
 if(p.skillRules&&p.requestedForm&&p.requestedForm!==form&&transformReady<=t){form=p.requestedForm;p.requestedForm=null;transformReady=t+5;cursor=0;if(form==='warrior'){if(assaultUntil>t&&rank('assault')){linkDamage=1.2+.04*rank('assault');assaultUntil=0;linkUntil=t+5;}if(riposteUntil>t&&rank('riposte')){linkDiscount=.25+.05*rank('riposte');riposteUntil=0;linkUntil=t+5;}}else{linkDamage=1;linkDiscount=0;}events.push({type:'form',form,time:t});}
 if(linkUntil<=t){linkDamage=1;linkDiscount=0;}
 const eligible=s=>(s.type!=='guard'||hp/maxHp<=.6)&&(s.type!=='focus'||cp/maxCp<=.4)&&s.ready<=t+1e-8&&(s.type==='potion'?potions>0&&potionReady<=t&&hp/maxHp<=clamp(s.hpBelow??.4):cp>=Math.max(0,s.cost||0)*(form==='warrior'?1-linkDiscount:1));
 let s;const actions=form==='warrior'&&warrior.length?warrior:skills;
 if(p.autoPotion&&potions>0&&potionReady<=t&&hp/maxHp<=p.autoPotion.hpBelow)s={...p.autoPotion,ready:potionReady};
 if(!s&&p.ordered){for(let n=0;n<actions.length;n++){const i=(cursor+n)%actions.length;if(eligible(actions[i])){s=actions[i];cursor=(i+1)%actions.length;break;}}}else if(!s)s=actions.find(eligible);
 if(!s)s={id:'basic',mult:1,cast:1,targets:1,basic:true,hitFractions:p.ordered?[165/405]:undefined};
 if(s.type==='potion'){potions--;potionsUsed++;potionReady=t+Math.max(.1,s.cooldown??15);s.ready=potionReady;}
 else{cp-=Math.max(0,s.cost||0)*(form==='warrior'&&!s.basic?1-linkDiscount:1);s.ready=t+Math.max(0,s.cooldown||0)*(1-clamp(p.cdr,0,.6));}
 const damageBonus=form==='warrior'&&!s.basic?linkDamage:1;if(form==='warrior'&&!s.basic&&s.type!=='potion'){linkDamage=1;linkDiscount=0;}
 const slow=active(ps,'cold')?1.5:1;
 const duration=chaseDelay+Math.max(.05,(s.cast||.1)*(s.type==='potion'?1:slow/Math.max(.1,p.attackSpeed||1)));pending={s,damageBonus,start:t,end:t+duration,done:t+duration,hit:0};if(s.hitFractions)pending.done=t+duration*s.hitFractions[0];events.push({type:"cast",id:s.id,time:t,duration});chaseDelay=0;
 }
 if(hp<=0)return out(false,'defeat');if(!living().length)return yield* victory();begin();
 while(t<maxSeconds&&hp>0&&living().length){
 yield snapshot();
 const next=Math.min(maxSeconds,t+.1,pending.done,...living().map(e=>e.next)),dt=next-t;
 if(!(dt>=0))throw Error('combat clock reversed');
 hp=Math.min(maxHp,hp+Math.max(0,p.hpRegen||0)*dt*(active(ps,'curse')?.5:1)+hots.reduce((s,h)=>s+h.rate*Math.max(0,Math.min(next,h.until)-t),0));
 cp=Math.min(maxCp,cp+Math.max(0,p.cpRegen||0)*dt*(active(ps,'curse')?.5:1));t=next;
 for(const e of living())e.hp=Math.min(e.maxHp,e.hp+Math.max(0,e.hpRegen||0)*dt*(active(e.statuses,'curse')?.5:1));
 for(const e of living())if(e.poisonUntil>t-dt)e.hp=Math.max(0,e.hp+(0-e.poisonRate)*Math.max(0,Math.min(t,e.poisonUntil)-(t-dt)));
 if(!living().length)return yield* victory();
 if(pending.done<=t+1e-8){const s=pending.s;if(s&&!pending.recovery&&!disabled(ps)){
 if(!pending.hit)casts[s.id]=(casts[s.id]||0)+1;
 if(s.type==='potion'){const duration=6/Math.max(.1,p.potionSpeed||1);hots.push({rate:maxHp*clamp(s.healRatio??.3)/duration,until:t+duration});}
 else if(s.type==='guard'){guardUntil=t+s.duration;guardReduction=s.reduction||.25;events.push({type:'buff',id:s.id,time:t});}
 else if(s.type==='counter'){counterUntil=t+s.duration;counterPower=s.mult;counterReduction=s.reduction||.45;events.push({type:'buff',id:s.id,time:t});}
 else if(s.type==='focus'){const amount=Math.min(maxCp-cp,s.cpRestore||18);cp+=amount;events.push({type:'cp',id:s.id,amount,time:t});}
 else for(const e of living().slice(0,Math.max(1,s.targets||1))){
 const hit=p.absoluteHit?1:clamp((p.hit??.95)+(s.hitBonus||0)-(p.ignoreEvade?0:Math.max(0,(e.evade||0)-(active(e.statuses,'lightDebuff')?.15:0)))-(active(ps,'blind')||active(ps,'lightDebuff')?.15:0),.05,1);if(rnd()>=hit){events.push({type:"miss",target:foes.indexOf(e),time:t});continue;}
 const crit=rnd()<clamp((p.crit||0)-(e.critResist||0));
 const flat=(p.minAttack||0)+rnd()*Math.max(0,(p.maxAttack||0)-(p.minAttack||0));
 const element=s.element||'physical';
 const raw=Math.max(0,element==='physical'?(p.atk||0)+flat:s.powerSource==='weapon'?((p.atk||0)+flat)*(1+(p.stats?.知識||0)/500):(p.magicPower||0))*(s.mult??1)*(pending.damageBonus||1)/(s.hitFractions?.length||1)*(crit?Math.max(1,p.critMult||1.5):1)*(active(ps,'weaponBreak')?.7:1)*(active(ps,'berserk')?1.2:1);
 let damage=mitigate(raw,element,e,e.statuses);
 for(const [el,v]of Object.entries(p.elementDamage||{})){const amt=(v[0]+rnd()*(v[1]-v[0]))*(1-resist(e.resist,el));if(el==='earth'){const duration=Math.max(.1,p.poisonDuration||2);e.poisonRate=amt/duration*(1-clamp((e.statusResist?.poison||0)+(e.statusResist?.state||0)+(e.statusResist?.all||0)));e.poisonUntil=t+duration;}else damage+=amt/(s.hitFractions?.length||1);}
 
 const actual=Math.min(e.hp,Math.max(0,damage));e.hp-=actual;events.push({type:"hit",id:s.id,target:foes.indexOf(e),damage:actual,element,crit,time:t});if(actual>0)delete e.statuses.sleep;hp=Math.min(maxHp,hp+actual*clamp(p.life)/(p.skillRules?Math.max(1,s.targets||1):1));proc(p.skillRules?(p.procs||[]).map(q=>({...q,chance:1-Math.pow(1-clamp(q.chance),1/(s.hitFractions?.length||1))})):p.procs,e);proc(s.procs,e);if(s.id==='break'&&active(e.statuses,'armorBreak'))assaultUntil=t+5;if(p.crush&&rnd()<clamp(p.crush)*(1-clamp(e.crushResist)))e.hp-=Math.max(0,e.hp)*.25;
 }if(s.basic)cp=Math.min(maxCp,cp+8*(1+(p.cpBonus||0)));
 }
 if(pending.s?.hitFractions&&!pending.recovery){pending.hit++;if(pending.hit<pending.s.hitFractions.length)pending.done=pending.start+(pending.end-pending.start)*pending.s.hitFractions[pending.hit];else{pending.recovery=true;pending.done=pending.end;}}else pending=null;}
 if(!living().length)return yield* victory();
 for(const e of living()){if(e.hp<=0||e.next>t+1e-8)continue;
 e.next=t+Math.max(.1,e.interval||2)*(active(e.statuses,'cold')?1.5:1)*(active(e.statuses,'aiDown')?1.2:1);
 if(active(e.statuses,'charm')||active(e.statuses,'confuse')){
 const others=living().filter(x=>x!==e);const target=active(e.statuses,'charm')?(others.length?others[Math.floor(rnd()*others.length)]:null):[...others,e,null][Math.floor(rnd()*(others.length+2))];
 if(target){const damage=mitigate(Math.max(0,e.atk||0),e.element||'physical',target,target.statuses);target.hp=Math.max(0,target.hp-damage);continue;}
 if(active(e.statuses,'charm'))continue;
 }
 if(disabled(e.statuses))continue;
 if(rnd()>=clamp((p.ignoreHit?(e.baseHit??.95):(e.hit??1))-Math.max(0,(p.evade||0)-(active(ps,'lightDebuff')?.15:0))-(active(e.statuses,'blind')||active(e.statuses,'lightDebuff')?.15:0),.05,1))continue;
 if(rnd()<clamp(p.block)){if(pending)pending.done+=.15/Math.max(.1,p.blockSpeed||1);continue;}
 const critical=rnd()<clamp((e.crit||0)-(p.critResist||0));let d=mitigate(Math.max(0,e.atk||0)*(critical?1.7:1)*(active(e.statuses,'weaponBreak')?.7:1)*(active(e.statuses,'berserk')?1.2:1),e.element||'physical',p,ps);
 if(guardUntil>t)d*=1-guardReduction;
 if(counterUntil>t&&!disabled(ps)&&hp>0){d*=1-counterReduction;counterUntil=0;const damage=Math.min(e.hp,mitigate((p.atk||0)*counterPower,'physical',e,e.statuses));e.hp-=damage;riposteUntil=t+5;events.push({type:'hit',id:'counter',target:foes.indexOf(e),damage,element:'physical',time:t});}
 const absorb=clamp(p.absorb?.[e.element]);hp-=d*(1-absorb);events.push({type:"hurt",target:foes.indexOf(e),damage:d*(1-absorb),time:t});if(d>0)delete ps.sleep;if(hp>0)hp=Math.min(maxHp,hp+d*absorb);
 if(rnd()<.1&&hp>0)hp=Math.min(maxHp,hp+d*clamp(p.firstAid));cp=Math.min(maxCp,cp+d*clamp(p.cpConvert));
 cp=Math.max(Math.min(cp,p.cpFloor||0),cp-Math.max(0,e.cpDrain||0)*(1-clamp(p.concentration)));
 e.hp-=d*clamp(p.reflect);proc(e.procs,p,true);proc(p.counterCold?[{type:'cold',...p.counterCold}]:[],e);proc(p.counterFreeze?[{type:'freeze',...p.counterFreeze}]:[],e);
 if(e.crush&&rnd()<e.crush)hp-=Math.max(0,hp)*.25*(1-clamp(p.crushResist));
 if(hp<=0){if(rnd()<clamp(p.reviveChance)){hp=maxHp*.3;}else return out(false,'defeat');}
 }
 if(!living().length)return yield* victory();if(!pending)begin();
 }
 return out(false,hp<=0?'defeat':'timeout');
}
function battle(args){const g=stream(args);let x;do{x=g.next();}while(!x.done);return x.value;}
module.exports={battle,stream};
