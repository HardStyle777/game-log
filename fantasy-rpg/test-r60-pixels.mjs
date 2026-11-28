// Node 22: node --experimental-default-type=module fantasy-rpg/test-r60-pixels.mjs
// Exact source PNG decoding, fitted-layer checks and storage migration. No Canvas claims.
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as outfit from './leon-outfit-r60.js';
import * as legacy from './leon-equipment-r53.js';
const load=p=>readFileSync(new URL(p,import.meta.url));
function png(p){
 const b=load(p),chunks=[];let w,h,depth,type,interlace,palette,alpha;
 for(let i=8;i+12<=b.length;){const n=b.readUInt32BE(i),tag=b.toString('ascii',i+4,i+8),d=b.subarray(i+8,i+8+n);
 if(tag==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9];interlace=d[12]}if(tag==='PLTE')palette=d;if(tag==='tRNS')alpha=d;if(tag==='IDAT')chunks.push(d);i+=n+12;if(tag==='IEND')break}
 if(depth!==8||![3,6].includes(type)||interlace!==0)throw Error('PNG format');
 const cpp=type===6?4:1,stride=w*cpp,raw=inflateSync(Buffer.concat(chunks)),scan=new Uint8Array(stride*h),pixels=new Uint8ClampedArray(w*h*4);
 function paeth(a,b,c){const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c}
 for(let y=0;y<h;y++)for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=cpp?scan[i-cpp]:0,b=y?scan[i-stride]:0,c=y&&x>=cpp?scan[i-stride-cpp]:0,f=raw[y*(stride+1)];scan[i]=(raw[y*(stride+1)+1+x]+(f===0?0:f===1?a:f===2?b:f===3?Math.floor((a+b)/2):paeth(a,b,c)))&255}
 if(type===6)pixels.set(scan);else for(let i=0;i<scan.length;i++){const k=scan[i];pixels.set([palette[k*3],palette[k*3+1],palette[k*3+2],alpha?.[k]??255],i*4)}return {w,h,pixels}
}
function crop(im,x,y,w,h){const out=new Uint8ClampedArray(w*h*4);for(let yy=0;yy<h;yy++)out.set(im.pixels.subarray(((y+yy)*im.w+x)*4,((y+yy)*im.w+x+w)*4),yy*w*4);return out}
const paths={battle:'assets/r26/leon-battle.png',field:'assets/field-atlas.png',run:'assets/r52/leon-run.png',victory:'assets/r57/party-victory.png',cheer:'assets/r58/party-cheer.png'};
const texture=png('assets/r60/leon-plate-parts.png').pixels;
let checks=0;const rows=[],ok=(v,m)=>{checks++;if(!v)throw Error(m)};
for(const [kind,p] of Object.entries(paths)){const im=png(p),small=kind==='field'||kind==='run',w=small?96:240,h=small?96:216,n=small?16:kind==='battle'?20:1,cols=small?4:6;
 for(let i=0;i<n;i++){const src=crop(im,i%cols*w,Math.floor(i/cols)*h,w,h),r=outfit.outfitPixels(src,src,texture,kind,i,{body:'royalplate',feet:'sabaton'}),base=outfit.outfitPixels(src,src,texture,kind,i,{});
 ok(base.pixels.every((v,j)=>v===src[j]),'default exact');ok(r.pixels.every((v,j)=>j%4!==3||v===src[j]),'alpha');ok(r.body>0,'body '+kind+i);ok(r.boots>0,'boots '+kind+i);
 const modified=new Uint8ClampedArray(src);for(let j=0;j<modified.length;j+=4)if(src[j+3]&&j%28===0)modified.fill(0,j,j+4);
 const safe=outfit.outfitPixels(src,modified,texture,kind,i,{body:'royalplate',feet:'sabaton'});ok(safe.pixels.every((v,j)=>src[j-j%4+3]===modified[j-j%4+3]||v===modified[j]),'erased pixels protected');rows.push({kind,i,body:r.body,boots:r.boots})
 }
}
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let configs=0;
for(const main of outfit.slots.main)for(const offhand of outfit.slots.offhand)for(const head of outfit.slots.head)for(const body of outfit.slots.body)for(const feet of outfit.slots.feet)for(const accessory of outfit.slots.accessory){const g={main,offhand,head,body,feet,accessory};ok(JSON.stringify(outfit.saveAppearance(storage,g))===JSON.stringify(outfit.readAppearance(storage)),'roundtrip');legacy.appearance(outfit.legacyAppearance(g));configs++}
ok(configs===144,'config count');
console.log(JSON.stringify({checks,configs,rows,failures:0},null,2));
