// Node 22: node --experimental-default-type=module fantasy-rpg/test-r60-pixels.mjs
// Exact source PNG decoding, fitted-layer checks and storage migration. No Canvas claims.
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as old from './leon-outfit-r60.js';
import * as outfit from './leon-outfit-r61.js';
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
let checks=0,cases=0,bytes=0,slots=0,oldMs=0,newMs=0,planMs=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
const values=[{},{body:'royalplate'},{feet:'sabaton'},{body:'royalplate',feet:'sabaton'},{body:'royalplate',feet:'black'},{body:'crimson',feet:'sabaton'}];
for(const [kind,path] of Object.entries(paths)){const im=png(path),small=['field','run'].includes(kind),w=small?96:240,h=small?96:216,n=small?16:kind==='battle'?20:1,cols=small?4:6;
 for(let i=0;i<n;i++){const raw=crop(im,i%cols*w,Math.floor(i/cols)*h,w,h);let t=performance.now();const plan=outfit.makeOutfitPlan(raw,texture,kind,i);planMs+=performance.now()-t;slots+=(plan.body.length+plan.boots.length)/2;
 const changed=new Uint8ClampedArray(raw),tolerance=new Uint8ClampedArray(raw);
 for(let j=0;j<raw.length;j+=4){if(!raw[j+3])continue;if(j%28===0)changed.fill(0,j,j+4);else if(j%44===0)changed[j]=(changed[j]+33)%256;if(j%16===0)tolerance[j]=Math.min(255,raw[j]+2)}
 for(const base of [raw,changed,tolerance])for(const g of values){t=performance.now();const a=old.outfitPixels(raw,base,texture,kind,i,g);oldMs+=performance.now()-t;t=performance.now();const b=outfit.applyOutfitPlan(plan,base,g);newMs+=performance.now()-t;ok(a.pixels.every((v,j)=>v===b.pixels[j]),'exact '+kind+' '+i);ok(a.body===b.body&&a.boots===b.boots,'counts');cases++;bytes+=a.pixels.length}
 }
}
const c=outfit.createPlanCache(),x={},y={},tex={},tex2={};let calls=0;const build=()=>({n:++calls}),first=c.get(x,tex,'a',build);for(let i=0;i<1000;i++)ok(c.get(x,tex,'a',build)===first,'reuse');ok(c.get(x,tex,'b',build)!==first,'cell');ok(c.get(y,tex,'a',build)!==first,'source');ok(c.get(x,tex2,'a',build)!==first,'texture');ok(calls===4,'builds');
console.log(JSON.stringify({checks,cases,bytes,slots,oldMs,newMs,planMs,failures:0},null,2));
