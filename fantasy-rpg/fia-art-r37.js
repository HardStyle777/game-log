// R37 visual candidate. Preserve the illustrated original; never draw replacement polygons.
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
export const fiaMeta={file:'fia-battle',clips:{idle:seq([0,1,2,0],[160,180,160,180]),windup:seq([3,4,5]),attack:seq([6,7,8,9,10,11],[70,90,70,90,80,110]),guard:seq([12,13,12]),cast:seq([3,12,13,11]),hit:seq([14,15,11]),down:seq([16]),victory:seq([17,0]),revive:seq([15,0])}};
export function matrix(i){
 const [x,y,deg,s]=transforms[i],rad=deg*Math.PI/180,cos=Math.cos(rad)*s,sin=Math.sin(rad)*s;
 const sx=AX,sy=i===16?121:AY,tx=AX+x,ty=(i===16?127:AY)+y;
 return [cos,sin,-sin,cos,tx-cos*sx+sin*sy,ty-sin*sx-cos*sy];
}
export function frameBounds(i){
 const [a,b,c,d,e,f]=matrix(i),corners=[[35,50],[217,50],[35,192],[217,192]].map(([x,y])=>[a*x+c*y+e,b*x+d*y+f]);
 return [Math.floor(Math.min(...corners.map(p=>p[0]))),Math.floor(Math.min(...corners.map(p=>p[1]))),Math.ceil(Math.max(...corners.map(p=>p[0]))),Math.ceil(Math.max(...corners.map(p=>p[1])))];
}
export function makeFiaAtlas(source){
 if(source.naturalWidth!==W||source.naturalHeight!==H)throw Error('Fia R37 artwork size');
 const atlas=document.createElement('canvas');atlas.width=COLS*W;atlas.height=Math.ceil(transforms.length/COLS)*H;
 const ctx=atlas.getContext('2d');ctx.imageSmoothingEnabled=false;
 for(let i=0;i<transforms.length;i++){
  const f=fr(i,0);ctx.save();ctx.translate(f.x,f.y);
  ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
  ctx.transform(...matrix(i));ctx.drawImage(source,0,0);ctx.restore();
 }
 return atlas;
}
