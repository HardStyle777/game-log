/* Player motion pass v3: NEVER use legacy sword-side/front/back assets.
   The current swordsman character sheet remains the single visual source. */
function pixelPlayer(p){
  const moving=Math.hypot(p.vx||0,p.vy||0)>3||p.dash>0;
  const attacking=p.attackAnim>0;
  const phase=attacking?clamp(1-p.attackAnim/attackDuration(),0,1):0;
  const row=sheetRow(p.facing);
  const walkSheet=ART.swordsmanWalk2Key||ART.swordsmanSheet;
  const attackSheet=ART.swordsmanAttackKey;

  if(state.form==='sword'&&walkSheet&&walkSheet.width){
    const cols=walkSheet===ART.swordsmanSheet?4:8;
    const fw=walkSheet.width/cols,fh=walkSheet.height/4;
    const speed=Math.hypot(p.vx||0,p.vy||0);
    const speedRatio=Math.min(1,Math.max(.25,speed/Math.max(1,derived().move)));

    // Keep the CURRENT character only. 8-frame gait: contact -> down -> passing -> up -> opposite contact.
    const cycle=moving?(p.animTime/7.0):0;
    const frame=moving?Math.floor(cycle)%cols:0;
    const gait=cycle*Math.PI*2;
    const contact=Math.abs(Math.cos(gait));
    const bob=moving?(1-contact)*1.35:Math.sin(world.time*2.1)*.16;
    const sway=moving?Math.sin(gait)*.72*speedRatio:0;
    const tilt=moving?Math.sin(gait)*.012*speedRatio:0;
    const bodyW=58,bodyH=68;

    // A compact planted shadow; it compresses as weight lands instead of faking two extra feet.
    if(moving&&!attacking){
      ctx.save();
      ctx.globalAlpha=.20+.08*contact;
      ctx.fillStyle='#081313';
      ctx.beginPath();
      ctx.ellipse(p.x,p.y+8,8.5-contact*1.3,2.2+contact*.35,0,0,TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(p.x+Math.cos(p.facing+Math.PI/2)*sway,p.y+bob);
    ctx.rotate(tilt);
    if(p.invuln>0&&Math.floor(p.invuln*18)%2===0)ctx.globalAlpha=.45;
    ctx.shadowColor=attacking?'#8de8ff':'#1b5b95';
    ctx.shadowBlur=attacking?8:3;

    if(attacking&&attackSheet){
      const ac=6,aw=attackSheet.width/ac,ah=attackSheet.height/4;
      const af=Math.min(ac-1,Math.floor(phase*ac));
      ctx.drawImage(attackSheet,af*aw,row*ah,aw,ah,-bodyW/2,-bodyH+11,bodyW,bodyH);
    }else{
      ctx.drawImage(walkSheet,frame*fw,row*fh,fw,fh,-bodyW/2,-bodyH+11,bodyW,bodyH);
    }
    ctx.restore();

    if(attacking){
      drawHeroSword(p,phase);
      if(phase>.27&&phase<.72){
        const q=(phase-.27)/.45;
        ctx.save();ctx.translate(p.x,p.y-10);ctx.rotate(p.facing);
        ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.sin(q*Math.PI)*.62;
        ctx.strokeStyle='#eefcff';ctx.shadowColor='#62dcff';ctx.shadowBlur=14;ctx.lineWidth=3.2;
        ctx.beginPath();ctx.arc(2,0,47,-1.30,1.18);ctx.stroke();
        ctx.strokeStyle='#78dfff';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(2,0,54,-1.38,1.25);ctx.stroke();ctx.restore();
      }
    }

    if(p.guard>0){
      ctx.save();ctx.translate(p.x,p.y-7);ctx.strokeStyle='#a8f2ff';ctx.shadowColor='#75dfff';ctx.shadowBlur=16;ctx.lineWidth=2.2;
      ctx.beginPath();ctx.arc(0,0,25,0,TAU);ctx.stroke();ctx.restore();
    }
    return;
  }

  player2D(p);
}
