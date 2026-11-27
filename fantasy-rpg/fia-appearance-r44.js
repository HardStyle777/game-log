// R44 representative equipment colours only. No inventory or stat changes.
export const GEAR_KEY='fantasy-fia-appearance-r44';
export const slots=Object.freeze({main:Object.freeze(['dagger']),offhand:Object.freeze(['dagger']),head:Object.freeze(['none']),body:Object.freeze(['green','blue']),feet:Object.freeze(['brown','black']),accessory:Object.freeze(['none'])});
export const defaults=Object.freeze({main:'dagger',offhand:'dagger',head:'none',body:'green',feet:'brown',accessory:'none'});
export function appearance(overrides={}){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('invalid appearance');
 for(const [k,v] of Object.entries(overrides))if(!Object.hasOwn(slots,k)||!slots[k].includes(v))throw Error('invalid appearance: '+k);
 return {...defaults,...overrides};
}
export function readAppearance(storage){try{return appearance(JSON.parse(storage.getItem(GEAR_KEY)||'{}'))}catch{return appearance()}}
export function saveAppearance(storage,gear){const g=appearance(gear);try{storage.setItem(GEAR_KEY,JSON.stringify(g))}catch{}return g}
export const dimensions=Object.freeze({field:[384,384],motion:[384,384],battle:[240,216],recovery:[960,216]});
function bootRegion(kind,x,y){
 if(kind==='field'||kind==='motion')return y%96>=72&&y%96<90;
 if(kind==='battle')return y>=157&&((x>=75&&x<=110)||(x>=157&&x<=192));
 const col=Math.floor(x/240),u=x%240;
 if(col===0)return y>=161&&u>=83&&u<=160;
 if(col===1)return y>=171&&u>=145&&u<=176;
 if(col===2)return y>=162&&u>=165&&u<=203;
 return y>=164&&((u>=83&&u<=115)||(u>=159&&u<=181&&y>=173));
}
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
export function recolourPixels(source,w,h,kind,gear={}){
 const g=appearance(gear),dim=dimensions[kind];
 if(!dim||w!==dim[0]||h!==dim[1]||source.length!==w*h*4)throw Error('appearance dimensions');
 const out=new Uint8ClampedArray(source);let cloth=0,boots=0;
 if(g.body==='green'&&g.feet==='brown')return {pixels:out,cloth,boots};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,r=source[i],v=source[i+1],b=source[i+2];if(!source[i+3])continue;
  // Green fabric only, below the hair/face. Gold, skin, steel and eye pixels remain intact.
  const bodyZone=kind==='field'||kind==='motion'?y%96>=43&&y%96<83:kind==='battle'?y>=97: y>=(Math.floor(x/240)===2?133:Math.floor(x/240)===0?97:121);
  if(g.body==='blue'&&bodyZone&&v>=r+3&&v>=b+4&&v>=20){out[i]=clamp(r*.76);out[i+1]=clamp(v*.86);out[i+2]=clamp(b+(v-b)*1.6+9);cloth++;continue}
  // Lower boot leather only. Preserve metal edging and brighter gold highlights.
  if(g.feet==='black'&&bootRegion(kind,x,y)&&r>=v+8&&v>=b+3&&r<150&&r-v>=v-b){const l=r*.28+v*.55+b*.17;out[i]=clamp(l*.72);out[i+1]=clamp(l*.79);out[i+2]=clamp(l*.90);boots++}
 }
 return {pixels:out,cloth,boots};
}
export function equippedImage(source,kind,gear={}){
 const g=appearance(gear),dim=dimensions[kind],w=source.naturalWidth??source.width,h=source.naturalHeight??source.height;
 if(!dim||w!==dim[0]||h!==dim[1])throw Error('appearance image size');
 if(g.body==='green'&&g.feet==='brown')return source;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0);
 const im=ctx.getImageData(0,0,w,h),result=recolourPixels(im.data,w,h,kind,g);im.data.set(result.pixels);ctx.putImageData(im,0,0);
 // R41 atlas loader accepts image dimensions; Canvas has no naturalWidth/Height by default.
 Object.defineProperties(c,{naturalWidth:{value:w},naturalHeight:{value:h}});return c;
}
