// Node 22: node --experimental-default-type=module fantasy-rpg/test-r60-pixels.mjs
// Exact source PNG decoding, fitted-layer checks and storage migration. No Canvas claims.
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as gear from './leon-gear-r62.js';
import {replacementPlan,applyReplacement,resultSegment} from './leon-sword-layer-r62.js';
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
const im=png('assets/r26/leon-battle.png'),texture=png('assets/r53/leon-equipment.png').pixels,segments=legacy.placements('battle').map(p=>p.blade);
const cells=segments.map((seg,i)=>({raw:crop(im,i%6*240,Math.floor(i/6)*216,240,216),seg,opts:{fallen:i>=15&&i<=18}}));
for(const path of ['assets/r57/party-victory.png','assets/r58/party-cheer.png'])cells.push({raw:crop(png(path),0,0,240,216),seg:resultSegment,opts:{result:true}});
let checks=0;const rows=[],ok=(v,m)=>{checks++;if(!v)throw Error(m)};
for(const [i,{raw,seg,opts}] of cells.entries()){
 const plan=replacementPlan(raw,texture,seg,opts),r=applyReplacement(plan,raw),cut=new Set(plan.cut),draw=new Set(Array.from(plan.draw).filter((_,j)=>j%2===0));
 ok(r.removed>50&&r.placed>50,'sword coverage '+i);let outside=0,edge=0,retained=0;
 for(let j=0;j<raw.length;j+=4){const p=j/4,x=p%240,y=Math.floor(p/240);if(r.pixels[j+3]&&(x===0||x===239||y===0||y===215))edge++;if([0,1,2,3].some(k=>raw[j+k]!==r.pixels[j+k])&&!cut.has(j)&&!draw.has(j))outside++;if(raw[j+3]&&!cut.has(j)&&raw[j+3]===r.pixels[j+3])retained++}
 ok(!edge&&!outside&&retained>1000,'cell boundaries '+i);
 const altered=new Uint8ClampedArray(raw);for(let j=0;j<plan.cut.length;j+=3){const k=plan.cut[j];altered[k]=255-altered[k];if(Math.abs(altered[k]-raw[k])<=2)altered[k+1]=255-altered[k+1]}
 const q=applyReplacement(plan,altered);ok(q.protectedCount>0,'protected overlay '+i);
 for(let j=0;j<plan.cut.length;j+=3){const k=plan.cut[j];ok(q.pixels.subarray(k,k+4).every((x,n)=>x===altered[k+n]),'protected pixel '+i)}
 const deleted=new Uint8ClampedArray(raw);for(let j=0;j<plan.cut.length;j+=5)deleted.fill(0,plan.cut[j],plan.cut[j]+4);const d=applyReplacement(plan,deleted);
 for(let j=0;j<plan.cut.length;j+=5)ok(d.pixels[plan.cut[j]+3]===0,'deleted pixels not restored');
 rows.push({i,removed:r.removed,placed:r.placed,protected:q.protectedCount});
}
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
storage.setItem('fantasy-leon-appearance-r60',JSON.stringify({body:'royalplate',feet:'sabaton',main:'sapphire'}));ok(gear.readAppearance(storage).main==='sapphire','migration');
let configs=0;for(const main of gear.slots.main)for(const offhand of gear.slots.offhand)for(const head of gear.slots.head)for(const body of gear.slots.body)for(const feet of gear.slots.feet)for(const accessory of gear.slots.accessory){const g={main,offhand,head,body,feet,accessory};ok(JSON.stringify(gear.saveAppearance(storage,g))===JSON.stringify(gear.readAppearance(storage)),'roundtrip');configs++}
ok(configs===216,'configs');console.log(JSON.stringify({checks,configs,rows,failures:0}));
