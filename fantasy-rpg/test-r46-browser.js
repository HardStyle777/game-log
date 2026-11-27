import {equippedImage} from './fia-appearance-r46.js';
import {makeFiaAtlas} from './fia-art-r46.js';
import {makeFiaAtlas as oldAtlas} from './fia-art-r45.js';
const paths={field:'assets/r42/fia-field.png',motion:'assets/r43/fia-motion.png',battle:'assets/r37/fia-sprite.png',recovery:'assets/r41/fia-recovery.png',attack:'assets/r45/fia-attack.png',stance:'assets/r46/fia-guard-victory.png'};
export async function verifyAppearance(){
 const sources={};let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
 for(const [k,path] of Object.entries(paths)){const im=new Image();im.src=path;await im.decode();sources[k]=im}
 const pixels=im=>{const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data};
 const orig=makeFiaAtlas(sources.battle,sources.recovery,sources.attack,sources.stance),origP=pixels(orig),rows=[];
 for(const body of ['green','blue'])for(const feet of ['brown','black']){
  const gear={body,feet},out={},changed={};
  for(const [k,im] of Object.entries(sources)){out[k]=equippedImage(im,k,gear);const x=pixels(im),y=pixels(out[k]);let count=0;ok(x.length===y.length,'size');for(let i=0;i<x.length;i+=4){ok(x[i+3]===y[i+3],'source alpha');if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2])count++}ok(body==='green'&&feet==='brown'?count===0:count>0,'colour difference '+k);changed[k]=count}
  const atlas=makeFiaAtlas(out.battle,out.recovery,out.attack,out.stance),prior=oldAtlas(out.battle,out.recovery,out.attack),g=atlas.getContext('2d'),p=prior.getContext('2d'),v=pixels(atlas),raw=document.createElement('canvas');raw.width=1440;raw.height=216;const rg=raw.getContext('2d');rg.drawImage(out.stance,0,0);
  for(let i=3;i<v.length;i+=4)ok(v[i]===origP[i],'atlas alpha');
  for(let i=0;i<38;i++){const x=i%6*240,y=Math.floor(i/6)*216,now=g.getImageData(x,y,240,216).data,exp=i<32?p.getImageData(x,y,240,216).data:rg.getImageData((i-32)*240,0,240,216).data;ok(now.every((v,k)=>v===exp[k]),'frame equality '+i);let n=0;for(let yy=0;yy<216;yy++)for(let xx=0;xx<240;xx++)if(now[(yy*240+xx)*4+3]){n++;ok(xx>0&&xx<239&&yy>0&&yy<215,'edge '+i)}ok(n>0,'empty '+i)}
  if(body==='green'&&feet==='brown')ok(v.every((x,i)=>x===origP[i]),'default exact');rows.push({body,feet,changed});
  if(body==='blue'&&feet==='black'){document.body.append(atlas);atlas.style.maxWidth='100%';atlas.style.imageRendering='pixelated'}
 }
 return {checks,rows,frames:38,failures:0};
}
