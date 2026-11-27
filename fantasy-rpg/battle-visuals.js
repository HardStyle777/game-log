// R15: pure presentation helpers. Never modify combat state.
export const actionNames={basic:'通常攻撃',guard:'防御',potion:'回復薬',blade:'踏み込み斬り',double:'連撃',heavy:'強撃',spell:'魔法',claw:'爪撃',wait:'待機'};
export const shortActionNames={basic:'攻撃',guard:'防御',potion:'回復薬',blade:'特技',double:'連撃',heavy:'特技',spell:'魔法',wait:'待機'};
export function activeMotion(v,id){const m=v.motion[id];if(!m||m.duration<=0||v.clock<m.start||v.clock-m.start>=m.duration)return null;return {...m,progress:(v.clock-m.start)/m.duration}}
export function enemyOpacity(v,id){if(v.vitals[id].hp>0)return 1;const m=activeMotion(v,id);if(!m)return 0;return m.clip==='knockout'?Math.max(0,1-m.progress):1}
export function impactLabel(hit){
 if(hit.type==='heal')return {text:'+'+hit.effective,color:'#a9f7a9',size:14};
 if(hit.type==='mp_restored')return {text:'MP +'+hit.effective,color:'#a5e5ff',size:12};
 if(!hit.landed)return {text:'MISS',color:'#e3ebf2',size:12};
 if(hit.absorbedHeal>0)return {text:'+'+hit.absorbedHeal,color:'#a9f7a9',size:14};
 if(hit.hpDamage===0&&hit.shieldDamage>0)return {text:'盾 '+hit.shieldDamage,color:'#b7e5ff',size:12};
 if(hit.critical)return {text:'CRIT '+hit.hpDamage,color:'#ffda75',size:16};
 return {text:String(hit.hpDamage),color:hit.weak?'#ffd2a1':'#fff3de',size:15};
}
export function impactAnchor(id,formation,box){const p=formation[id];if(p)return {x:p.x,y:Math.max(18,p.y-(p.h??88)-8)};return {x:Math.max(25,box.x+box.w*.62),y:Math.max(30,box.y+box.h*.25)}}
export function plannedLabel(cmd){return shortActionNames[cmd?.skill]??(cmd?'選択済':'')}
export function battleMessage(v,names,selected){
 if(v.outcome)return v.outcome==='win'?'勝利！':v.outcome==='loss'?'敗北':'戦闘終了';
 if(v.busy){const a=[...(v.events??[])].reverse().find(e=>e.type==='action');return a?(names[a.actor]??a.actor)+'：'+(actionNames[a.skill]??a.skill):'行動開始';}
 if(v.complete)return '全員の行動選択完了';
 return (names[selected]??selected)+'の行動を選択';
}

// R16: four fixed party slots; only the acting member travels to the action point.
// R21: fixed foot anchors, measured visible-pixel extents; Leon atlas includes effects.
export const STAGE=Object.freeze({w:480,h:400,ground:116,margin:10});
export const profiles=Object.freeze({
 leon:{scale:.78,left:100*.78,right:48*.78,above:99*.78,below:5*.78,idleLeft:37*.78,idleRight:25*.78,idleAbove:88*.78,idleBelow:1*.78,h:69},
 fia:{scale:1.4,left:38*1.4,right:19*1.4,above:56*1.4,below:0,idleLeft:34*1.4,idleRight:17*1.4,idleAbove:46*1.4,h:64},
 glen:{scale:1.4,left:32*1.4,right:24*1.4,above:52*1.4,below:0,idleLeft:31*1.4,idleRight:23*1.4,idleAbove:46*1.4,h:65},
 lucia:{scale:1.4,left:35*1.4,right:22*1.4,above:52*1.4,below:0,idleLeft:33*1.4,idleRight:13*1.4,idleAbove:49*1.4,h:69}
});
export const partyFormation=Object.freeze(Object.fromEntries(['leon','fia','glen','lucia'].map((id,i)=>[id,Object.freeze({x:390+i*13,y:148+i*77,h:profiles[id].h})])));
export function visibleBounds(id,p,idle=false){
 const a=profiles[id],l=idle?(a.idleLeft??a.left):a.left,r=idle?(a.idleRight??a.right):a.right,t=idle?(a.idleAbove??a.above):a.above,b=idle?(a.idleBelow??a.below):a.below;
 return {x:p.x-Math.ceil(l),y:p.y-Math.ceil(t),w:Math.ceil(l)+Math.ceil(r),h:Math.ceil(t)+Math.ceil(b)};
}
export function safePosition(id,p){
 const a=profiles[id];return {...p,x:Math.round(Math.max(STAGE.margin+Math.ceil(a.left),Math.min(STAGE.w-STAGE.margin-Math.ceil(a.right),p.x))),y:Math.round(Math.max(STAGE.ground+12,STAGE.margin+Math.ceil(a.above),Math.min(STAGE.h-STAGE.margin-Math.ceil(a.below),p.y)))};
}

const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function travel(m){
 if(!m)return 0;
 const t=m.progress*m.duration, contact=m.contact??m.duration*.46;
 const arrive=Math.max(1,contact-35),leave=Math.min(m.duration-1,contact+Math.min(115,m.duration*.22));
 const windup=Math.min(105,arrive*.42);
 if(t<=windup)return 0;
 if(t<arrive)return ease((t-windup)/Math.max(1,arrive-windup));
 if(t<=leave)return 1;
 return 1-ease((t-leave)/Math.max(1,m.duration-leave));
}
export function actorPosition(v,id,box){
 const p=partyFormation[id],m=activeMotion(v,id);let {x,y,h}=p;
 if(m?.clip==='attack'||m?.clip==='cast'){
  const ranged=m.reach==='ranged'||m.clip==='cast',tx=ranged?Math.max(290,x-48):box.x+box.w+25,ty=ranged?y:Math.min(346,box.y+box.h+5);
  const f=travel(m);x+=(tx-x)*f;y+=(ty-y)*f;
 }else if(m?.clip==='hit')x+=Math.sin(m.progress*12)*3*(1-m.progress);
 return safePosition(id,{x,y,h});
}

// R17: target candidates are derived from legal engine commands, not canvas hit boxes.
export function targetSpec(session,actor,skill){
 const cs=session.legal(actor).filter(c=>c.skill===skill),s=session.state,k=s.catalog[skill];
 if(!cs.length||!k)return null;
 const ids=[...new Set(cs.filter(c=>c.target?.mode==='actor').map(c=>c.target.id))];
 if(ids.length)return {mode:'single',ids};
 if(!cs.some(c=>c.target===null))return null;
 if(k.target?.endsWith('_all')){
  const side=k.target.startsWith('enemy')?s.enemies:s.front;
  return {mode:'all',ids:side.filter(id=>s.actors[id].vitals.hp>0)};
 }
 return {mode:'none',ids:[]};
}
export function enemyLayout(v,bounds){
 const ids=v.enemies??[v.enemy];
 if(ids.length===1)return {[ids[0]]:bounds[v.enemy]};
 return Object.fromEntries(ids.map((id,i)=>[id,{x:16+(i%2)*86,y:115+i*91,w:128,h:80}]));
}
export function targetBox(id,boxes,formation=partyFormation){
 if(boxes[id])return boxes[id];
 const p=formation[id];return p?visibleBounds(id,p,true):null;
}
export function targetCursor(b){return {x:Math.max(17,Math.min(463,b.x+b.w*.5)),y:Math.max(17,b.y-5)}}

// R18: first tap selects; a second tap on the same target within the window confirms.
// Selection persists after the window expires; a different target never confirms.
export const DOUBLE_TAP_MS=450;
export function tapTarget(choice,id,now){
 if(!choice||!choice.spec.ids.includes(id)||!Number.isFinite(now))return {choice,confirm:false};
 const same=choice.target===id,elapsed=now-(choice.lastTap??-Infinity);
 if(same&&elapsed>=0&&elapsed<=DOUBLE_TAP_MS)return {choice,confirm:true,target:choice.spec.mode==='all'?null:id};
 return {choice:{...choice,target:id,lastTap:now},confirm:false};
}
