/* Shared animation sampling. Time is monotonic within each action; position belongs
 * to the combat scene and is deliberately never reset by an animation. */
(function(root){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
// Explicit source frame starts avoid the previous opening-frame replay bug.
const clips={
 triple:{kind:'combo',frames:[0,1,2,3,4,5,6,7,8,9,10],source:[0,200,265,350,435,500,565,650,740,870,930],weights:[80,65,85,85,65,65,85,90,130,60,240]},
 thrust:{kind:'other',row:0,frames:[0,1,2,3],source:[0,260,325,475],weights:[80,65,150,80]},
 sweep:{kind:'other',row:1,frames:[0,1,2,3],source:[0,230,315,475],weights:[80,85,160,80]},
 leap:{kind:'other',row:2,frames:[0,1,2,3],source:[0,210,430,530],weights:[80,220,100,80]}
};
const aliases={flame:'leap',frost:'sweep',thunder:'thrust'};
function sample(id,progress){
 const p=clamp(progress),clip=clips[aliases[id]||id];
 if(id==='basic')return {kind:'basic',progress:p,finished:progress>=1,effects:progress>=0&&progress<1};
 if(!clip)return {kind:id==='heal_potion'?'potion':'idle',progress:p,finished:progress>=1,effects:false};
 const total=clip.weights.reduce((a,b)=>a+b,0);let t=p*total,i=0;
 while(i<clip.weights.length-1&&t>=clip.weights[i])t-=clip.weights[i++];
 // The final source pose is held, but effect time keeps advancing through its
 // tail. At completion the renderer turns off effects rather than freezing them.
 const next=clip.source[i+1]??(clip.kind==='combo'?1090:clip.source[i]+clip.weights[i]);
 const time=clip.source[i]+Math.min(.999999,t/clip.weights[i])*(next-clip.source[i]);
 return {kind:clip.kind,row:clip.row,frame:clip.frames[i],sourceTime:time,progress:p,finished:progress>=1,effects:progress>=0&&progress<1};
}
function create(g,{combo,other,basic}={}){
 if(typeof combo!=='function'||typeof other!=='function')throw Error('HeroMotion needs combo and other renderers');
 let last=null,hurtAt=-Infinity;
 function stance(){combo(0,true,{effects:false});}
 function drawPose(s){
  if(s.kind==='basic'){
   if(typeof basic==='function')basic(s.progress,{effects:s.effects});
   else stance(); // Never silently substitute a horizontal attack for diagonal.
  }else if(s.kind==='combo')combo(s.sourceTime,false,{effects:s.effects});
  else if(s.kind==='other')other(s.row,s.sourceTime,false,{effects:s.effects});
  else stance();
 }
 return {
  setBasic(fn){basic=fn;},
  reset(){last=null;hurtAt=-Infinity;},
  hurt(now){hurtAt=now;},
  /* now/duration are seconds. x/y are absolute scene root offsets, not skill
   * offsets. Caller owns proximity and motion towards the next live target. */
  draw({id=null,progress=0,now=0,x=0,y=0,state='combat',approach=0}={}){
   g.save();g.translate(x,y);
   const hurtAge=now-hurtAt;
   if(hurtAge>=0&&hurtAge<.16){
    // Brief local impact recoil only; does not overwrite persistent world x.
    const recoil=Math.sin(Math.PI*hurtAge/.16);g.translate(-5*recoil,0);
   }
   if(state==='defeat'){
    // Existing low crouch gives a coherent defeated stance without rotating
    // the entire sprite into a rigid cardboard fall.
    g.globalAlpha*=.72;other(2,530,false,{effects:false});last=null;
   }else if(id){
    const s=sample(id,progress);drawPose(s);last=s;
    if(s.kind==='potion'&&progress<1){
     const p=clamp(progress);g.save();g.globalCompositeOperation='lighter';
     g.strokeStyle='#baf7c9';g.lineWidth=2;g.globalAlpha*=Math.sin(Math.PI*p);
     for(let i=0;i<5;i++){const px=265+i*20,py=335-((p*115+i*17)%115);g.beginPath();g.moveTo(px-3,py);g.lineTo(px+3,py);g.moveTo(px,py-3);g.lineTo(px,py+3);g.stroke();}g.restore();
    }
   }else if(state==='combat'&&last&&last.kind!=='potion'){
    drawPose({...last,effects:false});
   }else{
    // Breathing is subpixel and vertical only, never a repeating horizontal
    // snap. Approach translation is supplied by the scene; no false walk cycle.
    if(state==='idle')g.translate(0,Math.sin(now*2.2)*.6);
    stance();
   }
   g.restore();
  }
 };
}
const api={sample,create,clips,smooth};
if(typeof module==='object'&&module.exports)module.exports=api;
root.HeroMotion=api;
})(typeof window==='object'?window:globalThis);
