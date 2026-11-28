// Independent full-body result sprites, same 240x216 cell and grounded feet as R26.
// Fia's approved R46 victory remains untouched. Use an unused source cell, not a new display scale.
import {appearance,rects} from './leon-equipment-r53.js?v=53';
export const victorySource='r58/party-cheer';
export const sourceIndex=Object.freeze({leon:0,glen:1,lucia:2});
export const resultCell=Object.freeze({x:720,y:648,w:240,h:216,ms:780});
export function configureVictory(actor){
 if(!actor?.clips?.idle?.length)throw Error('missing idle');
 const frame={...resultCell};
 return {...actor,resultFrame:frame,clips:{...actor.clips,victory:[{...actor.clips.idle[0],ms:120},frame]}};
}
export function victoryDuration(actor){return actor.clips.victory.reduce((n,f)=>n+f.ms,0)}
const clamp=x=>Math.max(0,Math.min(255,Math.round(x)));
export function leonResultPixels(source,value={}){
 const g=appearance(value);if(source.length!==240*216*4)throw Error('result pixels');
 const out=new Uint8ClampedArray(source);let cloth=0,boots=0,blade=0;
 for(let y=0;y<216;y++)for(let x=0;x<240;x++){
  const i=(y*240+x)*4,[r,v,b,a]=source.subarray(i,i+4);if(!a)continue;
  const l=(r*3+v*5+b*2)/10;
  // Visible blade, below the gold hilt. Preserve the original silhouette and grip.
  const t=((x-94)*-39+(y-145)*41)/(39*39+41*41),d=((x-94)*-41+(y-145)*-39)/Math.hypot(39,41);
  if(g.main==='sapphire'&&t>=.20&&t<=1.14&&Math.abs(d)<=9&&Math.min(r,v,b)>=45&&Math.max(r,v,b)-Math.min(r,v,b)<=48){out[i]=clamp(l*.78);out[i+1]=clamp(l*.96);out[i+2]=clamp(l*1.22);blade++;continue}
  if(g.body==='crimson'&&y>=100&&y<=174&&x>=92&&r<115&&b>r+15&&b>v+8){out[i]=clamp(l*1.48+20);out[i+1]=clamp(l*.60+8);out[i+2]=clamp(l*.55+10);cloth++}
  else if(g.feet==='black'&&y>=167&&x>=92&&x<=160&&r>v+10&&v>b+5&&r<160&&r-v>=v-b){out[i]=clamp(l*.65+5);out[i+1]=clamp(l*.70+8);out[i+2]=clamp(l*.82+14);boots++}
 }
 return {pixels:out,cloth,boots,blade};
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;Object.defineProperties(c,{naturalWidth:{value:w},naturalHeight:{value:h}});return c}
function paint(ctx,asset,key,x,y,w,h,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);ctx.drawImage(asset,...rects[key],-w/2,-h/2,w,h);ctx.restore()}
export function makeVictoryCell(id,source,gear={},asset=null){
 if(!Object.hasOwn(sourceIndex,id)||source?.naturalWidth!==720||source?.naturalHeight!==216)throw Error('victory source dimensions');
 const c=canvas(240,216),ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(source,sourceIndex[id]*240,0,240,216,0,0,240,216);
 if(id!=='leon')return c;
 const g=appearance(gear);
 if(g.body!=='blue'||g.feet!=='brown'||g.main!=='iron'){const p=ctx.getImageData(0,0,240,216);p.data.set(leonResultPixels(p.data,g).pixels);ctx.putImageData(p,0,0)}
 if(g.offhand==='none'&&g.head==='none'&&g.accessory==='none')return c;
 if(asset?.naturalWidth!==256||asset?.naturalHeight!==96)throw Error('victory equipment dimensions');
 if(g.offhand==='shield')paint(ctx,asset,'shield',163,111,33,46,-12);
 const ink=canvas(240,216),i=ink.getContext('2d');i.imageSmoothingEnabled=false;
 if(g.head==='circlet')paint(i,asset,'circlet',133,76,41,11);
 if(g.accessory==='brooch')paint(i,asset,'brooch',122,117,10,10);
 const d=ctx.getImageData(0,0,240,216),q=i.getImageData(0,0,240,216).data;
 for(let n=0;n<q.length;n+=4)if(d.data[n+3]&&q[n+3]){const a=q[n+3]/255;for(let j=0;j<3;j++)d.data[n+j]=Math.round(d.data[n+j]*(1-a)+q[n+j]*a)}
 ctx.putImageData(d,0,0);return c;
}
export function appendVictory(base,id,source,gear,asset){
 const w=base.naturalWidth??base.width,h=base.naturalHeight??base.height;
 const expectedHeight=864;
 if(w!==1440||h!==expectedHeight)throw Error('unexpected original atlas '+id+' '+w+'x'+h);
 // Glen and Lucia's original sheets have fewer rows. Extend, never rescale.
 const c=canvas(w,864),ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
 const p=ctx.getImageData(resultCell.x,resultCell.y,240,216).data;
 for(let i=3;i<p.length;i+=4)if(p[i])throw Error('victory target cell occupied '+id);
 ctx.drawImage(makeVictoryCell(id,source,gear,asset),resultCell.x,resultCell.y);
 return c;
}
