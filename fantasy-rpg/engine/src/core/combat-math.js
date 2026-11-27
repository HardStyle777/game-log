// Shared deterministic combat primitives — stage 1. No turn engine.
function makeCore(){
 const KEYS=Object.freeze(["STR","VIT","AGI","DEX","INT","MND","RES","LUK","WIL","SYN"]);
 const DER=Object.freeze(["hp","mp","patk","matk","pdef","mdef","spd","acc","eva","heal","barrier"]);
 const ELEMENTS=Object.freeze(["none","fire","water","thunder","wind","earth","ice","light","dark"]);
 const MAX=1000000, BP=10000;
 function fail(s){throw new RangeError(s)}
 function number(v,min,max,n){if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max)fail(n);return v}
 function int(v,min,max,n){number(v,min,max,n);if(!Number.isSafeInteger(v))fail(n);return v}
 function obj(v,n){if(!v||typeof v!=="object"||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))fail(n);return v}
 function dense(v,min,max,n){if(!Array.isArray(v)||v.length<min||v.length>max||Object.keys(v).length!==v.length)fail(n);for(let i=0;i<v.length;i++)if(!Object.hasOwn(v,i))fail(n+" sparse");return v}
 function exact(o,keys,n){obj(o,n);if(Object.keys(o).length!==keys.length||keys.some(k=>!Object.hasOwn(o,k)))fail(n+" keys")}
 function optional(o,keys,n){obj(o,n);for(const k of Object.keys(o)){if(!keys.includes(k))fail(n+" unknown "+k);if(o[k]===undefined||o[k]===null)fail(n+" missing "+k)}}
 const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
 // Exact nonnegative rational half-up for integer arithmetic.
 function ratio(n,d){if(!Number.isSafeInteger(n)||n<0||!Number.isSafeInteger(d)||d<=0)fail("ratio");let q=Math.floor(n/d),r=n%d;return q+(r>=Math.ceil(d/2)?1:0)}
 // Rational arithmetic, rounding only once at each specified boundary.
 function gcd(a,b){while(b){const r=a%b;a=b;b=r}return a}
 function frac(n,d=1){n=BigInt(n);d=BigInt(d);if(n<0n||d<=0n)fail("fraction");if(!n)return [0n,1n];const g=gcd(n,d);return [n/g,d/g]}
 function mul(a,b){const g=gcd(a[0],b[1]),h=gcd(b[0],a[1]);return [(a[0]/g)*(b[0]/h),(a[1]/h)*(b[1]/g)]}
 function add(a,b){const g=gcd(a[1],b[1]);return frac(a[0]*(b[1]/g)+b[0]*(a[1]/g),a[1]*(b[1]/g))}
 function cmp(a,b){const n=a[0]*b[1]-b[0]*a[1];return n<0n?-1:n>0n?1:0}
 function bound(a,l,h){return cmp(a,l)<0?l:cmp(a,h)>0?h:a}
 function half(a){const [n,d]=a,v=(n+d/2n)/d;if(v>BigInt(Number.MAX_SAFE_INTEGER))fail("rounded overflow");return Number(v)}
 function approx(a){return Number(a[0])/Number(a[1])}
 function group(groups,reduced){dense(groups,0,8,"modifier groups");let a=frac(1);for(const bp of groups)a=mul(a,frac(reduced?BP-int(bp,0,8000,"reduction"):BP+int(bp,-9000,30000,"outgoing"),BP));return reduced?bound(a,frac(1,5),frac(1)):bound(a,frac(1,10),frac(8))}
 function validateInnate(t){exact(t,KEYS,"innate");let sum=0;for(let k of KEYS)sum+=int(t[k],30,100,k);if(sum!==650)fail("innate budget");return true}
 function validateCoef(c){exact(c,KEYS,"coefficient");for(let k of KEYS)int(c[k],7500,14000,k);return true}
 function validateData(d){obj(d,"data");if(d.schemaVersion!==1)fail("schema version");dense(d.characters,16,16,"roster");dense(d.jobs,26,26,"jobs");
 const ids=new Set(),jobs=new Set(),names=new Set();for(const c of d.characters){obj(c,"character");if(typeof c.id!=="string"||!c.id||ids.has(c.id)||typeof c.name!=="string"||!c.name)fail("character identity");ids.add(c.id);validateInnate(c.innate)}
 for(const j of d.jobs){obj(j,"job");if(typeof j.id!=="string"||!j.id||jobs.has(j.id)||typeof j.name!=="string"||!j.name||names.has(j.name))fail("job identity");jobs.add(j.id);names.add(j.name);validateCoef(j.coefficientBp)}
 for(const c of d.characters)if(!names.has(c.initialJob==="弓使い"?"弓士":c.initialJob))fail("initial job reference");return true}
 function statMods(mods={},keys=KEYS){optional(mods,keys,"mods");for(const [k,m] of Object.entries(mods)){optional(m,["flat","pctBp"],k);int(m.flat??0,-100000,100000,k+" flat");int(m.pctBp??0,-9000,30000,k+" pct")}}
 function derive(input){
 optional(input,["innate","coefficientBp","level","mastery","permanent","equipmentStats","statsMods","baseGear","derivedMods","pcritBp","mcritBp","critMultiplierBp"],"derive input");
 const {innate,coefficientBp,level,mastery=0,permanent={},equipmentStats={},statsMods={},baseGear={},derivedMods={},pcritBp=0,mcritBp=0,critMultiplierBp=15000}=input;
 validateInnate(innate);validateCoef(coefficientBp);int(level,1,120,"level");if(typeof mastery==="number"){int(mastery,0,8,"mastery")}else{optional(mastery,KEYS,"mastery");for(const v of Object.values(mastery))int(v,0,8,"mastery")}
 for(const m of [permanent,equipmentStats]){optional(m,KEYS,"flat stat");for(const v of Object.values(m))int(v,-100000,100000,"flat stat")}
 statMods(statsMods);statMods(derivedMods,DER);optional(baseGear,["patk","matk","pdef","mdef"],"base gear");
 for(const v of Object.values(baseGear))int(v,0,100000,"gear value");
 int(pcritBp,-10000,10000,"pcrit modifier");int(mcritBp,-10000,10000,"mcrit modifier");int(critMultiplierBp,10000,30000,"critical multiplier");
 let A={};for(let k of KEYS){
   // B expressed exactly in thousandths: 10+.30*T+(L-1)*(.55+.012*T)
   const b=10000+300*innate[k]+(level-1)*(550+12*innate[k]);
   const m=statsMods[k]??{};let n=b*coefficientBp[k]+((typeof mastery==="number"?mastery:(mastery[k]??0))+(permanent[k]??0)+(equipmentStats[k]??0)+(m.flat??0))*10000000;
   // Clip before multiplying only at zero; rounding once after percentage.
   n=Math.max(0,n);const factor=BP+(m.pctBp??0), numerator=n*factor;
   const value=Number.isSafeInteger(numerator)?ratio(numerator,100000000000):Number((BigInt(n)*BigInt(factor)+50000000000n)/100000000000n);
   A[k]=clamp(value,1,MAX);
 }
 const {STR:s,VIT:v,AGI:a,DEX:d,INT:i,MND:m,RES:r,LUK:l}=A;
 const raw={hp:100*(100+12*v+5*m+8*level),mp:100*(20+3*i+3*m+level),patk:100*(baseGear.patk??0)+220*s+65*d,matk:100*(baseGear.matk??0)+210*i+75*r,pdef:100*(baseGear.pdef??0)+150*v+40*s,mdef:100*(baseGear.mdef??0)+150*m+45*r,spd:4000+65*a+25*d,acc:5000+80*d+15*l,eva:2500+65*a+15*l,heal:130*i+200*m+50*r,barrier:140*r+100*m+50*v};
 let derived={};for(const k of DER){let x=derivedMods[k]??{},n=Math.max(0,raw[k]+100*(x.flat??0));derived[k]=clamp(ratio(n*(BP+(x.pctBp??0)),1000000),k==="hp"||k==="mp"||k==="spd"?1:0,MAX)}
 // Rate in basis points; exact rounding at end. P: 500+4*DEX+2.5*LUK; M: 300+10/3*INT+2.5*LUK.
 derived.pcritBp=clamp(ratio(1000+8*d+5*l,2)+pcritBp,0,7500);
 derived.mcritBp=clamp(ratio(1800+20*i+15*l,6)+mcritBp,0,7500);
 derived.critMultiplierBp=critMultiplierBp;derived.spMaxCenti=10000;
 return {level,ability:A,...derived};
 }
 function hitRatio(input){optional(input,["level","acc","eva","baseBp","hitBp","evadeBp"],"hit input");const {level,acc,eva,baseBp=8200,hitBp=0,evadeBp=0}=input;int(level,1,120,"level");int(acc,0,MAX,"acc");int(eva,0,MAX,"eva");int(baseBp,0,BP,"base hit");int(hitBp,-BP,BP,"hit");int(evadeBp,-BP,BP,"evade");let k=500+4*level;return [clamp((baseBp+hitBp-evadeBp)*k+(acc-eva)*BP,500*k,9900*k),BP*k]}
 function hitChance(input){const [n,d]=hitRatio(input);return n/d}
 function defenseRatio(level,def,penBp=0,flatPen=0){int(level,1,120,"level");int(def,0,MAX,"def");int(penBp,0,BP,"pen");int(flatPen,0,MAX,"flat pen");const k=(100+8*level)*BP;return frac(k,k+Math.max(0,def*(BP-Math.min(penBp,7000))-flatPen*BP))}
 function defenseFactor(level,def,penBp=0,flatPen=0){return approx(defenseRatio(level,def,penBp,flatPen))}
 function attribute(input={}){optional(input,["element","resistBp","penBp","mode"],"attribute");const {element="none",resistBp=0,penBp=0,mode="normal"}=input;if(!ELEMENTS.includes(element)||!["normal","immune","absorb"].includes(mode))fail("attribute");int(resistBp,-20000,20000,"resist");int(penBp,0,10000,"attribute pen");
 if(element==="none"&&(resistBp!==0||penBp!==0||mode!=="normal"))fail("neutral cannot have elemental modifiers");
 const effective=element==="none"?0:mode==="normal"?resistBp-Math.min(Math.max(0,resistBp),penBp):resistBp;
 const factorBp=mode==="immune"?0:clamp(BP-effective,1000,20000);
 return {mode,factor:factorBp/BP,factorBp,weak:mode==="normal"&&effective<0,effectiveResistBp:effective}}
 function reduction(groups=[]){return approx(group(groups,true))}
 function outgoing(groups=[]){return approx(group(groups,false))}
 function validateState(s){exact(s,["hp","hpMax","shield","mp","mpMax","spCenti"],"state");int(s.hpMax,1,MAX,"hp max");int(s.mpMax,1,MAX,"mp max");int(s.hp,0,s.hpMax,"hp");int(s.shield,0,Math.floor(s.hpMax/2),"shield");int(s.mp,0,s.mpMax,"mp");int(s.spCenti,0,10000,"sp centi");if(s.hp===0&&s.shield!==0)fail("dead shield");return true}
 function damage(input,detail=false){
 if(typeof detail!=="boolean")fail("detail flag");
 optional(input,["attacker","defender","components","hits","baseHitBp","hitBp","evadeBp","rolls","damageGroups","reductionGroups"],"damage input");
 const {attacker,defender,components,hits=1,baseHitBp=8200,hitBp=0,evadeBp=0,rolls,damageGroups=[],reductionGroups=[]}=input;
 obj(attacker,"attacker");obj(defender,"defender");int(attacker.level,1,120,"level");for(const k of ["patk","matk","acc"])int(attacker[k],0,MAX,k);for(const k of ["pcritBp","mcritBp"])int(attacker[k],0,7500,k);int(attacker.critMultiplierBp,10000,30000,"crit multiplier");for(const k of ["pdef","mdef","eva"])int(defender[k],0,MAX,k);
 int(hits,1,16,"hits");dense(components,1,8,"components");dense(rolls,hits,hits,"rolls");
 const [hn,hd]=hitRatio({level:attacker.level,acc:attacker.acc,eva:defender.eva,baseBp:baseHitBp,hitBp,evadeBp}),groups=mul(group(damageGroups,false),group(reductionGroups,true));
 const comps=components.map(c=>{optional(c,["kind","coefficientBp","fixed","penBp","flatPen","attribute","canCrit","damageGroups","reductionGroups"],"component");if(!["physical","magic","fixed"].includes(c.kind))fail("kind");
 const coeff=int(c.coefficientBp??0,0,100000,"coefficient"),fixed=int(c.fixed??0,0,MAX,"fixed"),pen=int(c.penBp??0,0,BP,"pen"),flat=int(c.flatPen??0,0,MAX,"flatPen");
 if(c.canCrit!==undefined&&typeof c.canCrit!=="boolean")fail("canCrit");if(c.kind==="fixed"&&(coeff!==0||pen!==0||flat!==0||c.canCrit===true))fail("fixed component modifiers");
 const modifiers=Object.hasOwn(c,"damageGroups")||Object.hasOwn(c,"reductionGroups");
 if(modifiers&&!detail)fail("component modifiers require detailed damage");
 if(c.kind==="fixed"&&modifiers)fail("fixed component groups");
 if(Object.hasOwn(c,"damageGroups"))dense(c.damageGroups,0,8,"component damage groups");if(Object.hasOwn(c,"reductionGroups"))dense(c.reductionGroups,0,8,"component reduction groups");
 const local=modifiers?mul(group([...damageGroups,...(c.damageGroups??[])],false),group([...reductionGroups,...(c.reductionGroups??[])],true)):groups;
 const a=attribute(c.attribute??{}),atk=c.kind==="physical"?attacker.patk:c.kind==="magic"?attacker.matk:0,def=c.kind==="physical"?defender.pdef:defender.mdef;
 let power=mul(frac(atk*coeff+fixed*BP,BP*hits),frac(a.factorBp,BP));if(c.kind!=="fixed")power=mul(mul(power,defenseRatio(attacker.level,def,pen,flat)),local);
 return {a,power,kind:c.kind,fixed:c.kind==="fixed",cr:c.kind==="physical"?attacker.pcritBp:attacker.mcritBp,crit:c.kind!=="fixed"&&(c.canCrit??(c.kind==="physical"))}});
 let results=[],details=[];for(let j=0;j<hits;j++){const roll=rolls[j];exact(roll,["hitPpm","critPpm","variancePpm"],"roll");for(const k of ["hitPpm","critPpm","variancePpm"])int(roll[k],0,999999,k);
 const landed=roll.hitPpm*hd<hn*1000000;let raw=frac(0),abs=frac(0),critical=false,weak=false,rows=detail?comps.map(c=>({kind:c.kind,mode:c.a.mode,critical:false,weak:false,weight:["0","1"]})):null;
 if(landed)for(const [index,c] of comps.entries()){if(!c.power[0])continue;const cr=c.crit&&roll.critPpm<c.cr*100;let v=c.power;if(!c.fixed){v=mul(v,frac(9500000+roll.variancePpm,10000000));if(cr)v=mul(v,frac(attacker.critMultiplierBp,BP))}
 if(detail)rows[index]={kind:c.kind,mode:c.a.mode,critical:cr,weak:c.a.weak,weight:v.map(String)};
 if(c.a.mode==="absorb")abs=add(abs,v);else{raw=add(raw,v);critical||=cr;weak||=c.a.weak}}
 results.push({landed,critical,weak,damage:raw[0]?Math.max(1,half(raw)):0,absorb:half(abs)});if(detail)details.push(rows)}
 return {chance:hn/hd,hits:results,damage:results.reduce((s,h)=>s+h.damage,0),absorb:results.reduce((s,h)=>s+h.absorb,0),...(detail?{details}: {})};
 }
 function validateHit(hit){optional(hit,["damage","absorb","landed","critical","weak"],"hit");int(hit.damage,0,MAX*100000,"damage");int(hit.absorb??0,0,MAX*100000,"absorb");for(const k of ["landed","critical","weak"])if(Object.hasOwn(hit,k)&&typeof hit[k]!=="boolean")fail("hit flag");if(hit.landed===false&&(hit.damage>0||(hit.absorb??0)>0||hit.critical||hit.weak))fail("miss effects")}
 // Exact Hamilton allocation. Shield receives damage first; actual HP loss is distributed over
 // remaining rounded damage shares. Absorption is a distinct positive channel.
 function allocateHit(rows,hit,actual){
  dense(rows,1,8,"detail rows");validateHit(hit);
  for(const k of ["hpDamage","shieldDamage","absorbedHeal"])int(actual[k],0,MAX,k);
  if(actual.hpDamage+actual.shieldDamage>hit.damage||actual.absorbedHeal>(hit.absorb??0))fail("allocation bounds");
  const weights=rows.map(r=>{exact(r,["kind","mode","critical","weak","weight"],"detail row");if(!["physical","magic","fixed"].includes(r.kind)||!["normal","immune","absorb"].includes(r.mode)||typeof r.critical!=="boolean"||typeof r.weak!=="boolean")fail("detail row value");dense(r.weight,2,2,"weight");if(r.weight.some(x=>typeof x!=="string"||!/^\d{1,180}$/.test(x)))fail("weight digits");let w=frac(r.weight[0],r.weight[1]);if(r.mode==="immune"&&w[0])fail("immune weight");return w});
  const dmgWeight=weights.reduce((v,w,i)=>rows[i].mode==="normal"?add(v,w):v,frac(0)),absWeight=weights.reduce((v,w,i)=>rows[i].mode==="absorb"?add(v,w):v,frac(0));
  if(hit.damage!==(dmgWeight[0]?Math.max(1,half(dmgWeight)):0)|| (hit.absorb??0)!==half(absWeight))fail("detail weights disagree with hit");
  if(rows.length===1){let r=rows[0];return [{index:0,kind:r.kind,mode:r.mode,critical:r.critical,weak:r.weak,damage:hit.damage,shieldDamage:actual.shieldDamage,hpDamage:actual.hpDamage,absorbedHeal:actual.absorbedHeal}]}
  function split(amount,ws){
   let sum=ws.reduce(add,frac(0));if(!amount)return ws.map(()=>0);if(!sum[0])fail("empty allocation");
   let shares=ws.map((w,index)=>{let q=mul(frac(amount),mul(w,frac(sum[1],sum[0])));return {index,value:Number(q[0]/q[1]),rem:frac(q[0]%q[1],q[1])}});
   let rem=amount-shares.reduce((n,x)=>n+x.value,0);shares.sort((a,b)=>cmp(b.rem,a.rem)||a.index-b.index);
   for(let i=0;i<rem;i++)shares[i].value++;return shares.sort((a,b)=>a.index-b.index).map(x=>x.value)
  }
  const damaging=weights.map((w,i)=>rows[i].mode==="normal"?w:frac(0)),absorbing=weights.map((w,i)=>rows[i].mode==="absorb"?w:frac(0));
  const damage=split(hit.damage,damaging),shield=split(actual.shieldDamage,damage.map(x=>frac(x))),hp=split(actual.hpDamage,damage.map((x,i)=>frac(x-shield[i]))),heal=split(actual.absorbedHeal,absorbing);
  return rows.map((r,i)=>({index:i,kind:r.kind,mode:r.mode,critical:r.critical,weak:r.weak,damage:damage[i],shieldDamage:shield[i],hpDamage:hp[i],absorbedHeal:heal[i]}))
 }
 function applyHit(state,hit,options={}){validateState(state);validateHit(hit);optional(options,["survive"],"hit options");const {survive=false}=options;if(typeof survive!=="boolean")fail("survive");let d=hit.damage,a=hit.absorb??0;let s={...state};if(!s.hp)return {state:s,hpDamage:0,shieldDamage:0,absorbedHeal:0,survivalUsed:false};let sd=Math.min(s.shield,d);s.shield-=sd;let loss=Math.min(s.hp,d-sd),used=survive&&loss===s.hp&&loss>0;if(used)loss=s.hp-1;s.hp-=loss;if(s.hp===0)s.shield=0;let healed=s.hp>0?Math.min(s.hpMax-s.hp,a):0;s.hp+=healed;return {state:s,hpDamage:loss,shieldDamage:sd,absorbedHeal:healed,survivalUsed:used}}
 // Only for uninterrupted sequences; events between hits belong to the future turn engine.
 function applyHitSequence(state,hits,options={}){validateState(state);dense(hits,1,16,"hit sequence");for(const h of hits)validateHit(h);optional(options,["survive"],"sequence options");const {survive=false}=options;if(typeof survive!=="boolean")fail("survive");let s={...state},entries=[],remaining=survive;for(const h of hits){if(s.hp===0)break;let r=applyHit(s,h,{survive:remaining});entries.push(r);s=r.state;if(r.survivalUsed)remaining=false}return {state:s,entries,skipped:hits.length-entries.length,survivalRemaining:remaining,hpDamage:entries.reduce((n,x)=>n+x.hpDamage,0),shieldDamage:entries.reduce((n,x)=>n+x.shieldDamage,0),absorbedHeal:entries.reduce((n,x)=>n+x.absorbedHeal,0)}}
 function recoveryAmount(input){optional(input,["base","coefficientBp","fixed","givenBp","receivedBp"],"recovery");const {base,coefficientBp=10000,fixed=0,givenBp=10000,receivedBp=10000}=input;int(base,0,MAX,"recovery base");int(coefficientBp,0,100000,"coef");int(fixed,0,MAX,"fixed");int(givenBp,0,40000,"given");int(receivedBp,0,40000,"received");return half(frac(BigInt(base*coefficientBp+fixed*BP)*BigInt(givenBp)*BigInt(receivedBp),1000000000000n))}
 function heal(state,input){validateState(state);const amount=recoveryAmount(input),effective=state.hp===0?0:Math.min(state.hpMax-state.hp,amount);return {state:{...state,hp:state.hp+effective},effective,overflow:amount-effective}}
 function barrierAmount(input){return Math.min(MAX,recoveryAmount(input))}
 function barrier(state,amount){validateState(state);int(amount,0,MAX,"barrier");let effective=state.hp===0?0:Math.min(Math.floor(state.hpMax/2)-state.shield,amount);return {state:{...state,shield:state.shield+effective},effective}}
 function resource(state,key,delta){validateState(state);if(!["mp","spCenti"].includes(key))fail("resource");int(delta,-MAX,MAX,"delta");let max=key==="spCenti"?10000:state.mpMax;if(delta<0&&state[key]<-delta)return {state:{...state},ok:false,change:0};let value=clamp(state[key]+delta,0,max);return {state:{...state,[key]:value},ok:true,change:value-state[key]}}
 // Level-normalized WIL preserves aptitude differences from Lv1 to Lv120.
 function spBonusBp(wil,level){int(wil,1,MAX,"WIL");int(level,1,120,"level");const refMilli=29500+(level-1)*1330;return Math.min(4000,ratio(Math.max(0,3000*(2*wil*1000-refMilli)),2*refMilli))}
 // Base uses displayed whole points; returned gain and stored SP use hundredths of a point.
 function spGainCenti(base,wil,level,bonusBp=0){int(base,0,100,"SP base");int(bonusBp,-10000,10000,"SP bonus");return ratio(base*100*Math.max(0,BP+spBonusBp(wil,level)+bonusBp),BP)}
 function captureResizeAnchor(state){validateState(state);return {hp:{value:state.hp,max:state.hpMax},mp:{value:state.mp,max:state.mpMax}}}
 function validateAnchor(a){exact(a,["hp","mp"],"resize anchor");for(const k of ["hp","mp"]){exact(a[k],["value","max"],k+" anchor");int(a[k].max,1,MAX,"anchor max");int(a[k].value,0,a[k].max,"anchor value")}}
 function project(a,max,k){let q=ratio(a[k].value*max,a[k].max);return k==="hp"&&a[k].value>0?Math.max(1,q):q}
 function checkAnchor(s,a){validateAnchor(a);if(project(a,s.hpMax,"hp")!==s.hp||project(a,s.mpMax,"mp")!==s.mp)fail("stale resize anchor")}
 function resize(state,hpMax,mpMax,anchor){validateState(state);checkAnchor(state,anchor);int(hpMax,1,MAX,"hp max");int(mpMax,1,MAX,"mp max");return {...state,hpMax,mpMax,hp:project(anchor,hpMax,"hp"),mp:project(anchor,mpMax,"mp"),shield:0}}
 function refreshResizeAnchor(before,after,anchor){validateState(before);validateState(after);checkAnchor(before,anchor);if(before.hpMax!==after.hpMax||before.mpMax!==after.mpMax)fail("resize must not rebase anchor");const fresh=captureResizeAnchor(after);return {hp:before.hp===after.hp?{...anchor.hp}:fresh.hp,mp:before.mp===after.mp?{...anchor.mp}:fresh.mp}}
 function resolveTarget(input){obj(input,"target input");for(const k of Object.keys(input))if(!["kind","target","guarder"].includes(k))fail("unknown target key "+k);const {kind,target,guarder=null}=input;if(!["single","all"].includes(kind)||typeof target!=="string"||!target)fail("target");if(guarder!==null&&(typeof guarder!=="string"||!guarder))fail("guarder");return kind==="single"&&guarder!==null?guarder:target}
 return Object.freeze({KEYS,DER,ELEMENTS,validateData,validateInnate,validateCoef,derive,hitChance,defenseFactor,attribute,reduction,outgoing,validateState,damage,allocateHit,applyHit,applyHitSequence,heal,barrierAmount,barrier,resource,spBonusBp,spGainCenti,captureResizeAnchor,refreshResizeAnchor,resize,resolveTarget});
}
export const core=makeCore();
