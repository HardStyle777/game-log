'use strict';
const $=id=>document.getElementById(id),g=$('scene').getContext('2d'),duration=SwordSkills.active.break.cast,total=duration+.7;
let time=0,last=null,playing=false,background=null,cycle=0;
const offset={x:160,y:14},point=BreakSlash.contact(offset),enemyX=point[0]+8,enemyY=374;
let ready=false;SwordArt.load('assets/diagonal-slash.webp').then(sprite=>{BreakSlash.setSprite(sprite);ready=true;}).catch(()=>{$('phase').textContent='剣士の素材を読み込めませんでした。再読み込みしてください。';});
const bg=new Image();bg.onload=()=>background=bg;bg.src='assets/forest.webp';
function pause(){playing=false;$('play').textContent='再生';last=null;}
function seek(p){pause();time=p*duration;$('frame').value=p*1000;}
$('play').onclick=()=>{playing=!playing;if(time>=total)time=0;$('play').textContent=playing?'一時停止':'再生';last=null;};
$('restart').onclick=()=>{time=0;cycle++;last=null;};
$('frame').oninput=()=>seek(Number($('frame').value)/1000);
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>seek(Number(b.dataset.p)));
$('sound').onchange=async()=>{if(!await SkillAudio.enable($('sound').checked)){$('sound').checked=false;$('phase').textContent='効果音を有効にできませんでした';}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function target(age){const q=age>=0&&age<.28?Math.sin(Math.PI*age/.28):0;g.save();g.translate(enemyX+q*14,enemyY);g.rotate(q*.12);g.fillStyle='#07131c80';g.beginPath();g.ellipse(0,8,40,9,0,0,7);g.fill();const grad=g.createRadialGradient(-12,-49,2,0,-25,62);grad.addColorStop(0,age>=0&&age<.07?'#fff3c0':'#afac7b');grad.addColorStop(1,'#244653');g.fillStyle=grad;g.beginPath();g.moveTo(-42,0);g.bezierCurveTo(-51,-20,-30,-31,-29,-57);g.bezierCurveTo(-24,-85,-6,-83,0,-98);g.bezierCurveTo(8,-75,28,-63,30,-44);g.bezierCurveTo(36,-26,52,-14,43,0);g.quadraticCurveTo(0,16,-42,0);g.fill();g.fillStyle='#f4f0c6';g.fillRect(-14,-41,3,4);g.fillRect(11,-41,3,4);g.restore();}
function draw(now){if(!ready){requestAnimationFrame(draw);return;}const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;const before=time;
 if(playing){time+=dt*Number($('rate').value);if(time>=total){time%=total;cycle++;}if(before<duration*.32&&time>=duration*.32)SkillAudio.play('swing');if(before<duration*BreakSlash.hit&&time>=duration*BreakSlash.hit&&!$('miss').checked)SkillAudio.play('hit');}
 const p=Math.min(1,time/duration),age=$('miss').checked?-1:time-duration*BreakSlash.hit;
 g.fillStyle='#142931';g.fillRect(0,0,900,460);if(background)g.drawImage(background,0,0,900,460);
 g.save();g.translate(offset.x,offset.y);BreakSlash.draw(g,p,{effects:$('effects').checked});g.restore();target(age);
 if($('effects').checked&&!$('miss').checked)SkillFX.impact(g,'break',point[0],point[1],age);
 $('phase').textContent=BreakSlash.phase(p)+' · '+Math.min(time,duration).toFixed(3)+'秒'+(time>=duration?' · 余韻':'');$('frame').value=Math.round(p*1000);
 requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
