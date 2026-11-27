// R40 guard, victory and recovery pose candidates. R37 original remains unchanged. Preserve the illustrated original; never draw replacement polygons.
// 240×216 source PNG, foot anchor (126,192). Motion frames are transforms of one source,
// not independently drawn attack poses. The separate 200×165 portrait is actual artwork.
const W=240,H=216,AX=126,AY=192,COLS=6;
// x, y, angle degrees, scale; rotation around the foot for upright poses.
export const transforms=Object.freeze([
 [0,0,0,1],[0,-1,0,1],[0,0,1,1],
 [1,0,3,1],[2,0,5,.99],[1,1,2,.99],
 [-2,0,-4,1],[-3,-1,-7,1],[-1,0,2,1],
 [-3,0,-5,1],[-1,0,-2,1],[0,0,0,1],
 [0,0,4,.98],[0,1,5,.97],
 [3,0,6,.98],[2,0,3,.99],
 [0,0,90,.70],[0,-2,-2,1]
].map(Object.freeze));
const fr=(i,ms)=>({x:i%COLS*W,y:Math.floor(i/COLS)*H,w:W,h:H,ms});
const seq=(ids,ms=100)=>ids.map((i,j)=>fr(i,Array.isArray(ms)?ms[j]:ms));
export const fiaMeta={file:'fia-battle',clips:{idle:seq([0,1,2,0],[160,180,160,180]),windup:seq([3,4,5]),attack:seq([6,7,8,9,10,11,18],[70,90,70,90,80,110,75]),guard:seq([19,20,20,19],[100,150,170,100]),cast:seq([3,12,13,11]),hit:seq([14,15,11]),down:seq([16]),victory:seq([21,22,23,23],[160,220,260,260]),revive:seq([16,24,19,0],[180,220,200,120])}};
export function matrix(i){
 const [x,y,deg,s]=transforms[i],rad=deg*Math.PI/180,cos=Math.cos(rad)*s,sin=Math.sin(rad)*s;
 const sx=AX,sy=i===16?121:AY,tx=AX+x,ty=(i===16?127:AY)+y;
 return [cos,sin,-sin,cos,tx-cos*sx+sin*sy,ty-sin*sx-cos*sy];
}
export function frameBounds(i){
 const [a,b,c,d,e,f]=matrix(i),corners=[[35,50],[217,50],[35,192],[217,192]].map(([x,y])=>[a*x+c*y+e,b*x+d*y+f]);
 return [Math.floor(Math.min(...corners.map(p=>p[0]))),Math.floor(Math.min(...corners.map(p=>p[1]))),Math.ceil(Math.max(...corners.map(p=>p[0]))),Math.ceil(Math.max(...corners.map(p=>p[1])))];
}
// Extract the original illustrated pixels, not replacement line-art. Keep the original idle intact.
const FRONT=[[115,101],[123,104],[120,112],[114,119],[105,124],[101,128],[97,132],[90,146],[0,146],[0,100],[93,100],[104,99]];
const REAR=[[145,93],[160,92],[175,94],[195,105],[240,110],[240,163],[207,163],[185,140],[178,133],[173,129],[169,124],[163,119],[155,114],[150,108],[145,105]];
export const jointAngles=Object.freeze({3:[20,-4],4:[43,-14],5:[28,-8],6:[43,-14],7:[-27,-10],8:[-12,-32],9:[4,120],10:[12,135],18:[-43,0],19:[25,105],20:[42,128],21:[32,-12],22:[57,-32],23:[65,-42],24:[16,65]});
function inside(x,y,poly){let b=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,c]=poly[i],[d,e]=poly[j];if((c>y)!==(e>y)&&x<(d-a)*(y-c)/(e-c)+a)b=!b}return b}
function canvas(){const c=document.createElement('canvas');c.width=W;c.height=H;return c}
function largestComponent(pixels){
 const seen=new Uint8Array(W*H),queue=new Int32Array(W*H);let best=[];
 for(let i=0;i<W*H;i++){
  if(seen[i]||!pixels[i*4+3])continue;
  let head=0,tail=1;queue[0]=i;seen[i]=1;
  while(head<tail){const n=queue[head++],x=n%W,y=Math.floor(n/W);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*W+xx;if(xx<0||xx>=W||yy<0||yy>=H||seen[k]||!pixels[k*4+3])continue;seen[k]=1;queue[tail++]=k}}
  if(tail>best.length)best=Array.from(queue.subarray(0,tail));
 }
 const keep=new Uint8Array(W*H);for(const k of best)keep[k]=1;
 for(let i=0;i<W*H;i++)if(!keep[i])pixels[i*4+3]=0;
 return pixels;
}
export function separatePixels(src){
 const layers=Array.from({length:3},()=>new Uint8ClampedArray(W*H*4));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,part=inside(x+.5,y+.5,FRONT)?1:inside(x+.5,y+.5,REAR)?2:0;layers[part].set(src.subarray(i,i+4),i)}
 return layers.map(largestComponent);
}
function armLayers(source){
 const c=canvas(),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(source,0,0);
 return separatePixels(g.getImageData(0,0,W,H).data).map(p=>{const a=canvas();a.getContext('2d').putImageData(new ImageData(p,W,H),0,0);return a});
}
function rotateLayer(g,layer,x,y,deg){g.save();g.translate(x,y);g.rotate(deg*Math.PI/180);g.translate(-x,-y);g.drawImage(layer,0,0);g.restore()}
function articulated(g,layers,angles){const [body,front,rear]=layers,[a,b]=angles;
 if(b<60){rotateLayer(g,rear,150,101,b);g.drawImage(body,0,0);rotateLayer(g,front,119,106,a)}
 else{g.drawImage(body,0,0);rotateLayer(g,front,119,106,a);rotateLayer(g,rear,150,101,b)}
}
export function makeFiaAtlas(source){
 if(source.naturalWidth!==W||source.naturalHeight!==H)throw Error('Fia R37 artwork size');
 const atlas=document.createElement('canvas');atlas.width=COLS*W;atlas.height=Math.ceil(25/COLS)*H;
 const ctx=atlas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const layers=armLayers(source);
 for(let i=0;i<25;i++){
  const f=fr(i,0);ctx.save();ctx.translate(f.x,f.y);
  ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
  if(jointAngles[i])articulated(ctx,layers,jointAngles[i]);else{ctx.transform(...matrix(i));ctx.drawImage(source,0,0)}ctx.restore();
 }
 return atlas;
}
