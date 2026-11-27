// Run in a browser from the game's origin. The R50 armour-only test isolates new layers.
import * as leon from './leon-appearance-r50.js';
import * as fia from './fia-armour-r50.js';
import {makeFiaAtlas} from './fia-art-r46.js';
const paths={leonField:'assets/field-atlas.png',leonBattle:'assets/r26/leon-battle.png',battle:'assets/r37/fia-sprite.png',recovery:'assets/r41/fia-recovery.png',attack:'assets/r45/fia-attack.png',stance:'assets/r46/fia-guard-victory.png',field:'assets/r42/fia-field.png',motion:'assets/r43/fia-motion.png',gear:'assets/r48/fia-equipment.png',ornaments:'assets/r47/fia-gear.png'};
export async function verify(){
 let checks=0,rows=[];const ok=(v,m)=>{checks++;if(!v)throw Error(m)},images={};
 for(const [k,v] of Object.entries(paths)){const im=new Image();im.src=v;await im.decode();images[k]=im}
 function pixels(im){const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data}
 function bounds(im,cw,ch,expected){const w=im.naturalWidth??im.width,h=im.naturalHeight??im.height,p=pixels(im);let n=0;for(let row=0;row<h/ch;row++)for(let col=0;col<w/cw;col++){let count=0,edge=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(p[((row*ch+y)*w+col*cw+x)*4+3]){count++;if(x===0||x===cw-1||y===0||y===ch-1)edge++}if(count)n++;ok(edge===0,'cell edge')}ok(n===expected,'nonempty cell count')}
 for(const body of ['blue','crimson'])for(const feet of ['brown','black']){const g={body,feet};for(const [k,im] of [['field',images.leonField],['battle',images.leonBattle]]){const r=leon.equippedImage(im,k,g),p=pixels(im),q=pixels(r);ok(p.every((v,i)=>i%4!==3||v===q[i]),'Leon alpha');if(body==='blue'&&feet==='brown')ok(p.every((v,i)=>v===q[i]),'Leon default exact');if(k==='field'){bounds(leon.fieldMotion(r,'run'),96,96,32);bounds(leon.fieldMotion(r,'idle'),96,96,16)}}}
 for(const k of ['battle','recovery','attack','stance','field','motion']){const im=images[k],w=im.naturalWidth,h=im.naturalHeight,cw=k==='field'||k==='motion'?96:240,ch=cw===96?96:216,p=pixels(im),as=fia.armourAnchors(k);for(const [body,feet] of [['green','brown'],['armoured','brown'],['green','greaves'],['armoured','greaves']]){const out=fia.armourImage(im,k,{body,feet},images.gear),q=pixels(out),count=Array(as.length).fill(0);let removed=0,edge=0,outside=0;for(let i=0;i<p.length;i+=4){const n=i/4,x=n%w,y=Math.floor(n/w),cell=Math.floor(y/ch)*(w/cw)+Math.floor(x/cw),changed=q[i]!==p[i]||q[i+1]!==p[i+1]||q[i+2]!==p[i+2]||q[i+3]!==p[i+3];if(q[i+3]<p[i+3])removed++;if(q[i+3]&&(x%cw===0||x%cw===cw-1||y%ch===0||y%ch===ch-1))edge++;if(changed){count[cell]++;const list=[...(body==='armoured'?[as[cell][0]]:[]),...(feet==='greaves'?as[cell][1]:[])];if(!list.some(([cx,cy,ww,hh])=>Math.hypot(x%cw+.5-cx,y%ch+.5-cy)<=Math.hypot(ww,hh)/2+2))outside++}}
 ok(removed===0,'alpha removed '+k);ok(edge===0,'edge '+k);ok(outside===0,'outside '+k);for(const n of count)ok(body==='green'&&feet==='brown'?n===0:n>0,'cell change '+k);rows.push({k,body,feet,changed:count.reduce((a,b)=>a+b,0)});
 }}
 // These additional end-to-end composition checks are included for future browser regression.
 for(const [body,feet] of [['green','brown'],['armoured','greaves']]){const gear={main:'engraved',offhand:'engraved',head:'circlet',accessory:'brooch',body,feet},out=['battle','recovery','attack','stance'].map(k=>fia.equippedImage(images[k],k,gear,images.ornaments,images.gear));bounds(makeFiaAtlas(...out),240,216,38)}
 return {checks,rows};
}
