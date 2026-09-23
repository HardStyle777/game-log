/* Dedicated right-upper to left-lower cut. Coordinates measured on the new sheet. */
(function(root){
const frames=[0,1,2,3,4,5,6],starts=[0,.08,.18,165/405,.54,.70,.88];
const anchors=[[337,484],[331,484],[324,484],[334,484],[354,953],[342,953],[336,953],[333,953]];
const blades=[[280,249,376,89],[548,161,742,42],[974,166,1123,238],[1265,347,1141,439],[159,808,33,902],[641,833,523,923],[944,832,824,920]];
function create(g,sprite){
 return function(progress,{effects=true}={}){
 const p=Math.max(0,Math.min(1,progress));let i=0;while(i<6&&p>=starts[i+1])i++;
 const f=frames[i],col=f%4,row=Math.floor(f/4),[ax,ay]=anchors[f],scale=.8;
 g.imageSmoothingEnabled=false;
 g.drawImage(sprite,col*384,row*512,384,512,340+(col*384-(col*384+ax))*scale,360+(row*512-ay)*scale,384*scale,512*scale);
 // Last poses never generate an endless glowing arc. The cut traverses the actual endpoints.
 if(effects&&p>=.22&&p<.64){
 const u=Math.max(0,Math.min(1,(p-.22)/(.407407-.22))),fade=Math.min(1,(.64-p)/.20);
 const point=t=>({x:455-210*t,y:118+224*t});
 g.save();g.globalCompositeOperation='lighter';
 for(const [w,c,a]of [[23,'#bc7413',.20],[11,'#ffcf67',.65],[3,'#fff9dc',.95]]){
 g.beginPath();const lo=Math.max(0,u-.85);for(let n=0;n<=30;n++){const t=lo+(u-lo)*n/30,q=point(t);if(n)g.lineTo(q.x+20*Math.sin(t*Math.PI),q.y);else g.moveTo(q.x,q.y);}g.strokeStyle=c;g.lineWidth=w;g.globalAlpha=fade*a;g.lineCap='round';g.shadowColor='#ffc456';g.shadowBlur=w*.6;g.stroke();}
 g.restore();
 }
 };
}
root.DiagonalSlash={create,starts,anchors};
})(typeof window==='object'?window:globalThis);
