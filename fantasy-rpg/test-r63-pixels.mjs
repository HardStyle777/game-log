// Node 22: node --experimental-default-type=module fantasy-rpg/test-r60-pixels.mjs
// Exact source PNG decoding, fitted-layer checks and storage migration. No Canvas claims.
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as gear from './fia-gear-r63.js';
import {makeDaggerPlans,applyDaggerPlans} from './fia-dagger-layer-r63.js';
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
const paths={battle:'assets/r37/fia-sprite.png',recovery:'assets/r41/fia-recovery.png',attack:'assets/r45/fia-attack.png',stance:'assets/r46/fia-guard-victory.png'},texture=png('assets/r48/fia-equipment.png').pixels;
let checks=0,cells=0;const rows=[],ok=(v,m)=>{checks++;if(!v)throw Error(m)};
for(const [kind,path] of Object.entries(paths)){const im=png(path);for(let i=0;i<im.w/240;i++){
 const raw=crop(im,i*240,0,240,216),p=makeDaggerPlans(raw,texture,kind,i);
 ok(applyDaggerPlans(p,raw,[false,false]).pixels.every((v,j)=>v===raw[j]),'default exact');
 const allowed=p.plans.map(s=>new Set([...s.cut,...Array.from(s.draw).filter((_,k)=>k%2===0),...Array.from(s.ink).filter((_,k)=>k%4===0)]));
 for(const active of [[true,false],[false,true],[true,true]]){
  const r=applyDaggerPlans(p,raw,active);let changed=0;
  for(let j=0;j<raw.length;j+=4)if([0,1,2,3].some(k=>raw[j+k]!==r.pixels[j+k])){changed++;ok(active.some((v,k)=>v&&allowed[k].has(j)),'slot scope');if(p.overlapping)ok(raw[j+3]===r.pixels[j+3],'overlap alpha')}
  ok(changed>0,'changed '+kind+i+active);
  for(let k=0;k<2;k++)if(!active[k])ok(Object.values(r.stats[k]).every(x=>x===0),'inactive slot');
 }
 // Changes and removals from prior equipment are never restored by a later blade.
 const modified=new Uint8ClampedArray(raw);
 const cuts=[...p.plans[0].cut,...p.plans[1].cut];for(const j of cuts)modified.fill(0,j,j+4);
 const q=applyDaggerPlans(p,modified,[true,true]);for(const j of cuts)ok(q.pixels[j+3]===0,'deletion protection');
 rows.push({kind,i,overlap:p.overlapping,stats:applyDaggerPlans(p,raw,[true,true]).stats});cells++;
}}
ok(cells===17,'source poses');
const m=new Map(),storage={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
storage.setItem('fantasy-fia-appearance-r59',JSON.stringify({main:'engraved',body:'rangercoat'}));ok(gear.readAppearance(storage).main==='engraved','migration');
let configs=0;for(const main of gear.slots.main)for(const offhand of gear.slots.offhand)for(const head of gear.slots.head)for(const body of gear.slots.body)for(const feet of gear.slots.feet)for(const accessory of gear.slots.accessory){const g={main,offhand,head,body,feet,accessory};ok(JSON.stringify(gear.saveAppearance(storage,g))===JSON.stringify(gear.readAppearance(storage)),'roundtrip');configs++}
ok(configs===576,'count');console.log(JSON.stringify({checks,cells,configs,rows,failures:0}));
