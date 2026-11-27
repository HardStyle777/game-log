import {PARTY,NAMES,PartySession,makePartyConfig} from './party-session.js?v=22';
import {activeMotion,enemyOpacity,impactLabel,impactAnchor,plannedLabel,battleMessage,partyFormation,actorPosition,targetSpec,enemyLayout,targetBox,targetCursor,tapTarget,STAGE,visibleBounds} from './battle-visuals.js?v=24';
import {atlasPose,leonPose,motionScale} from './party-motion.js?v=23';
const $=id=>document.getElementById(id), c=$('field'),ctx=c.getContext('2d'), W=STAGE.w,H=STAGE.h;
const artIds={leon:'leon',fia:'fia',glen:'glen',lucia:'eris'};
// Same world-space coordinates for both encounters; no shrinking allies for boss.
export const formation=partyFormation;
export const enemyBounds={wolf:{x:12,y:172,w:156,h:98},boss:{x:10,y:79,w:252,h:258}};
const loadImage=n=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error(n));i.src='assets/'+n+'.png'});
let activeCommand='basic', lastUi='', pendingChoice=null, speed=1, fieldChoice=null, targetLayoutKey='';

const params=new URLSearchParams(location.search),multiTest=params.get('test')==='multi',fromField=params.get('from')==='field',initialEnemy=params.get('encounter')==='boss'?'boss':'wolf';
let assets={},meta,partyMeta,session=null,live=false,encounter=initialEnemy,selected='leon',clock=0,previous=0,preview=null,hoverTarget=false,err=null,frames=0;
const imgNames=['meadow','wolf','boss','r24/leon-battle','r22/fia-r22','r22/glen-r22','r22/eris-r22'];
const demoStats=[[482,96],[398,152],[540,84],[376,198]];
const sample=()=>({vitals:{...Object.fromEntries(PARTY.map((id,i)=>[id,{hp:demoStats[i][0],hpMax:demoStats[i][0],mp:demoStats[i][1],mpMax:demoStats[i][1],spCenti:10000}])),wolf:{hp:700,hpMax:700},boss:{hp:3200,hpMax:3200}},round:1,clock,motion:preview?{[preview.id]:preview}: {},impacts:[],selected:{},active:[...PARTY],busy:!!preview,enemy:encounter,complete:false,inventory:{potion:4},outcome:null});
const getView=()=>session?session.view():sample();
const commandFor=s=>({basic:'basic',guard:'guard',potion:'potion',spell:'skill',blade:'tech',double:'tech',heavy:'tech'})[s];
for(const id of PARTY){const b=document.createElement('button');b.className='gold member';b.id='member-'+id;b.setAttribute('aria-pressed','false');b.innerHTML='<img class="portrait" alt="" src="assets/'+artIds[id]+'-portrait.png"><span class="stat"><span class="name"><span>'+NAMES[id]+'</span><span class="lv">Lv.<span class="level">34</span></span></span>'+['hp','mp','sp'].map(k=>'<span class="rowstat"><strong>'+k.toUpperCase()+'</strong><span class="meter"><span class="val" data-val="'+k+'"></span><span class="bar '+k+'"><i data-bar="'+k+'"></i></span></span></span>').join('')+'</span>';b.onclick=()=>{if(fieldChoice&&fieldChoice.spec.ids.includes(id)){chooseFieldTarget(id);return}if(!getView().busy&&(!live||session.active.includes(id))){closeChoice();selected=id;activeCommand=commandFor(session?.selected[id]?.skill)??'basic';update(getView(),true)}};$('party').append(b)}
function shadow(x,y,w,h=4){ctx.fillStyle='#1c351d88';ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,2*Math.PI);ctx.fill()}
function partyPose(v,id){return id==='leon'?leonPose(v,meta):atlasPose(v,id,partyMeta)}
function drawParty(v,id,x,y){
 const pose=partyPose(v,id),f=pose.frame,isLeon=id==='leon';
 const im=assets[isLeon?'r24/leon-battle':'r22/'+pose.file],anchor=(isLeon?meta:partyMeta).anchor;
 ctx.drawImage(im,f.x,f.y,f.w,f.h,Math.round(x-anchor[0]*motionScale),Math.round(y-anchor[1]*motionScale),Math.round(f.w*motionScale),Math.round(f.h*motionScale));
}
function roleEffect(v,id,p,m){
 if(!m||!['attack','cast'].includes(m.clip))return;
 const t=m.progress*m.duration,delta=t-(m.contact??m.duration*.5);
 if(delta< -35||delta>175)return;
 const alpha=Math.max(0,1-Math.max(0,delta)/175);ctx.save();ctx.globalAlpha=alpha;
 if(m.clip==='attack'&&id==='leon'){
  ctx.strokeStyle='#f0f7ed';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-29,p.y-57);
  ctx.quadraticCurveTo(p.x-61,p.y-43,p.x-49,p.y-25);ctx.stroke();
  ctx.strokeStyle='#81a9c3';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-33,p.y-59);
  ctx.quadraticCurveTo(p.x-62,p.y-44,p.x-53,p.y-25);ctx.stroke();
 }else if(m.clip==='attack'&&id==='glen'){
  ctx.strokeStyle='#eff7ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-48,p.y-17);ctx.quadraticCurveTo(p.x-65,p.y-37,p.x-33,p.y-49);ctx.stroke();
  ctx.strokeStyle='#81bde8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-52,p.y-14);ctx.quadraticCurveTo(p.x-70,p.y-39,p.x-32,p.y-53);ctx.stroke();
 }else{
  const colors=id==='lucia'?['#e8d6ff','#a896ff']:['#fff3b2','#e5c66f'];const q=Math.max(0,Math.min(1,(delta+35)/210)),x=p.x-32,y=p.y-42;
  ctx.fillStyle=colors[0];for(let i=0;i<5;i++){const a=i*Math.PI*2/5+q*1.8,r=5+q*14,xx=Math.round(x+Math.cos(a)*r),yy=Math.round(y+Math.sin(a)*r);ctx.fillRect(xx-1,yy-3,2,6);ctx.fillRect(xx-3,yy-1,6,2)}
  ctx.fillStyle=colors[1];ctx.fillRect(x-2,y-2,4,4);
 }
 ctx.restore();
}

function delta(v,id){const m=activeMotion(v,id);return m?.clip==='attack'?Math.sin(m.progress*Math.PI):0}
function draw(v){
 ctx.imageSmoothingEnabled=false;const bg=assets.meadow,cut=Math.round(bg.height*94/224),crop=Math.round(bg.height*13/224),top=STAGE.ground;ctx.drawImage(bg,0,crop,bg.width,cut-crop,0,0,W,top);ctx.drawImage(bg,0,cut,bg.width,bg.height-cut,0,top,W,H-top);
 const boxes=enemyLayout(v,enemyBounds);
 for(const [id,box] of Object.entries(boxes)){
  const enemyX=box.x+Math.round(delta(v,id)*(id==='boss'?12:20)),opacity=enemyOpacity(v,id),em=activeMotion(v,id),shake=em?.clip==='hit'?Math.round(Math.sin(em.progress*12)*4*(1-em.progress)):0;
  if(opacity>0){ctx.save();ctx.globalAlpha=opacity;shadow(enemyX+box.w*.5,box.y+box.h-3,box.w*.38,id==='boss'?9:5);ctx.drawImage(assets[id==='boss'?'boss':'wolf'],enemyX+shake,box.y,box.w,box.h);ctx.restore()}
 }
 const positions=Object.fromEntries(PARTY.map(id=>[id,actorPosition(v,id,boxes[activeMotion(v,id)?.targets?.find(t=>boxes[t])]??boxes[v.enemy])]));
 for(const id of [...PARTY].sort((a,b)=>positions[a].y-positions[b].y)){
  const {x,y,h}=positions[id],m=activeMotion(v,id);shadow(x,y,13);
  if(v.vitals[id].hp===0&&id!=='leon'&&!m)ctx.globalAlpha=.72;
  drawParty(v,id,x,y);ctx.globalAlpha=1;roleEffect(v,id,{x,y},m);
  if(m?.clip==='guard'){ctx.save();ctx.strokeStyle='#d1eaff';ctx.globalAlpha=Math.sin(m.progress*Math.PI)*.75;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-h*.42,20,h*.45,0,0,2*Math.PI);ctx.stroke();ctx.restore()}
  if(id===selected&&!v.busy&&!fieldChoice){ctx.strokeStyle='#f8d787';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+1,18,4,0,0,2*Math.PI);ctx.stroke()}
 }
 if(fieldChoice&&!v.busy){
  for(const id of fieldChoice.spec.ids){const b=targetBox(id,boxes,positions);if(!b)continue;const chosen=fieldChoice.spec.mode==='all'?!!fieldChoice.target:fieldChoice.target===id;
   const p=targetCursor(b),cy=p.y+Math.round(Math.sin(v.clock/150)*2);ctx.save();ctx.lineWidth=2;ctx.strokeStyle=chosen?'#fff3a0':'#e1c489';ctx.fillStyle=chosen?'#f7d26e':'#192b3a';
   ctx.beginPath();ctx.moveTo(p.x-9,cy-12);ctx.lineTo(p.x+9,cy-12);ctx.lineTo(p.x,cy);ctx.closePath();ctx.fill();ctx.stroke();
   if(chosen){ctx.strokeStyle='#fff0a0';ctx.beginPath();ctx.ellipse(b.x+b.w/2,b.y+b.h-2,Math.max(15,b.w*.35),5,0,0,Math.PI*2);ctx.stroke()}ctx.restore()
  }
 }
 for(const [i,hit] of v.impacts.entries()){const p=impactAnchor(hit.target,positions,boxes[hit.target]??boxes[v.enemy]),age=v.clock-hit.time,label=impactLabel(hit),x=Math.max(45,Math.min(W-45,p.x+(i%2?11:-7))),y=Math.max(17,p.y-age/35);ctx.save();ctx.globalAlpha=Math.min(1,Math.max(0,(650-age)/180));ctx.font='bold '+label.size+'px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#142234';ctx.strokeText(label.text,x,y);ctx.fillStyle=label.color;ctx.fillText(label.text,x,y);ctx.restore()}
}


function update(v,force=false){if(live&&!v.busy&&!v.outcome&&!v.active.includes(selected))selected=v.active[0]??selected;const signature=JSON.stringify([v.vitals,v.round,v.outcome,v.busy,v.selected,v.active,v.complete,v.inventory,v.enemy,selected,activeCommand,live,fieldChoice,v.busy?v.events?.at(-1)?.seq:null]);if(!force&&signature===lastUi)return;lastUi=signature;$('turn').textContent='TURN '+v.round;c.closest('.field').dataset.encounter=v.enemy;const ids=v.enemies??[v.enemy],focus=fieldChoice?.target&&ids.includes(fieldChoice.target)?fieldChoice.target:null;const es=focus?[v.vitals[focus]]:ids.map(id=>v.vitals[id]);$('enemyName').textContent=focus?NAMES[focus]:ids.length>1?'蒼牙狼 × '+ids.length:NAMES[v.enemy];$('enemyBar').style.width=(es.reduce((s,e)=>s+e.hp,0)/es.reduce((s,e)=>s+e.hpMax,0)*100)+'%';for(const id of PARTY){const b=$('member-'+id),s=v.vitals[id];b.setAttribute('aria-pressed',String(id===selected));b.classList.toggle('planned',!!v.selected[id]);b.classList.toggle('downed',s.hp===0);b.disabled=v.busy||!!v.outcome||(live&&!v.active.includes(id));b.title=v.selected[id]?'行動選択済み':'';b.dataset.plan=plannedLabel(v.selected[id]);b.querySelector('.lv').textContent=v.selected[id]?plannedLabel(v.selected[id]):'Lv.'+(live?'5':'34');b.classList.toggle('lowhp',s.hp>0&&s.hp*100<=s.hpMax*30);for(const k of ['hp','mp','sp']){const x=k==='sp'?s.spCenti/100:s[k],max=k==='sp'?100:s[k+'Max'];b.querySelector('[data-val='+k+']').textContent=Math.floor(x)+' / '+max;b.querySelector('[data-bar='+k+']').style.width=(Math.max(0,Math.min(1,x/max))*100)+'%'}}for(const b of document.querySelectorAll('[data-action]')){const a=b.dataset.action;b.setAttribute('aria-pressed',String(a===activeCommand));b.disabled=v.busy||!!v.outcome||a==='escape';if(live&&!b.disabled){const skills=session.legal(selected).map(c=>c.skill),sk=mapAction(a);b.disabled=!skills.includes(sk)||(a==='potion'&&Object.entries(v.selected).filter(([id,c])=>id!==selected&&c.skill==='potion').length>=(v.inventory.potion??0))}}$('fieldReturn').hidden=!v.outcome;$('fieldReturn').disabled=v.busy;$('fieldReturn').textContent='マップへ戻る';$('submit').hidden=!live||v.busy||!!v.outcome;$('submit').disabled=!v.complete||!!fieldChoice;$('submit').textContent=v.complete?'行動開始':`行動開始 ${Object.keys(v.selected).length}/${v.active.length}`; $('skip').hidden=!live||!v.busy;renderFieldTargets(v);if(live)$('message').textContent=fieldChoice?fieldChoice.target?(fieldChoice.spec.mode==='all'?'全体を選択中':NAMES[fieldChoice.target]+' を選択中')+'・ダブルタップで確定':'対象をタップ／ダブルタップで確定':battleMessage(v,NAMES,selected);else $('message').textContent=preview?'実素材のモーション確認中':'4人の配置・敵のサイズ確認';}
function mapAction(a){return a==='basic'?'basic':a==='guard'?'guard':a==='potion'?'potion':a==='skill'?(selected==='lucia'?'spell':'unavailable'):a==='tech'?({leon:'blade',fia:'double',glen:'heavy',lucia:'unavailable'})[selected]:'wait'}
function startPreview(actor,action){
 closeChoice();
 const clip=action==='guard'?'guard':action==='skill'||action==='potion'?'cast':'attack';
 const fs=actor==='leon'?meta?.clips[clip]:null;
 const mark=fs?.findIndex(f=>f.contact);
 const duration=fs?.reduce((sum,f)=>sum+f.ms,0)??(clip==='guard'?590:1000);
 const contact=mark>=0?fs.slice(0,mark).reduce((sum,f)=>sum+f.ms,0):duration*.5;
 preview={id:actor,clip,duration,contact,start:clock};update(getView(),true)
}
function closeChoice(){fieldChoice=null;pendingChoice=null;if($('choice').open)$('choice').close()}
$('choiceCancel').onclick=closeChoice;$('choice').addEventListener('close',()=>{if(!$('choice').open)pendingChoice=null});
function commitChoice(actor,skill,target){try{session.select(actor,skill,target);closeChoice();selected=session.active.find(id=>!session.selected[id])??actor;activeCommand=commandFor(session.selected[selected]?.skill)??'basic';update(getView(),true)}catch(e){$('choiceInfo').textContent=e.message;$('message').textContent=e.message;$('notice').hidden=false;$('notice').textContent=e.message}}
function pickAction(action){
 const actor=selected,skill=mapAction(action),spec=targetSpec(session,actor,skill);if(!spec)return;
 closeChoice();$('notice').hidden=true;
 if(spec.mode==='none'){commitChoice(actor,skill,null);return}
 if(!spec.ids.length)return;
 fieldChoice={actor,skill,spec,target:null,lastTap:null};update(getView(),true);
}
function chooseFieldTarget(id,now=performance.now()){
 if(!fieldChoice||getView().busy)return;
 const p=fieldChoice,result=tapTarget(p,id,now);
 if(result.confirm){commitChoice(p.actor,p.skill,result.target);return}
 fieldChoice=result.choice;update(getView(),true);
}
function renderFieldTargets(v){
 const overlay=$('fieldTargets');
 overlay.hidden=!fieldChoice||v.busy;
 if(overlay.hidden){if(targetLayoutKey){overlay.replaceChildren();targetLayoutKey=''}return}
 const boxes=enemyLayout(v,enemyBounds),key=JSON.stringify([v.enemy,fieldChoice.actor,fieldChoice.skill,fieldChoice.spec,boxes]);
 // Keep the hit elements stable across the first and second tap.
 if(key!==targetLayoutKey){
  targetLayoutKey=key;overlay.replaceChildren();
  for(const id of fieldChoice.spec.ids){
   const b=targetBox(id,boxes);if(!b)continue;const el=document.createElement('button');
   el.type='button';el.className='field-target';el.dataset.target=id;el.setAttribute('aria-label',NAMES[id]+' を選択・ダブルタップで確定');
   el.style.left=(Math.max(0,b.x)/W*100)+'%';el.style.top=(Math.max(0,b.y)/H*100)+'%';el.style.width=(Math.min(W-Math.max(0,b.x),b.w+Math.min(0,b.x))/W*100)+'%';el.style.height=(Math.min(H-Math.max(0,b.y),b.h)/H*100)+'%';
   el.onclick=()=>chooseFieldTarget(id);overlay.append(el);
  }
 }
 for(const el of overlay.querySelectorAll('[data-target]'))el.setAttribute('aria-pressed',String(fieldChoice.spec.mode==='all'?!!fieldChoice.target:fieldChoice.target===el.dataset.target));
}

for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{const a=b.dataset.action;if(getView().busy||b.disabled)return;activeCommand=a;if(live){pickAction(a);update(getView(),true)}else{const actor=selected;if(a==='guard'){startPreview(actor,a);return}pendingChoice={actor,skill:a};$('choiceTitle').textContent=NAMES[actor]+' — '+(a==='potion'?'回復対象':'対象を選択');$('choiceInfo').textContent='演出確認のみ（HP・MP・SPは変化しません）';const list=$('choiceList');list.replaceChildren();for(const id of a==='potion'?PARTY:[encounter]){const b=document.createElement('button');b.dataset.target=id;b.textContent=NAMES[id];b.onclick=()=>{if(pendingChoice)startPreview(actor,a)};list.append(b)}$('choice').showModal();update(getView(),true)}};
$('submit').onclick=()=>{try{if(session?.complete&&!fieldChoice){session.submit();update(getView(),true)}}catch(e){$('notice').hidden=false;$('notice').textContent=e.message}};$('fieldReturn').onclick=()=>{const v=getView();if(v.busy)return;if(fromField){try{sessionStorage.setItem('fantasy-field-result',JSON.stringify({token:params.get('token'),outcome:v.outcome??'abort'}))}catch{}}location.href='./field.html?v=24'};$('skip').onclick=()=>{if(session?.busy){session.advance(120000);update(getView(),true)}};
let runtime=null;function switchEnemy(id){if(getView().busy)return;closeChoice();$('notice').hidden=true;activeCommand='basic';encounter=id;selected='leon';preview=null;if(live)session=new PartySession(runtime.battle,makePartyConfig(runtime.core,runtime.reference,runtime.fixture,{boss:id==='boss',multi:multiTest}),meta.clips);update(getView())}
function tick(t){try{const dt=previous?Math.min(100,t-previous):0;previous=t;clock+=dt;if(preview&&clock-preview.start>=preview.duration)preview=null;const v=session?session.advance(dt*speed):sample();draw(v);update(v);frames++;requestAnimationFrame(tick)}catch(e){err=e.message;$('message').textContent='描画エラー：'+err;console.error(e)}}
try{[meta,partyMeta,assets]=await Promise.all([fetch('assets/r23/leon-clips.json').then(r=>{if(!r.ok)throw Error('R23 Leon motion');return r.json()}),fetch('assets/r22/motion.json?v=22').then(r=>{if(!r.ok)throw Error('R22 motion');return r.json()}),Promise.all(imgNames.map(async n=>[n,await loadImage(n)])).then(Object.fromEntries)]);const requested=new URLSearchParams(location.search).get('live');const availability=await fetch('./runtime-status.json',{cache:'no-store'}).then(r=>r.ok?r.json():{live:false}).catch(()=>({live:false}));if(requested==='1'&&!availability.live)throw Error('戦闘エンジンを読み込めませんでした。ページを再読み込みしてください。');if(requested!=='0'&&availability.live){runtime=await import('./runtime.js?v=22').then(x=>x.loadRuntime());live=true;session=new PartySession(runtime.battle,makePartyConfig(runtime.core,runtime.reference,runtime.fixture,{multi:multiTest,boss:initialEnemy==='boss'}),meta.clips);$('mode').textContent='R24・実戦闘エンジン接続・仮素材／仮技能'}else $('mode').textContent='演出確認モード（戦闘計算なし）';window.__r12={get frames(){return frames},get err(){return err},get view(){return getView()},get formation(){return formation},get poses(){const v=getView();return Object.fromEntries(PARTY.map(id=>[id,partyPose(v,id)]))},get visibleBounds(){return Object.fromEntries(PARTY.map(id=>[id,visibleBounds(id,formation[id],true)]))},get fieldChoice(){return fieldChoice},get encounter(){return encounter},get live(){return live},get state(){return session?.state??null},get sequence(){return session?.seq??null}};requestAnimationFrame(tick)}catch(e){err=e.message;$('message').textContent='読み込みエラー：'+err;console.error(e)}
