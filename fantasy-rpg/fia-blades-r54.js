// R54: opt-in improved exposed blade replacement. Retain R50 for overlapping poses.
import {equippedImage as previousImage,appearance} from './fia-armour-r50.js?v=50';
const masks={
 battle:[[[[79,123],[36,135],[[79,119],[83,127],[60,135],[38,139],[34,134],[56,127]]],[[185,128],[216,156],[[181,124],[188,124],[216,150],[218,158],[210,155],[184,133]]]]],
 attack:[
 [[[88,140],[53,154],[[87,135],[94,141],[65,157],[51,157],[51,152]]],[[183,124],[199,155],[[179,123],[186,119],[200,145],[201,158],[196,157]]]],
 [[[73,114],[31,107],[[74,109],[76,118],[50,118],[31,110],[29,105],[49,108]]],[[189,107],[215,126],[[187,103],[192,103],[215,119],[217,128],[208,124],[185,110]]]],
 [[[81,160],[56,180],[[81,155],[87,161],[67,177],[55,182],[54,179],[64,168]]],[[178,122],[195,150],[[175,120],[181,118],[194,139],[197,153],[192,152]]]],null,
 [[[76,137],[41,153],[[76,132],[82,138],[54,154],[40,155],[40,151]]],[[178,126],[210,146],[[176,122],[182,121],[210,141],[212,148],[205,147]]]],
 [[[86,140],[53,159],[[85,135],[91,141],[66,158],[52,160],[52,156]]],[[174,136],[199,162],[[173,131],[179,132],[199,156],[201,164],[196,162]]]]],
 stance:[null,null,
 [[[93,142],[70,166],[[92,138],[97,142],[81,160],[69,167],[69,163]]],[[170,143],[182,170],[[168,139],[174,139],[182,160],[184,172],[179,170]]]],
 [[[95,135],[80,158],[[93,131],[99,135],[82,158],[79,160],[79,154]]],[[159,135],[172,164],[[157,131],[163,132],[173,157],[174,165],[170,164]]]],
 [[[92,49],[68,73],[[91,45],[96,48],[78,69],[67,74],[67,70]]],[[160,134],[184,154],[[158,130],[164,130],[184,149],[186,155],[180,154]]]],
 [[[94,132],[73,155],[[92,128],[98,132],[81,153],[72,156],[72,152]]],[[161,130],[180,154],[[159,126],[165,127],[181,148],[182,155],[176,153]]]]]
};
const W=240,H=216;
const rects=[[31,2,71,34],[136,2,70,33]];
export function replacementCells(kind){return (masks[kind]??[]).flatMap((v,i)=>v?[i]:[])}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;Object.defineProperties(c,{naturalWidth:{value:w},naturalHeight:{value:h}});return c}
function inside(x,y,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,b]=poly[j],[c,d]=poly[i];const cross=(x-a)*(d-b)-(y-b)*(c-a);if(Math.abs(cross)<1e-7&&x>=Math.min(a,c)&&x<=Math.max(a,c)&&y>=Math.min(b,d)&&y<=Math.max(b,d))return true;if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit}return hit}
export function bladeMask(kind,cell,slot){const spec=masks[kind]?.[cell]?.[slot];if(!spec)return null;const [r,t,poly]=spec;const m=new Uint8Array(W*H),dx=t[0]-r[0],dy=t[1]-r[1],L=Math.hypot(dx,dy);
 const minX=Math.max(0,Math.min(...poly.map(p=>p[0]))-2),maxX=Math.min(W-1,Math.max(...poly.map(p=>p[0]))+2),minY=Math.max(0,Math.min(...poly.map(p=>p[1]))-2),maxY=Math.min(H-1,Math.max(...poly.map(p=>p[1]))+2);
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){let v=inside(x,y,poly);if(!v&&((x-r[0])*dx+(y-r[1])*dy)>4*L){for(let i=-2;i<=2&&!v;i++)for(let j=-2;j<=2&&!v;j++)if(Math.abs(i)+Math.abs(j)<=2&&inside(x+i,y+j,poly))v=true}if(v)m[y*W+x]=1}return m}
function paint(ctx,asset,spec,slot){const [r,t]=spec,[sx,sy,w,h]=rects[slot],ax=0,ay=20,bx=w-1,by=3,dx=t[0]-r[0],dy=t[1]-r[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,sl=Math.hypot(bx-ax,by-ay),ex=(bx-ax)/sl,ey=(by-ay)/sl,s=L/sl,k=s*.78;
 const a=ux*s*ex+(-uy)*k*(-ey),c=ux*s*ey+(-uy)*k*ex,b=uy*s*ex+ux*k*(-ey),d=uy*s*ey+ux*k*ex;
 ctx.save();ctx.transform(a,b,c,d,r[0]-a*ax-c*ay,r[1]-b*ax-d*ay);ctx.drawImage(asset,sx,sy,w,h,0,0,w,h);ctx.restore()}
export function equippedImage(source,kind,value={},ornaments=null,asset=null){
 const g=appearance(value),cells=replacementCells(kind),active=[g.main==='engraved',g.offhand==='engraved'];
 const prior=previousImage(source,kind,g,ornaments,asset);if(!cells.length||!active.some(Boolean))return prior;
 // Render the unreinforced source using the same armour and ornament settings. Only replace safe cells.
 const bare=previousImage(source,kind,{...g,main:'dagger',offhand:'dagger'},ornaments,asset),out=canvas(source.naturalWidth??source.width,H),ctx=out.getContext('2d'),scratch=canvas(W,H),sc=scratch.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;sc.imageSmoothingEnabled=false;ctx.drawImage(prior,0,0);
 for(const i of cells){sc.clearRect(0,0,W,H);sc.drawImage(bare,i*W,0,W,H,0,0,W,H);const p=sc.getImageData(0,0,W,H);for(let j=0;j<2;j++)if(active[j]){const m=bladeMask(kind,i,j);for(let k=0;k<m.length;k++)if(m[k])p.data.fill(0,k*4,k*4+4)}sc.putImageData(p,0,0);for(let j=0;j<2;j++)if(active[j])paint(sc,asset,masks[kind][i][j],j);ctx.clearRect(i*W,0,W,H);ctx.drawImage(scratch,i*W,0)}return out
}
