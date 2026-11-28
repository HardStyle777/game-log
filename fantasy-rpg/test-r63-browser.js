import * as gear from './fia-gear-r63.js';
import * as oldGear from './fia-outfit-r59.js';
import * as old from './battle-appearance-r62.js';
import * as current from './battle-appearance-r63.js';
import {makeFiaAtlas} from './fia-art-r46.js';
export async function createVerifier(){
 const assets=Object.fromEntries(await Promise.all([...current.appearanceSources,'r26/glen-battle','r26/eris-battle','r42/fia-field','r43/fia-motion'].map(async n=>{const im=new Image();im.src='assets/'+n+'.png';await im.decode();return [n,im]})));
 const list=[];for(const main of gear.slots.main)for(const offhand of gear.slots.offhand)for(const head of gear.slots.head)for(const body of gear.slots.body)for(const feet of gear.slots.feet)for(const accessory of gear.slots.accessory)list.push({main,offhand,head,body,feet,accessory});
 const pix=im=>{const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);return ctx.getImageData(0,0,c.width,c.height).data};
 let checks=0,frames=0,done=0,legacy=0;const ok=(v,m,g)=>{checks++;if(!v)throw Error(m+' '+JSON.stringify(g))};
 function bounds(p,w,cw,ch,n,g,label){for(let i=0;i<n;i++){const dx=i%(w/cw)*cw,dy=Math.floor(i/(w/cw))*ch;let seen=0,edge=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(p[((dy+y)*w+dx+x)*4+3]){seen++;if(x===0||x===cw-1||y===0||y===ch-1)edge++}ok(seen>0&&edge===0,label+' '+i,g);frames++}}
 // All 576 full configurations, including mixed old/new weapons; compare old route and field separately.
 function verifyOne(g){
  const prior=gear.previousAppearance(g),base=old.buildBattleAppearance('fia',assets,prior),battle=current.buildBattleAppearance('fia',assets,g),p=pix(battle),q=pix(base),active=g.main==='moonfang'||g.offhand==='moonfang';
  ok(p.length===q.length,'battle dimensions',g);
  if(active)ok(p.some((v,i)=>v!==q[i]),'new weapon visible',g);else{ok(p.every((v,i)=>v===q[i]),'legacy exact',g);legacy++}
  bounds(p,battle.width??battle.naturalWidth,240,216,38,g,'battle');
  const args=[assets['r47/fia-gear'],assets['r48/fia-equipment'],assets[gear.outfitSource]],out={battle};
  for(const [kind,name] of [['field','r42/fia-field'],['motion','r43/fia-motion']]){
   const im=gear.equippedImage(assets[name],kind,g,...args),before=oldGear.equippedImage(assets[name],kind,prior,...args),s=pix(im),t=pix(before);
   ok(s.every((v,i)=>v===t[i]),kind+' exact sheathed',g);bounds(s,384,96,96,16,g,kind);out[kind]=im;
  }
  done++;return out;
 }
 return {assets,list,verifyOne,summary:()=>({checks,frames,done,legacy,failures:0})};
}
