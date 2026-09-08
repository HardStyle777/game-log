/* Player motion pass: readable walk cycle + explicit sword swing.
   Loaded after game.js as a classic script so it can override pixelPlayer(). */
function pixelPlayer(p){
  const moving=Math.hypot(p.vx||0,p.vy||0)>3||p.dash>0;
  const attacking=p.attackAnim>0;
  const phase=attacking?clamp(1-p.attackAnim/attackDuration(),0,1):0;
  const row=sheetRow(p.facing);
  const walkSheet=ART.swordsmanWalk2Key||ART.swordsmanSheet;
  const attackSheet=ART.swordsmanAttackKey;

  // Keep the hero smaller than the old 68x77 render so the map has room to breathe.
  const bodyW=56,bodyH=64;

  if(state.form==='sword'&&walkSheet&&walkSheet.width){
    // Use every frame. The old 0/2/4/6 sampling could skip the actual contact poses
    // and made the feet look planted while the character slid.
    const walkCols=walkSheet===ART.swordsmanSheet?4:8;
    const walkW=walkSheet.width/walkCols,walkH=walkSheet.height/4;
    const cadence=Math.max(0,Math.hypot(p.vx||0,p.vy||0));
    const walkFrame=moving?Math.floor(p.animTime/7.2)%walkCols:0;
    const gait=moving?Math.sin((p.animTime/7.2)*Math.PI*2):0;
    const bob=moving?Math.abs(gait)*1.15:Math.sin(world.time*2.2)*.22;

    // Wind-up -> strike -> recovery. Character stays centered; the sword supplies the motion.
    let bodyScaleX=1,bodyScaleY=1,bodyY=bob;
    if(attacking){
      const impact=Math.sin(phase*Math.PI);
      bodyScaleX=1+impact*.035;
      bodyScaleY=1-impact*.025;
      bodyY=-impact*.8;
    }

    ctx.save();
    ctx.translate(p.x,p.y+bodyY);
    ctx.scale(bodyScaleX,bodyScaleY);
    if(p.invuln>0&&Math.floor(p.invuln*18)%2===0)ctx.globalAlpha=.45;
    ctx.shadowColor=attacking?'#8de8ff':'#1b5b95';
    ctx.shadowBlur=attacking?8:3;

    if(attacking&&attackSheet){
      const cols=6,aw=attackSheet.width/cols,ah=attackSheet.height/4;
      const attackFrame=Math.min(cols-1,Math.floor(phase*cols));
      ctx.drawImage(attackSheet,attackFrame*aw,row*ah,aw,ah,-bodyW/2,-bodyH+10,bodyW,bodyH);
    }else{
      ctx.drawImage(walkSheet,walkFrame*walkW,row*walkH,walkW,walkH,-bodyW/2,-bodyH+10,bodyW,bodyH);
    }
    ctx.restore();

    if(attacking){
      // The original project already contained this full sword pose but never rendered it.
      // Its sweep crosses the hit timing (~52% of the attack), making the attack readable.
      drawHeroSword(p,phase);

      // Short, sharp motion trail only around the actual strike window.
      if(phase>.27&&phase<.72){
        const q=(phase-.27)/.45;
        ctx.save();
        ctx.translate(p.x,p.y-10);
        ctx.rotate(p.facing);
        ctx.globalCompositeOperation='lighter';
        ctx.globalAlpha=Math.sin(q*Math.PI)*.62;
        ctx.strokeStyle='#eefcff';
        ctx.shadowColor='#62dcff';
        ctx.shadowBlur=14;
        ctx.lineWidth=3.2;
        ctx.beginPath();
        ctx.arc(2,0,47,-1.30,1.18);
        ctx.stroke();
        ctx.strokeStyle='#78dfff';
        ctx.lineWidth=1.2;
        ctx.beginPath();
        ctx.arc(2,0,54,-1.38,1.25);
        ctx.stroke();
        ctx.restore();
      }
    }

    if(p.guard>0){
      ctx.save();
      ctx.translate(p.x,p.y-7);
      ctx.strokeStyle='#a8f2ff';
      ctx.shadowColor='#75dfff';
      ctx.shadowBlur=16;
      ctx.lineWidth=2.2;
      ctx.beginPath();ctx.arc(0,0,25,0,TAU);ctx.stroke();
      ctx.restore();
    }
    return;
  }

  // Warrior/fallback keeps the existing procedural model.
  player2D(p);
}
