(function(root){
'use strict';
const active={
 triple:{name:'連続斬り',mult:3.2,cost:18,cooldown:9,cast:1.05,targets:1,hitFractions:[.265/1.05,.5/1.05,.89/1.05],motion:'triple',desc:'単体へ3連撃'},
 thrust:{name:'突進斬り',mult:1.35,cost:8,cooldown:3,cast:.375,targets:1,hitFractions:[145/375],motion:'thrust',desc:'単体へ素早く接近攻撃'},
 sweep:{name:'旋回斬り',mult:1.7,cost:12,cooldown:5,cast:.405,targets:3,hitFractions:[165/405],motion:'sweep',desc:'最大3体へ物理攻撃'},
 leap:{name:'跳び込み斬り',mult:2.4,cost:16,cooldown:7,cast:.48,targets:1,hitFractions:[300/480],motion:'leap',desc:'単体への強打'},
 flame:{name:'焔の飛び込み',mult:3,cost:20,cooldown:8,cast:.48,targets:1,hitFractions:[300/480],element:'fire',powerSource:'weapon',motion:'leap',desc:'火属性・知識で威力上昇'},
 frost:{name:'氷牙薙ぎ',mult:1.45,cost:18,cooldown:7,cast:.405,targets:3,hitFractions:[165/405],element:'water',powerSource:'weapon',motion:'sweep',procs:[{type:'cold',chance:1,duration:2}],desc:'水属性・鈍足2秒（抵抗あり）'},
 thunder:{name:'雷光突き',mult:2,cost:14,cooldown:5,cast:.375,targets:1,hitFractions:[145/375],element:'wind',powerSource:'weapon',motion:'thrust',procs:[{type:'stun',chance:.25,duration:1}],desc:'風属性・気絶25%／1秒（抵抗あり）'},
 counter:{name:'盾反撃',type:'counter',mult:1.4,cost:12,cooldown:8,cast:.35,targets:1,duration:3,motion:'guard',desc:'3秒構える。次の被弾を軽減し1回反撃'},
 wave:{name:'剣気',mult:1.45,cost:16,cooldown:5,cast:.6,targets:2,hitFractions:[.5],motion:'sweep',desc:'離れた位置から直線上の敵を貫通'},
 break:{name:'崩し斬り',mult:.85,cost:10,cooldown:7,cast:.48,targets:1,hitFractions:[300/480],motion:'leap',procs:[{type:'armorBreak',chance:1,duration:5}],desc:'物理防御を5秒間30%低下（抵抗あり）'},
 guard:{name:'守りの構え',type:'guard',mult:0,cost:12,cooldown:12,cast:.35,targets:0,duration:4,motion:'guard',desc:'HP60%以下で使用。4秒間被ダメージ軽減'},
 focus:{name:'練気',type:'focus',mult:0,cost:0,cooldown:8,cast:1.2,targets:0,motion:'focus',desc:'CP40%以下で使用。時間を使いCPを回復'}
};
const passive={sword:{name:'剣術熟練',desc:'物理剣技の威力 +2%／Lv'},combo:{name:'連撃技巧',desc:'連続斬りの命中 +1ポイント／Lv'},shield:{name:'盾術熟練',desc:'盾反撃・守りの構えの軽減 +1ポイント／Lv'},breath:{name:'呼吸法',desc:'通常攻撃のCP獲得 +3%／Lv'},magic:{name:'魔法剣の心得',desc:'属性剣技の威力 +2%／Lv'},control:{name:'剣気制御',desc:'剣気の威力 +2%／Lv、Lv5で対象3体'}};
const links={assault:{name:'崩しからの強襲',desc:'崩し成功後5秒以内の変身で戦士の次の一撃 +24%〜40%'},riposte:{name:'守勢からの反攻',desc:'反撃成功後5秒以内の変身で戦士の次の攻撃CP -30%〜50%'}};
const all={...active,...passive,...links},free=Object.keys(active).slice(0,7);
const max=id=>active[id]?10:passive[id]?10:5;
const total=s=>10+Math.min(110,Math.floor(Math.max(0,s.level-1)/5));
function spent(s){return Object.entries(s.training||{}).reduce((v,[id,n])=>v+(all[id]?Math.max(0,n-(free.includes(id)?1:0)):0),0);}
function migrate(s){s.training=s.training||Object.fromEntries(free.map(id=>[id,1]));for(const id of Object.keys(all))s.training[id]=Math.max(free.includes(id)?1:0,Math.min(max(id),Math.floor(Number(s.training[id])||0)));s.queue=s.queue.filter(id=>active[id]&&s.training[id]>0);for(const id of free)if(s.queue.length<5&&!s.queue.includes(id))s.queue.push(id);s.queue=s.queue.slice(0,5);s.autoPotion=s.autoPotion!==false;s.form=s.form==='warrior'?'warrior':'swordsman';}
function train(s,id){if(!all[id]||s.training[id]>=max(id)||spent(s)>=total(s))return false;s.training[id]++;return true;}
function reset(s){s.training=Object.fromEntries(free.map(id=>[id,1]));migrate(s);}
function apply(q,s,specs){const rank=id=>s.training[id]||0,bonus=q.skills.find(x=>x.id==='burst').mult/3.2;q.ordered=true;q.cpBonus=(q.cpBonus||0)+rank('breath')*.03;q.training={...s.training};q.form=s.form;q.skillRules=true;q.actions=s.queue.filter(id=>rank(id)>0).map(id=>{const v={...specs[id],id},r=rank(id);v.mult*=bonus*(1+.04*(r-1))*(1+.02*rank(v.element?'magic':'sword'));v.rank=r;v.hitBonus=id==='triple'?rank('combo')*.01:0;if(id==='wave'){v.mult*=1+.02*rank('control');v.targets=rank('control')>=5?3:2;}v.reduction=Math.min(.6,(id==='counter'?.45:.25)+.01*(r-1)+.01*rank('shield'));v.cpRestore=18+2*(r-1);return v;});q.autoPotion=s.autoPotion?{id:'heal_potion',name:'回復薬',type:'potion',hpBelow:s.healAt,healRatio:.3,cast:.5,cooldown:15}:null;return q;}
const api={active,passive,links,all,free,max,total,spent,migrate,train,reset,apply};if(typeof module==='object')module.exports=api;root.SwordSkills=api;
})(typeof window==='object'?window:globalThis);
