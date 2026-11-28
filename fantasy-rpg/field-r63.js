import {read,claim,trade} from './adventure-r34.js';
import {MAPS,W,H,newState,restore,move,transition,interact,encounter,returnBattle,camera} from './field-model-r34.js?v=34';
import {render} from './field-art-r52.js?v=52';
import {fieldActor,nextFieldActor,fieldFrame,motionClock} from './field-actor-r52.js?v=52';
import {appearance,readAppearance,saveAppearance,equippedImage} from './fia-gear-r63.js?v=63.1';
import {character,normalBattleFrame,drawPreview,slotIds} from './character-visual-r52.js?v=52';
import * as leonGearApi from './leon-gear-r62.js?v=62';
import {appearanceSources,configureBattleMeta,buildBattleAppearance} from './battle-appearance-r63.js?v=63.1';
import {availableModes,poseSelection,labels as poseLabels} from './pose-preview-r55.js?v=55';
import {loopFrame} from './victory-loop-r58.js?v=58';
import {createPreviewCache,timedClipFrame,explorationFrame} from './appearance-preview-r61.js?v=61';
import {createPixelSurface} from './battle-surface.js?v=27';
const $=id=>document.getElementById(id),cv=$('map'),ctx=cv.getContext('2d'),mini=$('mini').getContext('2d');
const surface=createPixelSurface(cv,ctx,{w:W,h:H}),artRoot='assets/r27/',townArt='assets/r30/';
const KEY='fantasy-field-r19',RESULT='fantasy-field-result',PENDING='fantasy-field-pending';
function get(k){try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch{return null}}
function put(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch{}}
function del(k){try{sessionStorage.removeItem(k)}catch{}}
let state=restore(get(KEY)),pending=get(PENDING),result=get(RESULT),note='スティックを倒して移動。近くで「調べる」。';
if(pending&&result&&pending.token===result.token&&pending.map===state.map){state=returnBattle(state,result.outcome,pending.id);note=result.outcome==='win'?'勝利。探索を続けられます。':result.outcome==='loss'?'探索試験に復帰しました。':'戦闘試験を終了しました。';}
del(PENDING);del(RESULT);put(KEY,state);
const ACTOR_KEY='fantasy-field-preview-actor-r42';let actor=fieldActor(get(ACTOR_KEY));
function updateActor(){ $('fieldActor').textContent='操作表示：'+character(actor).name; $('gearOpen').textContent=character(actor).name+'外観'; }
$('fieldActor').onclick=()=>{if(!ready||leaving)return;stop();actor=nextFieldActor(actor);put(ACTOR_KEY,actor);updateActor()};
let gear=readAppearance(sessionStorage),leonGear=leonGearApi.readAppearance(sessionStorage),gearActor='fia',previewMode='normal',previewIndex=null,previewCache=createPreviewCache(),originalFia=null,originalLeon=null,images={},ready=false,run=false,pointer=null,dx=0,dy=0,prev=0,anim=0,idleAnim=0,motionState=null,frames=0,leaving=false,keys=new Set(),lastMap='',lastSaved=0,err=null;
const keyDir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]};
function stop(){pointer=null;dx=dy=0;keys.clear();$('knob').style.transform='translate(0,0)';state={...state,moving:false};motionState=null;anim=idleAnim=0}
function stick(e){const b=$('stick').getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/(b.width*.37),y=(e.clientY-b.top-b.height/2)/(b.height*.37),m=Math.max(1,Math.hypot(x,y));dx=x/m;dy=y/m;$('knob').style.transform='translate('+Math.round(dx*b.width*.27)+'px,'+Math.round(dy*b.height*.27)+'px)'}
$('stick').onpointerdown=e=>{if(!ready||leaving||pointer!==null||$('gear').open||$('bag').open)return;e.preventDefault();pointer=e.pointerId;$('stick').setPointerCapture(e.pointerId);stick(e)};
$('stick').onpointermove=e=>{if(e.pointerId===pointer)stick(e)};
for(const k of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(k,e=>{if(e.pointerId===pointer)stop()});
window.addEventListener('keydown',e=>{if($('gear').open||$('bag').open)return;if(keyDir[e.key]){e.preventDefault();keys.add(e.key)}else if(e.key==='Enter'&&!e.repeat)inspect()});
window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();put(KEY,state)}prev=0});
$('run').onclick=()=>{run=!run;$('run').textContent='走る：'+(run?'ON':'OFF');$('run').setAttribute('aria-pressed',String(run))};
$('talk').onclick=inspect;
function inspect(){if(!ready||leaving||$('bag').open||$('gear').open)return;stop();const r=interact(state);state=r.state;note=r.text;if(state.map==='town'&&r.object?.id==='chest')note=claim('town-chest',50,2)?'宝箱：50Gと回復薬2個を入手。':'宝箱は空です。';if(state.map==='room_shop'&&r.object?.kind==='npc')openBag(true);put(KEY,state);updateMap()}
$('reset').onclick=()=>{if(leaving)return;stop();state=newState();del(PENDING);del(RESULT);note='初期位置に戻りました。';put(KEY,state);updateMap()};
function updateMap(){$('money').textContent=read().gold+' G';if(lastMap!==state.map){lastMap=state.map;$('mapName').textContent=MAPS[state.map].name;$('quest').textContent=state.map==='town'?'南の門から草原へ':state.map==='meadow'?'敵シンボルに接触すると戦闘へ':'南の扉から村へ戻る'}$('fieldMessage').textContent=note}
function minimap(){
 const m=MAPS[state.map],w=84,h=72,k=Math.min(w/m.w,h/m.h),ox=(w-m.w*k)/2,oy=(h-m.h*k)/2;
 mini.fillStyle='#1b2b27';mini.fillRect(0,0,w,h);
 mini.imageSmoothingEnabled=true;mini.drawImage(images[state.map],ox,oy,m.w*k,m.h*k);
 for(const b of m.buildings){
  mini.fillStyle=b.id==='hall'?'#4c9ba7':b.roof==='blue'?'#376aac':'#bd6a82';
  mini.fillRect(ox+b.x*k,oy+b.y*k,b.w*k,b.h*k)
 }
 for(const exit of m.exits){
  mini.fillStyle='#e0c389';mini.fillRect(ox+(exit.x+exit.w/2)*k-2,oy+(exit.y+exit.h/2)*k-1,4,2)
 }
 for(const o of m.objects)if(o.kind==='enemy'&&!state.cleared.includes(o.id)){
  mini.fillStyle='#ec9b7c';mini.fillRect(ox+o.x*k-1,oy+o.y*k-1,3,3)
 }
 const x=ox+state.x*k,y=oy+state.y*k;
 mini.fillStyle='#303331';mini.fillRect(x-2,y-2,5,5);
 mini.fillStyle='#fff2ac';mini.fillRect(x-1,y-1,3,3)
}
function battle(enemy){if(leaving)return;leaving=true;stop();const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);put(KEY,state);put(PENDING,{token,map:state.map,id:enemy.id});del(RESULT);location.href='./battle-r63.html?live=1&from=field&encounter='+encodeURIComponent(enemy.encounter)+'&token='+encodeURIComponent(token)}
let victoryPreviewStart=null,previewMotion=null,explorePreviewStart=0,lastBattlePreview='',lastFieldPreview='';
function tick(t){if(leaving)return;try{if($('bag').open||$('gear').open){if($('gear').open){try{tickPreview(t)}catch(e){stopVictoryPreview();$('gearError').textContent=String(e);previewCache.clear()}}prev=t;requestAnimationFrame(tick);return}const dt=prev?Math.min(.1,(t-prev)/1000):0;prev=t;let x=dx,y=dy;if(pointer===null){x=0;y=0;for(const k of keys){x+=keyDir[k][0];y+=keyDir[k][1]}}
 state=move(state,x,y,dt,run);
 const next=transition(state);if(next!==state){state=next;note=MAPS[state.map].name+' に移動しました。';put(KEY,state);updateMap()}
 const e=encounter(state);state=e.state;if(e.enemy){battle(e.enemy);return}
 motionState=motionClock(motionState,state,actor,run,dt*1000);anim=state.moving?motionState.elapsed:0;idleAnim=state.moving?0:motionState.elapsed;
 surface.fit();render(ctx,state,camera(state),t,images,anim,run,actor,idleAnim);minimap();if(t-lastSaved>700){put(KEY,state);lastSaved=t}frames++;requestAnimationFrame(tick)
 }catch(e){err=String(e);$('fieldMessage').textContent='描画エラー：'+err;stop()}}
const load=(name,path)=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve([name,i]);i.onerror=()=>reject(Error(path));i.src=path});
try{images=Object.fromEntries(await Promise.all([load('leon','assets/field-atlas.png'),load('leonRunSource','assets/r52/leon-run.png'),
 load('fia','assets/r42/fia-field.png'),
 load('fiaMotion','assets/r43/fia-motion.png'),
 load('fiaGear','assets/r47/fia-gear.png'),
 ...appearanceSources.map(n=>load(n,'assets/'+n+'.png')),
 fetch('assets/r26/motion.json').then(r=>{if(!r.ok)throw Error('戦闘素材設定');return r.json()}).then(m=>['battleMeta',m]),
 load('fiaWeapons','assets/r48/fia-equipment.png'),
 load('props',artRoot+'field-props.png'),
 load('townProps',townArt+'town-props.png'),
 ...Object.keys(MAPS).map(name=>load(name,(name==='town'?townArt:artRoot)+(name.startsWith('room_')?'room':name)+'-ground.png')),
 fetch(artRoot+'field-art.json').then(r=>{if(!r.ok)throw Error('地形素材の設定');return r.json()}).then(art=>['art',art])
 ]));if([images.fia,images.fiaMotion].some(i=>i.naturalWidth!==384||i.naturalHeight!==384))throw Error('フィアの素材寸法');originalFia={field:images.fia,motion:images.fiaMotion};images.battleMeta=configureBattleMeta(images.battleMeta);originalLeon={field:images.leon,battle:images['r26/leon-battle'],run:images.leonRunSource};if(originalLeon.run.naturalWidth!==384||originalLeon.run.naturalHeight!==384)throw Error('レオン走行素材寸法');applyAppearance(gear);applyLeonAppearance(leonGear);ready=true;$('gearOpen').disabled=false;$('talk').disabled=false;$('fieldActor').disabled=false;updateActor();updateMap();window.__field={get state(){return {...state}},get ready(){return ready},get frames(){return frames},get err(){return err},get camera(){return camera(state)},get actor(){return actor},get appearance(){return {...gear}},get leonAppearance(){return {...leonGear}},get frame(){return fieldFrame(state,anim,run,actor,idleAnim)}};requestAnimationFrame(tick)}catch(e){err=String(e);$('fieldMessage').textContent='読み込みエラー：'+err}

function openBag(shop=false){stop();$('bagTitle').textContent=shop?'道具屋':'所持品';$('buy').hidden=$('sell').hidden=!shop;refreshBag();$('bag').showModal()}
function refreshBag(){const s=read();$('bagGold').textContent=s.gold+' G';$('bagItems').textContent='回復薬 × '+s.potion;$('buy').disabled=s.gold<20;$('sell').disabled=s.potion<1;$('money').textContent=s.gold+' G'}
$('bagOpen').onclick=()=>openBag();$('bagClose').onclick=()=>$('bag').close();$('buy').onclick=()=>{trade(1);refreshBag()};$('sell').onclick=()=>{trade(-1);refreshBag()};$('bag').addEventListener('close',stop);

function applyAppearance(next){const g=appearance(next);const field=equippedImage(originalFia.field,'field',g,images.fiaGear,images.fiaWeapons,images['r59/fia-outfit']),motion=equippedImage(originalFia.motion,'motion',g,images.fiaGear,images.fiaWeapons,images['r59/fia-outfit']);images.fia=field;images.fiaMotion=motion;gear=g}
function applyLeonAppearance(value){
 const g=leonGearApi.appearance(value),asset=images['r53/leon-equipment'],field=leonGearApi.equippedImage(originalLeon.field,'field',g,asset,images[leonGearApi.outfitSource]);
 const runImage=leonGearApi.equippedImage(originalLeon.run,'run',g,asset,images[leonGearApi.outfitSource]),idleImage=leonGearApi.fieldMotion(field,'idle');
 images.leon=field;images.leonRun=runImage;images.leonIdle=idleImage;leonGear=g;
}
const leonControls={main:'leonMain',offhand:'leonOffhand',head:'leonHead',body:'leonBody',feet:'leonFeet',accessory:'leonAccessory'};
function draftLeon(){return leonGearApi.appearance(Object.fromEntries(slotIds.map(k=>[k,$(leonControls[k]).value])))}
const gearControls={main:'gearMain',offhand:'gearOffhand',head:'gearHead',body:'gearBody',feet:'gearFeet',accessory:'gearAccessory'};
function draftAppearance(){return appearance({...gear,...Object.fromEntries(slotIds.map(k=>[k,$(gearControls[k]).value]))})}
function stopVictoryPreview(){
 victoryPreviewStart=null;previewMotion=null;
 $('gearPlay').textContent='勝利再生';$('gearPlay').setAttribute('aria-pressed','false');
 $('gearMotionPlay').textContent='姿勢再生';$('gearMotionPlay').setAttribute('aria-pressed','false');
}
function previewBundle(){
 const id=gearActor,g=id==='fia'?draftAppearance():draftLeon(),key=id+':'+JSON.stringify(g);
 return previewCache.get(key,()=>{
  const battle=buildBattleAppearance(id,images,g);
  if(id==='fia'){const args=[g,images.fiaGear,images.fiaWeapons,images['r59/fia-outfit']];return {battle,walk:equippedImage(originalFia.field,'field',...args),motion:equippedImage(originalFia.motion,'motion',...args)}}
  const args=[g,images['r53/leon-equipment'],images[leonGearApi.outfitSource]],walk=leonGearApi.equippedImage(originalLeon.field,'field',...args);
  return {battle,walk,run:leonGearApi.equippedImage(originalLeon.run,'run',...args),idle:leonGearApi.fieldMotion(walk,'idle')};
 });
}
function paintBattlePreview(bundle,p){
 const c=$('gearBattle'),key=p.frame.x+':'+p.frame.y;
 if(lastBattlePreview!==key){drawPreview(c.getContext('2d'),bundle.battle,p.frame,c.width,c.height);lastBattlePreview=key}
 const label=(p.index+1)+' / '+p.count;if($('gearPoseCount').textContent!==label)$('gearPoseCount').textContent=label;
}
function tickPreview(t){
 const bundle=previewCache.current();if(!bundle)return;
 const mode=$('gearExploreMode').value,dir=Number($('gearExploreDir').value),f=explorationFrame(gearActor,mode,dir,t-explorePreviewStart),key=f.asset+':'+f.x+':'+f.y;
 if(lastFieldPreview!==key){const c=$('gearPreview');drawPreview(c.getContext('2d'),bundle[f.asset],f,c.width,c.height);lastFieldPreview=key}
 if(victoryPreviewStart!==null){
  const actor=images.battleMeta.actors[gearActor],elapsed=t-victoryPreviewStart;
  const p=previewMotion==='victory'?loopFrame(actor,elapsed):timedClipFrame(actor.clips[previewMotion==='normal'?'idle':previewMotion],elapsed);
  previewIndex=p.index;paintBattlePreview(bundle,p);
 }
}
function previewAppearance(){
 stopVictoryPreview();
 const bundle=previewBundle(),actor=images.battleMeta.actors[gearActor],p=poseSelection(actor,previewMode,previewIndex);previewMode=p.mode;previewIndex=p.index;
 lastBattlePreview=lastFieldPreview='';explorePreviewStart=performance.now();paintBattlePreview(bundle,p);tickPreview(explorePreviewStart);
 $('gearPose').value=p.mode;$('gearPrev').disabled=$('gearNext').disabled=p.count<=1;
 $('gearBattleMode').textContent=p.mode==='victory'?'勝利時':p.mode==='normal'?'戦闘通常時':'通常時へ戻る';$('gearBattleMode').setAttribute('aria-pressed',String(p.mode==='victory'));
}
function startPreview(mode,button){
 if(victoryPreviewStart!==null&&previewMotion===mode){previewAppearance();return}
 previewMode=mode;previewIndex=null;previewAppearance();previewMotion=mode;victoryPreviewStart=performance.now();$(button).textContent='停止';$(button).setAttribute('aria-pressed','true');
}
$('gearPlay').onclick=()=>startPreview('victory','gearPlay');
$('gearMotionPlay').onclick=()=>startPreview(previewMode,'gearMotionPlay');
$('gearBattleMode').onclick=()=>{previewMode=previewMode==='normal'?'victory':'normal';previewIndex=null;previewAppearance()};
$('gearPose').onchange=()=>{previewMode=$('gearPose').value;previewIndex=null;previewAppearance()};
$('gearPrev').onclick=()=>{previewIndex=(previewIndex??0)-1;previewAppearance()};$('gearNext').onclick=()=>{previewIndex=(previewIndex??0)+1;previewAppearance()};
for(const id of ['gearExploreDir','gearExploreMode'])$(id).onchange=()=>{lastFieldPreview='';explorePreviewStart=performance.now();tickPreview(explorePreviewStart)};
function showGearActor(id){
 const c=character(id);gearActor=id;$('gearCharacter').value=id;$('gearTitle').textContent=c.name+'・装備外観';$('gearPortrait').src=c.portrait;
 $('gearFiaSlots').hidden=id!=='fia';$('gearLeonSlots').hidden=id!=='leon';
 const select=$('gearPose');select.replaceChildren();for(const mode of availableModes(images.battleMeta.actors[id])){const o=document.createElement('option');o.value=mode;o.textContent=poseLabels[mode];select.append(o)}previewIndex=null;
 $('gearNote').textContent=id==='fia'?'外観確認専用。能力・所持品は変化しません。月牙短剣は左右別に選択できます。露出刃を交換し、交差・倒れ姿勢は材質を変更します。探索は納刀表示。肩・脛装甲に加え、レンジャーコート・ロングブーツを選択できます。':'外観確認専用。6部位を選択できます。蒼玉の刃に加え、蒼王剣は刀身と露出した鍔を交換します（探索では納刀扱い）。王騎士の重装鎧と鋼のサバトンは通常・勝利・探索に反映。サークレットと胸飾りは正面・側面に表示。';
 previewAppearance();
}
$('gearOpen').onclick=()=>{if(!ready||leaving||$('bag').open)return;stop();previewMode='normal';previewIndex=null;previewCache.clear();$('gearExploreMode').value='idle';$('gearExploreDir').value='0';for(const k of slotIds)$(gearControls[k]).value=gear[k];for(const k of slotIds)$(leonControls[k]).value=leonGear[k];showGearActor(actor);$('gear').showModal()};
$('gearCharacter').onchange=()=>showGearActor($('gearCharacter').value);
for(const id of [...Object.values(gearControls),...Object.values(leonControls)])$(id).onchange=()=>{try{previewAppearance();$('gearError').textContent=''}catch(e){stopVictoryPreview();previewCache.clear();$('gearError').textContent=String(e)}};
$('gearApply').onclick=()=>{try{
 const bundle=previewBundle();
 if(gearActor==='fia'){const next=draftAppearance();saveAppearance(sessionStorage,next);images.fia=bundle.walk;images.fiaMotion=bundle.motion;gear=next}
 else{const next=draftLeon();leonGearApi.saveAppearance(sessionStorage,next);images.leon=bundle.walk;images.leonRun=bundle.run;images.leonIdle=bundle.idle;leonGear=next}
 $('gear').close();updateMap()
}catch(e){$('gearError').textContent=String(e)}};
$('gearCancel').onclick=()=>$('gear').close();
$('gear').addEventListener('close',()=>{stop();$('gearError').textContent='';stopVictoryPreview();previewCache.clear();lastFieldPreview=lastBattlePreview='';prev=0});
