// Open in a browser from the same web origin. Reproduce R44 raster regression.
import {equippedImage} from './fia-appearance-r44.js';
import {makeFiaAtlas} from './fia-art-r41.js';
const paths={field:'assets/r42/fia-field.png',motion:'assets/r43/fia-motion.png',battle:'assets/r37/fia-sprite.png',recovery:'assets/r41/fia-recovery.png'};
export async function verifyAppearance(){
 let checks=0;const ok=(x,msg)=>{checks++;if(!x)throw Error(msg)};const sources={};
 for(const [k,v] of Object.entries(paths)){const im=new Image();im.src=v;await im.decode();sources[k]=im}
 const pixels=im=>{const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data};
 const orig=makeFiaAtlas(sources.battle,sources.recovery),origP=pixels(orig),rows=[];
 for(const body of ['green','blue'])for(const feet of ['brown','black']){const gear={body,feet},changed={},out={};
 for(const [k,im] of Object.entries(sources)){const n=equippedImage(im,k,gear);out[k]=n;const x=pixels(im),y=pixels(n);ok(x.length===y.length,'size');let count=0;for(let i=0;i<x.length;i+=4){ok(x[i+3]===y[i+3],'alpha');if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2])count++}ok((body==='green'&&feet==='brown')?count===0:count>0,'change');changed[k]=count;}
 const atlas=makeFiaAtlas(out.battle,out.recovery),v=pixels(atlas);ok(v.length===origP.length,'atlas size');for(let i=3;i<v.length;i+=4)ok(v[i]===origP[i],'atlas alpha');
 for(let i=0;i<26;i++){let n=0;const d=atlas.getContext('2d').getImageData(i%6*240,Math.floor(i/6)*216,240,216).data;for(let y=0;y<216;y++)for(let x=0;x<240;x++)if(d[(y*240+x)*4+3]){n++;ok(x>0&&x<239&&y>0&&y<215,'edge')}ok(n>0,'empty frame')}
 if(body==='green'&&feet==='brown')ok(v.every((x,i)=>x===origP[i]),'atlas default exact');rows.push({body,feet,changed});if(body==='blue'&&feet==='black'){document.body.append(atlas);atlas.style.maxWidth='100%';atlas.style.imageRendering='pixelated'}}
 return {checks,rows,frames:26};
}
