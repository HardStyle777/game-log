// R50: R6.1 motion algorithm adapted to approved public R26 / R4 source.
// Cosmetic colour variants only. Existing source and default pixels remain unchanged.
export const KEY='fantasy-leon-appearance-r50';
export const defaults=Object.freeze({body:'blue',feet:'brown'});
export const choices=Object.freeze({body:Object.freeze(['blue','crimson']),feet:Object.freeze(['brown','black'])});
export function appearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid Leon appearance');
 for(const [k,v] of Object.entries(value))if(!Object.hasOwn(choices,k)||!choices[k].includes(v))throw Error('invalid Leon appearance '+k);
 return {...defaults,...value};
}
export function readAppearance(storage){try{return appearance(JSON.parse(storage.getItem(KEY)||'{}'))}catch{return appearance()}}
export function saveAppearance(storage,value){const g=appearance(value);try{storage.setItem(KEY,JSON.stringify(g))}catch{}return g}
export const RUN_MS=70,IDLE_MS=240;
const RUN=[[1,0],[1,-2],[2,-3],[2,-1],[3,0],[3,-2],[0,-3],[0,-1]];
const IDLE=[[0,0],[0,-1],[0,-1],[0,0]];
const cut=[44,45,44,45];
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
// Source coordinates relative to 240x216 battle cell. KO has a rotated torso.
const koTorso={15:[103,70,206,161],16:[87,80,213,165],17:[87,86,218,169],18:[86,89,211,177]};
const koBoot={15:[141,137,205,190],16:[139,125,218,187],17:[140,109,231,183],18:[140,124,219,181]};
function inRect(x,y,b){return b&&x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3]}
export function recolour(source,w,h,kind,value={}){
 const g=appearance(value),field=kind==='field',cw=field?96:240,ch=field?96:216;
 if(!['field','battle'].includes(kind)||w!==(field?384:1440)||h!==(field?384:864)||source.length!==w*h*4)throw Error('Leon source size');
 const out=new Uint8ClampedArray(source);let cloth=0,boots=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;if(!source[i+3])continue;
  const u=x%cw,v=y%ch,cell=Math.floor(y/ch)*(w/cw)+Math.floor(x/cw),r=source[i],b=source[i+2],gr=source[i+1],l=(r*3+gr*5+b*2)/10;
  const bodyZone=field?v>=44&&v<=82:koTorso[cell]?inRect(u,v,koTorso[cell]):v>=101&&v<=175;
  const feetZone=field?v>=77&&v<=91:koBoot[cell]?inRect(u,v,koBoot[cell]):v>=163&&v<=193;
  // Restrict the dye to blue cloth and dark brown boot leather; never regenerate a face or metal.
  if(g.body==='crimson'&&bodyZone&&r<110&&b>r+18&&b>gr+9){out[i]=clamp(l*1.48+20);out[i+1]=clamp(l*.60+8);out[i+2]=clamp(l*.55+10);cloth++}
  else if(g.feet==='black'&&feetZone&&r>gr+10&&gr>b+5&&r<150&&r-gr>=gr-b){out[i]=clamp(l*.65+5);out[i+1]=clamp(l*.70+8);out[i+2]=clamp(l*.82+14);boots++}
 }
 return {pixels:out,cloth,boots};
}
// Direct integer-pixel copying from each original R4 pose. No interpolation.
export function motionPixels(source,mode){
 if(source.length!==384*384*4||!['run','idle'].includes(mode))throw Error('Leon motion source');
 const seq=mode==='run'?RUN:IDLE,w=96*seq.length,h=384,pixels=new Uint8ClampedArray(w*h*4);
 let copied=0;
 for(let row=0;row<4;row++)for(let j=0;j<seq.length;j++){
  const [pose,bob]=seq[j],lean=mode==='run'?(row===1?2:row===3?-2:0):0;
  for(let y=0;y<96;y++){const dx=y<cut[row]?lean:Math.round(lean*Math.max(0,(75-y)/(75-cut[row])));
   for(let x=0;x<96;x++){const a=((row*96+y)*384+pose*96+x)*4;if(!source[a+3])continue;const u=x+dx,v=y+bob;if(u<1||u>=95||v<0||v>=95)throw Error('Leon motion cell edge');const b=((row*96+v)*w+j*96+u)*4;pixels.set(source.subarray(a,a+4),b);copied++}
  }
 }
 return {pixels,w,h,copied};
}
function sourcePixels(source,w,h){if((source.naturalWidth??source.width)!==w||(source.naturalHeight??source.height)!==h)throw Error('Leon image size');const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(source,0,0);return g.getImageData(0,0,w,h).data}
function canvas(pixels,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').putImageData(new ImageData(pixels,w,h),0,0);return c}
export function equippedImage(source,kind,value={}){
 const g=appearance(value);if(g.body==='blue'&&g.feet==='brown')return source;
 const [w,h]=kind==='field'?[384,384]:[1440,864],r=recolour(sourcePixels(source,w,h),w,h,kind,g);return canvas(r.pixels,w,h);
}
export function fieldMotion(source,mode){const r=motionPixels(sourcePixels(source,384,384),mode);return canvas(r.pixels,r.w,r.h)}
