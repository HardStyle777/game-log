/* Player motion pass v2: use dedicated directional walk strips so the feet visibly move. */
function pixelPlayer(p){
  const moving=Math.hypot(p.vx||0,p.vy||0)>3||p.dash>0;
  const attacking=p.attackAnim>0;
  const phase=attacking?clamp(1-p.attackAnim/attackDuration(),0,1):0;
  const row=sheetRow(p.facing);
  const attackSheet=ART.swordsmanAttackKey;

  if(state.form==='sword'){
    const horizontal=Math.abs(Math.cos(p.facing))>.58;
    const front=Math.sin(p.facing)>0;
    const walkStrip=horizontal?ART.swordSideKey:(front?ART.swordFrontKey:ART.swordBackKey);
    const fallback=ART.swordsmanWalk2Key||ART.swordsmanSheet;
    const speed=Math.hypot(p.vx||0,p.vy||0);
    const stride=Math.min(1,Math.max(.35,speed/derived().move));
    const walkFrame=moving?Math.floor(p.animTime/6.3)%8:0;
    const footPhase=(p.animTime/6.3)*Math.PI*2;
    const bob=moving?Math.abs(Math.sin(footPhase))*1.6:Math.sin(world.time*2.2)*.2;
    const lean=moving?Math.sin(footPhase)*.018:0;
    const sway=moving?Math.sin(footPhase)*1.05:0;
    const bodyW=58,bodyH=72;

    ctx.save();
    ctx.translate(p.x+sway*Math.cos(p.facing+Math.PI/2),p.y+bob);
    ctx.rotate(lean);
    if(p.invuln>0&&Math.floor(p.invuln*18)%2===0)ctx.globalAlpha=.45;
    ctx.shadowColor=attacking?'#8de8ff':'#1b5b95';
    ctx.shadowBlur=attacking?8:3;

    if(attacking&&attackSheet){
      const cols=6,aw=attackSheet.width/cols,ah=attackSheet.height/4;
      const attackFrame=Math.min(cols-1,Math.floor(phase*cols));
      ctx.drawImage(attackSheet,attackFrame*aw,row*ah,aw,ah,-bodyW/2,-bodyH+13,bodyW,bodyH);
    }else if(walkStrip&&walkStrip.width){
      const sw=walkStrip.width/8;
      const sy=walkStrip.height*.10;
      const sh=walkStrip.height*.80;
      let dw=horizontal?62:58,dh=horizontal?78:76;
      if(horizontal&&Math.cos(p.facing)>0)ctx.scale(-1,1);
      ctx.drawImage(walkStrip,walkFrame*sw,sy,sw,sh,-dw/2,-dh+15,dw,dh);
    }else if(fallback&&fallback.width){
      const cols=fallback===ART.swordsmanSheet?4:8;
      const fw=fallback.width/cols,fh=fallback.height/4;
      const frame=moving?Math.floor(p.animTime/6.3)%cols:0;
      ctx.drawImage(fallback,frame*fw,row*fh,fw,fh,-bodyW/2,-bodyH+13,bodyW,bodyH);
    }
    ctx.restore();

    // Ground contact cue: two alternating short foot shadows make planted steps readable.
    if(moving&&!attacking){
      const left=Math.sin(footPhase)>0;
      ctx.save();
      ctx.globalAlpha=.18;
      ctx.fillStyle='#081313';
      ctx.beginPath();
      ctx.ellipse(p.x+(left?-5:5),p.y+10,left?5.5:3.2,left?2.1:1.5,0,0,TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.x+(left?5:-5),p.y+10,left?3.2:5.5,left?1.5:2.1,0,0,TAU);
      ctx.fill();
      ctx.restore();
    }

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
