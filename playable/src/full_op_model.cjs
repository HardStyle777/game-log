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
function player(level,gear,enhance={weapon:0,armor:0,charm:0},allocation){
 const s={力:10+Math.floor((level-1)*1.5),敏捷:10+Math.floor((level-1)*.5),健康:10+level-1,知恵:10,知識:10,威厳:10,運:10};s.運+=4*(level-1)-(s.力-10+s.敏捷-10+s.健康-10);
 if(allocation){let remaining=4*Math.max(0,level-1);for(const k of stats){const n=Math.min(remaining,Math.max(0,Math.floor(Number(allocation[k])||0)));s[k]=10+n;remaining-=n;}}
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
