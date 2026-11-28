// R60: independent fitted royal plate and sabatons. Keep prior appearance and source silhouettes.
import * as prior from './leon-equipment-r53.js?v=53';
export {fieldMotion} from './leon-equipment-r53.js?v=53';
export const outfitSource='r60/leon-plate-parts';
export const KEY='fantasy-leon-appearance-r60';
export const slots=Object.freeze({...prior.slots,body:Object.freeze([...prior.slots.body,'royalplate']),feet:Object.freeze([...prior.slots.feet,'sabaton'])});
export const defaults=Object.freeze({...prior.defaults});
export function appearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid Leon outfit');
 for(const [k,v] of Object.entries(value))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid Leon outfit '+k);
 return {...defaults,...value};
}
export function legacyAppearance(value={}){const g=appearance(value);return {...g,body:g.body==='royalplate'?'blue':g.body,feet:g.feet==='sabaton'?'brown':g.feet}}
export function readAppearance(storage){try{const raw=storage.getItem(KEY);return raw===null?appearance(prior.readAppearance(storage)):appearance(JSON.parse(raw))}catch{return appearance()}}
export function saveAppearance(storage,value){const g=appearance(value);try{storage.setItem(KEY,JSON.stringify(g))}catch{}return g}
const bodyBattle=[[107,132,69,61,0],[106,130,69,61,0],[108,134,69,61,0],[107,133,69,61,0],[107,130,69,61,0],[106,133,69,61,0],[100,132,69,61,0],[105,134,69,61,0],[104,132,69,61,0],[108,134,69,61,0],[107,130,69,61,0],[106,132,69,61,0],[103,133,69,61,0],[110,132,69,61,0],[108,136,69,61,0],[119,134,63,61,-43],[119,137,61,59,-56],[132,140,63,55,-70],[130,143,62,53,-67],[105,131,69,61,0]];
const bootsBattle=Array.from({length:20},(_,i)=>i===15?[[106,177,21,29,22,0],[165,153,24,28,-65,1]]:i===16?[[120,176,21,29,-15,0],[179,143,24,30,-70,1]]:i===17?[[137,178,23,29,-18,0],[218,128,25,29,-80,1]]:i===18?[[135,169,25,28,-63,0],[181,137,25,28,-85,1]]:(()=>{const c=bodyBattle[i];return [[c[0]-24,c[1]+43,23,28,12,0],[c[0]+39,c[1]+44,23,28,-13,1]]})());
const fieldBoots=[[[43,79,10,18,0,0],[53,79,10,18,0,1]],[[42,79,10,18,0,0],[52,79,10,18,0,1]],[[43,78,10,18,0,0],[53,78,10,18,0,1]],[[42,79,10,18,0,0],[52,79,10,18,0,1]],[[46,80,13,19,0,1]],[[42,78,10,18,25,1],[61,78,10,18,-20,1]],[[36,75,10,18,37,1],[54,79,11,19,0,1]],[[42,78,10,18,25,1],[61,78,10,18,-20,1]],[[43,79,10,18,0,0],[53,79,10,18,0,1]],[[43,79,10,18,0,0],[54,75,10,18,0,1]],[[48,79,11,18,0,0]],[[43,79,10,18,0,0],[54,75,10,18,0,1]],[[49,80,13,19,0,0]],[[35,78,10,18,20,0],[53,78,10,18,-25,0]],[[42,79,11,19,0,0],[60,75,10,18,-37,0]],[[35,78,10,18,20,0],[53,78,10,18,-25,0]]];
const runBoots=[[[48,79,12,20,0,0]],[[48,77,12,20,0,0]],[[48,79,12,20,0,0]],[[48,77,12,20,0,0]],[[29,75,13,20,40,1],[61,79,13,22,-18,1]],[[32,75,13,20,32,1],[61,78,13,22,-20,1]],[[36,68,13,20,56,1],[58,79,13,22,0,1]],[[28,73,13,20,42,1],[62,79,13,22,-16,1]],[[48,79,12,20,0,0]],[[48,76,12,20,0,0]],[[48,79,12,20,0,0]],[[48,76,12,20,0,0]],[[35,79,13,22,18,0],[67,75,13,20,-40,0]],[[35,78,13,22,20,0],[64,75,13,20,-32,0]],[[38,79,13,22,0,0],[60,68,13,20,-56,0]],[[34,79,13,22,16,0],[68,73,13,20,-42,0]]];
export function placement(kind,index){
 if(!Number.isInteger(index)||index<0)throw Error('invalid outfit index');
 if(kind==='battle'){if(index>=20)throw Error('invalid battle index');return {body:[...bodyBattle[index],0],boots:bootsBattle[index].map(p=>p.slice()),blade:prior.placements('battle')[index].blade}}
 if(kind==='victory'||kind==='cheer'){if(index!==0)throw Error('invalid result index');return {body:[124,132,61,68,0,0],boots:[[107,174,24,32,0,0],[155,174,23,32,0,1]],blade:[94,145,55,186]}}
 if(!['field','run'].includes(kind)||index>=16)throw Error('invalid field index');
 const row=Math.floor(index/4),col=index%4,run=kind==='run';
 const body=run?[row===1?51:row===3?45:48,54,row%2?27:38,36,row===1?-22:row===3?22:0,row===2?1:0]:[48,54,row%2?25:36,36,0,row===2?1:0];
 return {body,boots:(run?runBoots:fieldBoots)[row*4+col].map(p=>p.slice()),blade:null}
}
const eq=(a,b,i)=>a[i+3]===b[i+3]&&(a[i+3]===0||[0,1,2].every(k=>Math.abs(a[i+k]-b[i+k])<=2));
const warmSkin=(r,g,b)=>r>=140&&g>=86&&r-g>=15&&r-g<=93&&g-b>=9&&g-b<=83;
function nearBlade(x,y,seg){if(!seg)return false;const [rx,ry,tx,ty]=seg,dx=tx-rx,dy=ty-ry,L=Math.hypot(dx,dy),t=((x-rx)*dx+(y-ry)*dy)/(L*L),d=((x-rx)*-dy+(y-ry)*dx)/L;return t>=-.23&&t<=1.14&&Math.abs(d)<13}
function sample(texture,spec,x,y,part){
 const [cx,cy,w,h,ang,flip]=spec,theta=ang*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta),dx=x+.5-cx,dy=y+.5-cy;
 let u=(dx*c+dy*s)/w+.5,v=(-dx*s+dy*c)/h+.5;
 if(u<0||u>=1||v<0||v>=1)return -1;
 const [sx,sw,sh]=part==='boots'?[192,64,96]:[flip?96:0,96,128];
 if(part==='boots'&&flip)u=1-u;
 return (Math.min(sh-1,Math.floor(v*sh))*256+sx+Math.min(sw-1,Math.floor(u*sw)))*4;
}
export function outfitPixels(raw,base,texture,kind,index,value={}){
 const g=appearance(value),small=kind==='field'||kind==='run',w=small?96:240,h=small?96:216;
 if(raw.length!==w*h*4||base.length!==raw.length||texture.length!==256*128*4)throw Error('outfit raster dimensions');
 const out=new Uint8ClampedArray(base),p=placement(kind,index);let body=0,boots=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,[r,v,b,a]=raw.subarray(i,i+4);
  if(!a||!eq(raw,base,i)||nearBlade(x,y,p.blade))continue;
  if(g.body==='royalplate'){
   const q=sample(texture,p.body,x,y,'body'),[cx,cy,bw,bh]=p.body;
   const headLimit=small?39:kind==='battle'&&index>=15&&index<=18?102:101;
   const skin=warmSkin(r,v,b),outerArm=Math.abs(x-cx)>bw*.34&&y>cy-bh*.12;
   if(q>=0&&texture[q+3]===255&&y>=headLimit&&!skin&&!outerArm){out.set(texture.subarray(q,q+4),i);body++}
  }
  if(g.feet==='sabaton'){
   const leather=r>v+8&&v>b+4&&r<174,blue=r<110&&b>r+12&&b>v+6;
   if((leather||blue)&&!warmSkin(r,v,b))for(const spec of p.boots){const q=sample(texture,spec,x,y,'boots');if(q>=0&&texture[q+3]===255){out.set(texture.subarray(q,q+4),i);boots++;break}}
  }
 }
 return {pixels:out,body,boots};
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;Object.defineProperties(c,{naturalWidth:{value:w},naturalHeight:{value:h}});return c}
function context(c){const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;return g}
function raster(im){const c=canvas(im.naturalWidth??im.width,im.naturalHeight??im.height),g=context(c);g.drawImage(im,0,0);return g}
function texturePixels(asset){if((asset?.naturalWidth??asset?.width)!==256||(asset?.naturalHeight??asset?.height)!==128)throw Error('Leon outfit asset dimensions');return raster(asset).getImageData(0,0,256,128).data}
function paintCell(dst,src,tex,kind,index,g,dx,dy,sx=dx,sy=dy){
 const small=kind==='field'||kind==='run',w=small?96:240,h=small?96:216;
 const orig=src.getImageData(sx,sy,w,h),base=dst.getImageData(dx,dy,w,h);
 base.data.set(outfitPixels(orig.data,base.data,tex,kind,index,g).pixels);dst.putImageData(base,dx,dy)
}
export function equippedImage(source,kind,value={},asset=null,outfit=null){
 const g=appearance(value),base=prior.equippedImage(source,kind,legacyAppearance(g),asset);
 if(g.body!=='royalplate'&&g.feet!=='sabaton')return base;
 if(!['field','run'].includes(kind))throw Error('use applyBattleOutfit for battle');
 const src=raster(source),dst=raster(base),tex=texturePixels(outfit);
 for(let i=0;i<16;i++)paintCell(dst,src,tex,kind,i,g,i%4*96,Math.floor(i/4)*96);
 return dst.canvas;
}
export function applyBattleOutfit(base,raw,victory,cheer,value={},asset=null){
 const g=appearance(value);if(g.body!=='royalplate'&&g.feet!=='sabaton')return base;
 const dst=raster(base),src=raster(raw),tex=texturePixels(asset);
 if(dst.canvas.width!==1440||dst.canvas.height!==864||src.canvas.width!==1440||src.canvas.height!==864)throw Error('Leon battle outfit size');
 for(let i=0;i<20;i++)paintCell(dst,src,tex,'battle',i,g,i%6*240,Math.floor(i/6)*216);
 for(const [kind,img,x] of [['victory',victory,480],['cheer',cheer,720]])paintCell(dst,raster(img),tex,kind,0,g,x,648,0,0);
 return dst.canvas;
}
