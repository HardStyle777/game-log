(()=>{const factories={},cache={};
factories['./full_op_model.cjs']=function(require,module,exports){
'use strict';
const fs=require('node:fs');
const source=require('./full_op_source.json');
const stats=['力','敏捷','健康','知恵','知識','威厳','運'];
const elements={火:'fire',水:'water',風:'wind',土:'earth',大地:'earth',光:'light',闇:'dark',全:'all',魔法:'all'};
const statusNames={フリーズ:'freeze',コールド:'cold',スタン:'stun',混乱:'confuse',魅了:'charm',石化:'petrify',即死:'instant',毒:'poison',眠り:'sleep',状態異常:'state',状態系:'state',低下系:'debuff',呪い:'curse',全異常:'all',後退転倒:'knockback',後退:'knockback',致命打:'crit',決定打:'crush'};
const procNames={敵逃亡:'flee',ノックアウト:'knockout',即死:'instant',武器破壊:'weaponBreak',防具破壊:'armorBreak',コールド:'cold',フリーズ:'freeze',暗闇:'blind',スタン:'stun',石化:'petrify',混乱:'confuse',眠り:'sleep',魅了:'charm',ターゲット固定:'taunt',知能低下:'aiDown',狂気:'berserk'};
function parse(row){
 const [rawName,rawEffect,req,coef]=row.cells;const name=rawName.replace(/^\[|\]$/g,''),effect=rawEffect.replace(/<[^>]*>/g,'');
 const op={id:'row'+row.line,line:row.line,name,effect,req:Number(req),weight:Number(coef),tier:name.includes('ULT')?'ULT':name.includes('DX')?'DX':name.includes('EX')?'EX':'normal',rank:Number(name.match(/Lv(\d+)/)?.[1]||1)};
 const clean=name.replace(/^弱効果 /,'').replace(/Lv\d+.*| DX$| ULT$/g,'');
 if(!effect||!op.weight||['破壊','呪','エンチャント不可','貸与してくれる'].includes(name)||name.includes('攻撃段階上昇')){op.kind='system';op.family=name;op.reason=!op.weight?'掲載係数0（自然抽選対象外）':'管理属性・加工属性（自然OP抽選から除外する仮仕様）';return op;}
 let st=stats.find(s=>clean.startsWith(s));
 if(st){op.kind='stat';op.stat=st;op.mode=clean.includes('固定')?'fixed':clean.includes('比率')?'ratio':'flat';op.family=st+op.mode;return op;}
 if(effect.startsWith('スキルレベル')){op.kind='skill';op.classId=Number(effect.match(/\((\d+)系列/)?.[1]??-1);op.family='skill'+op.classId;return op;}
 const simple=[[/^ダメージ \+/,'attack'],[/^最小ダメージ/,'minAttack'],[/^最大ダメージ/,'maxAttack'],[/^防御力.*％/,'defPercent'],[/^防御力/,'defFlat'],[/^最大HP.*％/,'hpPercent'],[/^最大HP/,'hpFlat'],[/^最大CP.*％/,'cpPercent'],[/^最大CP/,'cpFlat'],[/^減少限界CP/,'cpFloor'],[/^命中率/,'hit'],[/^回避率/,'evade'],[/^ブロック率/,'block'],[/^致命打発動/,'crit'],[/^決定打発動/,'crush'],[/^ブロッキング速度/,'blockSpeed'],[/^移動速度/,'moveSpeed'],[/^攻撃速度/,'attackSpeed'],[/^ポーション回復速度/,'potionSpeed'],[/^集中力/,'concentration'],[/^CP獲得ボーナス/,'cpBonus'],[/^敵に与えたダメージ/,'life'],[/^ダメージ返し/,'reflect'],[/^ダメージをCP/,'cpConvert'],[/^HP回復/,'hpRegen'],[/^復活 /,'reviveChance'],[/^魔法アイテム\s*ドロップ/,'magicFind'],[/^ユニークアイテムドロップ/,'uniqueFind']];
 if(name==='絶対命中'){op.kind='flag';op.family='absoluteHit';return op;}
 for(const [re,family] of simple)if(re.test(effect)){op.kind='scalar';op.family=family;return op;}
 if(name==='回避補正無視'||name==='命中補正無視'){op.kind='flag';op.family=name==='回避補正無視'?'ignoreEvade':'ignoreHit';return op;}
 let el=Object.keys(elements).find(e=>clean.startsWith(e));
 if(el&&/攻撃|抵抗|吸収/.test(clean)){op.element=elements[el];op.kind=clean.includes('攻撃')?'elementDamage':clean.includes('抵抗')?'resist':'absorb';op.family=op.kind+op.element;return op;}
 if(/魔法抵抗/.test(effect)){op.kind='resist';op.element='all';op.family='resistall';return op;}
 if(clean.endsWith('抵抗')){op.kind='statusResist';op.status=statusNames[clean.replace(/抵抗$/,'')];if(!op.status)throw Error(name);op.family='resist'+op.status;return op;}
 const pr=Object.keys(procNames).find(p=>clean===p);if(pr){op.kind='proc';op.status=procNames[pr];op.family='proc'+op.status;return op;}
 if(clean==='反射フリーズ'||clean==='反射コールド'){op.kind='counter';op.status=clean==='反射フリーズ'?'freeze':'cold';op.family='counter'+op.status;return op;}
 if(effect.includes('応急処置')){op.kind='firstAid';op.family='firstAid';return op;}
 if(name==='ターゲット回避'||clean==='不可視'){op.kind='flag';op.family='noAggro';return op;}
 const context={変身速度:'武器切替をしない固定剣士ビルド',変身:'武器切替をしない固定剣士ビルド',浮遊:'地形・床罠がない対面戦闘',魔法弾丸:'剣士は弾丸を使わない',無限弾丸:'剣士は弾丸を使わない',永久弾:'剣士は弾丸を使わない',リロード速度:'鞄から直接薬を使う仕様でベルト補充なし',リロード:'鞄から直接薬を使う仕様でベルト補充なし',補充速度:'鞄から直接薬を使う仕様でベルト補充なし',自動リロード:'鞄から直接薬を使う仕様でベルト補充なし'};
 if(context[clean]){op.kind='context';op.family=clean;op.reason=context[clean];return op;}
 throw Error('Unclassified '+name+' '+effect);
}
const master=source.map(parse);if(master.length!==639)throw Error('Source incomplete');
function ranges(text,r){return text.replace(/\[(\d+)-(\d+)\]/g,(_,a,b)=>String(+a+Math.floor(r()*(+b-+a+1))));}
function roll(op,r){const text=ranges(op.effect,r),nums=(text.match(/\d+(?:\.\d+)?/g)||[]).map(Number);return {...op,rolled:text,nums};}
function value(op){return op.nums[0]||0;}
function pick(r,arr){let x=r()*arr.reduce((s,o)=>s+o.weight,0);for(const o of arr)if((x-=o.weight)<=0)return o;return arr.at(-1);}
const natural=master.filter(o=>o.kind!=='system');
function requirement(base,ops){const reqs=ops.map(o=>o.req).sort((a,b)=>b-a);return base+Math.floor((reqs[0]||0)+(reqs[1]||0)*2/3+(reqs[2]||0)/3);}
function item(r,level,id,noOP=false,magicFind=0,uniqueFind=0){const slot=['weapon','armor','charm'][Math.floor(r()*3)],baseLevel=Math.max(1,Math.floor(level*(.65+r()*.30)));const countRoll=r();let n=countRoll<.2?0:countRoll<.66?1:countRoll<.93?2:3;if(n===0&&r()<Math.min(.9,.8*magicFind))n=1;const ops=[],used=new Set();for(let i=0;i<n;i++){const op=pick(r,natural.filter(o=>!used.has(o.family)));used.add(op.family);ops.push(roll(op,r));}const quality=.9+r()*.2;const unique=r()<Math.min(.2,.002*(1+uniqueFind));return{id,slot,baseLevel,quality:quality*(unique?1.2:1),unique,req:noOP?baseLevel:requirement(baseLevel,ops),ops:noOP?[]:ops};}
function player(level,gear,enhance={weapon:0,armor:0,charm:0}){
 const s={力:10+Math.floor((level-1)*1.5),敏捷:10+Math.floor((level-1)*.5),健康:10+level-1,知恵:10,知識:10,威厳:10,運:10};s.運+=4*(level-1)-(s.力-10+s.敏捷-10+s.健康-10);
 const b={},fixed={},p={resist:{},absorb:{},statusResist:{},elementDamage:{},procs:[],skills:[],classId:0};let skill=0;
 const add=(o,k,v)=>o[k]=(o[k]||0)+v;
 for(const op of gear.flatMap(g=>g.ops)){
 const v=value(op),n=op.nums;
 if(op.kind==='stat'){if(op.mode==='fixed')fixed[op.stat]=Math.max(fixed[op.stat]||0,v);else s[op.stat]+=op.mode==='ratio'?Math.floor(level*v/n[1]):v;}
 else if(op.kind==='scalar')add(b,op.family,op.family==='hpRegen'?v/10:v);
 else if(op.kind==='skill'){if(op.classId===-1||op.classId===p.classId)skill+=v;}
 else if(op.kind==='flag')p[op.family]=true;
 else if(op.kind==='resist'||op.kind==='absorb'){for(const el of op.element==='all'?['fire','water','wind','earth','light','dark']:[op.element])add(p[op.kind],el,v/100);}
 else if(op.kind==='statusResist')add(p.statusResist,op.status,v/100);
 else if(op.kind==='proc')p.procs.push({type:op.status,chance:v/100,duration:n[1]||1});
 else if(op.kind==='counter')p[op.status==='cold'?'counterCold':'counterFreeze']={type:op.status,chance:v/100,duration:n[1]||1};
 else if(op.kind==='firstAid')add(b,'firstAid',n[1]||0);
 else if(op.kind==='elementDamage'){
 const earth=op.element==='earth',lo=earth?n[1]:n[0],hi=earth?n[2]:n[1];const old=p.elementDamage[op.element]||[0,0];p.elementDamage[op.element]=[old[0]+lo,old[1]+hi];
 if(earth)p.poisonDuration=Math.max(p.poisonDuration||0,n[0]);
 else if(op.element==='water')p.procs.push({type:'cold',chance:1,duration:n[2]/16});
 else if(op.element==='wind')p.procs.push({type:'stun',chance:1,duration:n[2]/16});
 else if(op.element==='light')p.procs.push({type:'lightDebuff',chance:1,duration:n[2]});
 else if(op.element==='dark')p.procs.push({type:'curse',chance:1,duration:n[2]});
 }
 }
 Object.assign(s,fixed);const power=slot=>{const g=gear.find(g=>g.slot===slot);return g.baseLevel*g.quality*(1+.04*(enhance[slot]||0));};
 p.hp=(180+level*9+s.健康*4+power('charm')*4+(b.hpFlat||0))*(1+(b.hpPercent||0)/100);
 p.cp=(45+s.威厳*.5+(b.cpFlat||0))*(1+(b.cpPercent||0)/100);
 p.atk=(18+level*.45+s.力*.2+power('weapon')*1.25)*(1+(b.attack||0)/100);
 p.def=(8+level*.03+s.健康*.01+power('armor')*.25+(b.defFlat||0))*(1+(b.defPercent||0)/100);
 p.hit=p.absoluteHit?1:Math.min(.99,.88+s.敏捷/(level+100)*.06+(b.hit||0)/100);
 p.evade=Math.min(.45,.03+s.敏捷/(level+100)*.02+(b.evade||0)/100);
 p.crit=Math.min(.65,.06+s.運/(level+100)*.04+(b.crit||0)/100);p.critMult=1.7;p.hpRegen=p.hp*.005+(b.hpRegen||0);p.cpRegen=7+s.威厳*.002;
 for(const el of ['fire','water','wind','earth','light','dark'])p.resist[el]=Math.min(.85,(p.resist[el]||0)+s.知恵/(level+100)*.02);
 for(const key of ['life','block','crush','concentration','cpBonus','reflect','cpConvert','firstAid','reviveChance','magicFind','uniqueFind'])p[key]=(b[key]||0)/100;
 for(const key of ['attackSpeed','blockSpeed','moveSpeed','potionSpeed'])p[key]=1+(b[key]||0)/100;
 for(const key of ['minAttack','maxAttack','cpFloor'])p[key]=b[key]||0;
 p.critResist=p.statusResist.crit||0;p.crushResist=p.statusResist.crush||0;p.potions=20;p.stats=s;
 // Physical swordsman; knowledge supports an optional fire skill, not all physical skills.
 p.magicPower=1+s.知識/200;
 p.skills=[{id:'heal_potion',type:'potion',hpBelow:.4,healRatio:.3,cast:.5,cooldown:15},{id:'cleave',mult:1.7*(1+.04*skill),cost:12,cooldown:5,cast:.8,targets:3,element:'physical'},{id:'burst',mult:3.2*(1+.04*skill),cost:18,cooldown:9,cast:1.1,targets:1,element:'physical'}];return p;
}
module.exports={master,natural,roll,item,player,requirement,stats};
if(require.main===module){fs.writeFileSync('full_op_master.json',JSON.stringify(master,null,2));console.log({rows:master.length,natural:natural.length,families:new Set(natural.map(o=>o.family)).size,counts:master.reduce((a,o)=>(a[o.kind]=(a[o.kind]||0)+1,a),{})});}

};
factories['./balanced_loot.cjs']=function(require,module,exports){
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

};
factories['./town_shop.cjs']=function(require,module,exports){
'use strict';
// Candidate economy; item prices are not recovered original specifications.
const defaults={enabled:true,threshold:5,target:30,reserve:100,price:10};
function purchase({gold,potions},settings={},manual=false){
 const s={...defaults,...settings};
 for(const [key,v] of Object.entries({gold,potions,...Object.fromEntries(['threshold','target','reserve','price'].map(k=>[k,s[k]]))}))
   if(!Number.isSafeInteger(v)||v<0)throw new Error('Invalid '+key);
 if(s.price===0||s.target<=s.threshold)throw new Error('Invalid shop settings');
 if(!manual&&(!s.enabled||potions>s.threshold))return {gold,potions,bought:0,spent:0,reason:'not_requested'};
 const bought=Math.max(0,Math.min(s.target-potions,Math.floor(Math.max(0,gold-s.reserve)/s.price)));
 return {gold:gold-bought*s.price,potions:potions+bought,bought,spent:bought*s.price,reason:bought?'purchased':'insufficient_budget_or_full'};
}
module.exports={purchase,defaults};

};
factories['./live_combat.cjs']=function(require,module,exports){
'use strict';
// Experimental combat semantics, not a reconstruction of Red Stone combat.
// Bosses ignore instant death/charm/flee; control proc chance is quartered.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
function* stream({player:p,enemies,state={},seed=1,maxSeconds=180}){
 let z=seed>>>0;const rnd=()=>{z+=0x6D2B79F5;let x=z;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296};
 const maxHp=p.hp,maxCp=p.cp||0;let hp=Math.min(maxHp,state.hp??maxHp),cp=Math.min(maxCp,state.cp??maxCp),t=0,potions=state.potions??p.potions??0,potionReady=state.potionCooldown||0,potionsUsed=0,pending,chaseDelay=0;
 let cursor=state.cursor||0,events=[];
 const snapshot=()=>({seconds:t,hp:Math.max(0,hp),cp,potions,cursor,action:pending?.s?.id||null,foes:foes.map(e=>({hp:Math.max(0,e.hp),maxHp:e.maxHp,element:e.element,statuses:{...e.statuses}})),events:events.splice(0)});
 const casts={},ps={...(state.statuses||{})},hots=(state.hots||[]).map(x=>({...x}));
 const skills=(p.actions||p.skills||[]).map(s=>({...s,ready:state.cooldowns?.[s.id]||0}));
 const foes=enemies.map(e=>({...e,hp:e.hp,maxHp:e.hp,statuses:{},next:Math.max(.1,e.interval||2)+(p.noAggro?1:0)}));
 const living=()=>foes.filter(e=>e.hp>0);const active=(s,k)=>s[k]>t;
 const disabled=s=>['freeze','stun','petrify','sleep','knockout','charm','flee','knockback'].some(k=>active(s,k));
 const resist=(o,k)=>clamp(o?.[k],-.5,.85);
 // Physical defense and elemental resistance are separate mitigation channels.
 const mitigate=(raw,element,target,statuses)=>element==='physical'
  ?raw*100/(100+Math.max(0,target.def||0)*(active(statuses,'armorBreak')?.7:1))
  :raw*(1-resist(target.resist,element));
 const out=(win,reason)=>({view:snapshot(),win,reason,seconds:+t.toFixed(6),hp:Math.max(0,hp),cp,casts,potionsUsed,state:{cursor,hp:Math.max(0,hp),cp,potions,potionCooldown:Math.max(0,potionReady-t),cooldowns:Object.fromEntries(skills.map(s=>[s.id,Math.max(0,s.ready-t)])),statuses:Object.fromEntries(Object.entries(ps).filter(([,v])=>v>t).map(([k,v])=>[k,v-t])),hots:hots.filter(h=>h.until>t).map(h=>({rate:h.rate,until:h.until-t}))}});
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
 const eligible=s=>s.ready<=t+1e-8&&(s.type==='potion'?potions>0&&potionReady<=t&&hp/maxHp<=clamp(s.hpBelow??.4):cp>=Math.max(0,s.cost||0));
 let s;
 if(p.ordered){for(let n=0;n<skills.length;n++){const i=(cursor+n)%skills.length;if(eligible(skills[i])){s=skills[i];cursor=(i+1)%skills.length;break;}}}else s=skills.find(eligible);
 if(!s)s={id:'basic',mult:1,cast:1,targets:1,basic:true,hitFractions:p.ordered?[145/375]:undefined};
 if(s.type==='potion'){potions--;potionsUsed++;potionReady=t+Math.max(.1,s.cooldown??15);s.ready=potionReady;}
 else{cp-=Math.max(0,s.cost||0);s.ready=t+Math.max(0,s.cooldown||0)*(1-clamp(p.cdr,0,.6));}
 const slow=active(ps,'cold')?1.5:1;
 const duration=chaseDelay+Math.max(.05,(s.cast||.1)*(s.type==='potion'?1:slow/Math.max(.1,p.attackSpeed||1)));pending={s,start:t,end:t+duration,done:t+duration,hit:0};if(s.hitFractions)pending.done=t+duration*s.hitFractions[0];events.push({type:"cast",id:s.id,time:t,duration});chaseDelay=0;
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
 else for(const e of living().slice(0,Math.max(1,s.targets||1))){
 const hit=p.absoluteHit?1:clamp((p.hit??.95)-(p.ignoreEvade?0:Math.max(0,(e.evade||0)-(active(e.statuses,'lightDebuff')?.15:0)))-(active(ps,'blind')||active(ps,'lightDebuff')?.15:0),.05,1);if(rnd()>=hit){events.push({type:"miss",target:foes.indexOf(e),time:t});continue;}
 const crit=rnd()<clamp((p.crit||0)-(e.critResist||0));
 const flat=(p.minAttack||0)+rnd()*Math.max(0,(p.maxAttack||0)-(p.minAttack||0));
 const element=s.element||'physical';
 const raw=Math.max(0,element==='physical'?(p.atk||0)+flat:s.powerSource==='weapon'?((p.atk||0)+flat)*(1+(p.stats?.知識||0)/500):(p.magicPower||0))*(s.mult??1)/(s.hitFractions?.length||1)*(crit?Math.max(1,p.critMult||1.5):1)*(active(ps,'weaponBreak')?.7:1)*(active(ps,'berserk')?1.2:1);
 let damage=mitigate(raw,element,e,e.statuses);
 for(const [el,v]of Object.entries(p.elementDamage||{})){const amt=(v[0]+rnd()*(v[1]-v[0]))*(1-resist(e.resist,el));if(el==='earth'){const duration=Math.max(.1,p.poisonDuration||2);e.poisonRate=amt/duration*(1-clamp((e.statusResist?.poison||0)+(e.statusResist?.state||0)+(e.statusResist?.all||0)));e.poisonUntil=t+duration;}else damage+=amt/(s.hitFractions?.length||1);}
 
 const actual=Math.min(e.hp,Math.max(0,damage));e.hp-=actual;events.push({type:"hit",id:s.id,target:foes.indexOf(e),damage:actual,element,crit,time:t});if(actual>0)delete e.statuses.sleep;hp=Math.min(maxHp,hp+actual*clamp(p.life));proc(p.procs,e);proc(s.procs,e);if(p.crush&&rnd()<clamp(p.crush)*(1-clamp(e.crushResist)))e.hp-=Math.max(0,e.hp)*.25;
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

};
factories['./enemies.cjs']=function(require,module,exports){
const els=['physical','fire','water','wind','earth','light','dark'];
const types=['cold','freeze','stun','petrify','confuse','sleep','charm','knockback','weaponBreak','armorBreak','blind','curse','instant'];
function enemies(level,boss,count=1){const stage=Math.floor(level/10),element=els[stage%7];return Array.from({length:count},(_,i)=>({hp:(50+level*15)*(boss?7:count===1?1:.64),atk:(7+level*.67)*(boss?1.5:count===1?1:.57),def:(5+level*.10)*(boss?1.2:1),interval:boss?1.8:2.2+i*.3,element,boss,hit:.96,evade:stage%5===0?.12:0,crit:stage%4===0?.15:.03,crush:stage%11===0?.04:0,cpDrain:stage%6===0?8:0,hpRegen:stage%9===0?(50+level*15)*.002:0,resist:{[element]:.25,[els[(stage+2)%7]]:-.15},statusResist:{state:boss?.4:stage%4===0?.25:0},procs:level>=30?[{type:types[stage%types.length],chance:types[stage%types.length]==='instant'?.005:.12,duration:2}]:[]}));}

module.exports={enemies};
};
factories['./full_op_source.json']=function(r,m){m.exports=[
  {
    "line": 175,
    "cells": [
      "[力Lv1]",
      "力 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 176,
    "cells": [
      "[力Lv2]",
      "力 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 177,
    "cells": [
      "[力Lv3]",
      "力 +[4-5]",
      "+7",
      "100"
    ]
  },
  {
    "line": 178,
    "cells": [
      "[力Lv4]",
      "力 +[6-7]",
      "+13",
      "100"
    ]
  },
  {
    "line": 179,
    "cells": [
      "[力Lv5]",
      "力 +[8-10]",
      "+21",
      "100"
    ]
  },
  {
    "line": 180,
    "cells": [
      "[力Lv6]",
      "力 +[11-15]",
      "+31",
      "100"
    ]
  },
  {
    "line": 181,
    "cells": [
      "[力Lv7]",
      "力 +[16-20]",
      "+44",
      "100"
    ]
  },
  {
    "line": 182,
    "cells": [
      "[力Lv8]",
      "力 +[21-30]",
      "+60",
      "95"
    ]
  },
  {
    "line": 183,
    "cells": [
      "[力Lv9]",
      "力 +[31-50]",
      "+79",
      "80"
    ]
  },
  {
    "line": 184,
    "cells": [
      "[力Lv10]",
      "力 +[51-100]",
      "+100",
      "85"
    ]
  },
  {
    "line": 185,
    "cells": [
      "[力Lv1 DX]",
      "力 +[101-150]",
      "+250",
      "5"
    ]
  },
  {
    "line": 186,
    "cells": [
      "[力Lv1 ULT]",
      "力 +[151-200]",
      "+350",
      "5"
    ]
  },
  {
    "line": 187,
    "cells": [
      "[敏捷Lv1]",
      "敏捷 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 188,
    "cells": [
      "[敏捷Lv2]",
      "敏捷 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 189,
    "cells": [
      "[敏捷Lv3]",
      "敏捷 +[4-5]",
      "+7",
      "100"
    ]
  },
  {
    "line": 190,
    "cells": [
      "[敏捷Lv4]",
      "敏捷 +[6-7]",
      "+13",
      "100"
    ]
  },
  {
    "line": 191,
    "cells": [
      "[敏捷Lv5]",
      "敏捷 +[8-10]",
      "+21",
      "100"
    ]
  },
  {
    "line": 192,
    "cells": [
      "[敏捷Lv6]",
      "敏捷 +[11-15]",
      "+31",
      "100"
    ]
  },
  {
    "line": 193,
    "cells": [
      "[敏捷Lv7]",
      "敏捷 +[16-20]",
      "+44",
      "100"
    ]
  },
  {
    "line": 194,
    "cells": [
      "[敏捷Lv8]",
      "敏捷 +[21-30]",
      "+60",
      "95"
    ]
  },
  {
    "line": 195,
    "cells": [
      "[敏捷Lv9]",
      "敏捷 +[31-50]",
      "+79",
      "80"
    ]
  },
  {
    "line": 196,
    "cells": [
      "[敏捷Lv10]",
      "敏捷 +[51-100]",
      "+100",
      "85"
    ]
  },
  {
    "line": 197,
    "cells": [
      "[敏捷Lv1 DX]",
      "敏捷 +[101-150]",
      "+250",
      "5"
    ]
  },
  {
    "line": 198,
    "cells": [
      "[敏捷Lv1 ULT]",
      "敏捷 +[151-200]",
      "+350",
      "5"
    ]
  },
  {
    "line": 199,
    "cells": [
      "[健康Lv1]",
      "健康 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 200,
    "cells": [
      "[健康Lv2]",
      "健康 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 201,
    "cells": [
      "[健康Lv3]",
      "健康 +[4-5]",
      "+7",
      "100"
    ]
  },
  {
    "line": 202,
    "cells": [
      "[健康Lv4]",
      "健康 +[6-7]",
      "+13",
      "100"
    ]
  },
  {
    "line": 203,
    "cells": [
      "[健康Lv5]",
      "健康 +[8-10]",
      "+21",
      "100"
    ]
  },
  {
    "line": 204,
    "cells": [
      "[健康Lv6]",
      "健康 +[11-15]",
      "+31",
      "100"
    ]
  },
  {
    "line": 205,
    "cells": [
      "[健康Lv7]",
      "健康 +[16-20]",
      "+44",
      "100"
    ]
  },
  {
    "line": 206,
    "cells": [
      "[健康Lv8]",
      "健康 +[21-30]",
      "+60",
      "95"
    ]
  },
  {
    "line": 207,
    "cells": [
      "[健康Lv9]",
      "健康 +[31-50]",
      "+79",
      "80"
    ]
  },
  {
    "line": 208,
    "cells": [
      "[健康Lv10]",
      "健康 +[51-100]",
      "+100",
      "85"
    ]
  },
  {
    "line": 209,
    "cells": [
      "[健康Lv1 DX]",
      "健康 +[101-150]",
      "+250",
      "5"
    ]
  },
  {
    "line": 210,
    "cells": [
      "[健康Lv1 ULT]",
      "健康 +[151-200]",
      "+350",
      "5"
    ]
  },
  {
    "line": 211,
    "cells": [
      "[知恵Lv1]",
      "知恵 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 212,
    "cells": [
      "[知恵Lv2]",
      "知恵 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 213,
    "cells": [
      "[知恵Lv3]",
      "知恵 +[4-5]",
      "+7",
      "100"
    ]
  },
  {
    "line": 214,
    "cells": [
      "[知恵Lv4]",
      "知恵 +[6-7]",
      "+13",
      "100"
    ]
  },
  {
    "line": 215,
    "cells": [
      "[知恵Lv5]",
      "知恵 +[8-10]",
      "+21",
      "100"
    ]
  },
  {
    "line": 216,
    "cells": [
      "[知恵Lv6]",
      "知恵 +[11-15]",
      "+31",
      "100"
    ]
  },
  {
    "line": 217,
    "cells": [
      "[知恵Lv7]",
      "知恵 +[16-20]",
      "+44",
      "100"
    ]
  },
  {
    "line": 218,
    "cells": [
      "[知恵Lv8]",
      "知恵 +[21-30]",
      "+60",
      "95"
    ]
  },
  {
    "line": 219,
    "cells": [
      "[知恵Lv9]",
      "知恵 +[31-50]",
      "+79",
      "80"
    ]
  },
  {
    "line": 220,
    "cells": [
      "[知恵Lv10]",
      "知恵 +[51-100]",
      "+100",
      "85"
    ]
  },
  {
    "line": 221,
    "cells": [
      "[知恵Lv1 DX]",
      "知恵 +[101-150]",
      "+250",
      "5"
    ]
  },
  {
    "line": 222,
    "cells": [
      "[知恵Lv1 ULT]",
      "知恵 +[151-200]",
      "+350",
      "5"
    ]
  },
  {
    "line": 223,
    "cells": [
      "[知識Lv1]",
      "知識 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 224,
    "cells": [
      "[知識Lv2]",
      "知識 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 225,
    "cells": [
      "[知識Lv3]",
      "知識 +[4-5]",
      "+7",
      "100"
    ]
  },
  {
    "line": 226,
    "cells": [
      "[知識Lv4]",
      "知識 +[6-7]",
      "+13",
      "100"
    ]
  },
  {
    "line": 227,
    "cells": [
      "[知識Lv5]",
      "知識 +[8-10]",
      "+21",
      "100"
    ]
  },
  {
    "line": 228,
    "cells": [
      "[知識Lv6]",
      "知識 +[11-15]",
      "+31",
      "100"
    ]
  },
  {
    "line": 229,
    "cells": [
      "[知識Lv7]",
      "知識 +[16-20]",
      "+44",
      "100"
    ]
  },
  {
    "line": 230,
    "cells": [
      "[知識Lv8]",
      "知識 +[21-30]",
      "+60",
      "95"
    ]
  },
  {
    "line": 231,
    "cells": [
      "[知識Lv9]",
      "知識 +[31-50]",
      "+79",
      "80"
    ]
  },
  {
    "line": 232,
    "cells": [
      "[知識Lv10]",
      "知識 +[51-100]",
      "+100",
      "85"
    ]
  },
  {
    "line": 233,
    "cells": [
      "[知識Lv1 DX]",
      "知識 +[101-150]",
      "+250",
      "5"
    ]
  },
  {
    "line": 234,
    "cells": [
      "[知識Lv1 ULT]",
      "知識 +[151-200]",
      "+350",
      "5"
    ]
  },
  {
    "line": 235,
    "cells": [
      "[威厳Lv1]",
      "カリスマ +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 236,
    "cells": [
      "[威厳Lv2]",
      "カリスマ +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 237,
    "cells": [
      "[威厳Lv3]",
      "カリスマ +[4-5]",
      "+7",
      "100"
    ]
  },
  {
    "line": 238,
    "cells": [
      "[威厳Lv4]",
      "カリスマ +[6-7]",
      "+13",
      "100"
    ]
  },
  {
    "line": 239,
    "cells": [
      "[威厳Lv5]",
      "カリスマ +[8-10]",
      "+21",
      "100"
    ]
  },
  {
    "line": 240,
    "cells": [
      "[威厳Lv6]",
      "カリスマ +[11-15]",
      "+31",
      "100"
    ]
  },
  {
    "line": 241,
    "cells": [
      "[威厳Lv7]",
      "カリスマ +[16-20]",
      "+44",
      "100"
    ]
  },
  {
    "line": 242,
    "cells": [
      "[威厳Lv8]",
      "カリスマ +[21-30]",
      "+60",
      "95"
    ]
  },
  {
    "line": 243,
    "cells": [
      "[威厳Lv9]",
      "カリスマ +[31-50]",
      "+79",
      "80"
    ]
  },
  {
    "line": 244,
    "cells": [
      "[威厳Lv10]",
      "カリスマ +[51-100]",
      "+100",
      "85"
    ]
  },
  {
    "line": 245,
    "cells": [
      "[威厳Lv1 DX]",
      "カリスマ +[101-150]",
      "+250",
      "5"
    ]
  },
  {
    "line": 246,
    "cells": [
      "[威厳Lv1 ULT]",
      "カリスマ +[151-200]",
      "+350",
      "5"
    ]
  },
  {
    "line": 247,
    "cells": [
      "[運Lv1]",
      "運 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 248,
    "cells": [
      "[運Lv2]",
      "運 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 249,
    "cells": [
      "[運Lv3]",
      "運 +[4-5]",
      "+7",
      "100"
    ]
  },
  {
    "line": 250,
    "cells": [
      "[運Lv4]",
      "運 +[6-7]",
      "+13",
      "100"
    ]
  },
  {
    "line": 251,
    "cells": [
      "[運Lv5]",
      "運 +[8-10]",
      "+21",
      "100"
    ]
  },
  {
    "line": 252,
    "cells": [
      "[運Lv6]",
      "運 +[11-15]",
      "+31",
      "100"
    ]
  },
  {
    "line": 253,
    "cells": [
      "[運Lv7]",
      "運 +[16-20]",
      "+44",
      "100"
    ]
  },
  {
    "line": 254,
    "cells": [
      "[運Lv8]",
      "運 +[21-30]",
      "+60",
      "95"
    ]
  },
  {
    "line": 255,
    "cells": [
      "[運Lv9]",
      "運 +[31-50]",
      "+79",
      "80"
    ]
  },
  {
    "line": 256,
    "cells": [
      "[運Lv10]",
      "運 +[51-100]",
      "+100",
      "85"
    ]
  },
  {
    "line": 257,
    "cells": [
      "[運Lv1 DX]",
      "運 +[101-150]",
      "+250",
      "5"
    ]
  },
  {
    "line": 258,
    "cells": [
      "[運Lv1 ULT]",
      "運 +[151-200]",
      "+350",
      "5"
    ]
  },
  {
    "line": 259,
    "cells": [
      "[力固定]",
      "力固定 [35-120]",
      "+30",
      "100"
    ]
  },
  {
    "line": 260,
    "cells": [
      "[敏捷固定]",
      "敏捷固定 [35-120]",
      "+30",
      "100"
    ]
  },
  {
    "line": 261,
    "cells": [
      "[健康固定]",
      "健康固定 [35-120]",
      "+30",
      "100"
    ]
  },
  {
    "line": 262,
    "cells": [
      "[知恵固定]",
      "知恵固定 [35-120]",
      "+30",
      "100"
    ]
  },
  {
    "line": 263,
    "cells": [
      "[知識固定]",
      "知識固定 [35-120]",
      "+30",
      "100"
    ]
  },
  {
    "line": 264,
    "cells": [
      "[威厳固定]",
      "カリスマ固定 [35-120]",
      "+30",
      "100"
    ]
  },
  {
    "line": 265,
    "cells": [
      "[運固定]",
      "運固定 [35-120]",
      "+30",
      "100"
    ]
  },
  {
    "line": 266,
    "cells": [
      "[力固定 DX]",
      "力固定 [50-150]",
      "+230",
      "2"
    ]
  },
  {
    "line": 267,
    "cells": [
      "[敏捷固定 DX]",
      "敏捷固定 [50-150]",
      "+230",
      "2"
    ]
  },
  {
    "line": 268,
    "cells": [
      "[健康固定 DX]",
      "健康固定 [50-150]",
      "+230",
      "2"
    ]
  },
  {
    "line": 269,
    "cells": [
      "[知恵固定 DX]",
      "知恵固定 [50-150]",
      "+230",
      "2"
    ]
  },
  {
    "line": 270,
    "cells": [
      "[知識固定 DX]",
      "知識固定 [50-150]",
      "+230",
      "2"
    ]
  },
  {
    "line": 271,
    "cells": [
      "[威厳固定 DX]",
      "カリスマ固定 [50-150]",
      "+230",
      "2"
    ]
  },
  {
    "line": 272,
    "cells": [
      "[運固定 DX]",
      "運固定 [50-150]",
      "+230",
      "2"
    ]
  },
  {
    "line": 273,
    "cells": [
      "[力固定 ULT]",
      "力固定 [100-200]",
      "+330",
      "2"
    ]
  },
  {
    "line": 274,
    "cells": [
      "[敏捷固定 ULT]",
      "敏捷固定 [100-200]",
      "+330",
      "2"
    ]
  },
  {
    "line": 275,
    "cells": [
      "[健康固定 ULT]",
      "健康固定 [100-200]",
      "+330",
      "2"
    ]
  },
  {
    "line": 276,
    "cells": [
      "[知恵固定 ULT]",
      "知恵固定 [100-200]",
      "+330",
      "2"
    ]
  },
  {
    "line": 277,
    "cells": [
      "[知識固定 ULT]",
      "知識固定 [100-200]",
      "+330",
      "2"
    ]
  },
  {
    "line": 278,
    "cells": [
      "[威厳固定 ULT]",
      "カリスマ固定 [100-200]",
      "+330",
      "2"
    ]
  },
  {
    "line": 279,
    "cells": [
      "[運固定 ULT]",
      "運固定 [100-200]",
      "+330",
      "2"
    ]
  },
  {
    "line": 280,
    "cells": [
      "[力比率上昇Lv1]",
      "力 +[1-2]/レベル [8-12]",
      "+30",
      "50"
    ]
  },
  {
    "line": 281,
    "cells": [
      "[力比率上昇Lv2]",
      "力 +1/レベル [2-3]",
      "+75",
      "10"
    ]
  },
  {
    "line": 282,
    "cells": [
      "[敏捷比率上昇Lv1]",
      "敏捷 +[1-2]/レベル [8-12]",
      "+30",
      "50"
    ]
  },
  {
    "line": 283,
    "cells": [
      "[敏捷比率上昇Lv2]",
      "敏捷 +1/レベル [2-3]",
      "+75",
      "10"
    ]
  },
  {
    "line": 284,
    "cells": [
      "[健康比率上昇Lv1]",
      "健康 +[1-2]/レベル [8-12]",
      "+30",
      "50"
    ]
  },
  {
    "line": 285,
    "cells": [
      "[健康比率上昇Lv2]",
      "健康 +1/レベル [2-3]",
      "+75",
      "10"
    ]
  },
  {
    "line": 286,
    "cells": [
      "[知恵比率上昇Lv1]",
      "知恵 +[1-2]/レベル [8-12]",
      "+30",
      "50"
    ]
  },
  {
    "line": 287,
    "cells": [
      "[知恵比率上昇Lv2]",
      "知恵 +1/レベル [2-3]",
      "+75",
      "10"
    ]
  },
  {
    "line": 288,
    "cells": [
      "[知識比率上昇Lv1]",
      "知識 +[1-2]/レベル [8-12]",
      "+30",
      "50"
    ]
  },
  {
    "line": 289,
    "cells": [
      "[知識比率上昇Lv2]",
      "知識 +1/レベル [2-3]",
      "+75",
      "10"
    ]
  },
  {
    "line": 290,
    "cells": [
      "[威厳比率上昇Lv1]",
      "カリスマ +[1-2]/レベル [8-12]",
      "+30",
      "50"
    ]
  },
  {
    "line": 291,
    "cells": [
      "[威厳比率上昇Lv2]",
      "カリスマ +1/レベル [2-3]",
      "+75",
      "10"
    ]
  },
  {
    "line": 292,
    "cells": [
      "[運比率上昇Lv1]",
      "運 +[1-2]/レベル [8-12]",
      "+30",
      "50"
    ]
  },
  {
    "line": 293,
    "cells": [
      "[運比率上昇Lv2]",
      "運 +1/レベル [2-3]",
      "+75",
      "10"
    ]
  },
  {
    "line": 294,
    "cells": [
      "[攻撃力Lv1]",
      "ダメージ +[2-5]％",
      "+1",
      "100"
    ]
  },
  {
    "line": 295,
    "cells": [
      "[攻撃Lv2]",
      "ダメージ +[6-10]％",
      "+3",
      "90"
    ]
  },
  {
    "line": 296,
    "cells": [
      "[攻撃Lv3]",
      "ダメージ +[11-15]％",
      "+7",
      "80"
    ]
  },
  {
    "line": 297,
    "cells": [
      "[攻撃Lv4]",
      "ダメージ +[16-25]％",
      "+13",
      "70"
    ]
  },
  {
    "line": 298,
    "cells": [
      "[攻撃Lv5]",
      "ダメージ +[26-40]％",
      "+21",
      "60"
    ]
  },
  {
    "line": 299,
    "cells": [
      "[攻撃Lv6]",
      "ダメージ +[41-60]％",
      "+31",
      "50"
    ]
  },
  {
    "line": 300,
    "cells": [
      "[攻撃Lv7]",
      "ダメージ +[61-80]％",
      "+44",
      "40"
    ]
  },
  {
    "line": 301,
    "cells": [
      "[攻撃Lv8]",
      "ダメージ +[81-100]％",
      "+60",
      "30"
    ]
  },
  {
    "line": 302,
    "cells": [
      "[攻撃Lv9]",
      "ダメージ +[101-120]％",
      "+79",
      "20"
    ]
  },
  {
    "line": 303,
    "cells": [
      "[攻撃Lv10]",
      "ダメージ +[121-150]％",
      "+100",
      "10"
    ]
  },
  {
    "line": 304,
    "cells": [
      "[最低攻撃Lv1]",
      "最小ダメージ +1",
      "+4",
      "100"
    ]
  },
  {
    "line": 305,
    "cells": [
      "[最低攻撃Lv2]",
      "最小ダメージ +2",
      "+10",
      "100"
    ]
  },
  {
    "line": 306,
    "cells": [
      "[最低攻撃Lv3]",
      "最小ダメージ +[3-4]",
      "+22",
      "100"
    ]
  },
  {
    "line": 307,
    "cells": [
      "[最低攻撃Lv4]",
      "最小ダメージ +[5-7]",
      "+40",
      "75"
    ]
  },
  {
    "line": 308,
    "cells": [
      "[最低攻撃Lv5]",
      "最小ダメージ +[8-10]",
      "+64",
      "50"
    ]
  },
  {
    "line": 309,
    "cells": [
      "[最高攻撃Lv1]",
      "最大ダメージ +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 310,
    "cells": [
      "[最高攻撃Lv2]",
      "最大ダメージ +[2-3]",
      "+6",
      "100"
    ]
  },
  {
    "line": 311,
    "cells": [
      "[最高攻撃Lv3]",
      "最大ダメージ +[4-6]",
      "+21",
      "100"
    ]
  },
  {
    "line": 312,
    "cells": [
      "[最高攻撃Lv4]",
      "最大ダメージ +[7-12]",
      "+46",
      "100"
    ]
  },
  {
    "line": 313,
    "cells": [
      "[最高攻撃Lv5]",
      "最大ダメージ +[13-20]",
      "+81",
      "75"
    ]
  },
  {
    "line": 314,
    "cells": [
      "[攻撃力Lv1 DX]",
      "ダメージ +[151-200]％",
      "+250",
      "5"
    ]
  },
  {
    "line": 315,
    "cells": [
      "[最低攻撃Lv1 DX]",
      "最小ダメージ +[11-13]",
      "+214",
      "5"
    ]
  },
  {
    "line": 316,
    "cells": [
      "[最高攻撃Lv1 DX]",
      "最大ダメージ +[21-28]",
      "+231",
      "5"
    ]
  },
  {
    "line": 317,
    "cells": [
      "[攻撃力Lv1 ULT]",
      "ダメージ +[201-250]％",
      "+350",
      "5"
    ]
  },
  {
    "line": 318,
    "cells": [
      "[最低攻撃Lv1 ULT]",
      "最小ダメージ +[14-18]",
      "+314",
      "5"
    ]
  },
  {
    "line": 319,
    "cells": [
      "[最高攻撃Lv1 ULT]",
      "最大ダメージ +[29-37]",
      "+331",
      "5"
    ]
  },
  {
    "line": 320,
    "cells": [
      "[防御力効率Lv1]",
      "防御力 +[2-5]％",
      "+1",
      "100"
    ]
  },
  {
    "line": 321,
    "cells": [
      "[防御力効率Lv2]",
      "防御力 +[6-10]％",
      "+3",
      "95"
    ]
  },
  {
    "line": 322,
    "cells": [
      "[防御力効率Lv3]",
      "防御力 +[11-15]％",
      "+7",
      "90"
    ]
  },
  {
    "line": 323,
    "cells": [
      "[防御力効率Lv4]",
      "防御力 +[16-25]％",
      "+13",
      "85"
    ]
  },
  {
    "line": 324,
    "cells": [
      "[防御力効率Lv5]",
      "防御力 +[26-40]％",
      "+21",
      "80"
    ]
  },
  {
    "line": 325,
    "cells": [
      "[防御力効率Lv6]",
      "防御力 +[41-60]％",
      "+31",
      "75"
    ]
  },
  {
    "line": 326,
    "cells": [
      "[防御力効率Lv7]",
      "防御力 +[61-80]％",
      "+44",
      "70"
    ]
  },
  {
    "line": 327,
    "cells": [
      "[防御力効率Lv8]",
      "防御力 +[81-100]％",
      "+60",
      "65"
    ]
  },
  {
    "line": 328,
    "cells": [
      "[防御力効率Lv9]",
      "防御力 +[101-120]％",
      "+79",
      "60"
    ]
  },
  {
    "line": 329,
    "cells": [
      "[防御力効率Lv10]",
      "防御力 +[121-150]％",
      "+100",
      "55"
    ]
  },
  {
    "line": 330,
    "cells": [
      "[防御力Lv1]",
      "防御力 +1",
      "+5",
      "100"
    ]
  },
  {
    "line": 331,
    "cells": [
      "[防御力Lv2]",
      "防御力 +2",
      "+25",
      "100"
    ]
  },
  {
    "line": 332,
    "cells": [
      "[防御力Lv3]",
      "防御力 +[3-4]",
      "+45",
      "100"
    ]
  },
  {
    "line": 333,
    "cells": [
      "[防御力Lv4]",
      "防御力 +[5-7]",
      "+65",
      "90"
    ]
  },
  {
    "line": 334,
    "cells": [
      "[防御力Lv5]",
      "防御力 +[8-10]",
      "+85",
      "80"
    ]
  },
  {
    "line": 335,
    "cells": [
      "[防御効率Lv1 DX]",
      "防御力 +[151-200]％",
      "+250",
      "5"
    ]
  },
  {
    "line": 336,
    "cells": [
      "[防御力Lv1 DX]",
      "防御力 +[11-13]",
      "+235",
      "5"
    ]
  },
  {
    "line": 337,
    "cells": [
      "[防御効率Lv1 ULT]",
      "防御力 +[201-250]％",
      "+350",
      "5"
    ]
  },
  {
    "line": 338,
    "cells": [
      "[防御力Lv1 ULT]",
      "防御力 +[14-20]",
      "+335",
      "5"
    ]
  },
  {
    "line": 339,
    "cells": [
      "[最大HP効率Lv1]",
      "最大HP +[5-10]％",
      "+45",
      "100"
    ]
  },
  {
    "line": 340,
    "cells": [
      "[最大HP効率Lv2]",
      "最大HP +[11-15]％",
      "+55",
      "90"
    ]
  },
  {
    "line": 341,
    "cells": [
      "[最大HP効率Lv3]",
      "最大HP +[16-25]％",
      "+65",
      "80"
    ]
  },
  {
    "line": 342,
    "cells": [
      "[最大HP効率Lv4]",
      "最大HP +[26-40]％",
      "+75",
      "70"
    ]
  },
  {
    "line": 343,
    "cells": [
      "[最大HP効率Lv5]",
      "最大HP +[41-70]％",
      "+85",
      "60"
    ]
  },
  {
    "line": 344,
    "cells": [
      "[最大HP効率Lv6]",
      "最大HP +[71-100]％",
      "+95",
      "50"
    ]
  },
  {
    "line": 345,
    "cells": [
      "[最大HPLv1]",
      "最大HP +[1-2]",
      "+1",
      "100"
    ]
  },
  {
    "line": 346,
    "cells": [
      "[最大HPLv2]",
      "最大HP +[3-5]",
      "+2",
      "100"
    ]
  },
  {
    "line": 347,
    "cells": [
      "[最大HPLv3]",
      "最大HP +[6-10]",
      "+4",
      "100"
    ]
  },
  {
    "line": 348,
    "cells": [
      "[最大HPLv4]",
      "最大HP +[11-16]",
      "+7",
      "100"
    ]
  },
  {
    "line": 349,
    "cells": [
      "[最大HPLv5]",
      "最大HP +[17-24]",
      "+11",
      "100"
    ]
  },
  {
    "line": 350,
    "cells": [
      "[最大HPLv6]",
      "最大HP +[25-35]",
      "+16",
      "100"
    ]
  },
  {
    "line": 351,
    "cells": [
      "[最大HPLv7]",
      "最大HP +[36-50]",
      "+23",
      "100"
    ]
  },
  {
    "line": 352,
    "cells": [
      "[最大HPLv8]",
      "最大HP +[51-70]",
      "+32",
      "95"
    ]
  },
  {
    "line": 353,
    "cells": [
      "[最大HPLv9]",
      "最大HP +[71-100]",
      "+43",
      "80"
    ]
  },
  {
    "line": 354,
    "cells": [
      "[最大HPLv10]",
      "最大HP +[101-145]",
      "+56",
      "85"
    ]
  },
  {
    "line": 355,
    "cells": [
      "[最大HPLv11]",
      "最大HP +[146-200]",
      "+71",
      "75"
    ]
  },
  {
    "line": 356,
    "cells": [
      "[HP効率Lv1 DX]",
      "最大HP +[101-120]％",
      "+245",
      "5"
    ]
  },
  {
    "line": 357,
    "cells": [
      "[最大HPLv1 DX]",
      "最大HP +[201-250]",
      "+221",
      "5"
    ]
  },
  {
    "line": 358,
    "cells": [
      "[HP効率Lv1 ULT]",
      "最大HP +[121-150]％",
      "+345",
      "5"
    ]
  },
  {
    "line": 359,
    "cells": [
      "[最大HPLv1 ULT]",
      "最大HP +[251-300]",
      "+321",
      "5"
    ]
  },
  {
    "line": 360,
    "cells": [
      "[最大CP効率Lv1]",
      "最大CP +[5-10]％",
      "+35",
      "100"
    ]
  },
  {
    "line": 361,
    "cells": [
      "[最大CP効率Lv2]",
      "最大CP +[11-15]％",
      "+47",
      "90"
    ]
  },
  {
    "line": 362,
    "cells": [
      "[最大CP効率Lv3]",
      "最大CP +[16-25]％",
      "+59",
      "80"
    ]
  },
  {
    "line": 363,
    "cells": [
      "[最大CP効率Lv4]",
      "最大CP +[26-40]％",
      "+71",
      "70"
    ]
  },
  {
    "line": 364,
    "cells": [
      "[最大CP効率Lv5]",
      "最大CP +[41-70]％",
      "+83",
      "60"
    ]
  },
  {
    "line": 365,
    "cells": [
      "[最大CP効率Lv6]",
      "最大CP +[71-100]％",
      "+95",
      "50"
    ]
  },
  {
    "line": 366,
    "cells": [
      "[最大CPLv1]",
      "最大CP +[1-2]",
      "+1",
      "100"
    ]
  },
  {
    "line": 367,
    "cells": [
      "[最大CPLv2]",
      "最大CP +[3-5]",
      "+2",
      "100"
    ]
  },
  {
    "line": 368,
    "cells": [
      "[最大CPLv3]",
      "最大CP +[6-10]",
      "+4",
      "100"
    ]
  },
  {
    "line": 369,
    "cells": [
      "[最大CPLv4]",
      "最大CP +[11-16]",
      "+7",
      "100"
    ]
  },
  {
    "line": 370,
    "cells": [
      "[最大CPLv5]",
      "最大CP +[17-24]",
      "+11",
      "100"
    ]
  },
  {
    "line": 371,
    "cells": [
      "[最大CPLv6]",
      "最大CP +[25-35]",
      "+16",
      "100"
    ]
  },
  {
    "line": 372,
    "cells": [
      "[最大CPLv7]",
      "最大CP +[36-50]",
      "+22",
      "100"
    ]
  },
  {
    "line": 373,
    "cells": [
      "[最大CPLv8]",
      "最大CP +[51-70]",
      "+29",
      "95"
    ]
  },
  {
    "line": 374,
    "cells": [
      "[最大CPLv9]",
      "最大CP +[71-100]",
      "+37",
      "80"
    ]
  },
  {
    "line": 375,
    "cells": [
      "[最大CPLv10]",
      "最大CP +[101-145]",
      "+46",
      "85"
    ]
  },
  {
    "line": 376,
    "cells": [
      "[最大CPLv11]",
      "最大CP +[146-200]",
      "+56",
      "75"
    ]
  },
  {
    "line": 377,
    "cells": [
      "[CP減少抑止Lv1]",
      "減少限界CP +[1-3]",
      "+47",
      "100"
    ]
  },
  {
    "line": 378,
    "cells": [
      "[CP減少抑止Lv2]",
      "減少限界CP +[4-10]",
      "+66",
      "66"
    ]
  },
  {
    "line": 379,
    "cells": [
      "[CP減少抑止Lv3]",
      "減少限界CP +[11-20]",
      "+85",
      "33"
    ]
  },
  {
    "line": 380,
    "cells": [
      "[CP減抑止Lv1 DX]",
      "減少限界CP +[15-25]",
      "+235",
      "5"
    ]
  },
  {
    "line": 381,
    "cells": [
      "[CP減抑止Lv1 ULT]",
      "減少限界CP +[20-30]",
      "+335",
      "5"
    ]
  },
  {
    "line": 382,
    "cells": [
      "[CP効率Lv1 DX]",
      "最大CP +[101-120]％",
      "+245",
      "5"
    ]
  },
  {
    "line": 383,
    "cells": [
      "[最大CPLv1 DX]",
      "最大CP +[201-250]",
      "+206",
      "5"
    ]
  },
  {
    "line": 384,
    "cells": [
      "[CP効率Lv1 ULT]",
      "最大CP +[121-150]％",
      "+345",
      "5"
    ]
  },
  {
    "line": 385,
    "cells": [
      "[最大CPLv1 ULT]",
      "最大CP +[251-300]",
      "+306",
      "5"
    ]
  },
  {
    "line": 386,
    "cells": [
      "[攻撃命中Lv1]",
      "命中率 +1％",
      "+10",
      "100"
    ]
  },
  {
    "line": 387,
    "cells": [
      "[攻撃命中Lv2]",
      "命中率 +[2-3]％",
      "+25",
      "100"
    ]
  },
  {
    "line": 388,
    "cells": [
      "[攻撃命中Lv3]",
      "命中率 +[4-5]％",
      "+40",
      "100"
    ]
  },
  {
    "line": 389,
    "cells": [
      "[攻撃命中Lv4]",
      "命中率 +[6-7]％",
      "+55",
      "50"
    ]
  },
  {
    "line": 390,
    "cells": [
      "[攻撃命中Lv5]",
      "命中率 +[8-9]％",
      "+70",
      "25"
    ]
  },
  {
    "line": 391,
    "cells": [
      "[攻撃命中Lv6]",
      "命中率 +[10-12]％",
      "+85",
      "10"
    ]
  },
  {
    "line": 392,
    "cells": [
      "[攻撃回避Lv1]",
      "回避率 +1％",
      "+15",
      "100"
    ]
  },
  {
    "line": 393,
    "cells": [
      "[攻撃回避Lv2]",
      "回避率 +[2-3]％",
      "+30",
      "100"
    ]
  },
  {
    "line": 394,
    "cells": [
      "[攻撃回避Lv3]",
      "回避率 +[4-5]％",
      "+45",
      "100"
    ]
  },
  {
    "line": 395,
    "cells": [
      "[攻撃回避Lv4]",
      "回避率 +[6-7]％",
      "+60",
      "50"
    ]
  },
  {
    "line": 396,
    "cells": [
      "[攻撃回避Lv5]",
      "回避率 +[8-9]％",
      "+75",
      "25"
    ]
  },
  {
    "line": 397,
    "cells": [
      "[攻撃回避Lv6]",
      "回避率 +[10-12]％",
      "+90",
      "10"
    ]
  },
  {
    "line": 398,
    "cells": [
      "[ブロック率Lv1]",
      "ブロック率 +[3-5]％",
      "+5",
      "100"
    ]
  },
  {
    "line": 399,
    "cells": [
      "[ブロック率Lv2]",
      "ブロック率 +[5-10]％",
      "+18",
      "40"
    ]
  },
  {
    "line": 400,
    "cells": [
      "[ブロック率Lv3]",
      "ブロック率 +[10-15]％",
      "+39",
      "20"
    ]
  },
  {
    "line": 401,
    "cells": [
      "[ブロック率Lv4]",
      "ブロック率 +[15-25]％",
      "+80",
      "10"
    ]
  },
  {
    "line": 402,
    "cells": [
      "[致命打率Lv1]",
      "致命打発動確率 +[2-5]％",
      "+7",
      "75"
    ]
  },
  {
    "line": 403,
    "cells": [
      "[致命打率Lv2]",
      "致命打発動確率 +[6-10]％",
      "+57",
      "50"
    ]
  },
  {
    "line": 404,
    "cells": [
      "[決定打率Lv1]",
      "決定打発動確率 +[1-2]％",
      "+33",
      "50"
    ]
  },
  {
    "line": 405,
    "cells": [
      "[決定打率Lv2]",
      "決定打発動確率 +[3-4]％",
      "+66",
      "25"
    ]
  },
  {
    "line": 406,
    "cells": [
      "[回避補正無視]",
      "ターゲットの回避率補正値 無視",
      "+99",
      "75"
    ]
  },
  {
    "line": 407,
    "cells": [
      "[命中補正無視]",
      "攻撃者の命中率補正値 無視",
      "+99",
      "75"
    ]
  },
  {
    "line": 408,
    "cells": [
      "[絶対命中]",
      "命中率 <c:LTYELLOW>100％<n>",
      "+100",
      "75"
    ]
  },
  {
    "line": 409,
    "cells": [
      "[攻撃命中Lv1 DX]",
      "命中率 +[10-15]％",
      "+285",
      "5"
    ]
  },
  {
    "line": 410,
    "cells": [
      "[攻撃回避Lv1 DX]",
      "回避率 +[10-15]％",
      "+290",
      "5"
    ]
  },
  {
    "line": 411,
    "cells": [
      "[ブロックLv1 DX]",
      "ブロック率 +[15-28]％",
      "+280",
      "5"
    ]
  },
  {
    "line": 412,
    "cells": [
      "[致命打率Lv1 DX]",
      "致命打発動確率 +[11-15]％",
      "+257",
      "5"
    ]
  },
  {
    "line": 413,
    "cells": [
      "[攻撃命中Lv1 ULT]",
      "命中率 +[12-18]％",
      "+385",
      "5"
    ]
  },
  {
    "line": 414,
    "cells": [
      "[攻撃回避Lv1 ULT]",
      "回避率 +[12-18]％",
      "+390",
      "5"
    ]
  },
  {
    "line": 415,
    "cells": [
      "[ブロックLv1 ULT]",
      "ブロック率 +[25-30]％",
      "+380",
      "5"
    ]
  },
  {
    "line": 416,
    "cells": [
      "[致命打率Lv1 ULT]",
      "致命打発動確率 +[16-20]％",
      "+357",
      "5"
    ]
  },
  {
    "line": 417,
    "cells": [
      "[防御速度Lv1]",
      "ブロッキング速度 +[25-50]％",
      "+10",
      "75"
    ]
  },
  {
    "line": 418,
    "cells": [
      "[防御速度Lv2]",
      "ブロッキング速度 +[51-100]％",
      "+30",
      "50"
    ]
  },
  {
    "line": 419,
    "cells": [
      "[移動速度Lv1]",
      "移動速度 +5％",
      "+5",
      "100"
    ]
  },
  {
    "line": 420,
    "cells": [
      "[移動速度Lv2]",
      "移動速度 +10％",
      "+20",
      "90"
    ]
  },
  {
    "line": 421,
    "cells": [
      "[移動速度Lv3]",
      "移動速度 +15％",
      "+40",
      "80"
    ]
  },
  {
    "line": 422,
    "cells": [
      "[移動速度Lv4]",
      "移動速度 +20％",
      "+55",
      "70"
    ]
  },
  {
    "line": 423,
    "cells": [
      "[移動速度Lv5]",
      "移動速度 +30％",
      "+60",
      "60"
    ]
  },
  {
    "line": 424,
    "cells": [
      "[攻撃速度Lv1]",
      "攻撃速度 +[10-20]％",
      "+40",
      "50"
    ]
  },
  {
    "line": 425,
    "cells": [
      "[攻撃速度Lv2]",
      "攻撃速度 +[21-35]％",
      "+65",
      "25"
    ]
  },
  {
    "line": 426,
    "cells": [
      "[攻撃速度Lv3]",
      "攻撃速度 +[36-50]％",
      "+70",
      "10"
    ]
  },
  {
    "line": 427,
    "cells": [
      "[薬回復Lv1]",
      "ポーション回復速度 +[0-50]％増加",
      "+10",
      "100"
    ]
  },
  {
    "line": 428,
    "cells": [
      "[薬回復Lv2]",
      "ポーション回復速度 +[51-150]％増加",
      "+15",
      "100"
    ]
  },
  {
    "line": 429,
    "cells": [
      "[薬回復Lv3]",
      "ポーション回復速度 +[151-250]％増加",
      "+30",
      "100"
    ]
  },
  {
    "line": 430,
    "cells": [
      "[CP減少速度Lv1]",
      "集中力 +[5-10]％",
      "+30",
      "100"
    ]
  },
  {
    "line": 431,
    "cells": [
      "[CP減少速度Lv2]",
      "集中力 +[11-18]％",
      "+60",
      "100"
    ]
  },
  {
    "line": 432,
    "cells": [
      "[CP減少速度Lv3]",
      "集中力 +[19-30]％",
      "+90",
      "100"
    ]
  },
  {
    "line": 433,
    "cells": [
      "[移動速度Lv1 DX]",
      "移動速度 +[30-35]％",
      "+210",
      "5"
    ]
  },
  {
    "line": 434,
    "cells": [
      "[攻撃速度Lv1 DX]",
      "攻撃速度 +[40-55]％",
      "+270",
      "5"
    ]
  },
  {
    "line": 435,
    "cells": [
      "[薬回復Lv1 DX]",
      "ポーション回復速度 +[251-350]％増加",
      "+180",
      "5"
    ]
  },
  {
    "line": 436,
    "cells": [
      "[CP減速Lv1 DX]",
      "集中力 +[25-35]％",
      "+240",
      "5"
    ]
  },
  {
    "line": 437,
    "cells": [
      "[移動速度Lv1 ULT]",
      "移動速度 +[35-40]％",
      "+310",
      "5"
    ]
  },
  {
    "line": 438,
    "cells": [
      "[攻撃速度Lv1 ULT]",
      "攻撃速度 +[45-60]％",
      "+370",
      "5"
    ]
  },
  {
    "line": 439,
    "cells": [
      "[薬回復Lv1 ULT]",
      "ポーション回復速度 +[300-400]％増加",
      "+280",
      "5"
    ]
  },
  {
    "line": 440,
    "cells": [
      "[CP減速Lv1 ULT]",
      "集中力 +[35-45]％",
      "+340",
      "5"
    ]
  },
  {
    "line": 441,
    "cells": [
      "[火属性攻撃Lv1]",
      "火ダメージ [2-3]～[3-4]",
      "+6",
      "100"
    ]
  },
  {
    "line": 442,
    "cells": [
      "[火属性攻撃Lv2]",
      "火ダメージ [3-4]～[5-8]",
      "+8",
      "100"
    ]
  },
  {
    "line": 443,
    "cells": [
      "[火属性攻撃Lv3]",
      "火ダメージ [5-7]～[8-13]",
      "+12",
      "100"
    ]
  },
  {
    "line": 444,
    "cells": [
      "[火属性攻撃Lv4]",
      "火ダメージ [8-11]～[12-19]",
      "+18",
      "95"
    ]
  },
  {
    "line": 445,
    "cells": [
      "[火属性攻撃Lv5]",
      "火ダメージ [10-14]～[15-24]",
      "+26",
      "90"
    ]
  },
  {
    "line": 446,
    "cells": [
      "[火属性攻撃Lv6]",
      "火ダメージ [15-20]～[23-34]",
      "+36",
      "85"
    ]
  },
  {
    "line": 447,
    "cells": [
      "[火属性攻撃Lv7]",
      "火ダメージ [20-26]～[30-43]",
      "+48",
      "75"
    ]
  },
  {
    "line": 448,
    "cells": [
      "[火属性攻撃Lv8]",
      "火ダメージ [25-32]～[38-53]",
      "+62",
      "65"
    ]
  },
  {
    "line": 449,
    "cells": [
      "[火属性攻撃Lv9]",
      "火ダメージ [33-41]～[50-67]",
      "+78",
      "55"
    ]
  },
  {
    "line": 450,
    "cells": [
      "[火属性攻撃Lv10]",
      "火ダメージ [40-50]～[60-90]",
      "+96",
      "40"
    ]
  },
  {
    "line": 451,
    "cells": [
      "[火攻撃Lv1 DX]",
      "火ダメージ [50-62]～[75-120]",
      "+196",
      "5"
    ]
  },
  {
    "line": 452,
    "cells": [
      "[火攻撃Lv1 ULT]",
      "火ダメージ [65-77]～[98-143]",
      "+296",
      "5"
    ]
  },
  {
    "line": 453,
    "cells": [
      "[水属性攻撃Lv1]",
      "水ダメージ 1～1 - コールド 16Frame",
      "+7",
      "100"
    ]
  },
  {
    "line": 454,
    "cells": [
      "[水属性攻撃Lv2]",
      "水ダメージ [1-2]～[2-3] - コールド 24Frame",
      "+9",
      "100"
    ]
  },
  {
    "line": 455,
    "cells": [
      "[水属性攻撃Lv3]",
      "水ダメージ [2-3]～[3-5] - コールド 32Frame",
      "+13",
      "100"
    ]
  },
  {
    "line": 456,
    "cells": [
      "[水属性攻撃Lv4]",
      "水ダメージ [4-5]～[6-8] - コールド 40Frame",
      "+19",
      "95"
    ]
  },
  {
    "line": 457,
    "cells": [
      "[水属性攻撃Lv5]",
      "水ダメージ [5-7]～[8-10] - コールド 48Frame",
      "+27",
      "90"
    ]
  },
  {
    "line": 458,
    "cells": [
      "[水属性攻撃Lv6]",
      "水ダメージ [8-10]～[11-14] - コールド 56Frame",
      "+37",
      "85"
    ]
  },
  {
    "line": 459,
    "cells": [
      "[水属性攻撃Lv7]",
      "水ダメージ [10-12]～[15-19] - コールド 64Frame",
      "+49",
      "75"
    ]
  },
  {
    "line": 460,
    "cells": [
      "[水属性攻撃Lv8]",
      "水ダメージ [13-15]～[19-23] - コールド 72Frame",
      "+63",
      "65"
    ]
  },
  {
    "line": 461,
    "cells": [
      "[水属性攻撃Lv9]",
      "水ダメージ [16-20]～[25-30] - コールド 96Frame",
      "+79",
      "55"
    ]
  },
  {
    "line": 462,
    "cells": [
      "[水属性攻撃Lv10]",
      "水ダメージ [20-25]～[30-38] - コールド 128Frame",
      "+97",
      "40"
    ]
  },
  {
    "line": 463,
    "cells": [
      "[水攻撃Lv1 DX]",
      "水ダメージ [25-30]～[40-50] - コールド 160Frame",
      "+197",
      "5"
    ]
  },
  {
    "line": 464,
    "cells": [
      "[水攻撃Lv1 ULT]",
      "水ダメージ [30-35]～[50-60] - コールド 192Frame",
      "+297",
      "5"
    ]
  },
  {
    "line": 465,
    "cells": [
      "[風属性攻撃Lv1]",
      "風ダメージ 1～1 - スタン 2Frame",
      "+8",
      "100"
    ]
  },
  {
    "line": 466,
    "cells": [
      "[風属性攻撃Lv2]",
      "風ダメージ 1～2 - スタン 3Frame",
      "+10",
      "100"
    ]
  },
  {
    "line": 467,
    "cells": [
      "[風属性攻撃Lv3]",
      "風ダメージ 2～[3-4] - スタン 4Frame",
      "+14",
      "100"
    ]
  },
  {
    "line": 468,
    "cells": [
      "[風属性攻撃Lv4]",
      "風ダメージ [3-4]～[5-7] - スタン 5Frame",
      "+20",
      "95"
    ]
  },
  {
    "line": 469,
    "cells": [
      "[風属性攻撃Lv5]",
      "風ダメージ [5-7]～[8-11] - スタン 7Frame",
      "+28",
      "90"
    ]
  },
  {
    "line": 470,
    "cells": [
      "[風属性攻撃Lv6]",
      "風ダメージ [7-9]～[12-16] - スタン 8Frame",
      "+38",
      "85"
    ]
  },
  {
    "line": 471,
    "cells": [
      "[風属性攻撃Lv7]",
      "風ダメージ [10-12]～[17-22] - スタン 10Frame",
      "+50",
      "75"
    ]
  },
  {
    "line": 472,
    "cells": [
      "[風属性攻撃Lv8]",
      "風ダメージ [13-16]～[23-29] - スタン 12Frame",
      "+64",
      "65"
    ]
  },
  {
    "line": 473,
    "cells": [
      "[風属性攻撃Lv9]",
      "風ダメージ [16-20]～[30-37] - スタン 14Frame",
      "+80",
      "55"
    ]
  },
  {
    "line": 474,
    "cells": [
      "[風属性攻撃Lv10]",
      "風ダメージ [20-24]～[38-46] - スタン 16Frame",
      "+98",
      "40"
    ]
  },
  {
    "line": 475,
    "cells": [
      "[風攻撃Lv1 DX]",
      "風ダメージ [24-28]～[47-56] - スタン 18Frame",
      "+198",
      "5"
    ]
  },
  {
    "line": 476,
    "cells": [
      "[風攻撃Lv1 ULT]",
      "風ダメージ [29-33]～[57-66] - スタン 20Frame",
      "+298",
      "5"
    ]
  },
  {
    "line": 477,
    "cells": [
      "[土属性攻撃Lv1]",
      "2秒 1～2 毒ダメージ",
      "+9",
      "100"
    ]
  },
  {
    "line": 478,
    "cells": [
      "[土属性攻撃Lv2]",
      "3秒 [1-2]～[3-4] 毒ダメージ",
      "+11",
      "100"
    ]
  },
  {
    "line": 479,
    "cells": [
      "[土属性攻撃Lv3]",
      "4秒 [2-3]～[4-6] 毒ダメージ",
      "+15",
      "100"
    ]
  },
  {
    "line": 480,
    "cells": [
      "[土属性攻撃Lv4]",
      "6秒 [4-5]～[6-9] 毒ダメージ",
      "+21",
      "95"
    ]
  },
  {
    "line": 481,
    "cells": [
      "[土属性攻撃Lv5]",
      "8秒 [6-7]～[8-12] 毒ダメージ",
      "+29",
      "90"
    ]
  },
  {
    "line": 482,
    "cells": [
      "[土属性攻撃Lv6]",
      "10秒 [9-10]～[11-16] 毒ダメージ",
      "+39",
      "85"
    ]
  },
  {
    "line": 483,
    "cells": [
      "[土属性攻撃Lv7]",
      "12秒 [12-13]～[14-20] 毒ダメージ",
      "+51",
      "75"
    ]
  },
  {
    "line": 484,
    "cells": [
      "[土属性攻撃Lv8]",
      "15秒 [16-17]～[18-25] 毒ダメージ",
      "+65",
      "65"
    ]
  },
  {
    "line": 485,
    "cells": [
      "[土属性攻撃Lv9]",
      "20秒 [20-21]～[22-30] 毒ダメージ",
      "+81",
      "55"
    ]
  },
  {
    "line": 486,
    "cells": [
      "[土属性攻撃Lv10]",
      "25秒 [25-26]～[27-36] 毒ダメージ",
      "+99",
      "40"
    ]
  },
  {
    "line": 487,
    "cells": [
      "[土攻撃Lv1 DX]",
      "30秒 [30-31]～[33-42] 毒ダメージ",
      "+199",
      "5"
    ]
  },
  {
    "line": 488,
    "cells": [
      "[土攻撃Lv1 ULT]",
      "35秒 [35-36]～[39-48] 毒ダメージ",
      "+299",
      "5"
    ]
  },
  {
    "line": 489,
    "cells": [
      "[光属性攻撃Lv1]",
      "光ダメージ 1～[2-3] - 2秒の間 命中, 回避低下",
      "+10",
      "100"
    ]
  },
  {
    "line": 490,
    "cells": [
      "[光属性攻撃Lv2]",
      "光ダメージ [2-3]～[3-6] - 3秒の間 命中, 回避低下",
      "+12",
      "100"
    ]
  },
  {
    "line": 491,
    "cells": [
      "[光属性攻撃Lv3]",
      "光ダメージ [3-5]～[5-10] - 5秒の間 命中, 回避低下",
      "+16",
      "100"
    ]
  },
  {
    "line": 492,
    "cells": [
      "[光属性攻撃Lv4]",
      "光ダメージ [5-8]～[8-15] - 8秒の間 命中, 回避低下",
      "+22",
      "95"
    ]
  },
  {
    "line": 493,
    "cells": [
      "[光属性攻撃Lv5]",
      "光ダメージ [8-12]～[12-21] - 12秒の間 命中, 回避低下",
      "+30",
      "90"
    ]
  },
  {
    "line": 494,
    "cells": [
      "[光属性攻撃Lv6]",
      "光ダメージ [10-15]～[15-26] - 17秒の間 命中, 回避低下",
      "+40",
      "85"
    ]
  },
  {
    "line": 495,
    "cells": [
      "[光属性攻撃Lv7]",
      "光ダメージ [12-18]～[18-31] - 23秒の間 命中, 回避低下",
      "+52",
      "75"
    ]
  },
  {
    "line": 496,
    "cells": [
      "[光属性攻撃Lv8]",
      "光ダメージ [15-22]～[23-38] - 30秒の間 命中, 回避低下",
      "+66",
      "65"
    ]
  },
  {
    "line": 497,
    "cells": [
      "[光属性攻撃Lv9]",
      "光ダメージ [20-28]～[30-47] - 38秒の間 命中, 回避低下",
      "+82",
      "55"
    ]
  },
  {
    "line": 498,
    "cells": [
      "[光属性攻撃Lv10]",
      "光ダメージ [25-35]～[38-68] - 47秒の間 命中, 回避低下",
      "+100",
      "40"
    ]
  },
  {
    "line": 499,
    "cells": [
      "[光攻撃Lv1 DX]",
      "光ダメージ [30-40]～[45-75] - 57秒の間 命中, 回避低下",
      "+200",
      "5"
    ]
  },
  {
    "line": 500,
    "cells": [
      "[光攻撃Lv1 ULT]",
      "光ダメージ [36-48]～[54-88] - 68秒の間 命中, 回避低下",
      "+300",
      "5"
    ]
  },
  {
    "line": 501,
    "cells": [
      "[闇属性攻撃Lv1]",
      "闇ダメージ [1-2]～[2-3] - 呪い 1秒",
      "+10",
      "100"
    ]
  },
  {
    "line": 502,
    "cells": [
      "[闇属性攻撃Lv2]",
      "闇ダメージ [2-3]～[3-6] - 呪い 2秒",
      "+12",
      "100"
    ]
  },
  {
    "line": 503,
    "cells": [
      "[闇属性攻撃Lv3]",
      "闇ダメージ [3-5]～[5-10] - 呪い 3秒",
      "+16",
      "100"
    ]
  },
  {
    "line": 504,
    "cells": [
      "[闇属性攻撃Lv4]",
      "闇ダメージ [5-8]～[8-15] - 呪い 5秒",
      "+22",
      "95"
    ]
  },
  {
    "line": 505,
    "cells": [
      "[闇属性攻撃Lv5]",
      "闇ダメージ [7-11]～[11-20] - 呪い 8秒",
      "+30",
      "90"
    ]
  },
  {
    "line": 506,
    "cells": [
      "[闇属性攻撃Lv6]",
      "闇ダメージ [10-15]～[15-26] - 呪い 12秒",
      "+40",
      "85"
    ]
  },
  {
    "line": 507,
    "cells": [
      "[闇属性攻撃Lv7]",
      "闇ダメージ [12-18]～[18-31] - 呪い 17秒",
      "+52",
      "75"
    ]
  },
  {
    "line": 508,
    "cells": [
      "[闇属性攻撃Lv8]",
      "闇ダメージ [15-22]～[23-38] - 呪い 23秒",
      "+66",
      "65"
    ]
  },
  {
    "line": 509,
    "cells": [
      "[闇属性攻撃Lv9]",
      "闇ダメージ [20-28]～[30-47] - 呪い 30秒",
      "+82",
      "55"
    ]
  },
  {
    "line": 510,
    "cells": [
      "[闇属性攻撃Lv10]",
      "闇ダメージ [27-37]～[41-71] - 呪い 38秒",
      "+100",
      "40"
    ]
  },
  {
    "line": 511,
    "cells": [
      "[闇攻撃Lv1 DX]",
      "闇ダメージ [35-45]～[53-83] - 呪い 47秒",
      "+200",
      "5"
    ]
  },
  {
    "line": 512,
    "cells": [
      "[闇攻撃Lv1 ULT]",
      "闇ダメージ [43-53]～[65-95] - 呪い 56秒",
      "+300",
      "5"
    ]
  },
  {
    "line": 513,
    "cells": [
      "[HP吸収Lv1]",
      "敵に与えたダメージ [1-2]％を 体力吸収",
      "+13",
      "75"
    ]
  },
  {
    "line": 514,
    "cells": [
      "[HP吸収Lv2]",
      "敵に与えたダメージ [3-4]％を 体力吸収",
      "+33",
      "25"
    ]
  },
  {
    "line": 515,
    "cells": [
      "[HP吸収Lv3]",
      "敵に与えたダメージ [5-6]％を 体力吸収",
      "+63",
      "10"
    ]
  },
  {
    "line": 516,
    "cells": [
      "[HP吸収Lv4]",
      "敵に与えたダメージ 8％を 体力吸収",
      "+73",
      "5"
    ]
  },
  {
    "line": 517,
    "cells": [
      "[CPボーナスLv1]",
      "CP獲得ボーナス [1-2]％",
      "+6",
      "100"
    ]
  },
  {
    "line": 518,
    "cells": [
      "[CPボーナスLv2]",
      "CP獲得ボーナス [3-4]％",
      "+26",
      "50"
    ]
  },
  {
    "line": 519,
    "cells": [
      "[CPボーナスLv3]",
      "CP獲得ボーナス [5-6]％",
      "+46",
      "25"
    ]
  },
  {
    "line": 520,
    "cells": [
      "[CPボーナスLv4]",
      "CP獲得ボーナス 8％",
      "+66",
      "5"
    ]
  },
  {
    "line": 521,
    "cells": [
      "[敵逃亡]",
      "敵逃亡 75％",
      "+40",
      "100"
    ]
  },
  {
    "line": 522,
    "cells": [
      "[ノックアウト]",
      "ノックアウト攻撃 +15％",
      "+50",
      "100"
    ]
  },
  {
    "line": 523,
    "cells": [
      "[即死Lv1]",
      "即死攻撃 +1％",
      "+55",
      "10"
    ]
  },
  {
    "line": 524,
    "cells": [
      "[即死Lv2]",
      "即死攻撃 +2％",
      "+75",
      "2"
    ]
  },
  {
    "line": 525,
    "cells": [
      "[武器破壊Lv1]",
      "武器破壊攻撃 +7％(5秒)",
      "+20",
      "50"
    ]
  },
  {
    "line": 526,
    "cells": [
      "[武器破壊Lv2]",
      "武器破壊攻撃 +15％([10-15]秒)",
      "+50",
      "25"
    ]
  },
  {
    "line": 527,
    "cells": [
      "[防具破壊Lv1]",
      "鎧破壊攻撃 +15％(5秒)",
      "+10",
      "50"
    ]
  },
  {
    "line": 528,
    "cells": [
      "[防具破壊Lv2]",
      "鎧破壊攻撃 +25％(10秒)",
      "+30",
      "25"
    ]
  },
  {
    "line": 529,
    "cells": [
      "[コールドLv1]",
      "コールド攻撃+ 35％([3-5]秒)",
      "+22",
      "100"
    ]
  },
  {
    "line": 530,
    "cells": [
      "[コールドLv2]",
      "コールド攻撃+ 40％([6-7]秒)",
      "+44",
      "50"
    ]
  },
  {
    "line": 531,
    "cells": [
      "[フリーズLv1]",
      "フリーズ攻撃 +5％(1秒)",
      "+33",
      "50"
    ]
  },
  {
    "line": 532,
    "cells": [
      "[フリーズLv2]",
      "フリーズ攻撃 +[6-10]％([2-3]秒)",
      "+55",
      "25"
    ]
  },
  {
    "line": 533,
    "cells": [
      "[暗闇]",
      "目くらまし攻撃 +[50-75]％([30-60]秒)",
      "+4",
      "100"
    ]
  },
  {
    "line": 534,
    "cells": [
      "[スタン]",
      "スタン攻撃 +[10-15]％([2-3]秒)",
      "+65",
      "80"
    ]
  },
  {
    "line": 535,
    "cells": [
      "[石化Lv1]",
      "石化攻撃 +5％([1-3]秒)",
      "+18",
      "50"
    ]
  },
  {
    "line": 536,
    "cells": [
      "[石化Lv2]",
      "石化攻撃 +[6-10]％([4-6]秒)",
      "+38",
      "25"
    ]
  },
  {
    "line": 537,
    "cells": [
      "[混乱Lv1]",
      "混乱攻撃 +15％(5秒)",
      "+12",
      "50"
    ]
  },
  {
    "line": 538,
    "cells": [
      "[混乱Lv2]",
      "混乱攻撃 +[25-50]％([10-15]秒)",
      "+24",
      "25"
    ]
  },
  {
    "line": 539,
    "cells": [
      "[眠り]",
      "睡眠攻撃 +15％([15-20]秒)",
      "+13",
      "75"
    ]
  },
  {
    "line": 540,
    "cells": [
      "[魅了Lv1]",
      "チャーミング攻撃 +10％(30秒)",
      "+47",
      "50"
    ]
  },
  {
    "line": 541,
    "cells": [
      "[魅了Lv2]",
      "チャーミング攻撃 +[20-25]％([45-60]秒)",
      "+74",
      "25"
    ]
  },
  {
    "line": 542,
    "cells": [
      "[ターゲット固定]",
      "優先ターゲット攻撃 +[15-20]％([45-60]秒)",
      "+37",
      "50"
    ]
  },
  {
    "line": 543,
    "cells": [
      "[知能低下]",
      "AI低下攻撃 +[75-85]％([60-120]秒)",
      "+16",
      "75"
    ]
  },
  {
    "line": 544,
    "cells": [
      "[狂気]",
      "ベルセルク攻撃 +[75-95]％([30-45]秒)",
      "+7",
      "50"
    ]
  },
  {
    "line": 545,
    "cells": [
      "[火属性抵抗Lv1]",
      "火属性抵抗 +[5-10]％",
      "+3",
      "100"
    ]
  },
  {
    "line": 546,
    "cells": [
      "[火属性抵抗Lv2]",
      "火属性抵抗 +[11-15]％",
      "+7",
      "95"
    ]
  },
  {
    "line": 547,
    "cells": [
      "[火属性抵抗Lv3]",
      "火属性抵抗 +[16-20]％",
      "+15",
      "90"
    ]
  },
  {
    "line": 548,
    "cells": [
      "[火属性抵抗Lv4]",
      "火属性抵抗 +[21-30]％",
      "+27",
      "85"
    ]
  },
  {
    "line": 549,
    "cells": [
      "[火属性抵抗Lv5]",
      "火属性抵抗 +[31-40]％",
      "+43",
      "80"
    ]
  },
  {
    "line": 550,
    "cells": [
      "[火属性抵抗Lv6]",
      "火属性抵抗 +[41-50]％",
      "+63",
      "75"
    ]
  },
  {
    "line": 551,
    "cells": [
      "[火抵抗Lv1 DX]",
      "火属性抵抗 +[45-60]％",
      "+213",
      "5"
    ]
  },
  {
    "line": 552,
    "cells": [
      "[火抵抗Lv1 ULT]",
      "火属性抵抗 +[50-75]％",
      "+313",
      "5"
    ]
  },
  {
    "line": 553,
    "cells": [
      "[水属性抵抗Lv1]",
      "水属性抵抗 +[5-10]％",
      "+4",
      "100"
    ]
  },
  {
    "line": 554,
    "cells": [
      "[水属性抵抗Lv2]",
      "水属性抵抗 +[11-15]％",
      "+8",
      "95"
    ]
  },
  {
    "line": 555,
    "cells": [
      "[水属性抵抗Lv3]",
      "水属性抵抗 +[16-20]％",
      "+16",
      "90"
    ]
  },
  {
    "line": 556,
    "cells": [
      "[水属性抵抗Lv4]",
      "水属性抵抗 +[21-30]％",
      "+28",
      "85"
    ]
  },
  {
    "line": 557,
    "cells": [
      "[水属性抵抗Lv5]",
      "水属性抵抗 +[31-40]％",
      "+44",
      "80"
    ]
  },
  {
    "line": 558,
    "cells": [
      "[水属性抵抗Lv6]",
      "水属性抵抗 +[41-50]％",
      "+64",
      "75"
    ]
  },
  {
    "line": 559,
    "cells": [
      "[水抵抗Lv1 DX]",
      "水属性抵抗 +[45-60]％",
      "+214",
      "5"
    ]
  },
  {
    "line": 560,
    "cells": [
      "[水抵抗Lv1 ULT]",
      "水属性抵抗 +[50-75]％",
      "+314",
      "5"
    ]
  },
  {
    "line": 561,
    "cells": [
      "[風属性抵抗Lv1]",
      "風属性抵抗 +[5-10]％",
      "+5",
      "100"
    ]
  },
  {
    "line": 562,
    "cells": [
      "[風属性抵抗Lv2]",
      "風属性抵抗 +[11-15]％",
      "+9",
      "95"
    ]
  },
  {
    "line": 563,
    "cells": [
      "[風属性抵抗Lv3]",
      "風属性抵抗 +[16-20]％",
      "+17",
      "90"
    ]
  },
  {
    "line": 564,
    "cells": [
      "[風属性抵抗Lv4]",
      "風属性抵抗 +[21-30]％",
      "+29",
      "85"
    ]
  },
  {
    "line": 565,
    "cells": [
      "[風属性抵抗Lv5]",
      "風属性抵抗 +[31-40]％",
      "+45",
      "80"
    ]
  },
  {
    "line": 566,
    "cells": [
      "[風属性抵抗Lv6]",
      "風属性抵抗 +[41-50]％",
      "+65",
      "75"
    ]
  },
  {
    "line": 567,
    "cells": [
      "[風抵抗Lv1 DX]",
      "風属性抵抗 +[45-60]％",
      "+215",
      "5"
    ]
  },
  {
    "line": 568,
    "cells": [
      "[風抵抗Lv1 ULT]",
      "風属性抵抗 +[50-75]％",
      "+315",
      "5"
    ]
  },
  {
    "line": 569,
    "cells": [
      "[土属性抵抗Lv1]",
      "大地属性抵抗 +[5-10]％",
      "+6",
      "100"
    ]
  },
  {
    "line": 570,
    "cells": [
      "[土属性抵抗Lv2]",
      "大地属性抵抗 +[11-15]％",
      "+10",
      "95"
    ]
  },
  {
    "line": 571,
    "cells": [
      "[土属性抵抗Lv3]",
      "大地属性抵抗 +[16-20]％",
      "+18",
      "90"
    ]
  },
  {
    "line": 572,
    "cells": [
      "[土属性抵抗Lv4]",
      "大地属性抵抗 +[21-30]％",
      "+30",
      "85"
    ]
  },
  {
    "line": 573,
    "cells": [
      "[土属性抵抗Lv5]",
      "大地属性抵抗 +[31-40]％",
      "+46",
      "80"
    ]
  },
  {
    "line": 574,
    "cells": [
      "[土属性抵抗Lv6]",
      "大地属性抵抗 +[41-50]％",
      "+66",
      "75"
    ]
  },
  {
    "line": 575,
    "cells": [
      "[土抵抗Lv1 DX]",
      "大地属性抵抗 +[45-60]％",
      "+216",
      "5"
    ]
  },
  {
    "line": 576,
    "cells": [
      "[土抵抗Lv1 ULT]",
      "大地属性抵抗 +[50-75]％",
      "+316",
      "5"
    ]
  },
  {
    "line": 577,
    "cells": [
      "[光属性抵抗Lv1]",
      "光属性抵抗 +[5-10]％",
      "+7",
      "100"
    ]
  },
  {
    "line": 578,
    "cells": [
      "[光属性抵抗Lv2]",
      "光属性抵抗 +[11-15]％",
      "+11",
      "95"
    ]
  },
  {
    "line": 579,
    "cells": [
      "[光属性抵抗Lv3]",
      "光属性抵抗 +[16-20]％",
      "+19",
      "90"
    ]
  },
  {
    "line": 580,
    "cells": [
      "[光属性抵抗Lv4]",
      "光属性抵抗 +[21-30]％",
      "+31",
      "85"
    ]
  },
  {
    "line": 581,
    "cells": [
      "[光属性抵抗Lv5]",
      "光属性抵抗 +[31-40]％",
      "+47",
      "80"
    ]
  },
  {
    "line": 582,
    "cells": [
      "[光属性抵抗Lv6]",
      "光属性抵抗 +[41-50]％",
      "+67",
      "75"
    ]
  },
  {
    "line": 583,
    "cells": [
      "[光抵抗Lv1 DX]",
      "光属性抵抗 +[45-60]％",
      "+217",
      "5"
    ]
  },
  {
    "line": 584,
    "cells": [
      "[光抵抗Lv1 ULT]",
      "光属性抵抗 +[50-75]％",
      "+317",
      "5"
    ]
  },
  {
    "line": 585,
    "cells": [
      "[闇属性抵抗Lv1]",
      "闇属性抵抗 +[5-10]％",
      "+7",
      "100"
    ]
  },
  {
    "line": 586,
    "cells": [
      "[闇属性抵抗Lv2]",
      "闇属性抵抗 +[11-15]％",
      "+11",
      "95"
    ]
  },
  {
    "line": 587,
    "cells": [
      "[闇属性抵抗Lv3]",
      "闇属性抵抗 +[16-20]％",
      "+19",
      "90"
    ]
  },
  {
    "line": 588,
    "cells": [
      "[闇属性抵抗Lv4]",
      "闇属性抵抗 +[21-30]％",
      "+31",
      "85"
    ]
  },
  {
    "line": 589,
    "cells": [
      "[闇属性抵抗Lv5]",
      "闇属性抵抗 +[31-40]％",
      "+47",
      "80"
    ]
  },
  {
    "line": 590,
    "cells": [
      "[闇属性抵抗Lv6]",
      "闇属性抵抗 +[41-50]％",
      "+67",
      "75"
    ]
  },
  {
    "line": 591,
    "cells": [
      "[闇抵抗Lv1 DX]",
      "闇属性抵抗 +[45-60]％",
      "+217",
      "5"
    ]
  },
  {
    "line": 592,
    "cells": [
      "[闇抵抗Lv1 ULT]",
      "闇属性抵抗 +[50-75]％",
      "+317",
      "5"
    ]
  },
  {
    "line": 593,
    "cells": [
      "[全属性抵抗Lv1]",
      "魔法抵抗 +[2-4]％",
      "+8",
      "75"
    ]
  },
  {
    "line": 594,
    "cells": [
      "[全属性抵抗Lv2]",
      "魔法抵抗 +[5-10]％",
      "+24",
      "50"
    ]
  },
  {
    "line": 595,
    "cells": [
      "[全属性抵抗Lv3]",
      "魔法抵抗 +[11-20]％",
      "+48",
      "25"
    ]
  },
  {
    "line": 596,
    "cells": [
      "[全属性抵抗Lv4]",
      "魔法抵抗 +[21-30]％",
      "+80",
      "10"
    ]
  },
  {
    "line": 597,
    "cells": [
      "[全抵抗Lv1 DX]",
      "魔法抵抗 +[31-40]％",
      "+280",
      "5"
    ]
  },
  {
    "line": 598,
    "cells": [
      "[全抵抗Lv1 ULT]",
      "魔法抵抗 +[41-50]％",
      "+380",
      "5"
    ]
  },
  {
    "line": 599,
    "cells": [
      "[火属性吸収Lv1]",
      "火属性ダメージ吸収 [5-10]％",
      "+37",
      "80"
    ]
  },
  {
    "line": 600,
    "cells": [
      "[火属性吸収Lv2]",
      "火属性ダメージ吸収 [11-20]％",
      "+73",
      "50"
    ]
  },
  {
    "line": 601,
    "cells": [
      "[水属性吸収Lv1]",
      "水属性ダメージ吸収 [5-10]％",
      "+38",
      "80"
    ]
  },
  {
    "line": 602,
    "cells": [
      "[水属性吸収Lv2]",
      "水属性ダメージ吸収 [11-20]％",
      "+74",
      "50"
    ]
  },
  {
    "line": 603,
    "cells": [
      "[風属性吸収Lv1]",
      "風属性ダメージ吸収 [5-10]％",
      "+39",
      "80"
    ]
  },
  {
    "line": 604,
    "cells": [
      "[風属性吸収Lv2]",
      "風属性ダメージ吸収 [11-20]％",
      "+75",
      "50"
    ]
  },
  {
    "line": 605,
    "cells": [
      "[土属性吸収Lv1]",
      "大地属性ダメージ吸収 [5-10]％",
      "+40",
      "80"
    ]
  },
  {
    "line": 606,
    "cells": [
      "[土属性吸収Lv2]",
      "大地属性ダメージ吸収 [11-20]％",
      "+76",
      "50"
    ]
  },
  {
    "line": 607,
    "cells": [
      "[光属性吸収Lv1]",
      "光属性ダメージ吸収 [5-10]％",
      "+41",
      "80"
    ]
  },
  {
    "line": 608,
    "cells": [
      "[光属性吸収Lv2]",
      "光属性ダメージ吸収 [11-20]％",
      "+77",
      "50"
    ]
  },
  {
    "line": 609,
    "cells": [
      "[闇属性吸収Lv1]",
      "闇属性ダメージ吸収 [5-10]％",
      "+41",
      "80"
    ]
  },
  {
    "line": 610,
    "cells": [
      "[闇属性吸収Lv2]",
      "闇属性ダメージ吸収 [11-20]％",
      "+77",
      "50"
    ]
  },
  {
    "line": 611,
    "cells": [
      "[全属性吸収Lv1]",
      "魔法属性ダメージ吸収 [3-8]％",
      "+45",
      "10"
    ]
  },
  {
    "line": 612,
    "cells": [
      "[全属性吸収Lv2]",
      "魔法属性ダメージ吸収 [9-15]％",
      "+81",
      "5"
    ]
  },
  {
    "line": 613,
    "cells": [
      "[火吸収Lv1 DX]",
      "火属性ダメージ吸収 [15-25]％",
      "+253",
      "5"
    ]
  },
  {
    "line": 614,
    "cells": [
      "[水吸収Lv1 DX]",
      "水属性ダメージ吸収 [15-25]％",
      "+254",
      "5"
    ]
  },
  {
    "line": 615,
    "cells": [
      "[風吸収Lv1 DX]",
      "風属性ダメージ吸収 [15-25]％",
      "+255",
      "5"
    ]
  },
  {
    "line": 616,
    "cells": [
      "[土吸収Lv1 DX]",
      "大地属性ダメージ吸収 [15-25]％",
      "+256",
      "5"
    ]
  },
  {
    "line": 617,
    "cells": [
      "[光吸収Lv1 DX]",
      "光属性ダメージ吸収 [15-25]％",
      "+257",
      "5"
    ]
  },
  {
    "line": 618,
    "cells": [
      "[闇吸収Lv1 DX]",
      "闇属性ダメージ吸収 [15-25]％",
      "+257",
      "5"
    ]
  },
  {
    "line": 619,
    "cells": [
      "[全吸収Lv1 DX]",
      "魔法属性ダメージ吸収 [10-20]％",
      "+281",
      "5"
    ]
  },
  {
    "line": 620,
    "cells": [
      "[火吸収Lv1 ULT]",
      "火属性ダメージ吸収 [25-40]％",
      "+353",
      "5"
    ]
  },
  {
    "line": 621,
    "cells": [
      "[水吸収Lv1 ULT]",
      "水属性ダメージ吸収 [25-40]％",
      "+354",
      "5"
    ]
  },
  {
    "line": 622,
    "cells": [
      "[風吸収Lv1 ULT]",
      "風属性ダメージ吸収 [25-40]％",
      "+355",
      "5"
    ]
  },
  {
    "line": 623,
    "cells": [
      "[土吸収Lv1 ULT]",
      "大地属性ダメージ吸収 [25-40]％",
      "+356",
      "5"
    ]
  },
  {
    "line": 624,
    "cells": [
      "[光吸収Lv1 ULT]",
      "光属性ダメージ吸収 [25-40]％",
      "+357",
      "5"
    ]
  },
  {
    "line": 625,
    "cells": [
      "[闇吸収Lv1 ULT]",
      "闇属性ダメージ吸収 [25-40]％",
      "+357",
      "5"
    ]
  },
  {
    "line": 626,
    "cells": [
      "[全吸収Lv1 ULT]",
      "魔法属性ダメージ吸収 [15-30]％",
      "+381",
      "5"
    ]
  },
  {
    "line": 627,
    "cells": [
      "[フリーズ抵抗]",
      "フリーズ抵抗 +[30-75]％",
      "+30",
      "100"
    ]
  },
  {
    "line": 628,
    "cells": [
      "[コールド抵抗]",
      "コールド抵抗 +[30-75]％",
      "+15",
      "100"
    ]
  },
  {
    "line": 629,
    "cells": [
      "[スタン抵抗]",
      "スタン抵抗 +[30-75]％",
      "+25",
      "100"
    ]
  },
  {
    "line": 630,
    "cells": [
      "[混乱抵抗]",
      "混乱抵抗 +[30-75]％",
      "+10",
      "100"
    ]
  },
  {
    "line": 631,
    "cells": [
      "[魅了抵抗]",
      "チャーミング抵抗 +[30-75]％",
      "+35",
      "100"
    ]
  },
  {
    "line": 632,
    "cells": [
      "[石化抵抗]",
      "石化抵抗 +[30-75]％",
      "+20",
      "100"
    ]
  },
  {
    "line": 633,
    "cells": [
      "[即死抵抗]",
      "即死抵抗 +[30-75]％",
      "+10",
      "100"
    ]
  },
  {
    "line": 634,
    "cells": [
      "[毒抵抗]",
      "毒抵抗 +[30-75]％",
      "+5",
      "100"
    ]
  },
  {
    "line": 635,
    "cells": [
      "[眠り抵抗]",
      "睡眠抵抗 +[30-75]％",
      "+1",
      "100"
    ]
  },
  {
    "line": 636,
    "cells": [
      "[状態異常抵抗]",
      "状態異常抵抗 +[15-35]％",
      "+40",
      "60"
    ]
  },
  {
    "line": 637,
    "cells": [
      "[低下系抵抗]",
      "低下系抵抗 +[30-75]％",
      "+37",
      "70"
    ]
  },
  {
    "line": 638,
    "cells": [
      "[呪い抵抗]",
      "呪い系抵抗 +[30-75]％",
      "+39",
      "70"
    ]
  },
  {
    "line": 639,
    "cells": [
      "[全異常抵抗]",
      "すべての異常系抵抗 +[5-15]％",
      "+45",
      "50"
    ]
  },
  {
    "line": 640,
    "cells": [
      "[後退転倒抵抗]",
      "ノックバック抵抗 +[30-75]％",
      "+7",
      "100"
    ]
  },
  {
    "line": 641,
    "cells": [
      "[致命打抵抗]",
      "致命打抵抗 +[30-75]％",
      "+18",
      "100"
    ]
  },
  {
    "line": 642,
    "cells": [
      "[決定打抵抗]",
      "決定打抵抗 +[30-75]％",
      "+19",
      "100"
    ]
  },
  {
    "line": 643,
    "cells": [
      "[状態系抵抗 DX]",
      "状態異常抵抗 +[30-75]％",
      "+190",
      "10"
    ]
  },
  {
    "line": 644,
    "cells": [
      "[低下系抵抗 DX]",
      "低下系抵抗 +[50-95]％",
      "+187",
      "10"
    ]
  },
  {
    "line": 645,
    "cells": [
      "[呪い抵抗 DX]",
      "呪い系抵抗 +[50-95]％",
      "+189",
      "10"
    ]
  },
  {
    "line": 646,
    "cells": [
      "[全異常抵抗 DX]",
      "すべての異常系抵抗 +[15-50]％",
      "+195",
      "5"
    ]
  },
  {
    "line": 647,
    "cells": [
      "[後退抵抗 DX]",
      "ノックバック抵抗 +[50-90]％",
      "+157",
      "10"
    ]
  },
  {
    "line": 648,
    "cells": [
      "[致命打抵抗 DX]",
      "致命打抵抗 +[50-90]％",
      "+168",
      "10"
    ]
  },
  {
    "line": 649,
    "cells": [
      "[決定打抵抗 DX]",
      "決定打抵抗 +[50-90]％",
      "+169",
      "10"
    ]
  },
  {
    "line": 650,
    "cells": [
      "[状態系抵抗 ULT]",
      "状態異常抵抗 +[40-85]％",
      "+290",
      "10"
    ]
  },
  {
    "line": 651,
    "cells": [
      "[低下系抵抗 ULT]",
      "低下系抵抗 +[60-99]％",
      "+287",
      "10"
    ]
  },
  {
    "line": 652,
    "cells": [
      "[呪い抵抗 ULT]",
      "呪い系抵抗 +[60-99]％",
      "+289",
      "10"
    ]
  },
  {
    "line": 653,
    "cells": [
      "[全異常抵抗 ULT]",
      "すべての異常系抵抗 +[25-60]％",
      "+295",
      "5"
    ]
  },
  {
    "line": 654,
    "cells": [
      "[後退抵抗 ULT]",
      "ノックバック抵抗 +[60-99]％",
      "+257",
      "10"
    ]
  },
  {
    "line": 655,
    "cells": [
      "[致命打抵抗 ULT]",
      "致命打抵抗 +[60-99]％",
      "+268",
      "10"
    ]
  },
  {
    "line": 656,
    "cells": [
      "[決定打抵抗 ULT]",
      "決定打抵抗 +[60-99]％",
      "+269",
      "10"
    ]
  },
  {
    "line": 657,
    "cells": [
      "[攻撃反射Lv1]",
      "ダメージ返し [10-20]％",
      "+3",
      "100"
    ]
  },
  {
    "line": 658,
    "cells": [
      "[攻撃反射Lv2]",
      "ダメージ返し [21-25]％",
      "+8",
      "80"
    ]
  },
  {
    "line": 659,
    "cells": [
      "[攻撃反射Lv3]",
      "ダメージ返し [26-35]％",
      "+29",
      "60"
    ]
  },
  {
    "line": 660,
    "cells": [
      "[攻撃反射Lv4]",
      "ダメージ返し [36-50]％",
      "+47",
      "40"
    ]
  },
  {
    "line": 661,
    "cells": [
      "[CP変換Lv1]",
      "ダメージをCPに転換 [2-4]％",
      "+2",
      "100"
    ]
  },
  {
    "line": 662,
    "cells": [
      "[CP変換Lv2]",
      "ダメージをCPに転換 [5-7]％",
      "+9",
      "80"
    ]
  },
  {
    "line": 663,
    "cells": [
      "[CP変換Lv3]",
      "ダメージをCPに転換 [8-10]％",
      "+53",
      "60"
    ]
  },
  {
    "line": 664,
    "cells": [
      "[反射フリーズ]",
      "カウンターフリーズ [10-15]％([1-2]秒)",
      "+22",
      "50"
    ]
  },
  {
    "line": 665,
    "cells": [
      "[反射コールド]",
      "カウンターコールド [30-50]％([5-10]秒)",
      "+19",
      "25"
    ]
  },
  {
    "line": 666,
    "cells": [
      "[スキル名]",
      "",
      "+0",
      "0"
    ]
  },
  {
    "line": 667,
    "cells": [
      "[剣士]",
      "スキルレベル +1(0系列 職業)",
      "+25",
      "50"
    ]
  },
  {
    "line": 668,
    "cells": [
      "[騎士]",
      "スキルレベル +2(0系列 職業)",
      "+45",
      "25"
    ]
  },
  {
    "line": 669,
    "cells": [
      "[聖騎士]",
      "スキルレベル +[3-4](0系列 職業)",
      "+70",
      "10"
    ]
  },
  {
    "line": 670,
    "cells": [
      "[戦士]",
      "スキルレベル +1(1系列 職業)",
      "+25",
      "50"
    ]
  },
  {
    "line": 671,
    "cells": [
      "[剣闘士]",
      "スキルレベル +2(1系列 職業)",
      "+45",
      "25"
    ]
  },
  {
    "line": 672,
    "cells": [
      "[勇者]",
      "スキルレベル +[3-4](1系列 職業)",
      "+70",
      "10"
    ]
  },
  {
    "line": 673,
    "cells": [
      "[研究生]",
      "スキルレベル +1(2系列 職業)",
      "+24",
      "50"
    ]
  },
  {
    "line": 674,
    "cells": [
      "[魔法使い]",
      "スキルレベル +2(2系列 職業)",
      "+44",
      "25"
    ]
  },
  {
    "line": 675,
    "cells": [
      "[大魔導師]",
      "スキルレベル +[3-4](2系列 職業)",
      "+69",
      "10"
    ]
  },
  {
    "line": 676,
    "cells": [
      "[闘犬]",
      "スキルレベル +1(3系列 職業)",
      "+26",
      "50"
    ]
  },
  {
    "line": 677,
    "cells": [
      "[牙狼]",
      "スキルレベル +2(3系列 職業)",
      "+46",
      "25"
    ]
  },
  {
    "line": 678,
    "cells": [
      "[銀狼]",
      "スキルレベル +[3-4](3系列 職業)",
      "+71",
      "10"
    ]
  },
  {
    "line": 679,
    "cells": [
      "[司祭]",
      "スキルレベル +1(4系列 職業)",
      "+23",
      "50"
    ]
  },
  {
    "line": 680,
    "cells": [
      "[司教]",
      "スキルレベル +2(4系列 職業)",
      "+43",
      "25"
    ]
  },
  {
    "line": 681,
    "cells": [
      "[教主]",
      "スキルレベル +[3-4](4系列 職業)",
      "+68",
      "10"
    ]
  },
  {
    "line": 682,
    "cells": [
      "[堕天使]",
      "スキルレベル +1(5系列 職業)",
      "+27",
      "50"
    ]
  },
  {
    "line": 683,
    "cells": [
      "[天使]",
      "スキルレベル +2(5系列 職業)",
      "+47",
      "25"
    ]
  },
  {
    "line": 684,
    "cells": [
      "[大天使]",
      "スキルレベル +[3-4](5系列 職業)",
      "+72",
      "10"
    ]
  },
  {
    "line": 685,
    "cells": [
      "[盗人]",
      "スキルレベル +1(6系列 職業)",
      "+23",
      "50"
    ]
  },
  {
    "line": 686,
    "cells": [
      "[自由人]",
      "スキルレベル +2(6系列 職業)",
      "+43",
      "25"
    ]
  },
  {
    "line": 687,
    "cells": [
      "[怪盗]",
      "スキルレベル +[3-4](6系列 職業)",
      "+68",
      "10"
    ]
  },
  {
    "line": 688,
    "cells": [
      "[格闘家]",
      "スキルレベル +1(7系列 職業)",
      "+24",
      "50"
    ]
  },
  {
    "line": 689,
    "cells": [
      "[師範代]",
      "スキルレベル +2(7系列 職業)",
      "+44",
      "25"
    ]
  },
  {
    "line": 690,
    "cells": [
      "[皆伝]",
      "スキルレベル +[3-4](7系列 職業)",
      "+69",
      "10"
    ]
  },
  {
    "line": 691,
    "cells": [
      "[狩人]",
      "スキルレベル +1(9系列 職業)",
      "+26",
      "50"
    ]
  },
  {
    "line": 692,
    "cells": [
      "[射手]",
      "スキルレベル +2(9系列 職業)",
      "+46",
      "25"
    ]
  },
  {
    "line": 693,
    "cells": [
      "[魔弓兵]",
      "スキルレベル +[3-4](9系列 職業)",
      "+71",
      "10"
    ]
  },
  {
    "line": 694,
    "cells": [
      "[義勇兵]",
      "スキルレベル +1(8系列 職業)",
      "+26",
      "50"
    ]
  },
  {
    "line": 695,
    "cells": [
      "[傭兵]",
      "スキルレベル +2(8系列 職業)",
      "+46",
      "25"
    ]
  },
  {
    "line": 696,
    "cells": [
      "[魔槍兵]",
      "スキルレベル +[3-4](8系列 職業)",
      "+71",
      "10"
    ]
  },
  {
    "line": 697,
    "cells": [
      "[飼育者]",
      "スキルレベル +1(10系列 職業)",
      "+22",
      "50"
    ]
  },
  {
    "line": 698,
    "cells": [
      "[調教師]",
      "スキルレベル +2(10系列 職業)",
      "+42",
      "25"
    ]
  },
  {
    "line": 699,
    "cells": [
      "[団長]",
      "スキルレベル +[3-4](10系列 職業)",
      "+67",
      "10"
    ]
  },
  {
    "line": 700,
    "cells": [
      "[精霊術士]",
      "スキルレベル +1(11系列 職業)",
      "+23",
      "50"
    ]
  },
  {
    "line": 701,
    "cells": [
      "[召喚士]",
      "スキルレベル +2(11系列 職業)",
      "+43",
      "25"
    ]
  },
  {
    "line": 702,
    "cells": [
      "[神獣使い]",
      "スキルレベル +[3-4](11系列 職業)",
      "+68",
      "10"
    ]
  },
  {
    "line": 703,
    "cells": [
      "[姫]",
      "スキルレベル +1(12系列 職業)",
      "+20",
      "50"
    ]
  },
  {
    "line": 704,
    "cells": [
      "[王妃]",
      "スキルレベル +2(12系列 職業)",
      "+40",
      "25"
    ]
  },
  {
    "line": 705,
    "cells": [
      "[女帝]",
      "スキルレベル +[3-4](12系列 職業)",
      "+65",
      "10"
    ]
  },
  {
    "line": 706,
    "cells": [
      "[修行中]",
      "スキルレベル +1(13系列 職業)",
      "+21",
      "50"
    ]
  },
  {
    "line": 707,
    "cells": [
      "[アイドル]",
      "スキルレベル +2(13系列 職業)",
      "+41",
      "25"
    ]
  },
  {
    "line": 708,
    "cells": [
      "[大スター]",
      "スキルレベル +[3-4](13系列 職業)",
      "+66",
      "10"
    ]
  },
  {
    "line": 709,
    "cells": [
      "[交霊術士]",
      "スキルレベル +1(14系列 職業)",
      "+25",
      "50"
    ]
  },
  {
    "line": 710,
    "cells": [
      "[死霊術師]",
      "スキルレベル +2(14系列 職業)",
      "+45",
      "25"
    ]
  },
  {
    "line": 711,
    "cells": [
      "[神霊術師]",
      "スキルレベル +[3-4](14系列 職業)",
      "+70",
      "10"
    ]
  },
  {
    "line": 712,
    "cells": [
      "[小悪魔]",
      "スキルレベル +1(15系列 職業)",
      "+25",
      "50"
    ]
  },
  {
    "line": 713,
    "cells": [
      "[魔人]",
      "スキルレベル +2(15系列 職業)",
      "+45",
      "25"
    ]
  },
  {
    "line": 714,
    "cells": [
      "[魔王]",
      "スキルレベル +[3-4](15系列 職業)",
      "+70",
      "10"
    ]
  },
  {
    "line": 715,
    "cells": [
      "[達人]",
      "スキルレベル +1",
      "+30",
      "20"
    ]
  },
  {
    "line": 716,
    "cells": [
      "[名手]",
      "スキルレベル +2",
      "+50",
      "15"
    ]
  },
  {
    "line": 717,
    "cells": [
      "[大家]",
      "スキルレベル +3",
      "+75",
      "10"
    ]
  },
  {
    "line": 718,
    "cells": [
      "[RED STONE]",
      "スキルレベル +[4-5]",
      "+100",
      "5"
    ]
  },
  {
    "line": 719,
    "cells": [
      "[RED STONE DX]",
      "スキルレベル +[4-6]",
      "+300",
      "2"
    ]
  },
  {
    "line": 720,
    "cells": [
      "[RED STONE ULT]",
      "スキルレベル +[5-7]",
      "+400",
      "2"
    ]
  },
  {
    "line": 721,
    "cells": [
      "[応急処置]",
      "攻撃を受けると <c:LTYELLOW>10％<n>の確率でダメージの[25-50]％を応急処置",
      "+31",
      "50"
    ]
  },
  {
    "line": 722,
    "cells": [
      "[変身速度]",
      "武器交換速度 +[35-80]％",
      "+3",
      "100"
    ]
  },
  {
    "line": 723,
    "cells": [
      "[HP回復]",
      "HP回復 +([5-10]/10秒)",
      "+39",
      "50"
    ]
  },
  {
    "line": 724,
    "cells": [
      "[復活確率]",
      "復活 [5-8]％",
      "+25",
      "100"
    ]
  },
  {
    "line": 725,
    "cells": [
      "[不可視Lv1]",
      "<c:LTYELLOW>ブラー<n>",
      "+77",
      "25"
    ]
  },
  {
    "line": 726,
    "cells": [
      "[不可視Lv2]",
      "<c:LTYELLOW>透明<n>",
      "+88",
      "10"
    ]
  },
  {
    "line": 727,
    "cells": [
      "[浮遊]",
      "<c:LTYELLOW>空中浮遊<n>",
      "+32",
      "75"
    ]
  },
  {
    "line": 728,
    "cells": [
      "[魔法弾丸]",
      "<c:LTYELLOW>魔法弾丸<n>",
      "+22",
      "50"
    ]
  },
  {
    "line": 729,
    "cells": [
      "[無限弾丸]",
      "<c:LTYELLOW>無限弾丸<n>",
      "+27",
      "15"
    ]
  },
  {
    "line": 730,
    "cells": [
      "[永久弾]",
      "<c:LTYELLOW>無限弾丸<n>",
      "+37",
      "15"
    ]
  },
  {
    "line": 731,
    "cells": [
      "[ターゲット回避]",
      "<c:LTYELLOW>先攻されない<n>",
      "+46",
      "50"
    ]
  },
  {
    "line": 732,
    "cells": [
      "[魔具入手Lv1]",
      "魔法アイテム ドロップ確率 +[5-10]％",
      "+79",
      "100"
    ]
  },
  {
    "line": 733,
    "cells": [
      "[魔具入手Lv2]",
      "魔法アイテムドロップ確率 +[11-15]％",
      "+89",
      "60"
    ]
  },
  {
    "line": 734,
    "cells": [
      "[魔具入手Lv3]",
      "魔法アイテムドロップ確率 +[16-20]％",
      "+99",
      "40"
    ]
  },
  {
    "line": 735,
    "cells": [
      "[レア入手Lv1]",
      "ユニークアイテムドロップ確率 +[5-10]％",
      "+98",
      "100"
    ]
  },
  {
    "line": 736,
    "cells": [
      "[レア入手Lv2]",
      "ユニークアイテムドロップ確率 +[11-15]％",
      "+0",
      "60"
    ]
  },
  {
    "line": 737,
    "cells": [
      "[レア入手Lv3]",
      "ユニークアイテムドロップ確率 +[16-20]％",
      "+100",
      "40"
    ]
  },
  {
    "line": 738,
    "cells": [
      "[リロード速度]",
      "アイテムリロードタイム -[50-90]％",
      "+2",
      "100"
    ]
  },
  {
    "line": 739,
    "cells": [
      "[自動リロード]",
      "<c:LTYELLOW>アイテム自動リロード<n>",
      "+14",
      "75"
    ]
  },
  {
    "line": 740,
    "cells": [
      "[応急処置 DX]",
      "攻撃を受けると <c:LTYELLOW>10％<n>の確率でダメージの[50-65]％を応急処置",
      "+181",
      "5"
    ]
  },
  {
    "line": 741,
    "cells": [
      "[変身速度 DX]",
      "武器交換速度 +[80-150]％",
      "+153",
      "20"
    ]
  },
  {
    "line": 742,
    "cells": [
      "[HP回復 DX]",
      "HP回復 +([10-15]/10秒)",
      "+239",
      "5"
    ]
  },
  {
    "line": 743,
    "cells": [
      "[魔具入手Lv1 DX]",
      "魔法アイテムドロップ確率 +[20-25]％",
      "+299",
      "5"
    ]
  },
  {
    "line": 744,
    "cells": [
      "[レア入手Lv1 DX]",
      "ユニークアイテムドロップ確率 +[20-25]％",
      "+300",
      "5"
    ]
  },
  {
    "line": 745,
    "cells": [
      "[リロード DX]",
      "アイテムリロードタイム -[90-95]％",
      "+152",
      "20"
    ]
  },
  {
    "line": 746,
    "cells": [
      "[応急処置 ULT]",
      "攻撃を受けると <c:LTYELLOW>10％<n>の確率でダメージの[65-75]％を応急処置",
      "+281",
      "5"
    ]
  },
  {
    "line": 747,
    "cells": [
      "[変身速度 ULT]",
      "武器交換速度 +[100-200]％",
      "+253",
      "20"
    ]
  },
  {
    "line": 748,
    "cells": [
      "[HP回復 ULT]",
      "HP回復 +([15-30]/10秒)",
      "+339",
      "5"
    ]
  },
  {
    "line": 749,
    "cells": [
      "[魔具入手Lv1 ULT]",
      "魔法アイテムドロップ確率 +[25-35]％",
      "+399",
      "5"
    ]
  },
  {
    "line": 750,
    "cells": [
      "[リロード ULT]",
      "アイテムリロードタイム -[95-99]％",
      "+252",
      "20"
    ]
  },
  {
    "line": 751,
    "cells": [
      "[破壊]",
      "<c:LTYELLOW>アイテム使用不可<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 752,
    "cells": [
      "[呪]",
      "<c:LTYELLOW>装備解除不可<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 753,
    "cells": [
      "[エンチャント不可]",
      "<c:LTYELLOW>追加エンチャントが不可能<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 754,
    "cells": [
      "[火攻撃段階上昇]",
      "<c:LTYELLOW>火攻撃称号 1段階上昇<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 755,
    "cells": [
      "[水攻撃段階上昇]",
      "<c:LTYELLOW>水攻撃称号 1段階上昇<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 756,
    "cells": [
      "[風攻撃段階上昇]",
      "<c:LTYELLOW>風攻撃称号 1段階 上昇<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 757,
    "cells": [
      "[土攻撃段階上昇]",
      "<c:LTYELLOW>大地攻撃称号 1段階 上昇<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 758,
    "cells": [
      "[光攻撃段階上昇]",
      "<c:LTYELLOW>光攻撃称号 1段階 上昇<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 759,
    "cells": [
      "[闇攻撃段階上昇]",
      "<c:LTYELLOW>闇攻撃称号 1段階 上昇<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 760,
    "cells": [
      "貸与してくれる",
      "<c:LTYELLOW>一定期間貸与するアイテム<n>",
      "+0",
      "100"
    ]
  },
  {
    "line": 761,
    "cells": [
      "[弱効果 力Lv1]",
      "力 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 762,
    "cells": [
      "[弱効果 力Lv2]",
      "力 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 763,
    "cells": [
      "[弱効果 敏捷Lv1]",
      "敏捷 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 764,
    "cells": [
      "[弱効果 敏捷Lv2]",
      "敏捷 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 765,
    "cells": [
      "[弱効果 健康Lv1]",
      "健康 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 766,
    "cells": [
      "[弱効果 健康Lv2]",
      "健康 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 767,
    "cells": [
      "[弱効果 知恵Lv1]",
      "知恵 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 768,
    "cells": [
      "[弱効果 知恵Lv2]",
      "知恵 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 769,
    "cells": [
      "[弱効果 知識Lv1]",
      "知識 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 770,
    "cells": [
      "[弱効果 知識Lv2]",
      "知識 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 771,
    "cells": [
      "[弱効果 威厳Lv1]",
      "カリスマ +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 772,
    "cells": [
      "[弱効果 威厳Lv2]",
      "カリスマ +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 773,
    "cells": [
      "[弱効果 運Lv1]",
      "運 +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 774,
    "cells": [
      "[弱効果 運Lv2]",
      "運 +[2-3]",
      "+3",
      "100"
    ]
  },
  {
    "line": 775,
    "cells": [
      "[弱効果 武器攻撃]",
      "ダメージ +[1-5]％",
      "+1",
      "100"
    ]
  },
  {
    "line": 776,
    "cells": [
      "[弱効果 最低攻撃]",
      "最小ダメージ +1",
      "+4",
      "100"
    ]
  },
  {
    "line": 777,
    "cells": [
      "[弱効果 最高攻撃]",
      "最大ダメージ +1",
      "+1",
      "100"
    ]
  },
  {
    "line": 778,
    "cells": [
      "[弱効果 防御効率]",
      "防御力 +[1-5]％",
      "+1",
      "100"
    ]
  },
  {
    "line": 779,
    "cells": [
      "[弱効果 防御力]",
      "防御力 +1",
      "+5",
      "100"
    ]
  },
  {
    "line": 780,
    "cells": [
      "[弱効果 最大HPLv1]",
      "最大HP +[1-2]",
      "+1",
      "100"
    ]
  },
  {
    "line": 781,
    "cells": [
      "[弱効果 最大HPLv2]",
      "最大HP +[3-5]",
      "+2",
      "100"
    ]
  },
  {
    "line": 782,
    "cells": [
      "[弱効果 最大CPLv1]",
      "最大CP +[1-2]",
      "+1",
      "100"
    ]
  },
  {
    "line": 783,
    "cells": [
      "[弱効果 最大CPLv2]",
      "最大CP +[3-5]",
      "+2",
      "100"
    ]
  },
  {
    "line": 784,
    "cells": [
      "[弱効果 火攻撃]",
      "火ダメージ [2-3]～[3-4]",
      "+6",
      "100"
    ]
  },
  {
    "line": 785,
    "cells": [
      "[弱効果 水攻撃]",
      "水ダメージ 1～1 - コールド 16Frame",
      "+7",
      "100"
    ]
  },
  {
    "line": 786,
    "cells": [
      "[弱効果 風攻撃]",
      "風ダメージ 1～1 - スタン 2Frame",
      "+8",
      "100"
    ]
  },
  {
    "line": 787,
    "cells": [
      "[弱効果 土攻撃]",
      "2秒 1～2 毒ダメージ",
      "+9",
      "100"
    ]
  },
  {
    "line": 788,
    "cells": [
      "[弱効果 火抵抗]",
      "火属性抵抗 +[5-10]％",
      "+3",
      "100"
    ]
  },
  {
    "line": 789,
    "cells": [
      "[弱効果 水抵抗]",
      "水属性抵抗 +[5-10]％",
      "+4",
      "100"
    ]
  },
  {
    "line": 790,
    "cells": [
      "[弱効果 風抵抗]",
      "風属性抵抗 +[5-10]％",
      "+5",
      "100"
    ]
  },
  {
    "line": 791,
    "cells": [
      "[弱効果 土抵抗]",
      "大地属性抵抗 +[5-10]％",
      "+6",
      "100"
    ]
  },
  {
    "line": 792,
    "cells": [
      "[弱効果 光抵抗]",
      "光属性抵抗 +[5-10]％",
      "+7",
      "100"
    ]
  },
  {
    "line": 793,
    "cells": [
      "[弱効果 闇抵抗]",
      "闇属性抵抗 +[5-10]％",
      "+7",
      "100"
    ]
  },
  {
    "line": 794,
    "cells": [
      "[弱効果 毒抵抗]",
      "毒抵抗 +[30-75]％",
      "+5",
      "100"
    ]
  },
  {
    "line": 795,
    "cells": [
      "[弱効果 眠り抵抗]",
      "睡眠抵抗 +[30-75]％",
      "+1",
      "100"
    ]
  },
  {
    "line": 796,
    "cells": [
      "[弱効果 CP変換]",
      "ダメージをCPに転換 [2-4]％",
      "+2",
      "100"
    ]
  },
  {
    "line": 797,
    "cells": [
      "[弱効果 変身]",
      "武器交換速度 +[35-80]％",
      "+3",
      "100"
    ]
  },
  {
    "line": 798,
    "cells": [
      "[弱効果 補充速度]",
      "アイテムリロードタイム -[50-90]％",
      "+2",
      "100"
    ]
  },
  {
    "line": 799,
    "cells": [
      "[スキルLv1 EX]",
      "スキル難易度1以下のスキルレベルが[1-3]増加する。",
      "+0",
      "0"
    ]
  },
  {
    "line": 800,
    "cells": [
      "[スキルLv2 EX]",
      "スキル難易度2以下のスキルレベルが[1-4]増加する。",
      "+0",
      "0"
    ]
  },
  {
    "line": 801,
    "cells": [
      "[スキルLv3 EX]",
      "スキル難易度3以下のスキルレベルが[1-5]増加する。",
      "+0",
      "0"
    ]
  },
  {
    "line": 802,
    "cells": [
      "[スキルLv4 EX]",
      "スキル難易度4以下のスキルレベルが[1-6]増加する。",
      "+0",
      "0"
    ]
  },
  {
    "line": 803,
    "cells": [
      "[スキルLv5 EX]",
      "スキル難易度4以下のスキルレベルが[5-10]増加する。",
      "+0",
      "0"
    ]
  },
  {
    "line": 804,
    "cells": [
      "[サマナーLv1 EX]",
      "召喚獣のすべてのステータスが[10-20]増加",
      "+0",
      "0"
    ]
  },
  {
    "line": 805,
    "cells": [
      "[サマナーLv2 EX]",
      "召喚獣のすべてのステータスが[20-40]増加",
      "+0",
      "0"
    ]
  },
  {
    "line": 806,
    "cells": [
      "[サマナーLv3 EX]",
      "召喚獣のすべてのステータスが[40-80]増加",
      "+0",
      "0"
    ]
  },
  {
    "line": 807,
    "cells": [
      "[サマナーLv4 EX]",
      "召喚獣のすべてのステータスが[80-160]増加",
      "+0",
      "0"
    ]
  },
  {
    "line": 808,
    "cells": [
      "[サマナーLv5 EX]",
      "召喚獣のすべてのステータスが[160-320]増加",
      "+0",
      "0"
    ]
  },
  {
    "line": 809,
    "cells": [
      "[ペットLv1 EX]",
      "[10-20]％のペット経験値ボーナス",
      "+0",
      "0"
    ]
  },
  {
    "line": 810,
    "cells": [
      "[ペットLv2 EX]",
      "[20-30]％のペット経験値ボーナス",
      "+0",
      "0"
    ]
  },
  {
    "line": 811,
    "cells": [
      "[ペットLv3 EX]",
      "[30-40]％のペット経験値ボーナス",
      "+0",
      "0"
    ]
  },
  {
    "line": 812,
    "cells": [
      "[ペットLv4 EX]",
      "[40-50]％のペット経験値ボーナス",
      "+0",
      "0"
    ]
  },
  {
    "line": 813,
    "cells": [
      "[ペットLv5 EX]",
      "[50-60]％のペット経験値ボーナス",
      "+0",
      "0"
    ]
  }
]
};
function require(id){if(id==='node:fs')return {};if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;factories[id](require,m,m.exports);return m.exports;}window.GameCore={loot:require('./balanced_loot.cjs'),combat:require('./live_combat.cjs'),shop:require('./town_shop.cjs'),enemies:require('./enemies.cjs').enemies};})();