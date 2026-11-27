// Fia R36 — original integer-pixel art, 120×108 native cells, 2× atlas.
// Battle only: no gameplay/stat changes. Positive x is rear; enemies are left.
const W=120,H=108,AX=63,AY=96,cols=6;
const C={outline:'#252b31',hair0:'#683b32',hair1:'#a05235',hair2:'#cb8050',hair3:'#e9ab70',hair4:'#f5cc98',skin0:'#a85f4c',skin1:'#e3a37e',skin2:'#f5c59c',skin3:'#ffe0b7',green0:'#173f3c',green1:'#265a50',green2:'#477b64',green3:'#78a28a',green4:'#a0c0a3',leather0:'#382e32',leather1:'#65483c',leather2:'#976a4b',gold:'#d4ae72',gold2:'#f2d49a',steel0:'#3e5664',steel1:'#7994a0',steel2:'#b9d3dc',steel3:'#eff7eb',black:'#2c333a',cloth:'#414b4c',cloth2:'#69736c',white:'#fff4da',eye:'#32534b'};
const P=[
 // dx, dy, lean, forward wrist x/y, rear wrist x/y, forward tip x/y, rear tip x/y, front foot x/y, rear foot x/y, mode
 [0,0,0,43,68,77,62,21,77,98,45,49,96,78,96,0],
 [0,-1,0,43,67,77,61,21,75,98,43,49,96,78,96,0],
 [0,1,0,42,69,78,63,19,78,100,46,49,96,78,96,0],
 [1,1,1,46,65,80,53,29,45,100,26,49,96,79,96,0],
 [3,3,2,51,62,82,54,40,35,106,32,51,96,80,96,0],
 [2,4,3,46,67,82,59,26,56,105,48,49,96,81,96,0],
 [-7,3,-5,30,60,70,67,5,39,92,80,34,96,79,96,0],
 [-9,2,-6,29,70,70,63,4,82,91,48,33,96,78,96,0],
 [-5,3,-3,39,67,64,59,16,83,43,34,42,96,76,96,0],
 [-8,2,-5,40,73,29,62,22,90,5,52,36,96,78,96,0],
 [-5,3,-2,43,66,36,72,23,43,9,83,42,96,76,96,0],
 [0,1,0,43,69,77,63,21,78,98,46,49,96,78,96,0],
 [2,4,0,44,53,67,58,69,27,38,32,47,96,80,96,0],
 [2,5,0,45,55,67,59,70,31,36,34,47,96,80,96,0],
 [5,0,4,48,70,83,71,30,84,102,79,50,96,82,96,0],
 [4,2,2,48,73,80,72,31,89,99,84,50,96,80,96,0],
 [0,0,0,43,68,77,62,21,77,98,45,49,96,78,96,1],
 [0,-3,-1,42,54,76,51,22,31,94,28,49,96,78,96,0]
];
const rgb=Object.fromEntries(Object.entries(C).map(([k,v])=>[k,[parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16),255]]));
export function fiaPixels(index){
 const p=P[index];if(!p)throw RangeError('Fia frame');
 const [dx,dy,lean,fx,fy,rx,ry,ftx,fty,rtx,rty,lx,ly,bx,by,down]=p;
 const data=new Uint8ClampedArray(W*H*4);
 const put=(x,y,k)=>{x=Math.round(x);y=Math.round(y);if(down){const a=x-AX,b=y-AY;x=AX-b*.89+a*.25-24;y=AY+a*.25+b*.06-6;x=Math.round(x);y=Math.round(y)}if(x>=0&&x<W&&y>=0&&y<H)data.set(rgb[k],(y*W+x)*4)};
 function poly(k,a){const xx=a.map(q=>q[0]),yy=a.map(q=>q[1]);for(let y=Math.floor(Math.min(...yy));y<=Math.ceil(Math.max(...yy));y++)for(let x=Math.floor(Math.min(...xx));x<=Math.ceil(Math.max(...xx));x++){let inP=false;for(let i=0,j=a.length-1;i<a.length;j=i++){const [u,v]=a[i],[s,t]=a[j];if((v>y+.5)!==(t>y+.5)&&x+.5<(s-u)*(y+.5-v)/(t-v)+u)inP=!inP}if(inP)put(x,y,k)}}
 function line(k,x,y,u,v,r=0){const n=Math.max(Math.abs(u-x),Math.abs(v-y),1);for(let i=0;i<=n;i++){const a=Math.round(x+(u-x)*i/n),b=Math.round(y+(v-y)*i/n);for(let j=-r;j<=r;j++)for(let z=-r;z<=r;z++)if(j*j+z*z<=r*r+1)put(a+j,b+z,k)}}
 const body=(k,a)=>poly(k,a.map(([x,y])=>[x+dx+(y<60?lean:0),y+dy]));
 const head=(k,a)=>poly(k,a.map(([x,y])=>[x+dx+lean,y+dy]));
 const hp=(x,y,k)=>put(x+dx+lean,y+dy,k);
 function limb(a,b,c,k,light,width=4){line('outline',...a,...b,width+1);line('outline',...b,...c,width+1);line(k,...a,...b,width);line(k,...b,...c,width);line(light,a[0]-1,a[1]-1,b[0]-1,b[1]-1,1);line(light,b[0]-1,b[1]-1,c[0]-1,c[1]-1,1)}
 function sword(x,y,tx,ty){const vx=tx-x,vy=ty-y,len=Math.hypot(vx,vy),ux=vx/len,uy=vy/len,nx=-uy,ny=ux;const q=(a,b)=>[Math.round(x+ux*a+nx*b),Math.round(y+uy*a+ny*b)];poly('outline',[q(-7,-2),q(5,-2),q(6,-4),q(len-4,-3),q(len,0),q(len-4,3),q(6,4),q(5,2),q(-7,2)]);poly('steel1',[q(5,-2),q(len-4,-2),q(len-1,0),q(len-5,2),q(5,2)]);poly('steel2',[q(6,-2),q(len-4,-2),q(len-1,0),q(7,0)]);line('steel3',...q(8,-1),...q(len-4,-1));line('gold',...q(4,-5),...q(4,5),1);line('leather1',...q(-6,0),...q(2,0),1);put(...q(-7,0),'gold2')}
 // rear leg and boot (tall dark leather, gold buckle)
 const hip=[65+dx,71+dy],backK=[(hip[0]+bx)/2+3,82+dy*.25],frontK=[(hip[0]+lx)/2-5,81+dy*.25];
 limb(hip,backK,[bx,by-7],'cloth','cloth2',5);
 poly('outline',[[bx-6,by-15],[bx+5,by-15],[bx+6,by-4],[bx+9,by-3],[bx+9,by],[bx-9,by],[bx-9,by-5],[bx-5,by-7]]);
 poly('leather1',[[bx-4,by-14],[bx+4,by-14],[bx+4,by-4],[bx+7,by-2],[bx-7,by-2],[bx-7,by-4],[bx-3,by-7]]);
 line('leather2',bx-3,by-12,bx-3,by-5,1);line('gold',bx-3,by-11,bx+2,by-11,1);
 // rear sword and arm, behind torso
 sword(rx,ry,rtx,rty);limb([70+dx+lean,54+dy],[77+dx,60+dy],[rx,ry],'green1','green3',4);
 line('leather0',rx,ry,rx+1,ry,4);line('skin1',rx,ry-1,rx+1,ry-1,2);put(rx-1,ry-2,'skin3');
 // front leg, lower shorter boot
 limb([58+dx,71+dy],frontK,[lx,ly-7],'black','cloth2',5);
 poly('outline',[[lx-5,ly-11],[lx+5,ly-12],[lx+6,ly-3],[lx+4,ly],[lx-12,ly],[lx-12,ly-4],[lx-6,ly-6]]);
 poly('leather2',[[lx-4,ly-10],[lx+4,ly-10],[lx+4,ly-3],[lx+2,ly-2],[lx-10,ly-2],[lx-10,ly-4],[lx-5,ly-6]]);
 line('gold2',lx-4,ly-8,lx+3,ly-8);line('leather1',lx-9,ly-3,lx+3,ly-3);
 // fitted short jacket, collar, leather belt and asymmetric tails
 body('outline',[[48,49],[65,46],[74,52],[77,62],[70,69],[75,77],[65,80],[59,74],[51,77],[44,70],[49,63],[44,55]]);
 body('green0',[[48,52],[65,49],[72,53],[74,61],[67,69],[72,76],[65,77],[59,71],[51,75],[47,69],[51,62]]);
 body('green2',[[49,52],[61,50],[67,53],[66,64],[62,68],[52,67],[52,61],[47,56]]);
 body('green3',[[49,53],[54,51],[57,54],[54,60],[50,59],[48,56]]);
 body('green1',[[62,54],[69,55],[72,61],[66,67],[63,65]]);
 body('green3',[[57,58],[59,59],[60,66],[56,65]]);
 body('gold',[[49,51],[52,50],[57,55],[59,57],[56,60]]);
 body('leather0',[[48,66],[66,67],[69,71],[50,72]]);
 body('gold',[[55,67],[61,67],[62,71],[55,71]]);
 body('leather1',[[57,68],[59,68],[59,70],[57,70]]);
 body('leather1',[[64,70],[69,71],[71,75],[67,77],[63,74]]);
 // neck and hair silhouette (short copper crop, side braid on visible side)
 head('outline',[[48,49],[48,44],[41,39],[39,31],[42,22],[48,16],[59,13],[70,16],[77,22],[79,33],[75,42],[72,48],[75,55],[68,60],[63,52],[56,50]]);
 head('hair0',[[42,30],[44,23],[50,18],[59,15],[69,18],[75,23],[77,33],[73,42],[70,47],[72,55],[68,57],[64,49],[55,47]]);
 head('hair1',[[43,29],[48,21],[56,18],[65,18],[71,23],[74,31],[71,39],[65,43],[58,39],[48,39]]);
 head('skin0',[[46,29],[58,24],[68,29],[69,40],[64,46],[57,50],[50,47],[44,42],[42,36]]);
 head('skin2',[[46,30],[58,27],[65,30],[67,39],[63,44],[57,47],[50,45],[45,41],[44,36]]);
 head('skin3',[[47,31],[53,29],[57,31],[57,35],[54,39],[48,38],[45,35]]);
 head('skin1',[[61,32],[66,33],[66,40],[62,44],[57,46],[58,43]]);
 // fringe locks and copper highlight ribbons
 head('hair1',[[43,30],[46,23],[54,19],[64,19],[70,24],[71,33],[66,30],[63,25],[60,30],[55,32],[56,25],[50,31],[45,35]]);
 head('hair2',[[44,29],[48,23],[54,20],[61,19],[66,22],[61,22],[57,27],[53,28],[54,23],[49,27],[46,32]]);
 head('hair3',[[48,23],[53,21],[59,20],[55,23],[51,25]]);
 head('hair2',[[65,22],[70,26],[72,32],[70,38],[67,36],[68,30]]);
 head('hair3',[[68,25],[70,28],[70,32],[68,30]]);
 head('hair1',[[67,37],[73,35],[75,42],[72,47],[69,48],[73,52],[70,57],[67,57],[64,52],[66,47],[64,43]]);
 head('hair2',[[68,38],[72,37],[73,41],[69,44],[67,43]]);
 head('hair3',[[68,39],[71,38],[71,40],[68,41]]);
 head('hair2',[[68,46],[71,45],[72,48],[69,51],[66,50]]);
 head('hair2',[[69,52],[72,51],[71,55],[68,56],[67,54]]);
 head('gold',[[67,56],[71,55],[71,57],[68,58]]);
 // face: stable eye pixels, warm shadow, small nose, closed mouth
 head('outline',[[46,34],[53,33],[55,35],[53,39],[48,39],[46,37]]);
 head('white',[[47,35],[53,35],[53,38],[48,38]]);
 head('eye',[[49,35],[52,35],[52,38],[49,38]]);
 hp(49,35,'white');hp(47,40,'skin1');hp(46,41,'skin3');hp(50,44,'hair0');hp(51,44,'hair0');
 head('skin1',[[59,36],[62,36],[62,41],[59,41]]);
 hp(61,38,'gold2');
 // front arm and blade are foremost, with sleeve folds and gloves
 sword(fx,fy,ftx,fty);
 limb([50+dx+lean,55+dy],[(50+dx+lean+fx)/2-3,(55+dy+fy)/2+3],[fx,fy],'green2','green3',4);
 line('green0',fx+2,fy+1,fx+3,fy+1,3);line('gold',fx+1,fy-2,fx+3,fy-2,1);
 line('leather0',fx,fy,fx-1,fy,3);line('skin2',fx,fy-1,fx-1,fy-1,2);put(fx-2,fy-2,'skin3');
 return data;
}
const fr=(i,ms)=>({x:i%cols*240,y:Math.floor(i/cols)*216,w:240,h:216,ms});
const seq=(ids,ms=100)=>ids.map((i,j)=>fr(i,Array.isArray(ms)?ms[j]:ms));
export const fiaMeta={file:'fia-battle',clips:{idle:seq([0,1,2,0],[160,180,160,180]),windup:seq([3,4,5]),attack:seq([6,7,8,9,10,11],[70,90,70,90,80,110]),guard:seq([12,13,12]),cast:seq([3,12,13,11]),hit:seq([14,15,11]),down:seq([16]),victory:seq([17,0]),revive:seq([15,0])}};
export function makeFiaAtlas(){const atlas=document.createElement('canvas');atlas.width=cols*240;atlas.height=Math.ceil(P.length/cols)*216;const a=atlas.getContext('2d');a.imageSmoothingEnabled=false;const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;const c=tmp.getContext('2d');for(let i=0;i<P.length;i++){const f=fr(i,0);c.putImageData(new ImageData(fiaPixels(i),W,H),0,0);a.drawImage(tmp,f.x,f.y,240,216)}return atlas}
export function fiaPortrait(){const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').putImageData(new ImageData(fiaPixels(0),W,H),0,0);const out=document.createElement('canvas');out.width=96;out.height=96;const g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,39,13,40,40,0,0,96,96);return out.toDataURL()}
