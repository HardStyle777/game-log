import {read,claim,trade} from './adventure-r34.js';
import {MAPS,W,H,newState,restore,move,transition,interact,encounter,returnBattle,camera} from './field-model-r34.js?v=34';
import {render} from './field-art-r34.js?v=34';
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
let images={},ready=false,run=false,pointer=null,dx=0,dy=0,prev=0,anim=0,frames=0,leaving=false,keys=new Set(),lastMap='',lastSaved=0,err=null;
const keyDir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]};
function stop(){pointer=null;dx=dy=0;keys.clear();$('knob').style.transform='translate(0,0)';state={...state,moving:false}}
function stick(e){const b=$('stick').getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/(b.width*.37),y=(e.clientY-b.top-b.height/2)/(b.height*.37),m=Math.max(1,Math.hypot(x,y));dx=x/m;dy=y/m;$('knob').style.transform='translate('+Math.round(dx*b.width*.27)+'px,'+Math.round(dy*b.height*.27)+'px)'}
$('stick').onpointerdown=e=>{if(!ready||leaving||pointer!==null)return;e.preventDefault();pointer=e.pointerId;$('stick').setPointerCapture(e.pointerId);stick(e)};
$('stick').onpointermove=e=>{if(e.pointerId===pointer)stick(e)};
for(const k of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(k,e=>{if(e.pointerId===pointer)stop()});
window.addEventListener('keydown',e=>{if(keyDir[e.key]){e.preventDefault();keys.add(e.key)}else if(e.key==='Enter'&&!e.repeat)inspect()});
window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();put(KEY,state)}prev=0});
$('run').onclick=()=>{run=!run;$('run').textContent='走る：'+(run?'ON':'OFF');$('run').setAttribute('aria-pressed',String(run))};
$('talk').onclick=inspect;
function inspect(){if(!ready||leaving||$('bag').open)return;stop();const r=interact(state);state=r.state;note=r.text;if(state.map==='town'&&r.object?.id==='chest')note=claim('town-chest',50,2)?'宝箱：50Gと回復薬2個を入手。':'宝箱は空です。';if(state.map==='room_shop'&&r.object?.kind==='npc')openBag(true);put(KEY,state);updateMap()}
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
function battle(enemy){if(leaving)return;leaving=true;stop();const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);put(KEY,state);put(PENDING,{token,map:state.map,id:enemy.id});del(RESULT);location.href='./battle-r40.html?live=1&from=field&encounter='+encodeURIComponent(enemy.encounter)+'&token='+encodeURIComponent(token)}
function tick(t){if(leaving)return;try{if($('bag').open){prev=t;requestAnimationFrame(tick);return}const dt=prev?Math.min(.1,(t-prev)/1000):0;prev=t;let x=dx,y=dy;if(pointer===null){x=0;y=0;for(const k of keys){x+=keyDir[k][0];y+=keyDir[k][1]}}
 state=move(state,x,y,dt,run);if(state.moving)anim+=dt*1000;else anim=0;
 const next=transition(state);if(next!==state){state=next;note=MAPS[state.map].name+' に移動しました。';put(KEY,state);updateMap()}
 const e=encounter(state);state=e.state;if(e.enemy){battle(e.enemy);return}
 surface.fit();render(ctx,state,camera(state),t,images,anim,run);minimap();if(t-lastSaved>700){put(KEY,state);lastSaved=t}frames++;requestAnimationFrame(tick)
 }catch(e){err=String(e);$('fieldMessage').textContent='描画エラー：'+err;stop()}}
const load=(name,path)=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve([name,i]);i.onerror=()=>reject(Error(path));i.src=path});
try{images=Object.fromEntries(await Promise.all([load('leon','assets/field-atlas.png'),
 load('props',artRoot+'field-props.png'),
 load('townProps',townArt+'town-props.png'),
 ...Object.keys(MAPS).map(name=>load(name,(name==='town'?townArt:artRoot)+(name.startsWith('room_')?'room':name)+'-ground.png')),
 fetch(artRoot+'field-art.json').then(r=>{if(!r.ok)throw Error('地形素材の設定');return r.json()}).then(art=>['art',art])
 ]));ready=true;$('talk').disabled=false;updateMap();window.__field={get state(){return {...state}},get ready(){return ready},get frames(){return frames},get err(){return err},get camera(){return camera(state)}};requestAnimationFrame(tick)}catch(e){err=String(e);$('fieldMessage').textContent='読み込みエラー：'+err}

function openBag(shop=false){stop();$('bagTitle').textContent=shop?'道具屋':'所持品';$('buy').hidden=$('sell').hidden=!shop;refreshBag();$('bag').showModal()}
function refreshBag(){const s=read();$('bagGold').textContent=s.gold+' G';$('bagItems').textContent='回復薬 × '+s.potion;$('buy').disabled=s.gold<20;$('sell').disabled=s.potion<1;$('money').textContent=s.gold+' G'}
$('bagOpen').onclick=()=>openBag();$('bagClose').onclick=()=>$('bag').close();$('buy').onclick=()=>{trade(1);refreshBag()};$('sell').onclick=()=>{trade(-1);refreshBag()};$('bag').addEventListener('close',stop);
