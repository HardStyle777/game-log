import * as gear from './leon-outfit-r61.js';
import * as old from './battle-appearance-r60.js';
import * as current from './battle-appearance-r61.js';
import * as oldGear from './leon-outfit-r60.js';
export async function createVerifier(){
 const assets=Object.fromEntries(await Promise.all([...current.appearanceSources,'r26/glen-battle','r26/eris-battle','field-atlas','r52/leon-run'].map(async n=>{const i=new Image();i.src='assets/'+n+'.png';await i.decode();return [n,i]})));
 const equipment=assets['r53/leon-equipment'],parts=assets[gear.outfitSource],meta=current.configureBattleMeta(await fetch('assets/r26/motion.json').then(r=>{if(!r.ok)throw Error('motion');return r.json()}));
 const list=[];for(const main of gear.slots.main)for(const offhand of gear.slots.offhand)for(const head of gear.slots.head)for(const body of gear.slots.body)for(const feet of gear.slots.feet)for(const accessory of gear.slots.accessory)list.push({main,offhand,head,body,feet,accessory});
 const pix=im=>{const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data};
 let checks=0,frames=0,done=0;const failures=[];const ok=(v,m,g)=>{checks++;if(!v)failures.push({m,g})};
 function bounds(im,cw,ch,indices,g,label){const w=im.naturalWidth??im.width,p=pix(im);for(const i of indices){let n=0,edge=0;const dx=i%(w/cw)*cw,dy=Math.floor(i/(w/cw))*ch;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(p[((dy+y)*w+dx+x)*4+3]){n++;if(x===0||x===cw-1||y===0||y===ch-1)edge++}ok(n>0&&edge===0,label+' '+i,g);frames++}}
 const battleCells=Array.from({length:22},(_,i)=>i),fieldCells=Array.from({length:16},(_,i)=>i);
 function verifyOne(g){const baseline=old.buildBattleAppearance('leon',assets,g),battle=current.buildBattleAppearance('leon',assets,g),walk=gear.equippedImage(assets['field-atlas'],'field',g,equipment,parts),run=gear.equippedImage(assets['r52/leon-run'],'run',g,equipment,parts),idle=gear.fieldMotion(walk,'idle');
 for(const [im,base,label] of [[battle,baseline,'battle'],[walk,oldGear.equippedImage(assets['field-atlas'],'field',g,equipment,parts),'walk'],[run,oldGear.equippedImage(assets['r52/leon-run'],'run',g,equipment,parts),'run']]){
 const a=pix(im),b=pix(base);ok(a.length===b.length,'dimensions '+label,g);ok(a.every((x,i)=>i%4!==3||x===b[i]),'alpha unchanged '+label,g);ok(a.every((x,i)=>x===b[i]),'R60 exact '+label,g)}
 const oldIdle=oldGear.fieldMotion(oldGear.equippedImage(assets['field-atlas'],'field',g,equipment,parts),'idle'),pixIdle=pix(oldIdle);ok(pix(idle).every((x,i)=>x===pixIdle[i]),'idle exact',g);
 bounds(battle,240,216,battleCells,g,'battle');bounds(walk,96,96,fieldCells,g,'walk');bounds(run,96,96,fieldCells,g,'run');bounds(idle,96,96,fieldCells,g,'idle');done++;
 return {battle,walk,run,idle}
 }
 return {assets,meta,list,verifyOne,summary:()=>({checks,frames,done,failures})};
}
