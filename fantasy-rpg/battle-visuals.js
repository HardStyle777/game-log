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
