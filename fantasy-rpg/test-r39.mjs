import * as lib from './direct-target-r39.js';
export function runTests(lib){
 let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
 function make(active){
 return {busy:false,active,selected:{},state:{phase:'planning',inventory:{potion:1},catalog:{basic:{target:'enemy_single'},double:{target:'enemy_single'},potion:{target:'ally_single'},guard:{target:'self'}},enemies:['wolf','wolf2'],front:active,actors:Object.fromEntries([...active,'wolf','wolf2'].map(id=>[id,{vitals:{hp:10}}]))},
 get complete(){return !this.busy&&this.state.phase==='planning'&&this.active.length>0&&this.active.every(id=>this.selected[id])},
 legal(id){return this.active.includes(id)?[{skill:'basic',target:{mode:'actor',id:'wolf'}},{skill:'basic',target:{mode:'actor',id:'wolf2'}},{skill:'double',target:{mode:'actor',id:'wolf'}},{skill:'guard',target:null},...this.active.map(id=>({skill:'potion',target:{mode:'actor',id}}))]:[]}}
 }
 for(const active of [['leon','fia','glen','lucia'],['leon','glen','lucia'],['fia']]){
 const s=make(active),tap=(id,prior,time,edit=null,skill='basic',target='wolf')=>lib.tapCurrentTarget(s,id,skill,prior,target,time,edit);
 let time=0;
 for(const id of active){
 ok(lib.planningInputOpen(s,id),'open before '+id);
 const first=tap(id,null,time);ok(!first.confirm&&first.choice.target==='wolf','first');
 const second=tap(id,first.choice,time+100);ok(second.confirm&&second.target==='wolf','second');
 s.selected[id]={skill:second.choice.skill,target:second.target};time+=200;
 }
 ok(s.complete,'complete');const last=active.at(-1),before=JSON.stringify(s.selected);
 ok(!lib.planningInputOpen(s,last),'locked after final');
 ok(lib.currentTargetChoice(s,last,'basic')===null,'overlay hidden');
 const stale={actor:last,skill:'basic',spec:{mode:'single',ids:['wolf','wolf2']},target:'wolf',lastTap:time-1};
 for(let n=0;n<20;n++){const r=tap(last,n%2?stale:null,time+n);ok(!r.confirm,'extra tap blocked');}
 ok(JSON.stringify(s.selected)===before,'unchanged commands');
 ok(lib.planningInputOpen(s,last,last),'explicit edit opens');
 ok(!lib.planningInputOpen(s,last,'wrong'),'wrong edit actor blocked');
 let r=tap(last,null,time+100,last,'basic','wolf2');ok(!r.confirm&&r.choice.target==='wolf2','edit first');
 r=tap(last,r.choice,time+200,last,'basic','wolf2');ok(r.confirm&&r.target==='wolf2','edit second');
 s.selected[last]={skill:r.choice.skill,target:r.target};ok(s.complete&&!lib.planningInputOpen(s,last),'lock after edit');
 s.busy=true;ok(!lib.planningInputOpen(s,last,last),'busy override');s.busy=false;s.state.phase='won';ok(!lib.planningInputOpen(s,last,last),'outcome override');s.state.phase='planning';s.selected={};ok(lib.planningInputOpen(s,active[0]),'next turn unlocked');
 }
 const s=make(['leon','fia']);s.selected.leon={skill:'potion'};ok(!lib.currentTargetChoice(s,'fia','potion'),'reserved item');
 ok(!lib.currentTargetChoice(s,'fia','guard'),'no target');
 let r=lib.tapCurrentTarget(s,'fia','basic',null,'wolf',0);ok(!lib.tapCurrentTarget(s,'fia','basic',r.choice,'wolf',451).confirm,'expired');ok(!lib.tapCurrentTarget(s,'fia','double',r.choice,'wolf',100).confirm,'changed command');
 return {version:'R39',checks,failures:0,scope:'completion lock, deliberate edit, next round, busy/outcome, party sizes 1/3/4, stale taps and existing target rules; mock session'};
}
console.log(JSON.stringify(runTests(lib),null,2));
