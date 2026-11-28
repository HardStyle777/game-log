// R56 Leon: replace the exposed steel tip in ten unobstructed poses.
// Keep the grip and proximal steel. Other poses use visible-steel material only.
import * as prior from './leon-equipment-r53.js?v=53';
import * as dye from './leon-appearance-r50.js?v=50';
export const shapeCells=Object.freeze([0,1,2,6,10,11,14,15,16,18]);
export const W=240,H=216;
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
const steel=(r,g,b,a)=>a>0&&Math.min(r,g,b)>=42&&Math.max(r,g,b)-Math.min(r,g,b)<=45&&b>=r-14;
export function bladePixels(source,asset,segments){
 if(source.length!==1440*864*4||asset.length!==256*96*4||segments.length!==20)throw Error('R56 raster size');
 const out=new Uint8ClampedArray(source),report=[];
 for(let i=0;i<20;i++){
 const [rx,ry,tx,ty]=segments[i],dx=tx-rx,dy=ty-ry,L=Math.hypot(dx,dy),cx=i%6*W,cy=Math.floor(i/6)*H,shape=shapeCells.includes(i);
 const coord=(x,y)=>[((x-rx)*dx+(y-ry)*dy)/(L*L),((x-rx)*-dy+(y-ry)*dx)/L];
 const idx=(x,y)=>((cy+y)*1440+cx+x)*4;
 let ds=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [t,d]=coord(x,y),j=idx(x,y);if(t>=.30&&t<=.42&&Math.abs(d)<=11&&steel(...source.subarray(j,j+4)))ds.push(d)}
 if(!ds.length)throw Error('missing steel '+i);ds.sort((a,b)=>a-b);const center=ds[Math.floor(ds.length/2)];
 let removed=0,changed=0,added=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const [t,d]=coord(x,y),j=idx(x,y),[r,g,b,a]=source.subarray(j,j+4);
  if(t<.13||t>1.11||Math.abs(d)>11)continue;
  // The entire exposed tip can be cut only in audited unobstructed poses.
  // Never remove warm/gold pixels or any grip-side pixels.
  if(shape&&t>=.32&&a&&!(r>g+20&&g>b+10)){out.fill(0,j,j+4);removed++}
  else if(steel(r,g,b,a)){const l=.299*r+.587*g+.114*b;out[j]=clamp(.65*r+.35*l*.77);out[j+1]=clamp(.65*g+.35*l*.96);out[j+2]=clamp(.65*b+.35*l*1.20);changed++}
 }
 if(shape)for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const [t,d]=coord(x,y);if(t<.32||t>1.07||Math.abs(d)>11)continue;
  const j=idx(x,y),sx=Math.round(2+(1-Math.max(0,Math.min(1,t)))*62),sy=Math.round(19+(d-center)*1.4);
  if(sx<2||sx>=65||sy<12||sy>=26)continue;
  const k=(sy*256+sx)*4;
  if(asset[k+3]<128||out[j+3]!==0)continue;
  out.set(asset.subarray(k,k+4),j);added++;
 }
 report.push({i,shape,removed,changed,added,center});
 }
 return {pixels:out,report};
}
function raster(im){const c=document.createElement('canvas');c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height)}
export function equippedImage(source,kind,value={},asset=null){
 const g=prior.appearance(value);
 if(kind!=='battle'||g.main==='iron')return prior.equippedImage(source,kind,g,asset);
 const original=raster(source),texture=raster(asset);
 if(original.width!==1440||original.height!==864||texture.width!==256||texture.height!==96)throw Error('R56 source dimensions');
 const p=bladePixels(original.data,texture.data,prior.placements('battle').map(p=>p.blade));
 // Dye the original clothing separately, then copy only the changed blade pixels.
 // Crimson armour must never recolour the new blue steel.
 const dyed=raster(dye.equippedImage(source,'battle',{body:g.body,feet:g.feet}));
 dyed.data.set(mergeBladeDelta(original.data,dyed.data,p.pixels));
 const c=document.createElement('canvas');c.width=1440;c.height=864;Object.defineProperties(c,{naturalWidth:{value:1440},naturalHeight:{value:864}});
 c.getContext('2d').putImageData(dyed,0,0);
 return prior.addEquipment(c,'battle',{...g,main:'iron'},asset);
}

export function mergeBladeDelta(original,dyed,blade){if(original.length!==dyed.length||original.length!==blade.length||original.length%4)throw Error('R56 delta dimensions');const out=new Uint8ClampedArray(dyed);for(let i=0;i<original.length;i+=4){if([0,1,2,3].some(k=>original[i+k]!==blade[i+k]))out.set(blade.subarray(i,i+4),i)}return out}
