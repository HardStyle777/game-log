// R56: real Canvas test for all 64 Leon gear settings. Run from the game's origin.
import * as r56 from './leon-blades-r56.js';
import * as r53 from './leon-equipment-r53.js';
import * as dye from './leon-appearance-r50.js';
const load=async p=>{const i=new Image();i.src=p;await i.decode();return i};
function pix(i){const c=document.createElement('canvas');c.width=i.naturalWidth??i.width;c.height=i.naturalHeight??i.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(i,0,0);return g.getImageData(0,0,c.width,c.height).data}
export async function verify(onProgress=()=>{}){
 const [source,asset]=await Promise.all([load('assets/r26/leon-battle.png'),load('assets/r53/leon-equipment.png')]);
 const original=pix(source),texture=pix(asset),segs=r53.placements('battle').map(p=>p.blade),p=r56.bladePixels(original,texture,segs);
 let checks=0,frames=0,done=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
 for(let i=0;i<24;i++){const cx=i%6*240,cy=Math.floor(i/6)*216,seg=segs[i];let changes=0,nonempty=0;
 for(let y=0;y<216;y++)for(let x=0;x<240;x++){const j=((cy+y)*1440+cx+x)*4,diff=[0,1,2,3].some(k=>original[j+k]!==p.pixels[j+k]);if(p.pixels[j+3]){nonempty++;ok(x>0&&x<239&&y>0&&y<215,'source edge')}if(!diff)continue;changes++;ok(!!seg,'unused cell');const [rx,ry,tx,ty]=seg,dx=tx-rx,dy=ty-ry,L=Math.hypot(dx,dy),t=((x-rx)*dx+(y-ry)*dy)/(L*L),d=((x-rx)*-dy+(y-ry)*dx)/L;ok(t>=.13&&t<=1.11&&Math.abs(d)<=11,'outside blade');ok(!(original[j+3]&&original[j]>original[j+1]+20&&original[j+1]>original[j+2]+10),'warm/grip');if(!r56.shapeCells.includes(i))ok(original[j+3]===p.pixels[j+3],'material alpha')}
 ok(i<20?changes>0&&nonempty>0:changes===0&&nonempty===0,'cell '+i)}
 for(const main of r53.slots.main)for(const offhand of r53.slots.offhand)for(const head of r53.slots.head)for(const body of r53.slots.body)for(const feet of r53.slots.feet)for(const accessory of r53.slots.accessory){
 const g={main,offhand,head,body,feet,accessory},actual=pix(r56.equippedImage(source,'battle',g,asset));
 if(main==='iron'){const before=pix(r53.equippedImage(source,'battle',g,asset));ok(actual.every((v,i)=>v===before[i]),'iron exact')}
 if(main==='sapphire'&&offhand==='none'&&head==='none'&&accessory==='none'){
 const dyed=pix(dye.equippedImage(source,'battle',{body,feet})),expected=r56.mergeBladeDelta(original,dyed,p.pixels);
 // Canvas roundtrip can alter low-alpha RGB; alpha must be exact, opaque RGB exact.
 ok(actual.every((v,i)=>i%4===3?v===expected[i]:expected[i-i%4+3]!==255||v===expected[i]),'dye isolation');
 }
 for(let i=0;i<24;i++){let n=0,edge=0;const cx=i%6*240,cy=Math.floor(i/6)*216;for(let y=0;y<216;y++)for(let x=0;x<240;x++)if(actual[((cy+y)*1440+cx+x)*4+3]){n++;if(x===0||x===239||y===0||y===215)edge++}
 ok(i<20?n>0&&edge===0:n===0,'atlas bounds '+i);if(i<20)frames++}
 done++;if(done%8===0){onProgress({done,checks,frames});await new Promise(r=>setTimeout(r,0))}
 }
 return {done,checks,frames,sourceRows:p.report,failures:0};
}
