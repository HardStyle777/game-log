import {applyLayers,readGearTexture,rectanglePlan} from './gear-layer-r66.js';
import {luciaGear} from './lucia-options-r68.js';
import {battlePlacements,fieldPlacements} from './lucia-anchors-r68.js';

const sizes={battle:[960,648,240,216,battlePlacements],field:[384,384,96,96,fieldPlacements]};
const order=['body','feet','head','accessory','offhand','main'];
const bundle=new WeakMap(),textures=new WeakMap();

function raster(im) {
 const c=document.createElement('canvas');
 c.width=im.naturalWidth??im.width;c.height=im.naturalHeight??im.height;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,0,0);
 return ctx;
}
function preserve(plan,pixels,filter){
 if(!plan)return null;
 const kept=[];
 for(let i=0;i<plan.paint.length;i+=2){
  const a=plan.paint[i],b=plan.paint[i+1];
  if(filter(pixels[a],pixels[a+1],pixels[a+2]))kept.push(a,b);
 }
 return {...plan,paint:Uint32Array.from(kept)};
}
const skin=(r,g,b)=>r>102&&r>g+20&&g>b+6;
const cloth=(r,g,b)=>!skin(r,g,b)&&r<151&&b>=g*.95;
function spots(raw,w,h,art,p){
 const box=(tile,rect,mode='ink',view)=>rectanglePlan(raw,w,h,art,tile,rect,mode,view);
 const coat=preserve(box(3,p.coat),raw,cloth);
 // Preserve the rear seams when the front clasps are outside the viewer’s sight.
 const back=p.rear&&coat?{paint:new Uint32Array(),tint:coat.paint.filter((_,i)=>i%2===0),kind:'amethyst'}:coat;
 return {
  main:[preserve(box(0,p.book,'ink',p.opened?[0,.50]:[.50,1]),raw,(r,g,b)=>!skin(r,g,b))],
  offhand:[box(1,p.orbit)],
  head:[p.rear?null:box(2,p.head,'over')],
  body:[back],
  feet:p.boots.map((point,j)=>box(4,point,'ink',j%2?[0,1]:[1,0])),
  accessory:[box(5,p.pin)],
 };
}
function prepare(source,art,kind,w,h,rows){
 const existing=bundle.get(source);
 if(existing?.art===art&&existing.kind===kind)return existing;
 if(!textures.has(art))textures.set(art,readGearTexture(raster(art)));
 const ink=textures.get(art),ctx=raster(source);
 const cells=rows.map((p,i)=>{
  const x=i%4*w,y=Math.floor(i/4)*h,raw=ctx.getImageData(x,y,w,h).data;
  return {x,y,raw,slots:spots(raw,w,h,ink,p)};
 });
 const entry={art,kind,ink,cells};bundle.set(source,entry);return entry;
}
export function equipLucia(source,art,kind,value={}){
 const size=sizes[kind];
 if(!size||!source||(source.naturalWidth??source.width)!==size[0]||(source.naturalHeight??source.height)!==size[1])throw Error('Invalid Lucia sprite sheet');
 const gear=luciaGear.appearance(value),active=order.filter(k=>gear[k]!==luciaGear.defaults[k]);
 if(!active.length)return source;
 const [, , w,h,poses]=size,{cells,ink}=prepare(source,art,kind,w,h,poses);
 const out=raster(source);
 for(const {x,y,raw,slots} of cells){
  const painted=out.getImageData(x,y,w,h);
  painted.data.set(applyLayers(raw,painted.data,ink,active.flatMap(key=>slots[key])));
  out.putImageData(painted,x,y);
 }
 return out.canvas;
}
