// R52 full raster regression. Run from the game's same origin. No mock Canvas or stub appearance modules.
import * as fia from './fia-armour-r50.js';
import {runningImage} from './leon-run-r52.js';
import {makeFiaAtlas,fiaMeta} from './fia-art-r46.js';
const paths={battle:'assets/r37/fia-sprite.png',recovery:'assets/r41/fia-recovery.png',attack:'assets/r45/fia-attack.png',stance:'assets/r46/fia-guard-victory.png',field:'assets/r42/fia-field.png',motion:'assets/r43/fia-motion.png',gear:'assets/r48/fia-equipment.png',ornaments:'assets/r47/fia-gear.png',leonRun:'assets/r52/leon-run.png'};
export async function verify(onProgress=()=>{}){
const imgs={};for(const [k,path] of Object.entries(paths)){const im=new Image();im.src=path;await im.decode();imgs[k]=im}
function pix(im){let c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data}
const src=Object.fromEntries(Object.entries(imgs).map(([k,v])=>[k,pix(v)]));
const base=makeFiaAtlas(imgs.battle,imgs.recovery,imgs.attack,imgs.stance),basePix=pix(base);
const combos=[];for(const body of fia.slots.body)for(const feet of fia.slots.feet)for(const main of fia.slots.main)for(const offhand of fia.slots.offhand)for(const head of fia.slots.head)for(const accessory of fia.slots.accessory)combos.push({body,feet,main,offhand,head,accessory});
let checks=0,frames=0,failures=[],done=0;function ok(v,m,g){checks++;if(!v)failures.push({m,g})}
function bounds(im,cw,ch,n,g,label){const p=pix(im),w=im.naturalWidth??im.width,h=im.naturalHeight??im.height;for(let i=0;i<n;i++){let seen=0,edge=0;const col=i%(w/cw),row=Math.floor(i/(w/cw));for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(p[((row*ch+y)*w+col*cw+x)*4+3]){seen++;if(x===0||y===0||x===cw-1||y===ch-1)edge++}ok(seen>0,label+' empty '+i,g);ok(edge===0,label+' edge '+i,g);frames++}}
function crop(im,f){const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(im,f.x,f.y,f.w,f.h,0,0,f.w,f.h);return c}
for(const g of combos){const out={};for(const k of ['battle','recovery','attack','stance','field','motion']){out[k]=fia.equippedImage(imgs[k],k,g,imgs.ornaments,imgs.gear);const q=pix(out[k]),p=src[k];ok(q.length===p.length,'size '+k,g);let alpha=true;for(let i=3;i<q.length;i+=4)if(q[i]<p[i]){alpha=false;break}ok(alpha,'alpha not reduced '+k,g);if(g.body==='green'&&g.feet==='brown'&&g.main==='dagger'&&g.offhand==='dagger'&&g.head==='none'&&g.accessory==='none')ok(q.every((v,i)=>v===p[i]),'default exact '+k,g)}
const atlas=makeFiaAtlas(out.battle,out.recovery,out.attack,out.stance);bounds(atlas,240,216,38,g,'battle');bounds(out.field,96,96,16,g,'field');bounds(out.motion,96,96,16,g,'motion');
if(g.body==='green'&&g.feet==='brown'&&g.main==='dagger'&&g.offhand==='dagger'&&g.head==='none'&&g.accessory==='none')ok(pix(atlas).every((v,i)=>v===basePix[i]),'default atlas exact',g);
if(g.body==='armoured'&&g.feet==='greaves'&&g.main==='engraved'&&g.offhand==='engraved'&&g.head==='circlet'&&g.accessory==='brooch'){const preview=document.createElement('div');preview.id='fiaReview';preview.append(crop(atlas,fiaMeta.clips.idle[0]),crop(atlas,fiaMeta.clips.victory.at(-1)),out.field,out.motion);document.body.append(preview)}
done++;if(done%24===0){onProgress({checks,frames,done,failures:failures.length});await new Promise(r=>setTimeout(r,0))}
}
const fiaReport={checks,frames,combinations:done,failures:failures.slice()};
const host=document.createElement('div');host.id='leonReview';
for(const body of ['blue','crimson'])for(const feet of ['brown','black']){const g={body,feet},out=runningImage(imgs.leonRun,g),p=pix(out),q=src.leonRun;ok(p.every((x,i)=>i%4!==3||x===q[i]),'Leon run alpha',g);if(body==='blue'&&feet==='brown')ok(p.every((x,i)=>x===q[i]),'Leon default exact',g);else ok(p.some((x,i)=>x!==q[i]),'Leon variant changed',g);bounds(out,96,96,16,g,'Leon run');host.append(out instanceof HTMLCanvasElement?out:crop(out,{x:0,y:0,w:384,h:384}))}
document.body.append(host);
return {checks,frames,failures,fia:fiaReport,leon:{checks:checks-fiaReport.checks,frames:frames-fiaReport.frames,combinations:4}};
}
