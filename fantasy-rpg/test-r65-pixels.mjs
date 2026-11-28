// Checks the real art and composition without requiring a browser.
import {readFileSync, writeFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as gear from './leon-gear-r65.js';
import {makeMantlePlan, applyMantle, poseCounts} from './leon-mantle-layer-r65.js';
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
const art = png('assets/r65/leon-mantle.png');
let checks = 0;
const ok = (value, message) => {checks++; if (!value) throw new Error(message);};
ok(art.w === 384 && art.h === 96, 'Atlas dimensions');
for (let i = 0; i < art.pixels.length; i += 4) {
  const [r, g, b, a] = art.pixels.subarray(i, i + 4);
  ok(a === 0 || (a === 255 && !(r > 160 && b > 125 && g < 80)), 'Binary alpha and clean color key');
}
const references = [
  ['battle','assets/r26/leon-battle.png',20,0],
  ['result','assets/r57/party-victory.png',1,0],
  ['result','assets/r58/party-cheer.png',1,1],
  ['field','assets/field-atlas.png',16,0],
  ['run','assets/r52/leon-run.png',16,0],
];
const rows = [];
for (const [kind, path, count, firstPose] of references) {
  const im = png(path);
  const w = kind === 'battle' || kind === 'result' ? 240 : 96;
  const h = w === 240 ? 216 : 96;
  const columns = im.w / w;
  const review = [];
  for (let i = 0; i < count; i++) {
    const label = `${kind} ${i + firstPose}`;
    const raw = crop(im, i % columns * w, Math.floor(i / columns) * h, w, h);
    const plan = makeMantlePlan(raw, art.pixels, kind, i + firstPose);
    const equipped = new Uint8ClampedArray(raw);
    applyMantle(plan, equipped);
    let silhouette = 0, changes = 0, violations = 0;
    const affected = new Set();
    for (const layer of [plan.rear, plan.cloth]) for (let j = 0; j < layer.length; j += 2) affected.add(layer[j]);
    for (let j = 0; j < raw.length; j += 4) {
      const x = j / 4 % w;
      const y = Math.floor(j / 4 / w);
      const alpha = equipped[j + 3];
      if (!raw[j + 3] && alpha) silhouette++;
      if (raw[j + 3] && alpha !== raw[j + 3]) violations++;
      if (alpha && (x === 0 || x === w - 1 || y === 0 || y === h - 1)) violations++;
      if ([0, 1, 2, 3].some(channel => raw[j + channel] !== equipped[j + channel])) {
        changes++;
        if (!affected.has(j)) violations++;
      }
    }
    ok(silhouette > 0 && violations === 0, `${label}: silhouette, alpha and cell bounds`);
    ok(plan.cloth.length > 0, `${label}: attachment to source garment`);

    const otherGear = new Uint8ClampedArray(raw);
    for (let j = 0; j < plan.rear.length; j += 2) otherGear.set([19, 167, 241, 255], plan.rear[j]);
    for (let j = 0; j < plan.cloth.length; j += 2) {
      const offset = plan.cloth[j];
      otherGear.set(j % 4 ? [112, 62, 209, 255] : [0, 0, 0, 0], offset);
    }
    const before = new Uint8ClampedArray(otherGear);
    applyMantle(plan, otherGear);
    ok(before.every((pixel, offset) => pixel === otherGear[offset]), `${label}: equipment and deleted pixels protected`);
    if (process.env.MANTLE_REVIEW_DIR) review.push(Buffer.from(equipped));
    rows.push({kind, pose: i + firstPose, silhouette, changes});
  }
  if (process.env.MANTLE_REVIEW_DIR) {
    writeFileSync(`${process.env.MANTLE_REVIEW_DIR}/${kind}-${firstPose}.rgba`, Buffer.concat(review));
  }
}
ok(rows.length === Object.values(poseCounts).reduce((a, b) => a + b, 0), 'All 54 fitted source poses');

const values = new Map();
const storage = {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
const previousKey = 'fantasy-leon-appearance-r62';
storage.setItem(previousKey, JSON.stringify({main: 'royalsword', body: 'royalplate', feet: 'sabaton'}));
const previous = storage.getItem(previousKey);
ok(gear.readAppearance(storage).body === 'royalplate', 'Previous value migrates');
storage.setItem(gear.KEY, '{');
ok(gear.readAppearance(storage).main === 'royalsword', 'Corrupt current value recovers old setting');
let combinations = [{}];
for (const [slot, options] of Object.entries(gear.slots)) combinations = combinations.flatMap(value => options.map(option => ({...value, [slot]: option})));
for (const value of combinations) {
  const saved = gear.saveAppearance(storage, value);
  ok(JSON.stringify(saved) === JSON.stringify(gear.readAppearance(storage)), 'All six slots save and reload');
  const current = gear.previousAppearance(value);
  ok(Object.keys(value).every(slot => current[slot] === (slot === 'body' && value.body === 'crimsonmantle' ? 'blue' : value[slot])), 'Only mantle maps to base body');
}
ok(combinations.length === 288 && storage.getItem(previousKey) === previous, '288 options and legacy storage intact');
console.log(JSON.stringify({checks, poses: rows.length, combinations: combinations.length,
  silhouetteRange: [Math.min(...rows.map(row => row.silhouette)), Math.max(...rows.map(row => row.silhouette))], failures: 0}));
