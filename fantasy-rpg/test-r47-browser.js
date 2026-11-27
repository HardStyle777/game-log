// Browser test, run from the game's same origin.
import * as m from './fia-appearance-r47.js';
import * as old from './fia-appearance-r46.js';
import * as a from './fia-art-r46.js';
const paths={field:'assets/r42/fia-field.png',motion:'assets/r43/fia-motion.png',battle:'assets/r37/fia-sprite.png',recovery:'assets/r41/fia-recovery.png',attack:'assets/r45/fia-attack.png',stance:'assets/r46/fia-guard-victory.png',gear:'assets/r47/fia-gear.png'};
export async function verifyAppearance(){
 const sources={};let checks=0;const ok=(v,msg)=>{checks++;if(!v)throw Error(msg)};
 for(const [k,u] of Object.entries(paths)){const i=new Image();i.src=u;await i.decode();sources[k]=i}
 const gear=sources.gear;delete sources.gear;
 const pix=im=>{const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data};
 const base=a.makeFiaAtlas(sources.battle,sources.recovery,sources.attack,sources.stance),baseP=pix(base),rows=[];
 for(const body of ['green','blue'])for(const feet of ['brown','black']){
 const originals=Object.fromEntries(Object.entries(sources).map(([k,im])=>[k,pix(old.equippedImage(im,k,{body,feet}))]));
 for(const head of ['none','circlet'])for(const accessory of ['none','brooch']){
 const g={body,feet,head,accessory},out={},changed={};
 for(const [k,im] of Object.entries(sources)){
 out[k]=m.equippedImage(im,k,g,gear);const x=originals[k],y=pix(out[k]);let count=0;ok(x.length===y.length,'size');
 const small=k==='field'||k==='motion',cw=small?96:240,ch=small?96:216,w=im.naturalWidth,cellCounts=Array(m.anchors(k).length).fill(0);
 for(let i=0;i<x.length;i+=4){ok(x[i+3]===y[i+3],'alpha '+k);if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2]){count++;const p=i/4,xx=p%w,yy=Math.floor(p/w);cellCounts[Math.floor(yy/ch)*(w/cw)+Math.floor(xx/cw)]++}}
 ok(head==='none'&&accessory==='none'?count===0:count>0,'overlay diff '+k);
 for(let j=0;j<cellCounts.length;j++){const expected=head==='circlet'||(accessory==='brooch'&&m.anchors(k)[j][6]>0);ok(expected?cellCounts[j]>0:cellCounts[j]===0,'per pose '+k+' '+j)}changed[k]=count;
 }
 const atlas=a.makeFiaAtlas(out.battle,out.recovery,out.attack,out.stance),v=pix(atlas);
 for(let i=3;i<v.length;i+=4)ok(v[i]===baseP[i],'atlas alpha');
 for(let i=0;i<38;i++){const q=atlas.getContext('2d').getImageData(i%6*240,Math.floor(i/6)*216,240,216).data;let n=0;for(let yy=0;yy<216;yy++)for(let xx=0;xx<240;xx++)if(q[(yy*240+xx)*4+3]){n++;ok(xx>0&&xx<239&&yy>0&&yy<215,'edge '+i)}ok(n>0,'empty '+i)}
 if(body==='green'&&feet==='brown'&&head==='none'&&accessory==='none')ok(v.every((x,i)=>x===baseP[i]),'default exact');
 rows.push({body,feet,head,accessory,changed});
 if(body==='green'&&feet==='brown'&&head==='circlet'&&accessory==='brooch'){document.body.append(atlas,out.field,out.motion);atlas.style.maxWidth='100%';atlas.style.imageRendering='pixelated';out.field.style.maxWidth='100%';out.motion.style.maxWidth='100%'}
 }}
 return {checks,rows,frames:38,failures:0};
}
