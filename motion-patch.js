/* v2: real stride poses.  The torso stays fixed; only the sprite's feet cycle. */
function pixelPlayer(p){
  const moving=Math.hypot(p.vx||0,p.vy||0)>3||p.dash>0;
  const attacking=p.attackAnim>0;
  const phase=attacking?clamp(1-p.attackAnim/attackDuration(),0,1):0;
  const row=sheetRow(p.facing);
  const walkSheet=ART.swordsmanWalk2Key||ART.swordsmanSheet;
  const attackSheet=ART.swordsmanAttackKey;
  const bodyW=50,bodyH=58;

  if(state.form==='sword'&&walkSheet&&walkSheet.width){
    const walkCols=walkSheet===ART.swordsmanSheet?4:4;
    const walkW=walkSheet.width/walkCols,walkH=walkSheet.height/4;
    // Four deliberately separated contact/pass poses.  No bob, scale, or camera shake.
    const walkFrame=moving?Math.floor(p.animTime/16)%4:0;
    ctx.save();
    ctx.translate(p.x,p.y);
    if(p.invuln>0&&Math.floor(p.invuln*18)%2===0)ctx.globalAlpha=.45;
    ctx.shadowColor=attacking?'#8de8ff':'#1b5b95';
    ctx.shadowBlur=attacking?7:2;
    if(attacking&&attackSheet){
      const cols=6,aw=attackSheet.width/cols,ah=attackSheet.height/4;
      const attackFrame=Math.min(cols-1,Math.floor(phase*cols));
      ctx.drawImage(attackSheet,attackFrame*aw,row*ah,aw,ah,-bodyW/2,-bodyH+9,bodyW,bodyH);
    }else{
      ctx.drawImage(walkSheet,walkFrame*walkW,row*walkH,walkW,walkH,-bodyW/2,-bodyH+9,bodyW,bodyH);
    }
    ctx.restore();

    if(attacking){
      // Keep the established sword sweep that already reads well in the current build.
      drawHeroSword(p,phase);
      if(phase>.30&&phase<.70){
        const q=(phase-.30)/.40;
        ctx.save();ctx.translate(p.x,p.y-9);ctx.rotate(p.facing);
        ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.sin(q*Math.PI)*.5;
        ctx.strokeStyle='#eefcff';ctx.shadowColor='#62dcff';ctx.shadowBlur=12;ctx.lineWidth=2.6;
        ctx.beginPath();ctx.arc(2,0,42,-1.30,1.18);ctx.stroke();ctx.restore();
      }
    }
    if(p.guard>0){
      ctx.save();ctx.translate(p.x,p.y-7);ctx.strokeStyle='#a8f2ff';ctx.shadowColor='#75dfff';ctx.shadowBlur=14;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,22,0,TAU);ctx.stroke();ctx.restore();
    }
    return;
  }
  player2D(p);
}
