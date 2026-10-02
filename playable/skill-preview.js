'use strict';
const g=document.getElementById('scene').getContext('2d'),clip=document.getElementById('clip'),slider=document.getElementById('frame'),btn=document.getElementById('play'),rate=document.getElementById('rate'),fxToggle=document.getElementById('fxToggle'),phaseLabel=document.getElementById('phase');
let motion,support,background,playing=true,time=0,last=null,cycle=0;
const requestedSkill=new URLSearchParams(location.search).get('skill');if(SwordSkills.active[requestedSkill])clip.value=requestedSkill;
const chain=['flame','frost','thunder'];
function timeline(){let start=0;return (clip.value==='chain'?chain:[clip.value]).map(id=>{const d=SkillFX.definitions[id],spec=SwordSkills.active[id],duration=spec?.cast||d?.duration||1.5;const item={id,start,duration,hit:d?start+d.hit*duration:spec?.mult?start+duration*(spec.hitFractions?.[0]??.7):null};start+=duration;return item;});}
function restart(){document.getElementById("skillDescription").textContent=SwordSkills.active[clip.value]?.desc||"連携・動作の確認";time=0;cycle++;motion?.reset();document.querySelectorAll('[data-skill]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skill===clip.value)));}
Promise.all([SwordArt.load('../restored/connected-combo.webp'),SwordArt.load('../restored/skill-motion-set.webp'),SwordArt.load('assets/diagonal-slash.webp'),SwordArt.load('assets/support.webp')]).then(([a,b,c,d])=>{support=SwordSupport.create(g,d);motion=HeroMotion.create(g,{combo:SwordArt.combo(g,a),other:SwordArt.other(g,b),basic:DiagonalSlash.create(g,c),support});phaseLabel.textContent='再生できます';}).catch(()=>{playing=false;phaseLabel.textContent='素材を読み込めませんでした。再読み込みしてください。';});
const bg=new Image();bg.onload=()=>background=bg;bg.src='assets/forest.webp';
btn.onclick=()=>{playing=!playing;btn.textContent=playing?'一時停止':'再生';};
slider.oninput=()=>{playing=false;time=+slider.value/1000;motion?.reset();btn.textContent='再生';};
clip.onchange=restart;
document.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{clip.value=b.dataset.skill;restart();playing=true;btn.textContent='一時停止';});
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const list=timeline(),item=list[0],total=list.at(-1).start+list.at(-1).duration+.7;const at=b.dataset.stage==='prepare'?0:item.hit??item.duration*.4;time=(at+(b.dataset.stage==='impact'?.04:0))/total;playing=false;motion?.reset();btn.textContent='再生';});
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;btn.textContent='再生';}last=null;});
function target(x,y,age){g.save();g.translate(x+(age>=0&&age<.18?Math.sin(age/.18*Math.PI)*9:0),y);g.fillStyle='#070d1e66';g.beginPath();g.ellipse(0,0,33,9,0,0,7);g.fill();g.strokeStyle='#617b91';g.lineWidth=10;g.beginPath();g.moveTo(0,0);g.lineTo(0,-163);g.moveTo(-28,-95);g.lineTo(28,-95);g.stroke();g.fillStyle=age>=0&&age<.09?'#e2f9ff':'#344e67';g.beginPath();g.ellipse(0,-92,28,68,0,0,7);g.fill();g.strokeStyle='#b0c5d2';g.lineWidth=1;g.stroke();g.restore();}
function draw(now){const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;const list=timeline(),end=list.at(-1).start+list.at(-1).duration,total=end+.7;if(playing&&motion){time+=dt*+rate.value/total;if(time>=1){time%=1;cycle++;motion.reset();}}const clock=time*total;slider.value=Math.floor(time*1000);g.fillStyle='#142931';g.fillRect(0,0,900,460);if(background)g.drawImage(background,0,0,900,460);
if(motion){let index=list.findIndex(a=>clock<a.start+a.duration);if(index<0)index=list.length-1;const item=list[index],progress=(clock-item.start)/item.duration,showFx=fxToggle.checked;
if(SwordSkills.active[item.id]){const hits=list.filter(a=>a.hit!==null&&a.hit<=clock),age=hits.length?clock-hits.at(-1).hit:-1;target(650,374,age);}
if(['idle','walk','hurt','potion','defeat','victory'].includes(item.id)){g.save();g.translate(160,14);support(item.id,clock);g.restore();}else motion.draw({id:item.id,progress,now:clock,x:160,y:14,token:cycle+':'+index,effects:showFx});
if(showFx)for(const a of list){const def=SkillFX.definitions[a.id];if(a.hit!==null)SkillFX.impact(g,a.id,a.id==='flame'?633:650,def?.hitY||300,clock-a.hit);}
phaseLabel.textContent=clip.options[clip.selectedIndex].text+' · '+(clock>end?'余韻':item.hit===null?'動作':clock<item.hit?'予備動作':'命中・振り抜き')+' · '+clock.toFixed(2)+'秒';}
requestAnimationFrame(draw);}
restart();requestAnimationFrame(draw);
