// R47: independent circlet and emerald brooch artwork; cosmetic only.
import {equippedImage as colourImage,dimensions,defaults as previousDefaults,slots as previousSlots,GEAR_KEY} from './fia-appearance-r46.js?v=46';
export {GEAR_KEY,dimensions};
export const slots=Object.freeze({...previousSlots,head:Object.freeze(['none','circlet']),accessory:Object.freeze(['none','brooch'])});
export const defaults=Object.freeze({...previousDefaults});
export function appearance(overrides={}){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('invalid appearance');
 for(const [k,v] of Object.entries(overrides))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid appearance: '+k);
 return {...defaults,...overrides};
}
export function readAppearance(storage){try{return appearance(JSON.parse(storage.getItem(GEAR_KEY)||'{}'))}catch{return appearance()}}
export function saveAppearance(storage,overrides){const g=appearance(overrides);try{storage.setItem(GEAR_KEY,JSON.stringify(g))}catch{}return g}
export const gearRects=Object.freeze([[0,0,64,22],[64,0,64,21],[128,0,64,21],[192,0,64,14],[256,0,39,32]].map(Object.freeze));
// Coordinates are relative to the source cell; the originals are never edited.
const battleAnchors={
 battle:[[122,65,47,0,132,112,10]],
 recovery:[[107,72,43,0,118,116,9],[99,104,42,-7,119,147,8],[81,140,40,-65,0,0,0],[107,93,43,0,121,138,8]],
 attack:[[122,69,47,0,135,116,10],[121,70,47,-6,143,116,9],[109,82,45,-10,127,127,9],[123,64,47,-5,0,0,0],[113,66,47,-6,130,111,9],[119,64,47,0,131,111,9]],
 stance:[[118,64,45,0,0,0,0],[111,82,44,-7,0,0,0],[120,64,45,0,132,113,9],[130,52,44,0,125,107,10],[134,53,44,0,127,107,10],[135,50,44,0,125,105,10]]
};
export function anchors(kind){
 if(Object.hasOwn(battleAnchors,kind))return battleAnchors[kind].map(a=>[...a,1]);
 if(kind!=='field'&&kind!=='motion')throw Error('invalid source kind');
 const rows=[];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  let x=48,y=22,cx=48,cy=46;
  if(row===1){x=kind==='field'?49:[54,54,53,48][col];cx=x+5}
  if(row===3){x=kind==='field'?47:[40,40,42,47][col];cx=x-5}
  if(kind==='motion'&&col===1){y+=4;cy+=4}
  if(row===2)cx=cy=0;
  rows.push([x,y,25,0,cx,cy,row===2?0:5,[0,2,3,1][row]]);
 }
 return rows;
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;Object.defineProperties(c,{naturalWidth:{value:w},naturalHeight:{value:h}});return c}
function ornament(ctx,asset,id,x,y,width,angle=0,height=null){
 const [sx,sy,sw,sh]=gearRects[id],h=height??Math.max(1,Math.round(width*sh/sw));
 // The source circlet is a front arc, not a complete floating ring.
 ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);ctx.drawImage(asset,sx,sy,sw,sh,-Math.floor(width/2),0,width,h);ctx.restore();
}
export function equippedImage(source,kind,gear={},ornaments=null){
 const g=appearance(gear),base=colourImage(source,kind,{...g,head:'none',accessory:'none'});
 if(g.head==='none'&&g.accessory==='none')return base;
 if(!ornaments||ornaments.naturalWidth!==320||ornaments.naturalHeight!==32)throw Error('Fia R47 ornament size');
 const [w,h]=dimensions[kind],small=kind==='field'||kind==='motion',cw=small?96:240,ch=small?96:216,cols=w/cw;
 const out=canvas(w,h),overlay=canvas(w,h),ctx=out.getContext('2d'),o=overlay.getContext('2d');
 ctx.imageSmoothingEnabled=false;o.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
 for(const [i,a] of anchors(kind).entries()){
  const [x,y,ww,angle,cx,cy,size,view]=a;
  o.save();o.translate(i%cols*cw,Math.floor(i/cols)*ch);o.beginPath();o.rect(0,0,cw,ch);o.clip();
  if(g.head==='circlet')ornament(o,ornaments,view,x,y,ww,angle);
  if(g.accessory==='brooch'&&size)ornament(o,ornaments,4,cx,cy-Math.floor(size/2),size,0,size);
  o.restore();
 }
 // Blend ornament RGB inside the existing silhouette without increasing edge opacity.
 const dst=ctx.getImageData(0,0,w,h),src=o.getImageData(0,0,w,h).data;
 for(let i=0;i<src.length;i+=4){if(!dst.data[i+3]||!src[i+3])continue;const k=src[i+3]/255;for(let j=0;j<3;j++)dst.data[i+j]=Math.round(dst.data[i+j]*(1-k)+src[i+j]*k)}
 ctx.putImageData(dst,0,0);return out;
}
