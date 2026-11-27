// Stage 2 candidate: deterministic state transitions, using stage-1 combat core.
import {core} from './combat-math.js';
function createEngine(core){
 const VERSION=17,MAX_ROUND=200,MAX_ACTORS=16,DEFAULT_LOG=8192,MAX_LOG=100000;
 const ownedStates=new WeakSet();
 const copy=x=>JSON.parse(JSON.stringify(x));
 function requireState(s){if(!s||!ownedStates.has(s))fail("untrusted battle state; use restoreCheckpoint");return s}
 function freeze(x){if(x&&typeof x==="object"&&!Object.isFrozen(x)){for(const v of Object.values(x))freeze(v);Object.freeze(x)}return x}
 // A transition shares only recursively frozen event records, never mutable actor data.
 function transitionCopy(s){const {log,...body}=s;let n=copy(body);n.log=log.map(e=>Object.isFrozen(e)?e:freeze(copy(e)));return n}
 function trimLog(s){if(s.log.length>s.logLimit)s.log.splice(0,s.log.length-s.logLimit);s.logStartSeq=s.log.length?s.log[0].seq:s.eventSeq+1;return s}
 function seal(s){const n=freeze(trimLog(s));ownedStates.add(n);return n}
 const cmp=(a,b)=>a<b?-1:a>b?1:0;
 function fail(m){throw new RangeError(m)}
 function obj(x,n){if(!x||typeof x!=="object"||Array.isArray(x)||![Object.prototype,null].includes(Object.getPrototypeOf(x)))fail(n);return x}
 function keys(x,required,optional=[],n="object"){obj(x,n);for(const k of required)if(!Object.hasOwn(x,k))fail(n+" missing "+k);for(const k of Object.keys(x))if(!required.includes(k)&&!optional.includes(k))fail(n+" unknown "+k);return x}
 function jsonInput(x,path="input",seen=new Set(),budget={left:50000},depth=0){if(depth>32||--budget.left<0)fail("config complexity");if(typeof x==="string"||typeof x==="boolean"||Number.isSafeInteger(x))return;if(x===null||typeof x!=="object")fail(path+" invalid primitive");if(seen.has(x))fail(path+" cycle");seen.add(x);if(Array.isArray(x)){list(x,0,10000,path);for(let i=0;i<x.length;i++)jsonInput(x[i],path+"["+i+"]",seen,budget,depth+1)}else{obj(x,path);for(const [k,v] of Object.entries(x))jsonInput(v,path+"."+k,seen,budget,depth+1)}seen.delete(x)}
 function int(x,min,max,n){if(!Number.isSafeInteger(x)||x<min||x>max)fail(n);return x}
 function id(x,n="id"){if(typeof x!=="string"||!/^[a-zA-Z0-9_-]{1,64}$/.test(x)||(Object.hasOwn(Object.prototype,x)||x==="prototype"))fail(n);return x}
 function bool(x,n){if(typeof x!=="boolean")fail(n);return x}
 function list(x,min,max,n){if(!Array.isArray(x)||x.length<min||x.length>max||Object.keys(x).length!==x.length)fail(n);for(let i=0;i<x.length;i++)if(!Object.hasOwn(x,i))fail(n+" sparse");return x}
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const half=(n,d)=>Math.floor((n+Math.floor(d/2))/d);
 const own=(o,k)=>Object.hasOwn(o,k)?o[k]:undefined;
 const sideOf=(s,a)=>s.actors[a].side;
 const opposite=side=>side==="party"?"enemy":"party";
 const slots=(s,side)=>side==="party"?s.front:s.enemies;
 const alive=(s,a)=>a!==null&&!!own(s.actors,a)&&s.actors[a].vitals.hp>0;
 const active=(s,a)=>slots(s,sideOf(s,a)).includes(a);
 const onField=(s,a)=>alive(s,a)&&active(s,a);
 const ordered=(s,side)=>slots(s,side).filter(a=>alive(s,a));
 function event(s,type,payload={}){
  s.log.push(freeze({seq:++s.eventSeq,round:s.round,type,...(s.actionSeq?{actionSeq:s.actionSeq}:{}),...copy(payload)}))
 }
 // Rejection sampling avoids modulo bias. PRNG state is serializable and used only by resolution.
 function ppm(s){int(s.rng,1,4294967295,"RNG state");let x;do{x=s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;x=s.rng-1;}while(x>=4294000000);return x%1000000}
 function rolls(s,n){return Array.from({length:n},()=>({hitPpm:ppm(s),critPpm:ppm(s),variancePpm:ppm(s)}))}
 function setVitals(a,next){core.validateState(next);if(a.shieldLayers.reduce((sum,x)=>sum+x.remaining,0)!==next.shield)fail("shield ledger mismatch");a.anchor=core.refreshResizeAnchor(a.vitals,next,a.anchor);a.vitals=next}
 function addShieldLayer(s,source,target,amount){
  if(amount<=0)return null;const layer={id:++s.shieldSeq,source,remaining:amount};s.actors[target].shieldLayers.push(layer);return layer.id
 }
 function consumeShield(s,target,amount,origin,attacker){
  if(!amount)return [];let layers=s.actors[target].shieldLayers,remaining=amount,allocations=[];
  while(remaining>0){let layer=layers[0];if(!layer)fail("missing shield layer");let used=Math.min(remaining,layer.remaining);layer.remaining-=used;remaining-=used;allocations.push({id:layer.id,source:layer.source,amount:used});if(!layer.remaining)layers.shift()}
  event(s,"shield_absorbed",{target,attacker,origin,amount,allocations});return allocations
 }
 function resources(a,mp,spCenti){let x=core.resource(a.vitals,"mp",-mp);if(!x.ok)return false;let y=core.resource(x.state,"spCenti",-spCenti);if(!y.ok)return false;setVitals(a,y.state);return true}
 function gain(s,a,base,reason){if(!alive(s,a)||base<=0)return;let x=s.actors[a],v=core.spGainCenti(base,x.stats.ability.WIL,x.stats.level,clamp(modSum(s,a,"sp_gain",{source:a,reason}),-10000,10000));let y=core.resource(x.vitals,"spCenti",v);setVitals(x,y.state);event(s,"sp_gain",{actor:a,amount:y.change,reason})}
 const STATUSES=Object.freeze(Object.fromEntries(Object.entries({
  poison:{category:"ailment",dot:true},burn:{category:"ailment",dot:true},freeze:{category:"control",hard:true},paralysis:{category:"control",hard:true},sleep:{category:"control",hard:true},silence:{category:"ailment"},blind:{category:"ailment"},slow:{category:"ailment"},weaken:{category:"ailment"},curse:{category:"ailment"},corrode:{category:"ailment"},might:{category:"buff"},arcane:{category:"buff"},fortify:{category:"buff"},ward:{category:"buff"},haste:{category:"buff"},precision:{category:"buff"},dodge:{category:"buff"},mend:{category:"buff"},aegis:{category:"buff"},focus:{category:"buff"},resolve:{category:"buff"}
 }).map(([k,v])=>[k,Object.freeze(v)])));
 // Declarative, bounded rules. No callbacks, arbitrary code, or nested trigger execution.
 const MOD_HOOKS=["damage_out","damage_in","sp_gain","heal_out","barrier_out","accuracy","critical","penetration","speed","status_resist","status_chance","slow_magnitude","item_effect"];
 const TRIGGER_HOOKS=["hit","action_end","guard","resist","shield_absorb","knockout"];
 const GROUPS=["personal","job","equipment","bond"];
 const PREDICATES=["hpAtMostBp","targetHpAtMostBp","hpCrossBp","kind","element","origin","reason","covered","mixed","weakOriginal","targetUnacted","firstRound","critical","minHpDamage","landed","requiresToken","skillKind","effective","item","positiveSupport","positiveBuff","cleansedEnemy","weakMagicHpDamage","mixedHpDamage","sourceEnemy","hasStatus","attackReach","attackTarget","normalGuard","fusion","firstAllyKnockout","actionHpAtMostBp","supportSkill"];
 function validateRules(raw){
  const result=list(raw,0,32,"effect rules").map(r=>{
   keys(r,["id","hook","when"],["group","valueBp","role","limit","effect","consumeOnMatch"],"rule");id(r.id,"rule id");
   keys(r.when,[],PREDICATES,"condition");
   for(const [k,v] of Object.entries(r.when)){
    if(["hpAtMostBp","targetHpAtMostBp","hpCrossBp","actionHpAtMostBp"].includes(k))int(v,1,10000,k);
    else if(k==="minHpDamage")int(v,1,1000000,k);
    else if(["covered","mixed","weakOriginal","targetUnacted","firstRound","critical","landed","effective","item","positiveSupport","positiveBuff","cleansedEnemy","weakMagicHpDamage","mixedHpDamage","sourceEnemy","normalGuard","fusion","firstAllyKnockout","supportSkill"].includes(k))bool(v,k);
    else if(k==="hasStatus"){if(!own(STATUSES,v))fail(k)}
    else if(k==="attackReach"){if(!["melee","ranged"].includes(v))fail(k)}
    else if(k==="attackTarget"){if(!["enemy_single","enemy_all"].includes(v))fail(k)}
    else if(k==="kind"){if(!["physical","magic","fixed"].includes(v))fail(k)}
    else if(k==="element"){if(v!=="elemental"&&!core.ELEMENTS.includes(v))fail(k)}
    else if(k==="origin"){if(!["attack","counter","followup","reflect","dot","item"].includes(v))fail(k)}
    else id(v,k);
   }
   const allowed={damage_out:["hpAtMostBp","targetHpAtMostBp","kind","element","origin","covered","mixed","weakOriginal","targetUnacted","firstRound","requiresToken"],damage_in:["hpAtMostBp","targetHpAtMostBp","kind","element","origin","covered","mixed","weakOriginal","targetUnacted","firstRound"],sp_gain:["hpAtMostBp","reason","firstRound"],heal_out:["hpAtMostBp","targetHpAtMostBp","firstRound"],barrier_out:["hpAtMostBp","targetHpAtMostBp","firstRound"],accuracy:["hpAtMostBp","targetHpAtMostBp","origin","covered","mixed","targetUnacted","firstRound","requiresToken"],critical:["hpAtMostBp","targetHpAtMostBp","origin","covered","mixed","targetUnacted","firstRound","requiresToken"],penetration:["hpAtMostBp","targetHpAtMostBp","kind","element","origin","covered","mixed","weakOriginal","targetUnacted","firstRound","requiresToken"],speed:["hpAtMostBp","firstRound"],slow_magnitude:["hpAtMostBp","firstRound"],item_effect:["hpAtMostBp","firstRound"],status_resist:["hpAtMostBp","targetHpAtMostBp","reason","firstRound"],status_chance:["hpAtMostBp","targetHpAtMostBp","reason","firstRound"],hit:["hpAtMostBp","targetHpAtMostBp","hpCrossBp","kind","element","origin","covered","mixed","weakOriginal","targetUnacted","firstRound","critical","minHpDamage","landed"],action_end:["hpAtMostBp","firstRound","skillKind","effective","item","reason","positiveSupport","positiveBuff","cleansedEnemy","weakMagicHpDamage","mixedHpDamage"],guard:["hpAtMostBp","firstRound","reason"],resist:["hpAtMostBp","targetHpAtMostBp","firstRound","reason"],shield_absorb:["hpAtMostBp","targetHpAtMostBp","firstRound","minHpDamage","covered"],knockout:["hpAtMostBp","targetHpAtMostBp","firstRound","origin","minHpDamage"]};
   for(const h of ["hit","resist","shield_absorb","knockout"])allowed[h].push("sourceEnemy");allowed.hit.push("attackReach","attackTarget","normalGuard");allowed.action_end.push("hasStatus","fusion","supportSkill");allowed.knockout.push("firstAllyKnockout");allowed.damage_out.push("actionHpAtMostBp");
   if(!Object.hasOwn(allowed,r.hook)||Object.keys(r.when).some(k=>!allowed[r.hook].includes(k)))fail("condition unavailable at hook");
   if(MOD_HOOKS.includes(r.hook)){
    if(!GROUPS.includes(r.group)||Object.hasOwn(r,"consumeOnMatch")||Object.hasOwn(r,"effect")||Object.hasOwn(r,"role")||Object.hasOwn(r,"limit"))fail("modifier contract");
    int(r.valueBp,r.hook==="damage_in"?0:-5000,r.hook==="damage_in"?8000:10000,"modifier value");
   }else if(TRIGGER_HOOKS.includes(r.hook)){
    const roles={hit:["source","target","ally"],action_end:["source","self"],guard:["source","self"],resist:["source","target","ally"],shield_absorb:["shield_source","target"],knockout:["source","ally"]};
    if(Object.hasOwn(r,"group")||Object.hasOwn(r,"valueBp")||!roles[r.hook].includes(r.role))fail("trigger contract");
    keys(r.limit,["scope","count"],[],"trigger limit");if(!["round","battle","action"].includes(r.limit.scope))fail("limit scope");int(r.limit.count,1,r.limit.scope==="action"?1:8,"limit count");if(Object.hasOwn(r,"consumeOnMatch"))bool(r.consumeOnMatch,"consume on match");
    const e=r.effect;obj(e,"trigger effect");
    if(e.kind==="sp"||e.kind==="mp"){keys(e,["kind","amount"],["target"],"resource effect");int(e.amount,1,e.kind==="sp"?10000:1000000,"amount")}
    else if(e.kind==="barrier"){keys(e,["kind","ratioBp"],["target"],"barrier effect");int(e.ratioBp,1,5000,"barrier ratio")}
    else if(e.kind==="order"){keys(e,["kind","valueBp","target"],[],"order effect");int(e.valueBp,-5000,5000,"order value");if(!e.valueBp||!((r.hook==="action_end"&&e.target==="buff_ally")||(r.hook==="hit"&&r.role==="source"&&e.target==="hit_target"&&e.valueBp<0)))fail("order effect contract")}
    else if(e.kind==="counter"){keys(e,["kind","skill"],[],"forced counter");id(e.skill,"counter skill");if(r.hook!=="hit"||r.role!=="target"||r.when.minHpDamage===undefined||r.when.sourceEnemy!==true)fail("forced counter contract")}
    else if(e.kind==="mp_refund"){keys(e,["kind","ratioBp","cap"],[],"MP refund");int(e.ratioBp,1,10000,"refund ratio");int(e.cap,1,1000000,"refund cap");if(r.hook!=="action_end")fail("refund requires action end")}
    else if(e.kind==="token"){keys(e,["kind","id","duration"],["consume"],"token effect");id(e.id,"token id");int(e.duration,1,10,"token duration");if(e.consume!==undefined&&!["attack","elemental"].includes(e.consume))fail("token consumption policy")}
    else fail("trigger effect kind");
    if(Object.hasOwn(e,"target")&&(!["owner","buff_ally","cleansed_ally","hit_target"].includes(e.target)||e.target==="hit_target"&&e.kind!=="order"||!["owner","hit_target"].includes(e.target)&&r.hook!=="action_end"))fail("trigger target policy");
   }else fail("effect hook");
   return copy(r)
  });
  if(new Set(result.map(r=>r.id)).size!==result.length)fail("duplicate rule ID");const tokens=new Map();for(const r of result.filter(r=>r.effect?.kind==="token")){let e=r.effect,policy=e.consume??"attack";if(tokens.has(e.id)&&tokens.get(e.id)!==policy)fail("inconsistent token consumption policy");tokens.set(e.id,policy)}if(result.some(r=>r.when.requiresToken&&!tokens.has(r.when.requiresToken)))fail("unknown token reference");return result.sort((a,b)=>cmp(a.id,b.id))
 }
 function matches(s,owner,when,ctx){
  const a=s.actors[owner],t=ctx.target?own(s.actors,ctx.target):null;
  for(const [k,v] of Object.entries(when)){
   if(k==="hpAtMostBp"){if(a.vitals.hp*10000>a.vitals.hpMax*v)return false}
   else if(k==="actionHpAtMostBp"){const hp=ctx.actionHp??a.vitals.hp;if(hp*10000>a.vitals.hpMax*v)return false}
   else if(k==="firstAllyKnockout"){if((a.enemyAllyFalls===1)!==v)return false}
   else if(k==="targetHpAtMostBp"){if(!t||t.vitals.hp*10000>t.vitals.hpMax*v)return false}
   else if(k==="hpCrossBp"){if(ctx.target!==owner||ctx.hpBefore===undefined||ctx.hpBefore*10000<=a.vitals.hpMax*v||a.vitals.hp*10000>a.vitals.hpMax*v)return false}
   else if(k==="minHpDamage"){if((ctx.hpDamage??0)<v)return false}
   else if(k==="sourceEnemy"){if(!ctx.source||((sideOf(s,ctx.source)!==a.side)!==v))return false}
   else if(k==="hasStatus"){if(!own(a.statuses,v))return false}
   else if(k==="normalGuard"){if((a.guardKind==="normal")!==v)return false}
   else if(k==="firstRound"){if((s.round===1)!==v)return false}
   else if(k==="requiresToken"){if(!(ctx.tokens??[]).includes(v))return false}
   else if(k==="element"&&v==="elemental"){if(!ctx.element||ctx.element==="none")return false}
   else if(ctx[k]!==v)return false
  }return true
 }
 function modGroups(s,owner,hook,ctx){
  if(!s.hasRules||!onField(s,owner)||!s.actors[owner].rules.length)return [];const sums={};
  for(const r of s.actors[owner].rules)if(r.hook===hook&&matches(s,owner,r.when,ctx))sums[r.group]=(sums[r.group]??0)+r.valueBp;
  return GROUPS.filter(g=>Object.hasOwn(sums,g)).map(g=>clamp(sums[g],hook==="damage_in"?0:-9000,hook==="damage_in"?8000:30000))
 }
 function modSum(s,owner,hook,ctx){return modGroups(s,owner,hook,ctx).reduce((a,b)=>a+b,0)}
 function dispatch(s,hook,ctx){if(!s.hasRules)return;
  // Called only at committed state boundaries, never by the event logger or by rule effects.
  for(const owner of Object.keys(s.actors).sort(cmp)){
   if(!onField(s,owner))continue;const a=s.actors[owner];
   for(const r of a.rules){
    if(r.hook!==hook)continue;
    if(r.role==="source"&&ctx.source!==owner||r.role==="target"&&ctx.target!==owner||r.role==="self"&&ctx.source!==owner||r.role==="ally"&&(!ctx.target||ctx.target===owner||sideOf(s,ctx.target)!==a.side)||r.role==="shield_source"&&!(ctx.shieldSources??[]).includes(owner))continue;
    const componentCondition=["kind","element","weakOriginal"].some(k=>Object.hasOwn(r.when,k));
    if(hook==="hit"&&componentCondition){if(!(ctx.components??[]).some(p=>matches(s,owner,r.when,{...ctx,...p})))continue}else if(!matches(s,owner,r.when,ctx))continue;
    const used=own(a.ruleUses,r.id)??{battle:0,round:0,roundNumber:0,action:0};
    if(used.roundNumber!==s.round){used.round=0;used.roundNumber=s.round}
    if((r.limit.scope!=="action"&&used[r.limit.scope]>=r.limit.count)||s.actionSeq&&used.action===s.actionSeq)continue;
    const e=r.effect;let amount=0,recipient=owner;
    if(e.target==="hit_target"){recipient=ctx.target;if(!recipient||!onField(s,recipient)||s.actors[recipient].acted||s.actors[recipient].shiftImmune||sideOf(s,recipient)===a.side)continue}
    else if(e.target&&e.target!=="owner"){const candidates=(e.target==="buff_ally"?ctx.buffTargets:ctx.cleanseTargets)??[];recipient=[...new Set(candidates)].filter(k=>(e.target!=="buff_ally"||k!==owner)&&onField(s,k)&&sideOf(s,k)===a.side&&(e.kind!=="order"||!s.actors[k].acted)).sort((u,v)=>s.actors[u].vitals.hp*s.actors[v].vitals.hpMax-s.actors[v].vitals.hp*s.actors[u].vitals.hpMax||cmp(u,v))[0];if(!recipient)continue}
    let dst=s.actors[recipient];
    if(e.kind==="sp"||e.kind==="mp"||e.kind==="mp_refund"){let key=e.kind==="sp"?"spCenti":"mp",value=e.kind==="mp_refund"?Math.min(e.cap,Math.floor((ctx.mpSpent??0)*e.ratioBp/10000)):e.amount,x=core.resource(dst.vitals,key,value);amount=x.change;if(amount)setVitals(dst,x.state)}
    else if(e.kind==="barrier"){let x=core.barrier(dst.vitals,half(dst.vitals.hpMax*e.ratioBp,10000));amount=x.effective;if(amount){let layerId=addShieldLayer(s,owner,recipient,amount);setVitals(dst,x.state);event(s,"barrier",{source:owner,target:recipient,effective:amount,layerId,rule:r.id})}}
    else if(e.kind==="order"){const old=own(s.orderMods,recipient)??0,next=clamp(old+e.valueBp,-5000,5000);if(old!==next){s.orderMods[recipient]=next;amount=Math.abs(next-old);requestReorder(s);event(s,"order_modifier",{source:owner,target:recipient,valueBp:next,rule:r.id})}}
    else if(e.kind==="counter"){if(!ctx.source||!onField(s,ctx.source)||own(s.forcedCounters,owner)||!reactionEligible(s,owner,e.skill)||!candidateIds(s,owner,s.catalog[e.skill]).includes(ctx.source))continue;s.forcedCounters[owner]={source:ctx.source,skill:e.skill,rule:r.id};amount=1;event(s,"counter_reserved",{actor:owner,target:ctx.source,skill:e.skill,rule:r.id})}
    else if(e.kind==="token"){const expires=s.round+e.duration-1;if((own(a.tokens,e.id)??0)<expires){a.tokens[e.id]=expires;amount=1;event(s,"token_added",{actor:owner,token:e.id,expires})}}
    if(!amount&&!r.consumeOnMatch)continue;
    used.battle++;used.round++;used.action=s.actionSeq;a.ruleUses[r.id]=used;
    if(!amount){event(s,"rule_matched_no_effect",{actor:owner,target:recipient,rule:r.id,hook});continue}
    if(e.kind==="sp")event(s,"sp_gain",{actor:recipient,amount,reason:"rule"});
    if(e.kind==="mp"||e.kind==="mp_refund")event(s,"mp_restored",{source:owner,target:recipient,effective:amount,rule:r.id});
    event(s,"rule_triggered",{actor:owner,target:recipient,rule:r.id,hook,amount});
   }
  }
 }
 function statusValue(a,k){return own(a.statuses,k)?.powerBp??0}
 function statusDef(v,buff=false){
  keys(v,["id","duration","powerBp","chanceBp"],["maxDamage"],"status");if(!own(STATUSES,v.id)|| (STATUSES[v.id].category==="buff")!==buff)fail("status polarity");
  int(v.duration,1,10,"duration");int(v.powerBp,0,10000,"power");int(v.chanceBp,0,10000,"chance");if(buff&&(v.chanceBp!==10000||v.powerBp<1||v.powerBp>5000))fail("buff range");if(v.id==="corrode"&&(v.powerBp<1||v.powerBp>5000))fail("corrode range");
  if(STATUSES[v.id].dot){int(v.maxDamage,1,1000000,"dot cap");if(v.powerBp===0)fail("zero dot")}
  else if(Object.hasOwn(v,"maxDamage"))fail("unexpected dot cap");
  return v;
 }
 const specs={attack:["components","hits","reach","target","baseHitBp","status"],heal:["coefficientBp","fixed","target"],barrier:["coefficientBp","fixed","target"],revive:["ratioBp","target"],cleanse:["categories","target"],inflict:["status","target","reach"],restore_mp:["amount","target"],empower:["status","target"],dispel:["target","reach"],shift:["direction","target","reach"],drain:["ratioBp","maxHeal","target"],compound:["target","reach","effects"],summon:["summonIds"],guard:[],cover:[],swap:[],wait:[]};
 const defaults={attack:{hits:1,reach:"melee",target:"enemy_single",baseHitBp:8200},heal:{coefficientBp:10000,fixed:0,target:"ally_single"},barrier:{coefficientBp:10000,fixed:0,target:"ally_single"},revive:{ratioBp:3000,target:"ally_dead"},cleanse:{categories:["ailment","control"],target:"ally_single"},inflict:{target:"enemy_single",reach:"ranged"},restore_mp:{target:"ally_single"},empower:{target:"ally_single"},dispel:{target:"enemy_single",reach:"ranged"},shift:{target:"ally_single",reach:"ranged",retarget:false},drain:{target:"self"},compound:{target:"enemy_single",reach:"ranged"}};
 const common=["kind","speedBp","mp","spCenti","cd","magical","retarget"];
 const BUILTINS={basic:{kind:"attack",components:[{kind:"physical",coefficientBp:10000}],hits:1,reach:"melee",target:"enemy_single"},guard:{kind:"guard",speedBp:15000},cover:{kind:"cover",speedBp:15000},swap:{kind:"swap",speedBp:15000},wait:{kind:"wait"}};
 function validateSkill(raw,nested=false){
  obj(raw,"skill");if(!own(specs,raw.kind))fail("skill kind");
  keys(raw,["kind"],[...common.filter(k=>k!=="kind"),...specs[raw.kind]],"skill");
  let a={speedBp:10000,mp:0,spCenti:0,cd:0,magical:false,retarget:true,...copy(defaults[raw.kind]??{}),...copy(raw)};
  int(a.speedBp,1000,30000,"speed");int(a.mp,0,1000000,"MP cost");int(a.spCenti,0,10000,"SP cost");int(a.cd,0,20,"cooldown");bool(a.magical,"magical");bool(a.retarget,"retarget");
  if(["guard","cover","swap","wait"].includes(a.kind)){if(a.mp||a.spCenti||a.cd||a.magical)fail("built-in cost");return a}
  if(a.kind==="compound"){
   if(nested)fail("nested compound");if(!["enemy_single","enemy_all","ally_single","ally_all","ally_dead","self"].includes(a.target)||!["melee","ranged"].includes(a.reach))fail("compound target");
   list(a.effects,1,4,"effects");let attacks=0,primary=0;const allowed=["attack","heal","barrier","revive","cleanse","inflict","empower","dispel","shift","drain"];
   a.effects=a.effects.map(x=>{
    keys(x,["scope","effect"],["when"],"effect step");let when=x.when??"always";if(!["always","on_damage"].includes(when)||!["primary","auto","damaged"].includes(x.scope))fail("effect scope");
    obj(x.effect,"effect");if(!allowed.includes(x.effect.kind))fail("compound effect kind");let e=validateSkill(x.effect,true);
    if(e.mp||e.spCenti||e.cd||e.speedBp!==10000||e.magical)fail("cost and timing belong to compound");
    if(when==="on_damage"&&attacks===0)fail("damage condition before attack");if(e.kind==="drain"&&(x.scope!=="auto"||when!=="on_damage"))fail("drain requires automatic damaged condition");
    if(x.scope==="damaged"&&(attacks===0||!["inflict","dispel"].includes(e.kind)||e.target!=="enemy_single"||when!=="on_damage"))fail("damaged target contract");
    if(x.scope==="primary"){primary++;if(e.target!==a.target&&!(a.target==="ally_dead"&&e.target==="ally_single"))fail("primary target mismatch");if(e.reach==="melee"&&a.reach!=="melee")fail("primary reach mismatch")}
    if(x.scope==="auto"&&!["self","ally_all","enemy_all"].includes(e.target))fail("automatic effect target");
    if(e.kind==="attack"&&++attacks>1)fail("one attack effect per compound");
    return {scope:x.scope,when,effect:e};
   });if(!primary)fail("compound requires primary effect");return a;
  }
  if(a.kind==="attack"){
   list(a.components,1,8,"components");int(a.hits,1,16,"hits");int(a.baseHitBp,0,10000,"accuracy");
   for(const c of a.components){
    keys(c,["kind"],["coefficientBp","fixed","penBp","flatPen","element","attributePenBp","canCrit"],"component");
    if(!["physical","magic","fixed"].includes(c.kind))fail("component kind");
    int(c.coefficientBp??0,0,100000,"coefficient");int(c.fixed??0,0,1000000,"fixed");
    int(c.penBp??0,0,10000,"pen");int(c.flatPen??0,0,1000000,"flat pen");int(c.attributePenBp??0,0,10000,"attr pen");
    if(!core.ELEMENTS.includes(c.element??"none")||((c.element??"none")==="none"&&(c.attributePenBp??0)!==0))fail("element");
    if(Object.hasOwn(c,"canCrit"))bool(c.canCrit,"canCrit");
    if(c.kind==="fixed"&&((c.coefficientBp??0)!==0||(c.penBp??0)!==0||(c.flatPen??0)!==0||c.canCrit===true))fail("fixed rules");
   }
   if(Object.hasOwn(a,"status"))statusDef(a.status);
  }
  if(["heal","barrier"].includes(a.kind)){int(a.coefficientBp,0,100000,"coefficient");int(a.fixed,0,1000000,"fixed")}
  if(a.kind==="revive")int(a.ratioBp,1,10000,"revive ratio");
  if(a.kind==="cleanse"){list(a.categories,1,2,"categories");if(new Set(a.categories).size!==a.categories.length||a.categories.some(x=>!["ailment","control"].includes(x)))fail("categories")}
  if(a.kind==="inflict")statusDef(a.status);if(a.kind==="empower")statusDef(a.status,true);
  if(a.kind==="restore_mp")int(a.amount,1,1000000,"restore MP");
  if(a.kind==="drain"){if(!nested||a.target!=="self")fail("drain only in compound");int(a.ratioBp,1,10000,"drain ratio");int(a.maxHeal,1,1000000,"drain cap");return a}
  if(a.kind==="shift"){if(!["advance","delay"].includes(a.direction)||a.target!==(a.direction==="advance"?"ally_single":"enemy_single")||a.reach!=="ranged")fail("shift direction/target");return a}
  if(a.kind==="summon"){list(a.summonIds,1,3,"summon ids");for(const k of a.summonIds)id(k,"summon id");if(new Set(a.summonIds).size!==a.summonIds.length)fail("duplicate summon id");return a}
  if(["attack","inflict","dispel"].includes(a.kind)){if(!["melee","ranged"].includes(a.reach)||!["enemy_single","enemy_all"].includes(a.target))fail("attack target")}
  else if(a.kind==="revive"){if(a.target!=="ally_dead")fail("revive target")}
  else if(!["ally_single","ally_all","self"].includes(a.target))fail("support target");
  return a;
 }
 function buildCatalog(raw){obj(raw,"catalog");let out={};for(const [k,v] of Object.entries(BUILTINS))out[k]=validateSkill(v);for(const [k,v] of Object.entries(raw)){id(k,"skill id");if(k==="fusion")fail("reserved fusion command");if(own(out,k))fail("reserved skill");if(["guard","cover","swap","wait"].includes(v.kind))fail("reserved control kind");out[k]=validateSkill(v)}if(Object.keys(out).length>256)fail("skill catalog limit");return out}
 function validateStats(x){keys(x,["level","ability",...core.DER,"pcritBp","mcritBp","critMultiplierBp","spMaxCenti"],[],"stats");int(x.level,1,120,"level");keys(x.ability,core.KEYS,[],"ability");for(const k of core.KEYS)int(x.ability[k],1,1000000,k);for(const k of core.DER)int(x[k],["hp","mp","spd"].includes(k)?1:0,1000000,k);int(x.pcritBp,0,7500,"pcrit");int(x.mcritBp,0,7500,"mcrit");int(x.critMultiplierBp,10000,30000,"crit multiplier");if(x.spMaxCenti!==10000)fail("SP unit")}
 function create(config){
  jsonInput(config);keys(config,["seed","actors","front","reserve","enemies"],["skills","maxRounds","enemyFrontCount","items","summonPool","logLimit","frontLimit","fusions"],"config");
  let catalog=buildCatalog(config.skills??{}),actors={},inventory={};list(config.actors,2,MAX_ACTORS,"actors");
  for(const [k,v] of Object.entries(obj(config.items??{},"items"))){
   id(k,"item id");if(k==="fusion"||own(catalog,k))fail("item/catalog collision");keys(v,["count","effect"],[],"item");
   const item=validateSkill(v.effect);if(!["heal","barrier","revive","cleanse","restore_mp","attack"].includes(item.kind)||item.mp||item.spCenti||item.cd||item.magical)fail("item effect contract");
   if(item.kind==="attack"&&(item.status||item.components.some(c=>c.kind!=="fixed")))fail("attack item requires fixed numeric damage");
   inventory[k]=int(v.count,0,9999,"item count");catalog[k]=item;
  }
  if(Object.keys(catalog).length>256)fail("catalog limit including items");
  for(const raw of config.actors){
   keys(raw,["id","side","stats"],["hp","mp","survival","skills","resistances","statusResist","boss","ai","anchor","reactions","phases","forecastMode","shiftImmune","rules"],"actor");
   let k=id(raw.id);if(own(actors,k)||!["party","enemy"].includes(raw.side))fail("actor duplicate or side");
   validateStats(raw.stats);let stats=copy(raw.stats),vitals={hp:raw.hp??stats.hp,hpMax:stats.hp,shield:0,mp:raw.mp??stats.mp,mpMax:stats.mp,spCenti:0};core.validateState(vitals);
   let anchor=raw.anchor?copy(raw.anchor):core.captureResizeAnchor(vitals);core.resize(vitals,vitals.hpMax,vitals.mpMax,anchor);
   let skillIds=list(raw.skills??[],0,64,"actor skills");if(new Set(skillIds).size!==skillIds.length||skillIds.some(x=>!own(catalog,x)||own(BUILTINS,x)||Object.hasOwn(inventory,x)))fail("actor skills");if(raw.side==="party"&&skillIds.some(k=>catalog[k].kind==="summon"))fail("enemy summon only");
   let resistance={};for(const [e,x] of Object.entries(obj(raw.resistances??{},"resistance"))){if(e==="none"||!core.ELEMENTS.includes(e))fail("resistance element");keys(x,["resistBp"],["mode"],"resistance");core.attribute({element:e,...x});resistance[e]=copy(x)}
   let statusResist={};for(const [e,x] of Object.entries(obj(raw.statusResist??{},"status resist"))){if(!own(STATUSES,e)||STATUSES[e].category==="buff")fail("status resistance");statusResist[e]=int(x,0,10000,"status resistance")}
   let ai=list(raw.ai??[],0,32,"AI").map(x=>{keys(x,["skill"],["when","thresholdBp","target","every","targetMode","minPhase"],"AI rule");if(!["basic","guard","cover","wait"].includes(x.skill)&&!skillIds.includes(x.skill))fail("AI skill");let rule={when:"always",thresholdBp:5000,target:"lowest_hp",every:1,targetMode:"actor",minPhase:0,...copy(x)};if(!["always","self_below","ally_below","ally_dead"].includes(rule.when)||!["lowest_hp","highest_atk","first"].includes(rule.target)||!["actor","slot"].includes(rule.targetMode))fail("AI rule");int(rule.thresholdBp,0,10000,"AI threshold");int(rule.every,1,20,"AI interval");int(rule.minPhase,0,8,"AI phase");return rule});
   let phases=list(raw.phases??[],0,8,"phases").map(x=>{keys(x,["id","hpBelowBp"],[],"phase");id(x.id,"phase id");int(x.hpBelowBp,1,9999,"phase threshold");return copy(x)});
   if(phases.length&&raw.boss!==true)fail("phases require boss");
   if(new Set(phases.map(x=>x.id)).size!==phases.length||phases.some((x,i)=>i>0&&phases[i-1].hpBelowBp<=x.hpBelowBp))fail("phase order");
   if(ai.some(x=>x.minPhase>phases.length))fail("AI phase out of range");
   let reactions=list(raw.reactions??[],0,3,"reactions").map(x=>{
    keys(x,["kind","chanceBp"],["skill","ratioBp","maxDamage"],"reaction");
    if(!["counter","followup","reflect"].includes(x.kind))fail("reaction kind");int(x.chanceBp,0,10000,"reaction chance");
    if(x.kind==="reflect"){if(Object.hasOwn(x,"skill"))fail("reflect skill");int(x.ratioBp,1,10000,"reflect ratio");int(x.maxDamage,1,1000000,"reflect cap")}
    else{let a=own(catalog,x.skill);if(!skillIds.includes(x.skill)||!a||a.kind!=="attack"||a.target!=="enemy_single"||a.mp||a.spCenti||a.cd||a.status||Object.hasOwn(x,"ratioBp")||Object.hasOwn(x,"maxDamage"))fail("reaction skill contract")}
    return copy(x);
   });
   if(new Set(reactions.map(x=>x.kind)).size!==reactions.length)fail("duplicate reaction");
   const forecastMode=raw.forecastMode??"full";if(!["full","category","hidden"].includes(forecastMode)||raw.side==="party"&&forecastMode!=="full")fail("forecast mode");
   actors[k]={id:k,side:raw.side,stats,vitals,anchor,shieldLayers:[],rules:validateRules(raw.rules??[]),ruleUses:{},tokens:{},enemyAllyFalls:0,forecastMode,shiftImmune:bool(raw.shiftImmune??false,"shift immune"),skills:[...skillIds],resistance,statusResist,boss:bool(raw.boss??false,"boss"),ai,reactions,phases,phaseIndex:0,survivalRemaining:bool(raw.survival??false,"survival"),statuses:{},cooldowns:{},guard:false,guardKind:null,cover:null,hitSpCount:0,controlResistBp:0,participated:false,performedAction:false,acted:false,normalResolved:false};
  }
  const front=list(config.front,1,4,"front"),reserve=list(config.reserve,0,4,"reserve"),enemies=list(config.enemies,1,8,"enemies"),summonPool=list(config.summonPool??[],0,7,"summon pool");if(enemies.length+summonPool.length>8)fail("enemy roster limit including summons");
  if(front.length+reserve.length>8)fail("party size");const frontLimit=int(config.frontLimit??4,1,4,"front limit");if(front.length!==Math.min(frontLimit,front.length+reserve.length))fail("underfilled battle slots");
  let all=[...front,...reserve,...enemies,...summonPool];if(all.some(k=>typeof k!=="string"||!own(actors,k))||new Set(all).size!==all.length||all.length!==Object.keys(actors).length)fail("roster partition");
  if([...front,...reserve].some(k=>actors[k].side!=="party")||[...enemies,...summonPool].some(k=>actors[k].side!=="enemy"))fail("slot side");if(summonPool.some(k=>!actors[k].vitals.hp))fail("dead dormant summon");for(const skill of Object.values(catalog))if(skill.kind==="summon"&&skill.summonIds.some(k=>!summonPool.includes(k)))fail("unknown summon pool id");
  for(const a of Object.values(actors))for(const r of a.rules)if(r.effect?.kind==="counter"){const k=r.effect.skill,x=own(catalog,k);if(!a.skills.includes(k)||!x||x.kind!=="attack"||x.target!=="enemy_single"||x.mp||x.spCenti||x.cd||x.status)fail("forced counter skill contract")}
  const fusions={};for(const raw of list(config.fusions??[],0,128,"fusions")){
   keys(raw,["id","members","cd"],[],"fusion");id(raw.id,"fusion id");if(own(fusions,raw.id))fail("duplicate fusion id");int(raw.cd,1,20,"pair cooldown");
   let members=list(raw.members,2,2,"fusion members").map(m=>{
    keys(m,["actor","skill","spCenti","effect"],[],"fusion member");id(m.actor,"fusion actor");id(m.skill,"fusion required skill");int(m.spCenti,1,10000,"fusion SP");
    const a=own(actors,m.actor),skill=own(catalog,m.skill);if(!a||a.side!=="party"||!a.skills.includes(m.skill)||!skill||skill.spCenti||!["attack","heal","barrier","revive","cleanse","inflict","empower","dispel","compound","shift"].includes(skill.kind))fail("fusion prerequisite");
    const effect=validateSkill(m.effect);if(!["attack","heal","barrier","revive","cleanse","inflict","empower","dispel","compound","shift"].includes(effect.kind)||effect.mp||effect.spCenti||effect.cd||effect.speedBp!==10000||effect.retarget)fail("fusion effect contract (explicit retarget:false)");
    return {actor:m.actor,skill:m.skill,spCenti:m.spCenti,effect};
   });if(members[0].actor===members[1].actor)fail("fusion distinct members");
   fusions[raw.id]={id:raw.id,cd:raw.cd,members,pair:members.map(m=>m.actor).sort(cmp).join(":")};
  }
  let s={version:VERSION,fusions,pairCooldowns:{},fusionReservations:{},fusionHistory:{},forcedCounters:{},hasRules:Object.values(actors).some(a=>a.rules.length>0),seed:int(config.seed,1,4294967295,"seed"),rng:config.seed,round:0,maxRounds:int(config.maxRounds??50,1,MAX_ROUND,"max rounds"),phase:"between",outcome:null,actors,catalog,inventory,summonPool:[...summonPool],frontLimit,front:[...front],reserve:[...reserve],enemies:[...enemies],enemyFrontCount:int(config.enemyFrontCount??Math.ceil(enemies.length/2),1,enemies.length,"enemy front count"),queue:[],cursor:0,plans:[],swapUsed:false,reordered:false,reorderPending:false,reorderCount:0,orderMods:{},queueShifts:{},shiftCount:0,logLimit:int(config.logLimit??DEFAULT_LOG,4096,MAX_LOG,"log limit"),eventSeq:0,actionSeq:0,actionHp:null,shieldSeq:0,logStartSeq:1,log:[]};
  event(s,"battle_created");return seal(startRound(s))
 }
 function terminal(s,outcome){cancelPending(s,"battle_finished");s.phase="finished";s.outcome=outcome;s.queue=[];s.cursor=0;s.plans=[];event(s,"battle_end",{outcome});return true}
 function checkEnd(s){
  let p=[...s.front,...s.reserve].some(k=>alive(s,k)),e=s.enemies.some(k=>alive(s,k));
  if(!p&&!e)return terminal(s,"draw");if(!e)return terminal(s,"win");if(!p)return terminal(s,"loss");return false
 }
 function rowIndex(s,side,i){return i<(side==="party"?2:s.enemyFrontCount)?0:1}
 function candidateIds(s,actor,skill){
  let side=sideOf(s,actor);
  if(skill.target==="self")return alive(s,actor)?[actor]:[];
  let targetSide=skill.target.startsWith("enemy")?opposite(side):side,arr=slots(s,targetSide);
  let ids=arr.filter(k=>skill.target==="ally_dead"?!alive(s,k):alive(s,k));
  if(skill.target==="ally_dead")return ids;
  if(skill.kind==="shift")ids=ids.filter(k=>k!==actor&&!s.actors[k].shiftImmune&&!s.actors[k].acted&&!Object.hasOwn(s.queueShifts,k));
  if(skill.target==="enemy_single"&&skill.reach==="melee"){let f=arr.filter((k,i)=>rowIndex(s,targetSide,i)===0&&alive(s,k));if(f.length)ids=f}
  return ids
 }
 function canUse(s,a,skillId){
  const x=s.actors[a],skill=own(s.catalog,skillId);
  return !!skill&&(Object.hasOwn(s.inventory,skillId)?x.side==="party"&&s.inventory[skillId]>0:own(BUILTINS,skillId)||x.skills.includes(skillId))&&(skill.kind!=="summon"||skill.summonIds.some(k=>s.summonPool.includes(k)))&&!(x.cooldowns[skillId]>0)&&x.vitals.mp>=skill.mp&&x.vitals.spCenti>=skill.spCenti&&!(skill.magical&&own(x.statuses,"silence"))
 }
 function targetRef(s,side,target){
  if(target===null||target===undefined)return null;obj(target,"target");
  if(target.mode==="actor"){keys(target,["mode","id"],[],"actor target");id(target.id,"target id");return own(s.actors,target.id)&&s.actors[target.id].side===side?target.id:null}
  if(target.mode==="slot"){keys(target,["mode","index"],[],"slot target");int(target.index,0,slots(s,side).length-1,"slot");return slots(s,side)[target.index]}
  fail("target mode");
 }
 function resolve(s,actor,skill,ref){
  if(skill.target==="self")return [actor];
  let cs=candidateIds(s,actor,skill);
  if(skill.target.endsWith("_all"))return cs;
  let side=skill.target.startsWith("enemy")?opposite(sideOf(s,actor)):sideOf(s,actor);
  let want=targetRef(s,side,ref);
  if(cs.includes(want))return [want];
  if(skill.retarget&&skill.target!=="ally_dead"&&cs.length)return [cs[0]];
  return []
 }
 function aiPlan(s,a){
  let x=s.actors[a],allies=ordered(s,x.side);
  for(const r of [...x.ai,{skill:"basic",when:"always",thresholdBp:0,target:"lowest_hp",every:1}]){
   if((s.round-1)%r.every!==0||(r.minPhase??0)>x.phaseIndex||!canUse(s,a,r.skill))continue;
   if(r.when==="self_below"&&x.vitals.hp*10000>=x.vitals.hpMax*r.thresholdBp)continue;
   if(r.when==="ally_below"&&!allies.some(k=>s.actors[k].vitals.hp*10000<s.actors[k].vitals.hpMax*r.thresholdBp))continue;
   if(r.when==="ally_dead"&&!slots(s,x.side).some(k=>!alive(s,k)))continue;
   let skill=s.catalog[r.skill];if(["guard","wait","summon"].includes(skill.kind))return {actor:a,skill:r.skill,target:null};let cs=skill.kind==="cover"?allies.filter(k=>k!==a):candidateIds(s,a,skill);if(!cs.length)continue;
   if(skill.target==="ally_single"&&["heal","barrier"].includes(skill.kind)&&r.when==="always"&&cs.every(k=>s.actors[k].vitals.hp===s.actors[k].vitals.hpMax)&&skill.kind==="heal")continue;
   cs.sort((a,b)=>{let u=s.actors[a],v=s.actors[b];return (r.target==="lowest_hp"?u.vitals.hp*v.vitals.hpMax-v.vitals.hp*u.vitals.hpMax:r.target==="highest_atk"?Math.max(v.stats.patk,v.stats.matk)-Math.max(u.stats.patk,u.stats.matk):0)||cmp(a,b)});
   let target=skill.kind==="cover"||skill.target?.endsWith("_single")||skill.target==="ally_dead"?(r.targetMode==="slot"?{mode:"slot",index:slots(s,sideOf(s,cs[0])).indexOf(cs[0])}:{mode:"actor",id:cs[0]}):null;
   return {actor:a,skill:r.skill,target}
  }
  return {actor:a,skill:"wait",target:null}
 }
 function refill(s){
  if(s.front.some(k=>alive(s,k)))return;
  for(let i=0;i<s.front.length;i++){
   let ri=s.reserve.findIndex(k=>alive(s,k));if(ri<0)break;
   let out=s.front[i],inc=s.reserve[ri];s.front[i]=inc;s.reserve[ri]=out;event(s,"emergency_swap",{out,in:inc,slot:i})
  }
 }
 function startRound(s){
  if(checkEnd(s))return s;
  if(s.round>=s.maxRounds){terminal(s,"timeout");return s}
  refill(s);
  s.round++;s.phase="planning";s.fusionReservations={};s.forcedCounters={};for(const k of Object.keys(s.pairCooldowns))if(--s.pairCooldowns[k]<=0)delete s.pairCooldowns[k];s.queue=[];s.cursor=0;s.swapUsed=false;s.reordered=false;s.reorderPending=false;s.reorderCount=0;s.orderMods={};s.queueShifts={};s.shiftCount=0;
  for(const a of Object.values(s.actors)){
   a.guard=false;a.guardKind=null;a.cover=null;a.hitSpCount=0;a.acted=false;a.normalResolved=false;
   for(const k of Object.keys(a.cooldowns)){if(--a.cooldowns[k]<=0)delete a.cooldowns[k]}
  }
  for(const k of Object.keys(s.actors).sort(cmp))if(onField(s,k))advancePhases(s,k);
  s.plans=ordered(s,"enemy").map(k=>aiPlan(s,k));event(s,"round_start");event(s,"enemy_forecast",{plans:publicForecast(s)});return s
 }
 function publicForecast(s){return s.plans.map(p=>{let mode=s.actors[p.actor].forecastMode;return mode==="full"?copy(p):mode==="category"?{actor:p.actor,visibility:"category",category:s.catalog[p.skill].kind}:{actor:p.actor,visibility:"hidden"}})}
 function forecast(s){requireState(s);if(s.phase!=="planning")fail("not planning");return publicForecast(s)}
 function eventsSince(s,afterSeq){requireState(s);int(afterSeq,0,s.eventSeq,"event cursor");return {afterSeq,firstAvailable:s.logStartSeq,lastSeq:s.eventSeq,lost:afterSeq<s.logStartSeq-1,events:copy(s.log.filter(e=>e.seq>afterSeq))}}
 function fusionEligible(s,f,m){
  const a=s.actors[m.actor];
  return onField(s,m.actor)&&canUse(s,m.actor,m.skill)&&a.vitals.spCenti>=m.spCenti&&!(m.effect.magical&&own(a.statuses,"silence"))&&!(s.pairCooldowns[f.pair]>0)
 }
 function fusionTarget(s,m,ref){
  const e=m.effect;if(e.target==="self"||e.target.endsWith("_all"))return ref===null&&candidateIds(s,m.actor,e).length>0;
  if(ref===null)return false;
  const side=e.target.startsWith("enemy")?"enemy":"party",target=targetRef(s,side,ref);
  return candidateIds(s,m.actor,e).includes(target)
 }
 function fusionTargets(s,m){
  const e=m.effect;if(e.target==="self"||e.target.endsWith("_all"))return candidateIds(s,m.actor,e).length?[null]:[];
  return candidateIds(s,m.actor,e).flatMap(k=>[{mode:"actor",id:k},{mode:"slot",index:slots(s,sideOf(s,k)).indexOf(k)}])
 }
 function legalFusions(s){requireState(s);if(s.phase!=="planning")fail("not planning");
  return freeze(Object.values(s.fusions).filter(f=>f.members.every(m=>fusionEligible(s,f,m))).map(f=>({id:f.id,pair:f.pair,cd:f.cd,members:f.members.map(m=>({actor:m.actor,requiredSkill:m.skill,mp:s.catalog[m.skill].mp,spCenti:m.spCenti,commands:fusionTargets(s,m).map(target=>({actor:m.actor,skill:"fusion",fusionId:f.id,target}))}))})).filter(f=>f.members.every(m=>m.commands.length)))
 }
 function validateCommand(s,c){
  if(c?.skill==="fusion"){
   keys(c,["actor","skill","fusionId","target"],[],"fusion command");id(c.actor);id(c.fusionId);const f=own(s.fusions,c.fusionId),m=f?.members.find(x=>x.actor===c.actor);
   if(!f||!m||!fusionEligible(s,f,m)||!fusionTarget(s,m,c.target))fail("illegal fusion command");
   return copy(c)
  }
  keys(c,["actor","skill"],["target","out","in"],"command");id(c.actor);id(c.skill);if(!onField(s,c.actor)||sideOf(s,c.actor)!=="party"||!canUse(s,c.actor,c.skill))fail("illegal actor or skill");
  let a=s.catalog[c.skill],cmd={actor:c.actor,skill:c.skill,target:c.target??null};
  if(a.kind==="swap"){
   if(c.target!==undefined&&c.target!==null)fail("swap target");if(!s.front.includes(c.out)||!s.reserve.includes(c.in)||!alive(s,c.in)||!(c.out===c.actor||!alive(s,c.out)))fail("illegal swap");
   return {...cmd,out:c.out,in:c.in}
  }
  if(c.out!==undefined||c.in!==undefined)fail("unexpected swap fields");
  if(a.kind==="cover"){let target=targetRef(s,"party",cmd.target);if(!target||!onField(s,target)||target===c.actor)fail("cover target");return cmd}
  if(["guard","wait"].includes(a.kind)||a.target==="self"||a.target?.endsWith("_all")){if(cmd.target!==null)fail("unexpected target");return cmd}
  let side=a.target.startsWith("enemy")?"enemy":"party";
  let want=targetRef(s,side,cmd.target);if(!candidateIds(s,c.actor,a).includes(want))fail("illegal target at planning");
  return cmd
 }
 // One source of legal commands for UI and simulator. Shared stock/round conflicts are rechecked at submit/execution.
 function legalCommands(s,actor){requireState(s);
  if(s.phase!=="planning"||!onField(s,actor)||sideOf(s,actor)!=="party")fail("not an active planning actor");
  const a=s.actors[actor],result=[],skillIds=[...new Set([...Object.keys(BUILTINS),...a.skills,...Object.keys(s.inventory)])].sort(cmp);
  const add=c=>result.push(validateCommand(s,{actor,...c}));
  for(const skillId of skillIds){
   if(!canUse(s,actor,skillId))continue;const skill=s.catalog[skillId];
   if(skill.kind==="swap"){
    for(const out of s.front.filter(k=>k===actor||!alive(s,k)))for(const inc of s.reserve.filter(k=>alive(s,k)))add({skill:skillId,out,in:inc,target:null});
   }else if(skill.kind==="cover"){
    for(const k of ordered(s,"party").filter(k=>k!==actor)){add({skill:skillId,target:{mode:"actor",id:k}});add({skill:skillId,target:{mode:"slot",index:s.front.indexOf(k)}})}
   }else if(["guard","wait"].includes(skill.kind)||skill.target==="self"||skill.target.endsWith("_all"))add({skill:skillId,target:null});
   else{
    for(const k of candidateIds(s,actor,skill)){add({skill:skillId,target:{mode:"actor",id:k}});add({skill:skillId,target:{mode:"slot",index:slots(s,sideOf(s,k)).indexOf(k)}})}
   }
  }
  return freeze(copy(result))
 }
 function effectiveStats(a){let x={...a.stats};for(const [k,b] of Object.entries({patk:"might",matk:"arcane",pdef:"fortify",mdef:"ward",spd:"haste",heal:"mend",barrier:"aegis"})){let bp=statusValue(a,b)-(k==="patk"&&own(a.statuses,"burn")?1500:0)-(["pdef","mdef"].includes(k)?statusValue(a,"corrode"):0);if(bp)x[k]=Math.min(1000000,half(x[k]*(10000+bp),10000))}return x}
 function speed(s,c){let a=s.actors[c.actor],skill=c.skill==="fusion"?s.fusions[c.fusionId].members.find(m=>m.actor===c.actor).skill:c.skill,base=effectiveStats(a).spd*s.catalog[skill].speedBp;return BigInt(base)*BigInt(10000-clamp(statusValue(a,"slow"),0,8000))*BigInt(10000+clamp(modSum(s,c.actor,"speed",{source:c.actor}),-9000,10000))*BigInt(10000+(own(s.orderMods,c.actor)??0))}
 function sortQueue(s,commands){return [...commands].sort((a,b)=>(s.queueShifts[a.actor]??0)-(s.queueShifts[b.actor]??0)||cmp(speed(s,b),speed(s,a))||cmp(a.actor,b.actor))}
 function lock(s,commands){
  if(s.phase!=="planning")fail("not planning");list(commands,0,4,"commands");
  let expected=ordered(s,"party"),validated=commands.map(c=>validateCommand(s,c));if(validated.length!==expected.length||new Set(validated.map(c=>c.actor)).size!==expected.length||expected.some(k=>!validated.some(c=>c.actor===k)))fail("one command per active living party member");
  if(validated.filter(c=>c.skill==="swap").length>1)fail("one swap per round");
  let n=transitionCopy(s);for(const c of validated.filter(c=>c.skill==="fusion")){const f=n.fusions[c.fusionId];if(!f.members.every(m=>validated.some(x=>x.actor===m.actor&&x.skill==="fusion"&&x.fusionId===f.id)))fail("fusion must reserve both members");if(!own(n.fusionReservations,f.id))n.fusionReservations[f.id]={id:f.id,arrived:[],status:"pending",invalidated:null,invalidatedActors:[],commands:validated.filter(x=>x.skill==="fusion"&&x.fusionId===f.id)}}n.queue=sortQueue(n,copy([...validated,...n.plans]));n.cursor=0;n.phase="resolving";event(n,"commands_locked",{order:n.queue.map(c=>c.actor)});for(const f of Object.values(n.fusionReservations))event(n,"fusion_reserved",{id:f.id,members:n.fusions[f.id].members.map(m=>m.actor)});return n
 }
 function submit(s,commands){requireState(s);return seal(lock(s,commands))}
 function requestReorder(s){if(s.phase==="resolving")s.reorderPending=true}
 function reorder(s){s.reorderPending=false;if(s.queue.length-s.cursor<2)return;s.reordered=true;s.reorderCount++;if(s.reorderCount>12)fail("reorder count");s.queue=[...s.queue.slice(0,s.cursor),...sortQueue(s,s.queue.slice(s.cursor))];event(s,"queue_reordered",{order:s.queue.slice(s.cursor).map(c=>c.actor)})}
 function inflict(s,source,target,def){
  if(!onField(s,target))return false;
  let a=s.actors[target],rule=STATUSES[def.id],res=a.statusResist[def.id]??0;
  let bonus=modSum(s,source,"status_chance",{source,target,reason:def.id}),resBonus=modSum(s,target,"status_resist",{source,target,reason:def.id});
  let baseline=clamp(def.chanceBp+statusValue(s.actors[source],"focus")+bonus,0,9500);
  let prob=res===10000?0:clamp(def.chanceBp+statusValue(s.actors[source],"focus")+bonus-res-resBonus-statusValue(a,"resolve")-(rule.hard&&a.boss?a.controlResistBp:0),0,9500);
  let roll=ppm(s);
  if(roll>=prob*100){let reason=res===10000?"immune":roll<baseline*100?"resisted":"chance";event(s,"status_resisted",{source,target,status:def.id,reason,baselineBp:baseline,effectiveBp:prob,rollPpm:roll});dispatch(s,"resist",{source,target,reason});return false}
  const old=own(a.statuses,def.id),fresh={source,powerBp:def.id==="slow"?Math.min(10000,half(def.powerBp*(10000+clamp(modSum(s,target,"slow_magnitude",{source,target}),-9000,10000)),10000)):def.powerBp,remaining:def.duration,appliedRound:s.round,...(rule.dot?{maxDamage:def.maxDamage}:{})};
  if(old){fresh.remaining=Math.max(old.remaining-(old.appliedRound<s.round?1:0),fresh.remaining);if(rule.dot){if(old.appliedRound<s.round){fresh.appliedRound=old.appliedRound;fresh.remaining=Math.max(old.remaining,def.duration+1)}let tick=x=>Math.min(x.maxDamage,Math.max(1,half(a.vitals.hpMax*x.powerBp,10000)));if(tick(old)>tick(fresh)||(tick(old)===tick(fresh)&&old.powerBp>=fresh.powerBp)){fresh.source=old.source;fresh.powerBp=old.powerBp;fresh.maxDamage=old.maxDamage}}else if(old.powerBp>=fresh.powerBp){fresh.source=old.source;fresh.powerBp=old.powerBp}}
  if(old&&old.powerBp===fresh.powerBp&&old.maxDamage===fresh.maxDamage&&old.remaining-(old.appliedRound<s.round?1:0)===fresh.remaining-(fresh.appliedRound<s.round?1:0)){
   event(s,"status_unchanged",{source,target,status:def.id});return false
  }
  a.statuses[def.id]=fresh;
  if(rule.hard&&a.boss)a.controlResistBp=Math.min(9500,a.controlResistBp+2500);
  event(s,"status_applied",{source,target,status:def.id,remaining:fresh.remaining,powerBp:fresh.powerBp});if(def.id==="slow")requestReorder(s);return true
 }
 function clearStatus(s,target,k,reason,source=null){let a=s.actors[target];if(!own(a.statuses,k))return false;let originalSource=a.statuses[k].source;delete a.statuses[k];event(s,"status_removed",{target,status:k,reason,originalSource,...(source?{source}: {})});if(k==="slow"||k==="haste")requestReorder(s);return true}
 function empower(s,source,target,def){
  if(!onField(s,target))return false;const a=s.actors[target],old=own(a.statuses,def.id);
  // Compare the actual remaining future rounds, not the raw stored timer before its end-round decrement.
  const future=old?Math.max(0,old.remaining-(old.appliedRound<s.round?1:0)):0;
  const power=Math.max(old?.powerBp??0,def.powerBp),remaining=Math.max(future,def.duration);
  if(old&&old.powerBp===power&&future===remaining){event(s,"status_unchanged",{source,target,status:def.id});return false}
  a.statuses[def.id]={source:old&&old.powerBp>=def.powerBp?old.source:source,powerBp:power,remaining,appliedRound:s.round};
  event(s,"status_applied",{source,target,status:def.id,remaining,powerBp:power});if(def.id==="haste")requestReorder(s);return true
 }
 function advancePhases(s,k){
  let a=s.actors[k];if(!alive(s,k))return;
  while(a.phaseIndex<a.phases.length&&a.vitals.hp*10000<=a.vitals.hpMax*a.phases[a.phaseIndex].hpBelowBp){
   let phase=a.phases[a.phaseIndex++];event(s,"boss_phase",{actor:k,id:phase.id,index:a.phaseIndex,hp:a.vitals.hp});
  }
 }
 function hit(s,source,target,h,reason,rows=null,context={}){
  const a=s.actors[target];let before=a.vitals.hp;let x=core.applyHit(a.vitals,h,{survive:a.survivalRemaining});const allocations=consumeShield(s,target,x.shieldDamage,reason,source);setVitals(a,x.state);
  if(x.survivalUsed)a.survivalRemaining=false;
  if(h.landed&&x.hpDamage+x.shieldDamage>0){
   a.participated=true;
   if(x.hpDamage>0&&own(a.statuses,"sleep"))clearStatus(s,target,"sleep","damage");
  }
  const components=rows?core.allocateHit(rows,h,x).map((p,i)=>({...p,element:context.parts[i].attribute.element,weakOriginal:context.parts[i].attribute.resistBp<0})):[];
  event(s,"hit",{source,target,reason,landed:h.landed,critical:h.critical,weak:h.weak,hpDamage:x.hpDamage,shieldDamage:x.shieldDamage,absorbedHeal:x.absorbedHeal,survivalUsed:x.survivalUsed,hpBefore:before,hp:a.vitals.hp,...(rows?{components,mixed:context.mixed??false}: {})});
  if(before>0&&a.vitals.hp===0){a.guard=false;a.guardKind=null;a.cover=null;a.statuses={};a.tokens={};invalidateFusion(s,target,"knockout");event(s,"knockout",{target,source,origin:reason});if(reason==="attack"&&sideOf(s,source)!==sideOf(s,target))for(const other of Object.values(s.actors))if(other.side===a.side&&other.id!==target)other.enemyAllyFalls++;
   dispatch(s,"knockout",{source,target,origin:reason,hpDamage:x.hpDamage,hpBefore:before})}else advancePhases(s,target);
  if(reason==="attack"){const ctx={source,target,origin:reason,hpDamage:x.hpDamage,hpBefore:before,critical:components.some(p=>p.critical&&p.hpDamage>0),landed:h.landed,components,covered:context.covered,mixed:context.mixed,targetUnacted:context.targetUnacted,attackReach:context.attackReach,attackTarget:context.attackTarget};dispatch(s,"hit",ctx);if(allocations.length)dispatch(s,"shield_absorb",{...ctx,shieldSources:allocations.map(a=>a.source)})}
  return {hpDamage:x.hpDamage,shieldDamage:x.shieldDamage,components}
 }
 function attack(s,actor,skill,targets,{secondary=false,reason="attack",item=false}={}){
  let src=s.actors[actor],effective=false,bonus=false,receipts=[];
  const elemental=skill.components.some(c=>(c.element??"none")!=="none"&&((c.coefficientBp??0)>0||(c.fixed??0)>0));
  const tokens=secondary||item?[]:Object.keys(src.tokens).filter(k=>src.tokens[k]>=s.round&&(src.rules.find(r=>r.effect?.kind==="token"&&r.effect.id===k)?.effect.consume!=="elemental"||elemental)).sort(cmp);for(const k of tokens){delete src.tokens[k];event(s,"token_consumed",{actor,token:k})}
  const mixed=["physical","magic"].every(kind=>skill.components.some(c=>c.kind===kind&&(c.coefficientBp??0)>0));
  for(let original of targets){
   if(!onField(s,original))continue;
   let dst=original;
   if(!secondary&&skill.target==="enemy_single"){
    let guarder=ordered(s,sideOf(s,original)).filter(k=>k!==original&&s.actors[k].cover===original&&reactionEligible(s,k,null)).sort(cmp)[0];
    if(guarder){dst=core.resolveTarget({kind:"single",target:original,guarder});event(s,"covered",{target:original,guarder:dst})}
   }
   let t=s.actors[dst],ctx={source:actor,target:dst,origin:reason,covered:dst!==original,mixed,targetUnacted:!t.normalResolved,tokens,actionHp:secondary?src.vitals.hp:s.actionHp,attackReach:skill.reach,attackTarget:skill.target};
   let parts=skill.components.map(c=>{const {element="none",attributePenBp=0,...p}=c;let x=own(t.resistance,element)??{resistBp:0};let cc={...ctx,kind:c.kind,element,weakOriginal:x.resistBp<0};
    if(item)p.fixed=Math.min(1000000,half((p.fixed??0)*(10000+clamp(modSum(s,actor,"item_effect",{source:actor}),-9000,20000)),10000));
    if(c.kind!=="fixed"){let out=modGroups(s,actor,"damage_out",cc),red=modGroups(s,dst,"damage_in",cc),pen=modSum(s,actor,"penetration",cc);if(out.length)p.damageGroups=out;if(red.length)p.reductionGroups=red;if(pen)p.penBp=clamp((p.penBp??0)+pen,0,10000)}
    return {...p,attribute:{element,resistBp:x.resistBp,mode:x.mode??"normal",penBp:attributePenBp}}});
   let atk=effectiveStats(src),crit=modSum(s,actor,"critical",ctx);atk.pcritBp=clamp(atk.pcritBp+crit,0,7500);atk.mcritBp=clamp(atk.mcritBp+crit,0,7500);
   let dg=own(src.statuses,"weaken")?[-Math.min(9000,statusValue(src,"weaken"))]:[],rg=t.guard?[4000]:[];
   const result=core.damage({attacker:atk,defender:effectiveStats(t),components:parts,hits:skill.hits,baseHitBp:skill.baseHitBp,hitBp:clamp(statusValue(src,"precision")-statusValue(src,"blind")+modSum(s,actor,"accuracy",ctx),-10000,10000),evadeBp:statusValue(t,"dodge"),rolls:rolls(s,skill.hits),damageGroups:dg,reductionGroups:rg},true);
   let landed=false,hpDamage=0,shieldDamage=0;
   for(const [index,h] of result.hits.entries()){if(!onField(s,dst))break;let x=hit(s,actor,dst,h,reason,result.details[index],{...ctx,parts});hpDamage+=x.hpDamage;shieldDamage+=x.shieldDamage;if(x.hpDamage+x.shieldDamage>0){effective=true;bonus||=h.critical||h.weak;landed=true}}
   if(landed)receipts.push({target:dst,hpDamage,shieldDamage});
   if(!secondary&&landed&&alive(s,dst)&&t.hitSpCount<3){t.hitSpCount++;gain(s,dst,4,"hit_action")}
   if(!secondary&&skill.status&&landed&&onField(s,dst))effective=inflict(s,actor,dst,skill.status)||effective;
  }
  return {effective,bonus,receipts}
 }
 function reactionEligible(s,k,skillId){
  let a=s.actors[k];return onField(s,k)&&!["freeze","sleep","paralysis"].some(x=>own(a.statuses,x))&&(!skillId||canUse(s,k,skillId));
 }
 function reactionAttack(s,source,target,r){
  if(!reactionEligible(s,source,r.skill)||!onField(s,target)||!candidateIds(s,source,s.catalog[r.skill]).includes(target))return false;
  if(!r.forced&&ppm(s)>=r.chanceBp*100)return false;
  event(s,"reaction",{actor:source,target,kind:r.kind,skill:r.skill,...(r.forced?{forced:true,rule:r.rule}: {})});
  attack(s,source,s.catalog[r.skill],[target],{secondary:true,reason:r.kind});return true;
 }
 function react(s,source,receipts,{followup=true}={}){
  // After the primary action: one followup, then at most one response per damaged target.
  // Secondary attacks do not invoke react(), spend actions, generate SP, apply statuses or redirect cover.
  let src=s.actors[source],follow=followup?src.reactions.find(x=>x.kind==="followup"):null;
  if(follow){let dst=receipts.map(x=>x.target).find(k=>onField(s,k)&&candidateIds(s,source,s.catalog[follow.skill]).includes(k));if(dst)reactionAttack(s,source,dst,follow)}
  for(const receipt of receipts){
   let k=receipt.target,forced=own(s.forcedCounters,k);if(forced)delete s.forcedCounters[k];if(!onField(s,source)||!reactionEligible(s,k,null))continue;
   if(forced&&forced.source===source&&reactionAttack(s,k,source,{kind:"counter",skill:forced.skill,chanceBp:10000,forced:true,rule:forced.rule}))continue;
   let a=s.actors[k],reflect=a.reactions.find(x=>x.kind==="reflect"),counter=a.reactions.find(x=>x.kind==="counter");
   if(reflect&&receipt.hpDamage>0&&ppm(s)<reflect.chanceBp*100){
    const amount=Math.min(reflect.maxDamage,half(receipt.hpDamage*reflect.ratioBp,10000));
    if(amount>0){event(s,"reaction",{actor:k,target:source,kind:"reflect",amount});hit(s,k,source,{damage:amount,absorb:0,landed:true,critical:false,weak:false},"reflect");continue}
   }
   if(counter)reactionAttack(s,k,source,counter)
  }
 }
 function shift(s,actor,target,direction){
  if(s.shiftCount>=4||Object.hasOwn(s.queueShifts,target)||!onField(s,target)||s.actors[target].acted||s.actors[target].shiftImmune)return false;
  const idx=s.queue.findIndex((x,i)=>i>=s.cursor&&x.actor===target);
  if(idx<0||idx===(direction==="advance"?s.cursor:s.queue.length-1))return false;
  const [entry]=s.queue.splice(idx,1);s.shiftCount++;s.queueShifts[target]=(direction==="advance"?-1:1)*s.shiftCount;
  s.queue.splice(direction==="advance"?s.cursor:s.queue.length,0,entry);
  event(s,"queue_shift",{source:actor,target,direction,order:s.queue.slice(s.cursor).map(x=>x.actor)});return true
 }
 function effect(s,actor,skill,targets,{item=false}={}){
  const a=s.actors[actor];let effective=false,bonus=false,receipts=[];
  switch(skill.kind){
   case "attack":return attack(s,actor,skill,targets);
   case "heal":case "barrier":for(const k of targets){if(!onField(s,k))continue;let t=s.actors[k],st=effectiveStats(a),cfg={base:skill.kind==="heal"?st.heal:st.barrier,coefficientBp:skill.coefficientBp,fixed:skill.fixed,receivedBp:10000-statusValue(t,"curse"),givenBp:clamp(10000+modSum(s,actor,skill.kind==="heal"?"heal_out":"barrier_out",{source:actor,target:k})+(item&&skill.kind==="heal"?modSum(s,actor,"item_effect",{source:actor}):0),0,30000)};let x=skill.kind==="heal"?core.heal(t.vitals,cfg):core.barrier(t.vitals,core.barrierAmount(cfg));let layerId=skill.kind==="barrier"?addShieldLayer(s,actor,k,x.effective):null;setVitals(t,x.state);event(s,skill.kind,{source:actor,target:k,effective:x.effective,...(skill.kind==="barrier"?{layerId}:{})});effective||=x.effective>0}break;
   case "revive":for(const k of targets){let t=s.actors[k];if(alive(s,k)||!active(s,k))continue;setVitals(t,{...t.vitals,hp:Math.max(1,half(t.vitals.hpMax*skill.ratioBp,10000)),shield:0});t.acted=true;t.normalResolved=true;event(s,"revive",{source:actor,target:k,hp:t.vitals.hp});effective=true}break;
   case "cleanse":case "dispel":for(const k of targets)if(onField(s,k))for(const x of Object.keys(s.actors[k].statuses).sort(cmp))if(skill.kind==="dispel"?STATUSES[x].category==="buff":skill.categories.includes(STATUSES[x].category))effective=clearStatus(s,k,x,skill.kind,actor)||effective;break;
   case "inflict":for(const k of targets)effective=inflict(s,actor,k,skill.status)||effective;break;
   case "empower":for(const k of targets)effective=empower(s,actor,k,skill.status)||effective;break;
   case "shift":for(const k of targets)effective=shift(s,actor,k,skill.direction)||effective;break;
   default:fail("invalid effect")
  }
  return {effective,bonus,receipts}
 }
 function compound(s,actor,skill,primary){
  let effective=false,bonus=false,receipts=[];
  for(const [index,step] of skill.effects.entries()){
   if(!onField(s,actor))break;
   if(step.when==="on_damage"&&!receipts.length)continue;
   let e=step.effect,targets;
   if(step.scope==="primary"){targets=primary.filter(k=>candidateIds(s,actor,e).includes(k))}
   else if(step.scope==="damaged"){targets=receipts.map(x=>x.target).filter(k=>onField(s,k))}
   else targets=candidateIds(s,actor,e);
   if(!targets.length)continue;
   event(s,"effect",{actor,index,kind:e.kind,targets});
   if(e.kind==="drain"){const a=s.actors[actor],hpDamage=receipts.reduce((sum,r)=>sum+r.hpDamage,0),amount=Math.min(e.maxHeal,half(hpDamage*e.ratioBp,10000));const x=core.heal(a.vitals,{base:0,fixed:amount,receivedBp:10000-statusValue(a,"curse")});setVitals(a,x.state);event(s,"heal",{source:actor,target:actor,effective:x.effective,origin:"drain",hpDamage});effective||=x.effective>0;continue}
   let x=effect(s,actor,e,targets);effective||=x.effective;bonus||=x.bonus;if(e.kind==="attack")receipts=x.receipts;
  }
  react(s,actor,receipts);return {effective,bonus}
 }
 function isSupportSkill(skill){
  const support=["heal","barrier","revive","cleanse","empower","restore_mp"];
  return support.includes(skill.kind)||skill.kind==="compound"&&["self","ally_single","ally_all","ally_dead"].includes(skill.target)&&skill.effects.some(x=>x.scope==="primary"&&support.includes(x.effect.kind))
 }
 function actionFacts(s,actor){
  let facts={positiveSupport:false,positiveBuff:false,cleansedEnemy:false,weakMagicHpDamage:false,mixedHpDamage:false,buffTargets:[],cleanseTargets:[]},kinds={};
  // Action records have not yet been trimmed. Derived facts use only direct primary events,
  // not reactions or rule-generated effects.
  for(let i=s.log.length-1;i>=0;i--){
   const e=s.log[i];if(e.seq<s.actionSeq)break;if(e.actionSeq!==s.actionSeq||e.rule)continue;
   if(e.type==="status_applied"&&e.source===actor&&STATUSES[e.status].category==="buff"&&sideOf(s,e.target)===sideOf(s,actor)){facts.positiveBuff=true;facts.positiveSupport=true;facts.buffTargets.push(e.target)}
   if(e.type==="status_removed"&&e.reason==="cleanse"&&e.source===actor&&sideOf(s,e.target)===sideOf(s,actor)){facts.positiveSupport=true;if(e.originalSource&&sideOf(s,e.originalSource)!==sideOf(s,actor)){facts.cleansedEnemy=true;facts.cleanseTargets.push(e.target)}}
   if(e.source===actor&&sideOf(s,e.target)===sideOf(s,actor)&&(["heal","barrier","mp_restored"].includes(e.type)&&e.effective>0||e.type==="revive")&&e.origin!=="drain")facts.positiveSupport=true;
   if(e.type==="hit"&&e.source===actor&&e.reason==="attack"){let q=kinds[e.target]??(kinds[e.target]=new Set());for(const c of e.components??[])if(c.hpDamage>0){if(e.mixed)q.add(c.kind);if(c.kind==="magic"&&c.weakOriginal)facts.weakMagicHpDamage=true}}
  }
  facts.mixedHpDamage=Object.values(kinds).some(x=>x.has("physical")&&x.has("magic"));return facts
 }
 function invalidateFusion(s,actor,reason){for(const r of Object.values(s.fusionReservations))if(r.status==="pending"&&s.fusions[r.id].members.some(m=>m.actor===actor)){if(!r.invalidated)r.invalidated=reason;if(!r.invalidatedActors.includes(actor))r.invalidatedActors.push(actor)}}
 function cancelPending(s,reason){for(const r of Object.values(s.fusionReservations))if(r.status==="pending"){r.status="cancelled";event(s,"fusion_cancelled",{id:r.id,reason:r.invalidated??reason,fallback:[]})}}
 function controlReason(s,a){if(own(a.statuses,"freeze"))return "freeze";if(own(a.statuses,"sleep"))return "sleep";if(own(a.statuses,"paralysis")&&ppm(s)<statusValue(a,"paralysis")*100)return "paralysis";return null}
 function cancelFusion(s,r,reason,blocked){
  r.status="cancelled";const fallback=[];
  for(const m of s.fusions[r.id].members){
   const a=s.actors[m.actor];a.acted=true;a.normalResolved=true;
   if(!onField(s,m.actor)||blocked.includes(m.actor)||r.invalidatedActors.includes(m.actor))continue;
   a.guard=true;a.guardKind="fallback";a.participated=true;a.performedAction=true;fallback.push(m.actor);
   // Failure guard is a consumed reserved action, not a normal guard skill or SP farm.
   event(s,"fusion_fallback",{id:r.id,actor:m.actor});
  }
  event(s,"fusion_cancelled",{id:r.id,reason,fallback});
 }
 function executeFusion(s,c){
  const r=s.fusionReservations[c.fusionId],f=s.fusions[c.fusionId],a=s.actors[c.actor];
  if(!r||r.status!=="pending"||r.arrived.includes(c.actor))fail("fusion reservation state");
  r.arrived.push(c.actor);a.acted=true;
  if(r.arrived.length===1){event(s,"fusion_wait",{id:f.id,actor:c.actor});return}
  const blocked=f.members.filter(m=>onField(s,m.actor)&&controlReason(s,s.actors[m.actor])).map(m=>m.actor);
  if(r.invalidated||blocked.length||!f.members.every(m=>fusionEligible(s,f,m))){cancelFusion(s,r,r.invalidated??(blocked.length?"control":"unavailable"),blocked);return}
  const targets=f.members.map(m=>resolve(s,m.actor,m.effect,r.commands.find(x=>x.actor===m.actor).target));
  if(targets.some(x=>!x.length)){cancelFusion(s,r,"no_target",blocked);return}
  // Compute both debits before mutating either participant; no effects during commit.
  const debits=f.members.map(m=>{
   let a=s.actors[m.actor],skill=s.catalog[m.skill],mp=core.resource(a.vitals,"mp",-skill.mp),sp=core.resource(mp.state,"spCenti",-m.spCenti);
   if(!mp.ok||!sp.ok)fail("fusion resource race");return {actor:m.actor,skill:m.skill,mp:skill.mp,spCenti:m.spCenti,cd:skill.cd,state:sp.state};
  });
  for(const d of debits){const a=s.actors[d.actor];setVitals(a,d.state);a.acted=true;a.normalResolved=true;a.participated=true;a.performedAction=true;if(d.cd)a.cooldowns[d.skill]=d.cd}
  s.pairCooldowns[f.pair]=f.cd;r.status="committed";
  event(s,"fusion_committed",{id:f.id,pair:f.pair,cd:f.cd,charges:debits.map(({state,...d})=>d)});
  let effective=false;
  // Defined recipe order, two separate attributed primary effect sequences, no ordinary acting SP.
  for(const [i,m] of f.members.entries()){
   const d=debits[i];s.actionSeq=s.eventSeq+1;s.actionHp=debits[i].state.hp;event(s,"action",{actor:m.actor,skill:m.skill,fusionId:f.id,targets:targets[i],mpSpent:d.mp,spSpentCenti:d.spCenti,cooldown:d.cd});
   if(onField(s,m.actor)){
    const valid=targets[i].filter(k=>candidateIds(s,m.actor,m.effect).includes(k));let x={effective:false,receipts:[]};
    if(valid.length){if(m.effect.kind==="compound")x=compound(s,m.actor,m.effect,valid);else{x=effect(s,m.actor,m.effect,valid);if(m.effect.kind==="attack")react(s,m.actor,x.receipts)}}
    effective||=x.effective;
    if(s.hasRules)dispatch(s,"action_end",{source:m.actor,skillKind:m.effect.kind,effective:x.effective,item:false,reason:m.skill,mpSpent:d.mp,fusion:true,supportSkill:isSupportSkill(m.effect),...actionFacts(s,m.actor)});
   }else event(s,"fusion_effect_skipped",{id:f.id,actor:m.actor,reason:"inactive_after_commit"});
   s.actionSeq=0;s.actionHp=null;s.forcedCounters={};
  }
  r.status="completed";let h=own(s.fusionHistory,f.pair)??{committed:0,effective:0};h.committed++;if(effective)h.effective++;s.fusionHistory[f.pair]=h;
  event(s,"fusion_completed",{id:f.id,pair:f.pair,effective})
 }
 function execute(s,c){
  const a=s.actors[c.actor],skill=s.catalog[c.skill];a.acted=true;a.normalResolved=true;
  let hard=["freeze","sleep"].find(k=>own(a.statuses,k));if(!hard&&own(a.statuses,"paralysis")&&ppm(s)<statusValue(a,"paralysis")*100)hard="paralysis";
  if(hard){event(s,"action_skipped",{actor:c.actor,reason:"control",status:hard});return}
  if(!canUse(s,c.actor,c.skill)){event(s,"action_skipped",{actor:c.actor,reason:"unavailable"});return}
  let targets=[];
  if(!["guard","cover","swap","wait","summon"].includes(skill.kind)){targets=resolve(s,c.actor,skill,c.target);if(!targets.length){event(s,"action_skipped",{actor:c.actor,reason:"no_target"});return}}
  if(skill.kind==="cover"){let t=targetRef(s,a.side,c.target);if(!onField(s,t)||t===c.actor){event(s,"action_skipped",{actor:c.actor,reason:"cover_target"});return}targets=[t]}
  if(skill.kind==="swap"&&(s.swapUsed||!s.front.includes(c.out)||!s.reserve.includes(c.in)||!alive(s,c.in)||!(c.out===c.actor||!alive(s,c.out)))){event(s,"action_skipped",{actor:c.actor,reason:"swap_invalidated"});return}
  if(!resources(a,skill.mp,skill.spCenti))fail("resource race");if(skill.kind!=="wait"){a.participated=true;a.performedAction=true;}if(skill.cd)a.cooldowns[c.skill]=skill.cd;
  const item=Object.hasOwn(s.inventory,c.skill);s.actionSeq=s.eventSeq+1;s.actionHp=a.vitals.hp;
  event(s,"action",{actor:c.actor,skill:c.skill,targets,mpSpent:skill.mp,spSpentCenti:skill.spCenti,cooldown:skill.cd});
  if(item){s.inventory[c.skill]--;event(s,"item_consumed",{actor:c.actor,item:c.skill,remaining:s.inventory[c.skill]})}
  let effective=false,bonus=false;
  switch(skill.kind){
   case "attack":{let x=item?attack(s,c.actor,skill,targets,{item:true,reason:"item"}):effect(s,c.actor,skill,targets);({effective,bonus}=x);react(s,c.actor,x.receipts,{followup:!item});break}
   case "compound":({effective,bonus}=compound(s,c.actor,skill,targets));break
   case "guard":a.guard=true;a.guardKind="normal";gain(s,c.actor,10,"guard");dispatch(s,"guard",{source:c.actor,reason:"guard"});break;
   case "cover":a.cover=targets[0];a.guard=true;a.guardKind="cover";gain(s,c.actor,10,"cover");break;
   case "swap":{let i=s.front.indexOf(c.out),j=s.reserve.indexOf(c.in);s.front[i]=c.in;s.reserve[j]=c.out;s.swapUsed=true;s.actors[c.in].acted=true;s.actors[c.in].normalResolved=true;s.actors[c.out].guard=false;s.actors[c.out].guardKind=null;s.actors[c.out].cover=null;event(s,"swap",{actor:c.actor,out:c.out,in:c.in,slot:i});break}
   case "heal":case "barrier":case "revive":case "cleanse":case "inflict":case "empower":case "dispel":case "shift":({effective,bonus}=effect(s,c.actor,skill,targets,{item}));break;
   case "restore_mp":for(const k of targets){const t=s.actors[k],x=core.resource(t.vitals,"mp",item?Math.min(1000000,half(skill.amount*(10000+clamp(modSum(s,c.actor,"item_effect",{source:c.actor}),-9000,20000)),10000)):skill.amount);setVitals(t,x.state);event(s,"mp_restored",{source:c.actor,target:k,effective:x.change});effective||=x.change>0}break;
   case "summon":for(const k of skill.summonIds){const i=s.summonPool.indexOf(k);if(i<0)continue;s.summonPool.splice(i,1);s.enemies.push(k);s.actors[k].acted=true;s.actors[k].normalResolved=true;event(s,"summon",{source:c.actor,target:k,slot:s.enemies.length-1});advancePhases(s,k);effective=true}break;
   case "wait":break;
   default:fail("unhandled kind")
  }
  if(effective&&!item&&skill.spCenti===0&&alive(s,c.actor))gain(s,c.actor,8+(bonus?3:0),"effective_action");
  if(s.hasRules)dispatch(s,"action_end",{source:c.actor,skillKind:skill.kind,effective,item,reason:c.skill,mpSpent:skill.mp,fusion:false,supportSkill:isSupportSkill(skill),...actionFacts(s,c.actor)});
 }
 function endRound(s){
  cancelPending(s,"round_ended");s.phase="ending";let ids=Object.keys(s.actors).sort(cmp);
  // End-of-round damage is applied to living active actors only, all before outcome evaluation.
  for(const k of ids){let a=s.actors[k];if(onField(s,k))for(const st of ["poison","burn"]){let x=own(a.statuses,st);if(!x||!alive(s,k)||x.appliedRound===s.round)continue;let amount=Math.min(x.maxDamage,Math.max(1,half(a.vitals.hpMax*x.powerBp,10000)));let y=core.applyHit(a.vitals,{damage:amount},{survive:a.survivalRemaining});consumeShield(s,k,y.shieldDamage,"dot",x.source);setVitals(a,y.state);if(y.survivalUsed)a.survivalRemaining=false;event(s,"dot",{target:k,source:x.source,status:st,hpDamage:y.hpDamage,shieldDamage:y.shieldDamage,hp:a.vitals.hp});if(y.hpDamage>0&&own(a.statuses,"sleep"))clearStatus(s,k,"sleep","damage");if(!alive(s,k)){a.guard=false;a.guardKind=null;a.cover=null;a.statuses={};a.tokens={};invalidateFusion(s,k,"knockout");event(s,"knockout",{target:k,source:x.source,origin:"dot"})}else advancePhases(s,k)}}
  // Status timers do not freeze in reserve; no DOT ticks for off-field actors.
  for(const k of ids){let a=s.actors[k];for(const st of Object.keys(a.statuses).sort(cmp)){let x=a.statuses[st];if(x.appliedRound<s.round&&--x.remaining<=0)clearStatus(s,k,st,"expired")}}
  for(const a of Object.values(s.actors))for(const k of Object.keys(a.tokens))if(a.tokens[k]<=s.round)delete a.tokens[k];
  event(s,"round_end");return startRound(s)
 }
 function stepMutable(n){
  if(n.phase!=="resolving")fail("not resolving");
  while(n.cursor<n.queue.length){
   let c=n.queue[n.cursor++];
   if(c.skill==="fusion")executeFusion(n,c);
   else{if(!onField(n,c.actor)||n.actors[c.actor].acted){n.actors[c.actor].normalResolved=true;event(n,"action_skipped",{actor:c.actor,reason:"inactive_or_spent"});continue}execute(n,c)}
   n.actionSeq=0;n.actionHp=null;n.forcedCounters={};
   if(n.reorderPending)reorder(n);
   if(checkEnd(n))return n;
   if(!n.front.some(k=>alive(n,k))){event(n,"front_wiped");return endRound(n)}
   if(n.cursor>=n.queue.length)return endRound(n);
   return n
  }
  return endRound(n)
 }
 function step(s){requireState(s);if(s.phase!=="resolving")fail("not resolving");return seal(stepMutable(transitionCopy(s)))}
 function runRound(s,commands){requireState(s);let n=lock(s,commands),limit=16;while(n.phase==="resolving"){if(--limit<0)fail("round step limit");n=trimLog(stepMutable(n))}return seal(n)}
 // Replay trusted encounter definitions + recorded user commands, rather than trusting edited state JSON.
 function replay(config,roundCommands,pending=null){
  list(roundCommands,0,MAX_ROUND,"replay rounds");let s=create(config);
  for(const commands of roundCommands){if(s.phase!=="planning")fail("replay after finish");s=runRound(s,commands)}
  if(pending!==null){keys(pending,["commands","steps"],[],"pending replay");int(pending.steps,0,12,"pending steps");s=submit(s,pending.commands);for(let i=0;i<pending.steps;i++){if(s.phase!=="resolving")fail("pending steps exceed round");s=step(s)}}
  return s
 }
 // Canonical, bounded JSON encoding for corruption detection. This is NOT an authentication signature.
 function canonical(v,depth=0){
  if(depth>40)fail("checkpoint depth");
  if(v===null||typeof v==="string"||typeof v==="boolean"||Number.isSafeInteger(v))return JSON.stringify(v);
  if(Array.isArray(v)){list(v,0,MAX_LOG,"checkpoint array");return "["+v.map(x=>canonical(x,depth+1)).join(",")+"]"}
  obj(v,"checkpoint object");const ks=Object.keys(v).sort(cmp);
  return "{"+ks.map(k=>JSON.stringify(k)+":"+canonical(v[k],depth+1)).join(",")+"}"
 }
 // FNV-1a 64 over UTF-16 code units (low byte then high byte), independent of key insertion order.
 function fingerprint(v){
  const str=canonical(v);let h=14695981039346656037n;
  for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h=BigInt.asUintN(64,(h^BigInt(c&255))*1099511628211n);h=BigInt.asUintN(64,(h^BigInt(c>>>8))*1099511628211n)}
  return h.toString(16).padStart(16,"0")
 }
 function checkpointHistory(roundCommands,pending){
  list(roundCommands,0,MAX_ROUND,"checkpoint rounds");
  for(const commands of roundCommands)list(commands,0,4,"checkpoint commands");
  if(pending!==null){keys(pending,["commands","steps"],[],"checkpoint pending");list(pending.commands,0,4,"checkpoint commands");int(pending.steps,0,12,"checkpoint steps")}
  // Only JSON-compatible command objects, bounded by the existing command schema during replay.
  canonical({roundCommands,pending});
 }
 function checkpoint(state,config,revision,roundCommands,pending=null){requireState(state);
  id(revision,"encounter revision");checkpointHistory(roundCommands,pending);
  const replayed=replay(config,roundCommands,pending);
  if(pending!==null&&replayed.phase!=="resolving")fail("completed round belongs in history");
  if(canonical(state)!==canonical(replayed))fail("checkpoint state/history mismatch");
  const payload={version:VERSION,revision,configFingerprint:fingerprint(config),roundCommands:copy(roundCommands),pending:copy(pending),stateFingerprint:fingerprint(replayed)};
  return freeze({...payload,checksum:fingerprint(payload)})
 }
 function restoreCheckpoint(config,revision,envelope){
  id(revision,"encounter revision");keys(envelope,["version","revision","configFingerprint","roundCommands","pending","stateFingerprint","checksum"],[],"checkpoint");
  if(envelope.version!==VERSION||envelope.revision!==revision)fail("checkpoint version/revision");
  for(const k of ["configFingerprint","stateFingerprint","checksum"])if(typeof envelope[k]!=="string"||!/^[0-9a-f]{16}$/.test(envelope[k]))fail("checkpoint checksum format");
  checkpointHistory(envelope.roundCommands,envelope.pending);const {checksum,...payload}=envelope;
  if(fingerprint(payload)!==checksum||fingerprint(config)!==payload.configFingerprint)fail("checkpoint corrupt or encounter changed");
  let state=replay(config,payload.roundCommands,payload.pending);
  if(payload.pending!==null&&state.phase!=="resolving")fail("checkpoint pending completed");
  if(fingerprint(state)!==payload.stateFingerprint)fail("checkpoint replay mismatch");
  return state
 }
 function exportResult(s){requireState(s);
  if(s.phase!=="finished")fail("battle not finished");
  return freeze({version:VERSION,outcome:s.outcome,rounds:s.round,front:[...s.front],reserve:[...s.reserve],inventory:exportInventory(s),fusionHistory:copy(s.fusionHistory),members:exportProgress(s).map(x=>({...x,performedAction:s.actors[x.id].performedAction}))})
 }
 function exportInventory(s){requireState(s);if(s.phase!=="finished")fail("battle not finished");return copy(s.inventory)}
 function exportProgress(s){requireState(s);
  if(s.phase!=="finished")fail("battle not finished");
  return [...s.front,...s.reserve].map(k=>{let a=s.actors[k];return {id:k,hp:a.vitals.hp,mp:a.vitals.mp,anchor:copy(a.anchor),participated:a.participated}})
 }
 return Object.freeze({VERSION,STATUSES,create,forecast,eventsSince,legalCommands,legalFusions,submit,step,runRound,replay,checkpoint,restoreCheckpoint,exportResult,exportProgress,exportInventory});
}
export const battle=createEngine(core);
