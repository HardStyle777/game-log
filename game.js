const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const ui = {
  hpText: document.querySelector('#hpText'), hpBar: document.querySelector('#hpBar'),
  levelText: document.querySelector('#levelText'), xpText: document.querySelector('#xpText'),
  killsText: document.querySelector('#killsText'), message: document.querySelector('#message'),
  restart: document.querySelector('#restart'), attack: document.querySelector('#attack'),
  stickZone: document.querySelector('#stickZone'), stickKnob: document.querySelector('#stickKnob')
};

let world;
let last = performance.now();
let spawnClock = 0;
let stickPointer = null;
const input = { x: 0, y: 0 };
const TAU = Math.PI * 2;

function reset() {
  world = {
    time: 0, gameOver: false, shake: 0, flashes: [], slashes: [], enemies: [], particles: [],
    player: { x: 0, y: 0, r: 14, speed: 185, hp: 100, maxHp: 100, level: 1, xp: 0, xpNeed: 5, kills: 0, facing: 0, attackCd: 0, invuln: 0 }
  };
  spawnClock = 0;
  ui.message.classList.add('hidden');
  ui.restart.classList.add('hidden');
  resize();
  updateHud();
  for (let i = 0; i < 4; i++) spawnEnemy();
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  world.w = rect.width;
  world.h = rect.height;
  if (!world.player.x) { world.player.x = rect.width / 2; world.player.y = rect.height / 2; }
  world.player.x = clamp(world.player.x, 18, rect.width - 18);
  world.player.y = clamp(world.player.y, 18, rect.height - 18);
}

function spawnEnemy() {
  if (!world?.w) return;
  const edge = Math.floor(Math.random() * 4);
  const pad = 24;
  let x = Math.random() * world.w, y = Math.random() * world.h;
  if (edge === 0) y = -pad;
  if (edge === 1) x = world.w + pad;
  if (edge === 2) y = world.h + pad;
  if (edge === 3) x = -pad;
  const scale = 1 + world.time / 100;
  world.enemies.push({ x, y, r: 11 + Math.random() * 4, hp: Math.ceil(2 * scale), maxHp: Math.ceil(2 * scale), speed: 52 + Math.random() * 22 + world.time * .25, hit: 0 });
}

function attack() {
  const p = world.player;
  if (world.gameOver || p.attackCd > 0) return;
  p.attackCd = .32;
  world.slashes.push({ x: p.x, y: p.y, angle: p.facing, life: .18 });
  ui.attack.classList.add('active');
  setTimeout(() => ui.attack.classList.remove('active'), 90);

  for (const e of world.enemies) {
    const dx = e.x - p.x, dy = e.y - p.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    if (distance < 72 && Math.abs(angleDelta(angle, p.facing)) < 1.15) {
      e.hp -= 1 + Math.floor((p.level - 1) / 3);
      e.hit = .12;
      e.x += Math.cos(angle) * 18;
      e.y += Math.sin(angle) * 18;
      world.shake = 5;
      burst(e.x, e.y, '#ffb259', 7);
    }
  }
}

function update(dt) {
  const p = world.player;
  if (world.gameOver) return;
  world.time += dt;
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  const mag = Math.hypot(input.x, input.y);
  if (mag > .05) {
    p.facing = Math.atan2(input.y, input.x);
    p.x += input.x * p.speed * dt;
    p.y += input.y * p.speed * dt;
  }
  p.x = clamp(p.x, p.r, world.w - p.r);
  p.y = clamp(p.y, p.r, world.h - p.r);

  spawnClock -= dt;
  if (spawnClock <= 0 && world.enemies.length < 22) {
    spawnEnemy();
    spawnClock = Math.max(.42, 1.05 - world.time * .006);
  }

  for (const e of world.enemies) {
    e.hit = Math.max(0, e.hit - dt);
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    e.x += dx / d * e.speed * dt;
    e.y += dy / d * e.speed * dt;
    if (d < p.r + e.r && p.invuln <= 0) {
      p.hp = Math.max(0, p.hp - 12);
      p.invuln = .65;
      world.shake = 9;
      burst(p.x, p.y, '#ff4965', 12);
      updateHud();
      if (p.hp <= 0) endGame();
    }
  }

  const dead = world.enemies.filter(e => e.hp <= 0);
  if (dead.length) {
    for (const e of dead) { p.kills++; p.xp++; burst(e.x, e.y, '#5ce7ff', 14); }
    world.enemies = world.enemies.filter(e => e.hp > 0);
    while (p.xp >= p.xpNeed) {
      p.xp -= p.xpNeed; p.level++; p.xpNeed = Math.ceil(p.xpNeed * 1.45); p.maxHp += 10; p.hp = Math.min(p.maxHp, p.hp + 30);
      showMessage(`LEVEL ${p.level}`, 800);
    }
    updateHud();
  }
  world.slashes.forEach(s => s.life -= dt);
  world.slashes = world.slashes.filter(s => s.life > 0);
  world.particles.forEach(q => { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .95; q.vy *= .95; });
  world.particles = world.particles.filter(q => q.life > 0);
  world.shake *= .82;
}

function draw() {
  const { w, h, player: p } = world;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.translate((Math.random() - .5) * world.shake, (Math.random() - .5) * world.shake);
  const grad = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, Math.max(w,h) * .72);
  grad.addColorStop(0, '#183642'); grad.addColorStop(1, '#091116');
  ctx.fillStyle = grad; ctx.fillRect(-10, -10, w + 20, h + 20);
  drawGrid(w, h);

  for (const e of world.enemies) {
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.shadowColor = e.hit ? '#fff' : '#ff405e'; ctx.shadowBlur = e.hit ? 18 : 8;
    ctx.fillStyle = e.hit ? '#fff' : '#b92f49';
    ctx.beginPath();
    for (let i=0;i<8;i++) { const a=i/8*TAU; const rr=e.r*(i%2?.8:1.05); const x=Math.cos(a)*rr,y=Math.sin(a)*rr; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#260d18'; ctx.beginPath(); ctx.arc(-4,-2,2,0,TAU); ctx.arc(4,-2,2,0,TAU); ctx.fill();
    if (e.hp < e.maxHp) { ctx.fillStyle='#30161e'; ctx.fillRect(-e.r,e.r+5,e.r*2,3); ctx.fillStyle='#ff5870'; ctx.fillRect(-e.r,e.r+5,e.r*2*(e.hp/e.maxHp),3); }
    ctx.restore();
  }

  for (const s of world.slashes) {
    const alpha = s.life / .18;
    ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.angle); ctx.strokeStyle=`rgba(255,224,156,${alpha})`; ctx.lineWidth=8*alpha+2; ctx.lineCap='round'; ctx.shadowColor='#ff8b42'; ctx.shadowBlur=18;
    ctx.beginPath(); ctx.arc(0,0,54,-.9,.9); ctx.stroke(); ctx.restore();
  }

  ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.facing);
  if (p.invuln > 0 && Math.floor(p.invuln*14)%2===0) ctx.globalAlpha=.35;
  ctx.shadowColor='#50dbff'; ctx.shadowBlur=18; ctx.fillStyle='#6de4ff'; ctx.beginPath(); ctx.arc(0,0,p.r,0,TAU); ctx.fill();
  ctx.fillStyle='#dffaff'; ctx.beginPath(); ctx.moveTo(17,0); ctx.lineTo(3,-6); ctx.lineTo(3,6); ctx.closePath(); ctx.fill();
  ctx.restore();

  for (const q of world.particles) { ctx.globalAlpha=Math.max(0,q.life/.45); ctx.fillStyle=q.color; ctx.fillRect(q.x-2,q.y-2,4,4); }
  ctx.globalAlpha=1; ctx.restore();
}

function drawGrid(w,h) {
  ctx.strokeStyle='rgba(104,182,200,.075)'; ctx.lineWidth=1;
  for(let x=0;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
}

function burst(x,y,color,count){ for(let i=0;i<count;i++){const a=Math.random()*TAU,s=35+Math.random()*110;world.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+Math.random()*.35,color});} }
function updateHud(){const p=world.player;ui.hpText.textContent=`${p.hp} / ${p.maxHp}`;ui.hpBar.style.width=`${p.hp/p.maxHp*100}%`;ui.levelText.textContent=p.level;ui.xpText.textContent=`${p.xp} / ${p.xpNeed}`;ui.killsText.textContent=p.kills;}
function showMessage(text,ms){ui.message.textContent=text;ui.message.classList.remove('hidden');clearTimeout(showMessage.t);showMessage.t=setTimeout(()=>{if(!world.gameOver)ui.message.classList.add('hidden');},ms);}
function endGame(){world.gameOver=true;ui.message.innerHTML=`GAME OVER<br><small>${world.player.kills} KILLS・LEVEL ${world.player.level}</small>`;ui.message.classList.remove('hidden');ui.restart.classList.remove('hidden');}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}

function setStick(clientX,clientY){const rect=ui.stickZone.getBoundingClientRect();const origin={x:rect.left+78,y:rect.bottom-76};const dx=clientX-origin.x,dy=clientY-origin.y;const m=Math.hypot(dx,dy)||1;const max=36;const k=Math.min(1,max/m);const sx=dx*k,sy=dy*k;input.x=sx/max;input.y=sy/max;ui.stickKnob.style.transform=`translate(${sx}px,${sy}px)`;}
function clearStick(){stickPointer=null;input.x=0;input.y=0;ui.stickKnob.style.transform='translate(0,0)';}
ui.stickZone.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;ui.stickZone.setPointerCapture(e.pointerId);setStick(e.clientX,e.clientY);});
ui.stickZone.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)setStick(e.clientX,e.clientY);});
ui.stickZone.addEventListener('pointerup',clearStick);ui.stickZone.addEventListener('pointercancel',clearStick);
ui.attack.addEventListener('pointerdown',e=>{e.preventDefault();attack();});
ui.restart.addEventListener('click',reset);
window.addEventListener('resize',resize);
window.addEventListener('keydown',e=>{if(e.code==='Space')attack();if(e.key==='ArrowLeft'||e.key==='a')input.x=-1;if(e.key==='ArrowRight'||e.key==='d')input.x=1;if(e.key==='ArrowUp'||e.key==='w')input.y=-1;if(e.key==='ArrowDown'||e.key==='s')input.y=1;});
window.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','a','d'].includes(e.key))input.x=0;if(['ArrowUp','ArrowDown','w','s'].includes(e.key))input.y=0;});

function frame(now){const dt=Math.min(.034,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(frame);}
reset();requestAnimationFrame(frame);
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
