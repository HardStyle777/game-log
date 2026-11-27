// R53 complete Leon raster review. Run in a browser from the game's origin.
import * as leon from './leon-equipment-r53.js';
import * as old from './leon-appearance-r50.js';
import {runningImage} from './leon-run-r52.js';
import {configureLeon,victoryFrame} from './result-pose-r51.js';
const paths={battle:'assets/r26/leon-battle.png',field:'assets/field-atlas.png',run:'assets/r52/leon-run.png',gear:'assets/r53/leon-equipment.png'};
export async function verify(onProgress=()=>{}){
 const images={};for(const [k,u] of Object.entries(paths)){const im=new Image();im.src=u;await im.decode();images[k]=im}
 const meta=configureLeon((await fetch('assets/r26/motion.json').then(r=>{if(!r.ok)throw Error('meta');return r.json()})).actors.leon);
 function pix(im){const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return ctx.getImageData(0,0,c.width,c.height).data}
 function crop(im,f){const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(im,f.x,f.y,f.w,f.h,0,0,f.w,f.h);return c}
 const configs=[];for(const main of leon.slots.main)for(const offhand of leon.slots.offhand)for(const head of leon.slots.head)for(const body of leon.slots.body)for(const feet of leon.slots.feet)for(const accessory of leon.slots.accessory)configs.push({main,offhand,head,body,feet,accessory});
 let checks=0,frames=0,failures=[],done=0;
 const ok=(v,m,g)=>{checks++;if(!v)failures.push({m,g})};
 const sources={battle:[240,216,20],field:[96,96,16],run:[96,96,16]};
 for(const g of configs){const out={};
 for(const [k,[cw,ch,n]] of Object.entries(sources)){
  const base=k==='run'?runningImage(images.run,{body:g.body,feet:g.feet}):old.equippedImage(images[k],k,{body:g.body,feet:g.feet});
  const r=out[k]=leon.equippedImage(images[k],k,g,images.gear),p=pix(r),q=pix(base),w=r.naturalWidth??r.width;
  ok(p.length===q.length,'size '+k,g);ok(p.every((v,i)=>i%4!==3||v>=q[i]),'source alpha '+k,g);
  if(g.offhand==='none'&&(g.main==='iron'||k!=='battle'))ok(p.every((v,i)=>i%4!==3||v===q[i]),'ornament alpha '+k,g);
  if(g.offhand==='none'&&g.head==='none'&&g.accessory==='none'&&(g.main==='iron'||k!=='battle'))ok(p.every((v,i)=>v===q[i]),'default layers exact '+k,g);
  for(let i=0;i<n;i++){let count=0,edge=0,diff=0;const cx=i%(w/cw)*cw,cy=Math.floor(i/(w/cw))*ch;
   for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const j=((cy+y)*w+cx+x)*4;if(p[j+3]){count++;if(!x||x===cw-1||!y||y===ch-1)edge++}if(p[j]!==q[j]||p[j+1]!==q[j+1]||p[j+2]!==q[j+2]||p[j+3]!==q[j+3])diff++}
   ok(count>0,'empty '+k+' '+i,g);ok(edge===0,'edge '+k+' '+i,g);
   const visible=g.offhand==='shield'||(k==='battle'&&g.main==='sapphire')||((k==='battle'||Math.floor(i/4)!==2)&&(g.head==='circlet'||g.accessory==='brooch'));
   ok(visible?diff>0:diff===0,'overlay '+k+' '+i,g);frames++;
  }
  if(k==='battle'){let nonempty=0;for(let i=20;i<24;i++){const cx=i%6*240,cy=Math.floor(i/6)*216;for(let y=0;y<216;y++)for(let x=0;x<240;x++)if(p[((cy+y)*w+cx+x)*4+3])nonempty++}ok(nonempty===0,'unused cells empty',g)}
 }
 const idle=leon.fieldMotion(out.field,'idle'),ip=pix(idle);for(let i=0;i<16;i++){let count=0,edge=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(ip[((Math.floor(i/4)*96+y)*384+i%4*96+x)*4+3]){count++;if(!x||x===95||!y||y===95)edge++}ok(count>0,'idle nonempty',g);ok(edge===0,'idle edge',g);frames++}
 if(g.main==='sapphire'&&g.offhand==='shield'&&g.head==='circlet'&&g.body==='blue'&&g.feet==='brown'&&g.accessory==='brooch'){const div=document.createElement('div');div.id='leon-review';div.append(crop(out.battle,meta.clips.idle[0]),crop(out.battle,victoryFrame(meta)),crop(out.battle,meta.clips.down[0]),out.field,out.run,idle);document.body.append(div)}
 done++;if(done%8===0){onProgress({done,checks,frames,failures:failures.length});await new Promise(r=>setTimeout(r,0))}
 }
 return {version:'R53',checks,frames,combinations:done,failures};
}
