import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import * as engine from '../dist/engine.js';
// DOM contract harness: executes production UI handlers without a browser runtime.
function boot(saved,backup,soundPref,prefs={}){const nodes=new Map(),timers=[];const storage=new Map();if(saved!==undefined&&saved!==null)storage.set('lumina-save-v1',typeof saved==='string'?saved:JSON.stringify(saved));if(backup!==undefined&&backup!==null)storage.set('lumina-save-v1-backup',typeof backup==='string'?backup:JSON.stringify(backup));if(soundPref)storage.set('lumina-sound-v1',soundPref);for(const[k,v]of Object.entries(prefs))storage.set(k,v);
class Element{constructor(tag='DIV',attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.dataset={};this.children=[];this.style={};this.listeners={};this.className='';this.classList={add:()=>{},remove:()=>{}};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.id=attrs.id;if(this.id)nodes.set(this.id,this);}set innerHTML(html){this.html=html;for(const c of this.children)if(c.id)nodes.delete(c.id);this.children=[];for(const match of html.matchAll(/<([a-zA-Z]+)\b([^>]*)>/g)){const attrs={};for(const a of match[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];if(/\bdisabled\b/.test(match[2]))attrs.disabled=true;const el=new Element(match[1],attrs);el.disabled=attrs.disabled;this.children.push(el);}}get innerHTML(){return this.html;}querySelectorAll(sel){const a=sel.match(/^\[([^\]]+)\]$/)?.[1];return this.children.filter(c=>a&&Object.hasOwn(c.attrs,a));}addEventListener(event,fn){this.listeners[event]=fn;}setPointerCapture(){}click(){if(!this.disabled)this.onclick?.({target:this,preventDefault(){}});}getContext(){return new Proxy({},{get:(_,k)=>()=>{}});}getBoundingClientRect(){return {width:390,height:390};}}
const doc=new Element();doc.innerHTML=fs.readFileSync('dist/index.html','utf8');doc.getElementById=id=>nodes.get(id);doc.hidden=false;doc.createElement=tag=>new Element(tag);doc.querySelectorAll=Element.prototype.querySelectorAll.bind(doc);const noop=()=>{};
class FakeAudio{constructor(src){this.src=src;}play(){return Promise.resolve();}pause(){}}
const context={...engine,document:doc,window:{addEventListener:noop},navigator:{},Image:class{constructor(){this.complete=false;}},Audio:FakeAudio,localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,val)=>storage.set(key,val)},setTimeout:(fn)=>{timers.push(fn);return 1;},clearTimeout:noop,setInterval:()=>1,clearInterval:noop,console,Date,Math,JSON,Number,Object,Array,URL,Blob};vm.createContext(context);const code=fs.readFileSync('dist/game.js','utf8').replace(/^import[^\n]+\n/,'');vm.runInContext(code,context);return {nodes,scene:()=>nodes.get('scene'),read:()=>JSON.parse(storage.get('lumina-save-v1')),backup:()=>storage.get('lumina-save-v1-backup'),stored:key=>storage.get(key),click:id=>{assert.ok(nodes.get(id),id+' exists');nodes.get(id).click();},data:(key)=>nodes.get('scene').querySelectorAll('['+key+']'),flush:()=>{while(timers.length)timers.shift()();},context};}
test('new game starter, menu, codex, bag and map render using actual UI handlers',()=>{const ui=boot();assert.equal(ui.data('data-starter').length,3);ui.data('data-starter')[0].click();assert.ok(engine.validState(ui.read().state));ui.click('menu');assert.ok(ui.scene().innerHTML.includes('セーブを書き出す'));ui.click('closeModal');ui.click('dexBtn');assert.equal(ui.data('data-dex').length,16);ui.click('closeModal');ui.click('partyBtn');assert.equal(ui.data('data-lead').length,1);ui.click('closeModal');ui.click('bagBtn');assert.ok(ui.scene().innerHTML.includes('捕獲クリスタル'));ui.click('closeModal');ui.click('mapBtn');assert.equal(ui.data('data-travel').length,4);assert.ok(ui.data('data-travel')[1].disabled);});
test('healer and shop transactions, persistence and reload',()=>{const s=engine.makeState();s.x=7;s.y=8;s.party[0].hp=1;let ui=boot({state:s,battle:null});ui.click('interact');assert.equal(ui.read().state.party[0].hp,engine.maxHP(s.party[0]));const saved=ui.read();saved.state.x=10;saved.state.y=8;ui=boot(saved);ui.click('interact');ui.click('buyBalls');assert.equal(ui.read().state.coins,50);assert.equal(ui.read().state.balls,17);assert.ok(engine.validState(ui.read().state));const ui2=boot(ui.read());assert.equal(ui2.read().state.balls,17);});
test('actual battle handlers resume save, attack, victory and ending return',()=>{const s=engine.makeState();s.party=[engine.createMonster(4,35),engine.createMonster(6,35)];s.badges=[0,1,2,3];const b=engine.encounter(s,3,true,true);let ui=boot({state:s,battle:b});let turns=0;while(!ui.read().battle.result&&turns++<40){ui.data('data-action').find(x=>x.dataset.action==='attack').click();ui.flush();}assert.equal(ui.read().battle.result,'win');assert.equal(ui.read().state.ended,true);ui.click('endBattle');assert.ok(ui.scene().innerHTML.includes('ルミナ島に光が戻った'));ui.click('postgame');assert.equal(ui.scene().className,'scene');assert.equal(ui.read().battle,null);});
test('party switch does not let a battle escape through closing a modal',()=>{const s=engine.makeState();s.party.push(engine.createMonster(2,5));const b=engine.encounter(s,0);const ui=boot({state:s,battle:b});ui.click('battleSwitch');ui.click('closeModal');assert.ok(ui.scene().innerHTML.includes('battle-actions'));ui.click('battleSwitch');ui.data('data-switch')[1].click();ui.flush();assert.equal(ui.read().battle.active,1);assert.equal(ui.read().battle.turn,1);});
test('corrupt current save restores backup and repairs current without overwriting backup',()=>{const s=engine.makeState(2);s.coins=777;const backup=JSON.stringify({state:s,battle:null});const ui=boot('{broken-json',backup);assert.equal(ui.read().state.coins,777);assert.equal(ui.read().state.party[0].id,2);assert.equal(ui.backup(),backup);});
test('sound preference survives reload and a direct tap unlocks playback',async()=>{const ui=boot(null,null,'on');assert.equal(ui.nodes.get('sound').textContent,'音 再開');ui.click('sound');assert.equal(ui.stored('lumina-sound-v1'),'off');ui.click('sound');assert.equal(ui.stored('lumina-sound-v1'),'on');await Promise.resolve();assert.equal(ui.nodes.get('sound').textContent,'音 ON');});
test('each guardian presents its own tactical dialogue before battle',()=>{for(let r=0;r<4;r++){const s=engine.makeState();s.badges=Array.from({length:r},(_,i)=>i);s.x=[13,39,14,39][r];s.y=[8,14,28,30][r];s.region=r;const ui=boot({state:s,battle:null});ui.click('interact');assert.ok(ui.scene().innerHTML.includes(engine.REGIONS[r].challenge),`guardian ${r}`);assert.ok(ui.nodes.get('challenge'));}});
test('canvas swipe moves exactly one tile using production pointer handlers',()=>{const s=engine.makeState();s.x=8;s.y=10;const ui=boot({state:s,battle:null}),canvas=ui.nodes.get('world');canvas.listeners.pointerdown({pointerId:7,clientX:80,clientY:100});canvas.listeners.pointerup({pointerId:7,clientX:140,clientY:102,preventDefault(){}});assert.equal(ui.read().state.x,9);assert.equal(ui.read().state.y,10);assert.equal(ui.read().state.steps,1);});
test('all four movement directions face correctly, including blocked moves and reload',()=>{
 for(const [dx,dy,dir] of [[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]]){
  const s=engine.makeState();s.x=8;s.y=10;const ui=boot({state:s,battle:null});vm.runInContext(`move(${dx},${dy})`,ui.context);
  assert.equal(ui.read().state.dir,dir);assert.equal(vm.runInContext('state.dir',boot(ui.read()).context),dir);
 }
 const s=engine.makeState();s.x=7;s.y=8;const ui=boot({state:s,battle:null});vm.runInContext('move(0,-1)',ui.context);
 assert.equal(ui.read().state.y,8);assert.equal(ui.read().state.steps,0);assert.equal(ui.read().state.dir,0);
});
test('stick rotates while held, ignores a second pointer, and stops on release',()=>{
 const s=engine.makeState();s.x=8;s.y=10;const ui=boot({state:s,battle:null}),stick=ui.nodes.get('joystick');
 stick.getBoundingClientRect=()=>({left:0,top:0,width:136,height:136});
 const event=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,preventDefault(){}});
 stick.listeners.pointerdown(event(1,120,68));assert.equal(ui.read().state.x,9);
 stick.listeners.pointermove(event(2,68,120));assert.equal(vm.runInContext('stickDir[0]',ui.context),1);
 stick.listeners.pointermove(event(1,68,120));vm.runInContext('movedAt=0;tickStick()',ui.context);
 assert.equal(ui.read().state.x,9);assert.equal(ui.read().state.y,11);
 stick.listeners.pointerup(event(1,68,120));vm.runInContext('movedAt=0;tickStick()',ui.context);
 assert.equal(ui.read().state.steps,2);assert.equal(ui.nodes.get('stickKnob').style.transform,'translate(0px, 0px)');
});
test('stick dead zone, pointer cancel and hidden-page handling stop movement',()=>{
 const s=engine.makeState();s.x=8;s.y=10;const ui=boot({state:s,battle:null}),stick=ui.nodes.get('joystick');
 stick.getBoundingClientRect=()=>({left:0,top:0,width:136,height:136});
 const e=(x,y)=>({pointerId:1,clientX:x,clientY:y,preventDefault(){}});
 stick.listeners.pointerdown(e(70,70));vm.runInContext('movedAt=0;tickStick()',ui.context);assert.equal(ui.read().state.steps,0);
 stick.listeners.pointermove(e(300,68));assert.match(ui.nodes.get('stickKnob').style.transform,/43\.52px/);
 stick.listeners.pointercancel(e(300,68));assert.equal(vm.runInContext('stickPointer',ui.context),null);
 stick.listeners.pointerdown(e(120,68));ui.context.document.hidden=true;ui.context.document.listeners.visibilitychange();
 assert.equal(vm.runInContext('stickPointer',ui.context),null);
});
test('zoom and controller preferences persist without changing the game save',()=>{
 const s=engine.makeState();const ui=boot({state:s,battle:null});
 assert.equal(ui.nodes.get('zoomBtn').textContent,'拡大 1.5×');assert.equal(ui.nodes.get('joystick').hidden,false);
 ui.click('zoomBtn');ui.click('controlMode');assert.equal(ui.stored('lumina-zoom-v1'),'1');assert.equal(ui.stored('lumina-control-v1'),'dpad');
 assert.equal(ui.nodes.get('joystick').hidden,true);assert.ok(ui.context.document.querySelectorAll('[data-dir]').every(el=>!el.hidden));
 const resumed=boot(ui.read(),null,null,{'lumina-zoom-v1':'1','lumina-control-v1':'dpad'});
 assert.equal(resumed.nodes.get('zoomBtn').textContent,'拡大 1×');assert.equal(resumed.nodes.get('joystick').hidden,true);assert.equal(resumed.read().state.party[0].id,s.party[0].id);
});
test('landscape layout defines side controls, safe areas, full-screen dialogs and cross-shaped dpad',()=>{
 const css=fs.readFileSync('dist/style.css','utf8');assert.match(css,/@media\(orientation:landscape\)/);assert.match(css,/grid-template-columns:150px minmax\(0,1fr\) 146px/);
 assert.match(css,/\.dpad \[data-dir=down\]\{[^}]*grid-row:3/);assert.match(css,/\.scene\{position:fixed/);
 assert.match(fs.readFileSync('dist/game.js','utf8'),/ctx.setTransform\(mapZoom,0,0,mapZoom,0,0\)/);
});
test('learned technique equipment and battle move selection persist via actual handlers',()=>{
 const s=engine.makeState();s.party=[engine.createMonster(0,28)];let ui=boot({state:s,battle:null});ui.click('partyBtn');ui.data('data-tech')[0].click();
 assert.equal(ui.data('data-learned').length,8);ui.data('data-learned').find(el=>el.dataset.learned==='2').click();ui.data('data-slot')[0].click();assert.equal(ui.read().state.party[0].moves[0],2);
 const saved=ui.read(),b=engine.encounter(saved.state,0);saved.state.party[0].hp-=50;ui=boot({state:saved.state,battle:b});ui.click('battleMoves');
 assert.equal(ui.data('data-move').length,4);ui.data('data-move').find(el=>el.dataset.move==='2').click();ui.flush();assert.equal(ui.read().battle.turn,1);assert.ok(ui.read().battle.log.some(x=>x.includes('芽吹きの祈り')));
 const resumed=boot(ui.read());assert.equal(resumed.read().state.party[0].moves[0],2);assert.ok(resumed.scene().innerHTML.includes('battle-actions'));
});
test('a legacy save immediately migrates move slots and preserves its backup',()=>{
 const s=engine.makeState();delete s.party[0].moves;delete s.postgame;const raw=JSON.stringify({state:s,battle:null}),ui=boot(raw,raw);
 assert.deepEqual(ui.read().state.party[0].moves,[0,1]);assert.deepEqual(ui.read().state.postgame,{medals:0,bestFloor:0,runs:0,tower:null,riftBest:0,riftRuns:0,rift:null});assert.equal(ui.backup(),raw);
});
test('cleared save enters tower, wins, banks rewards and resumes them through actual UI',()=>{
 const s=engine.makeState();s.ended=true;s.badges=[0,1,2,3];s.party=Array.from({length:6},(_,i)=>engine.createMonster(i<4?i:i+8,40));let ui=boot({state:s,battle:null});
 ui.click('menu');ui.click('towerBtn');assert.ok(ui.scene().innerHTML.includes('研究メダル'));ui.click('towerStart');assert.equal(ui.read().battle.towerFloor,1);
 let turns=0;while(!ui.read().battle.result&&turns++<80){ui.data('data-action').find(x=>x.dataset.action==='attack').click();ui.flush();}
 assert.equal(ui.read().battle.result,'win');ui.click('endBattle');assert.ok(ui.scene().innerHTML.includes('未確定 2枚'));ui.click('towerRetire');
 assert.equal(ui.read().state.postgame.medals,2);assert.equal(ui.read().state.postgame.runs,1);assert.equal(ui.read().state.postgame.tower,null);
 ui=boot(ui.read());ui.click('menu');ui.click('towerBtn');assert.ok(ui.scene().innerHTML.includes('研究メダル 2枚'));
});
test('party shows individual traits and tower research trains the lead through actual UI',()=>{
 const s=engine.makeState();s.ended=true;s.badges=[0,1,2,3];s.postgame.medals=10;s.party[0].aptitudes={vitality:0,force:2};s.party[0].hp=engine.maxHP(s.party[0]);let ui=boot({state:s,battle:null});
 ui.click('partyBtn');assert.ok(ui.scene().innerHTML.includes('個性：勇猛'));assert.ok(ui.scene().innerHTML.includes('生命 ◇◇◇'));
 ui.click('closeModal');ui.click('menu');ui.click('towerBtn');ui.click('researchTrain');assert.equal(ui.read().state.party[0].aptitudes.vitality,1);assert.equal(ui.read().state.postgame.medals,0);assert.ok(ui.scene().innerHTML.includes('生命か力の低い方を強化'));
});
test('cleared save explores a seeded rift, resumes after battle and banks rewards via UI',()=>{
 const s=engine.makeState();s.seed=321;s.ended=true;s.badges=[0,1,2,3];s.party=Array.from({length:6},(_,i)=>engine.createMonster(i<4?i:i+8,40));let ui=boot({state:s,battle:null});
 ui.click('menu');ui.click('riftBtn');assert.ok(ui.scene().innerHTML.includes('5〜15層'));ui.click('riftStart');assert.ok(ui.scene().innerHTML.includes('揺らぐ獣道'));ui.click('riftBattle');assert.equal(ui.read().battle.riftFloor,1);
 let turns=0;while(!ui.read().battle.result&&turns++<80){ui.data('data-action').find(x=>x.dataset.action==='attack').click();ui.flush();}
 assert.equal(ui.read().battle.result,'win');ui.click('endBattle');assert.ok(ui.scene().innerHTML.includes('未確定'));ui.click('riftRetire');
 assert.equal(ui.read().state.postgame.rift,null);assert.equal(ui.read().state.postgame.riftRuns,1);assert.ok(ui.read().state.postgame.medals>=2);
 ui=boot(ui.read());ui.click('menu');ui.click('riftBtn');assert.ok(ui.scene().innerHTML.includes('帰還 1回'));
});
