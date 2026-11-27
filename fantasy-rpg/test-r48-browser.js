// Run in a browser on the game's origin. Weapon additions intentionally may increase alpha.
import * as m from './fia-appearance-r48.js';
import * as old from './fia-appearance-r47.js';
import * as a from './fia-art-r46.js';
const paths={field:'assets/r42/fia-field.png',motion:'assets/r43/fia-motion.png',battle:'assets/r37/fia-sprite.png',recovery:'assets/r41/fia-recovery.png',attack:'assets/r45/fia-attack.png',stance:'assets/r46/fia-guard-victory.png',gear:'assets/r47/fia-gear.png',weapons:'assets/r48/fia-equipment.png'};
export async function verifyAppearance(){
const sources={};let checks=0;const ok=(v,msg)=>{checks++;if(!v)throw Error(msg)};
for(const [k,u] of Object.entries(paths)){const i=new Image();i.src=u;await i.decode();sources[k]=i}
const gear=sources.gear,weapons=sources.weapons;delete sources.gear;delete sources.weapons;
const pix=im=>{const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data};
const atlasOf=o=>a.makeFiaAtlas(o.battle,o.recovery,o.attack,o.stance);const rows=[];let pixelComparisons=0;
for(const body of ['green','blue'])for(const feet of ['brown','black'])for(const head of ['none','circlet'])for(const accessory of ['none','brooch']){
const common={body,feet,head,accessory},prev=Object.fromEntries(Object.entries(sources).map(([k,im])=>[k,old.equippedImage(im,k,common,gear)])),baseP=pix(atlasOf(prev)),originals=Object.fromEntries(Object.entries(prev).map(([k,im])=>[k,pix(im)]));
for(const main of ['dagger','engraved'])for(const offhand of ['dagger','engraved']){
const g={...common,main,offhand},out={},changed={},added={},active=main==='engraved'||offhand==='engraved';
for(const [k,im] of Object.entries(sources)){out[k]=m.equippedImage(im,k,g,gear,weapons);const x=originals[k],y=pix(out[k]);let count=0,alphaAdded=0,removed=0;ok(x.length===y.length,'size');const rowsK=m.weaponAnchors(k),isBattle=rowsK.length>0,w=im.naturalWidth,cellCounts=Array(rowsK.length).fill(0);
for(let i=0;i<x.length;i+=4){pixelComparisons++;if(y[i+3]<x[i+3])removed++;if(y[i+3]>x[i+3])alphaAdded++;if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2]||x[i+3]!==y[i+3]){count++;if(isBattle)cellCounts[Math.floor(((i/4)%w)/240)]++}}
ok(removed===0,'source alpha removed '+k);ok(active&&isBattle?count>0:count===0,'diff '+k);for(let j=0;j<cellCounts.length;j++)ok(active?cellCounts[j]>0:cellCounts[j]===0,'per pose '+k+' '+j);changed[k]=count;added[k]=alphaAdded;}
const atlas=atlasOf(out),v=pix(atlas);ok(v.length===baseP.length,'atlas size');if(!active)ok(v.every((x,i)=>x===baseP[i]),'default exact');
for(let i=0;i<38;i++){const q=atlas.getContext('2d').getImageData(i%6*240,Math.floor(i/6)*216,240,216).data;let n=0,edge=0;for(let yy=0;yy<216;yy++)for(let xx=0;xx<240;xx++)if(q[(yy*240+xx)*4+3]){n++;if(xx===0||xx===239||yy===0||yy===215)edge++}ok(edge===0,'edge '+i+' '+JSON.stringify(g));ok(n>0,'empty '+i)}
rows.push({main,offhand,...common,changed,added});if(body==='green'&&feet==='brown'&&head==='none'&&accessory==='none'&&main==='engraved'&&offhand==='engraved'){document.body.append(atlas);atlas.style.maxWidth='100%';atlas.style.imageRendering='pixelated'}
}}
return {checks,pixelComparisons,rows,frames:38,failures:0};
}
