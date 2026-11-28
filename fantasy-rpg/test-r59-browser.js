// Full R59 composition, not a stub: all 256 settings, six real source sheets and the actual R46 atlas.
import * as outfit from './fia-outfit-r59.js';
import * as old from './fia-armour-r50.js';
import {equippedImage as oldBattle} from './fia-blades-r55.js';
import {makeFiaAtlas} from './fia-art-r46.js';
const paths={battle:'assets/r37/fia-sprite.png',recovery:'assets/r41/fia-recovery.png',attack:'assets/r45/fia-attack.png',stance:'assets/r46/fia-guard-victory.png',field:'assets/r42/fia-field.png',motion:'assets/r43/fia-motion.png',gear:'assets/r48/fia-equipment.png',ornaments:'assets/r47/fia-gear.png',outfit:'assets/r59/fia-outfit.png'};
const kinds=['battle','recovery','attack','stance','field','motion'];
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function pix(im){const c=canvas(im.naturalWidth??im.width,im.naturalHeight??im.height),g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data}
export async function createVerifier(urls=paths,startAt=0){
 const imgs={};for(const [k,u] of Object.entries(urls)){const i=new Image();i.src=u;await i.decode();imgs[k]=i}
 const raw=Object.fromEntries(kinds.map(k=>[k,pix(imgs[k])])),maps={};
 for(const k of kinds){const im=imgs[k];maps[k]={};for(const part of ['coat','boots']){const c=canvas(im.naturalWidth,im.naturalHeight),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;for(let i=0;i<outfit.cellCount(k);i++){const f=outfit.layerLayout(k,i,part);ctx.drawImage(imgs.outfit,f.sx,f.sy,f.w,f.h,f.dx,f.dy,f.w,f.h)}maps[k][part]=pix(c)}}
 const combos=[];for(const main of outfit.slots.main)for(const offhand of outfit.slots.offhand)for(const head of outfit.slots.head)for(const body of outfit.slots.body)for(const feet of outfit.slots.feet)for(const accessory of outfit.slots.accessory)combos.push({main,offhand,head,body,feet,accessory});
 let checks=0,frames=0,sourceCells=0,done=startAt,rows=[];const ok=(v,m,g)=>{checks++;if(!v)throw Error(m+' '+JSON.stringify(g))};
 function bounds(im,cw,ch,n,g,label){const p=pix(im),w=im.naturalWidth??im.width;for(let i=0;i<n;i++){const x0=i%(w/cw)*cw,y0=Math.floor(i/(w/cw))*ch;let seen=0,edge=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(p[((y0+y)*w+x0+x)*4+3]){seen++;if(!x||!y||x===cw-1||y===ch-1)edge++}ok(seen>0,label+' empty '+i,g);ok(edge===0,label+' edge '+i,g);frames++}}
 function compare(k,im,prior,g){const p=pix(im),q=pix(prior),s=raw[k],active=g.body==='rangercoat'||g.feet==='rangerboots',layers=maps[k],w=imgs[k].naturalWidth,change=Array(outfit.cellCount(k)).fill(0),small=k==='field'||k==='motion',cw=small?96:240,ch=small?96:216;let protectedPixels=0,bad=0;
 for(let i=0;i<p.length;i+=4){const a=q[i+3],sa=s[i+3],isChanged=p[i]!==q[i]||p[i+1]!==q[i+1]||p[i+2]!==q[i+2]||p[i+3]!==a,protectedPixel=sa!==a||(sa>0&&(Math.abs(s[i]-q[i])>2||Math.abs(s[i+1]-q[i+1])>2||Math.abs(s[i+2]-q[i+2])>2));const layer=!protectedPixel?(g.feet==='rangerboots'&&layers.boots[i+3]?layers.boots:g.body==='rangercoat'&&layers.coat[i+3]?layers.coat:null):null,expected=layer??q;if(protectedPixel)protectedPixels++;const ea=expected[i+3],tol=ea===255?0:Math.ceil(255/Math.max(1,ea));if(p[i+3]!==ea||Math.abs(p[i]-expected[i])>tol||Math.abs(p[i+1]-expected[i+1])>tol||Math.abs(p[i+2]-expected[i+2])>tol)bad++;if(isChanged&&layer){const x=(i/4)%w,y=Math.floor(i/4/w);change[Math.floor(y/ch)*(w/cw)+Math.floor(x/cw)]++}}
 ok(bad===0,'composition mismatch '+k+' '+bad,g);if(!active)ok(p.every((v,i)=>v===q[i]),'legacy exact '+k,g);for(const n of change){ok(active?n>0:n===0,'each source cell '+k,g);sourceCells++}return {protectedPixels,changed:change.reduce((a,b)=>a+b,0)};
 }
 async function runBatch(start,end){if(start!==done)throw Error('batch order');for(let i=start;i<Math.min(end,combos.length);i++){const g=combos[i],legacy=outfit.legacyAppearance(g),out={},result={};for(const k of kinds){const orig=imgs[k],prior=(k==='field'||k==='motion'?old.equippedImage:oldBattle)(orig,k,legacy,imgs.ornaments,imgs.gear);out[k]=outfit.equippedImage(orig,k,g,imgs.ornaments,imgs.gear,imgs.outfit);result[k]=compare(k,out[k],prior,g)}const atlas=makeFiaAtlas(out.battle,out.recovery,out.attack,out.stance);bounds(atlas,240,216,38,g,'battle');bounds(out.field,96,96,16,g,'field');bounds(out.motion,96,96,16,g,'motion');rows.push({g,...result});done++}return {checks,frames,sourceCells,done,failures:0}}
 return {runBatch,combos,report:()=>({checks,frames,sourceCells,done,rows,failures:0})};
}
