window.ElementArt={draw(g,element,x,y,age){const kind={fire:'fire',water:'ice',wind:'thunder'}[element];if(!kind)return;g.save();g.translate(x-506,y-264);
function line(points,color,width,alpha){g.strokeStyle=color;g.lineWidth=width;g.globalAlpha=alpha;g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke();}
function ribbon(t,offset,power){if(age>260)return;const fade=Math.max(0,1-age/260)*power,p=palettes[kind];g.save();g.globalCompositeOperation='lighter';g.shadowColor=p[1];g.shadowBlur=18;g.globalAlpha=fade;
if(kind==='fire'){for(const [w,c]of [[26,p[0]],[12,p[1]],[3,p[3]]]){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(411+offset,150);g.quadraticCurveTo(461,224,530,291);g.stroke();}}
else if(kind==='ice'){for(let i=0;i<5;i++){const bx=445+i*29,tip=320-(35+i%3*19)*Math.min(1,.4+age/100);g.fillStyle=i%2?p[1]:p[2];g.beginPath();g.moveTo(bx-12,326);g.lineTo(bx,tip);g.lineTo(bx+9,326);g.fill();g.strokeStyle=p[3];g.lineWidth=2;g.beginPath();g.moveTo(bx,tip);g.lineTo(bx+4,323);g.stroke();}}
else{const pts=[[382,263],[416,263],[431,254],[446,270],[463,256],[481,265],[508,264]];line(pts,p[1],9,fade*.7);line(pts,p[3],2,fade);}
g.restore();}
const palettes={fire:['#bd3508','#f87618','#ffd15b','#fffbd9'],ice:['#1673b3','#42bfe3','#a8efff','#f0ffff'],thunder:['#4b32b3','#9470ef','#cbd1ff','#ffffff']};
function mist(x,y,r,color,alpha){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=alpha;const z=g.createRadialGradient(x,y,0,x,y,r);z.addColorStop(0,color);z.addColorStop(1,'transparent');g.fillStyle=z;g.fillRect(x-r,y-r,r*2,r*2);g.restore();}
function elementEffects(t){
 const age=t-615,p=palettes[kind];
 ribbon(t-535,0,kind==='thunder'?.65:1);ribbon(t-559,-9,.32);ribbon(t-583,10,.18);
 if(age<0)return;
 if(age<180)mist(506,264,70,p[2],Math.pow(1-age/180,2)*.65);
 if(kind==='fire'&&age<1100){
  for(let i=0;i<32;i++){const life=410+i%8*85,q=age/life;if(q>=1)continue;const a=i*2.399,v=30+i%7*13,x=506+Math.cos(a)*v*q+18*Math.sin(q*3+i)*q,y=264+Math.sin(a)*v*q-95*q*q;
   g.save();g.globalCompositeOperation='lighter';g.globalAlpha=(1-q)*.85;g.fillStyle=i%3?p[1]:p[3];g.shadowColor=p[1];g.shadowBlur=7;g.beginPath();g.moveTo(x,y-7*(1-q));g.quadraticCurveTo(x+5,y+4,x,y+9*(1-q));g.quadraticCurveTo(x-4,y+2,x,y-7*(1-q));g.fill();g.restore();
  }
  if(age>100){const q=(age-100)/1000;mist(532+q*15,268-q*58,40+q*30,'#984623',Math.sin(q*Math.PI)*.14);}
 }
 if(kind==='ice'&&age<1050){
  const q=age/1050;
  for(let i=0;i<18;i++){const a=i*2.399,v=40+i%6*15,x=506+Math.cos(a)*v*q*1.5,y=264+Math.sin(a)*v*q+100*q*q;g.save();g.translate(x,y);g.rotate(i+q*(i%2?3:-3));g.globalAlpha=(1-q)*.9;const h=(9+i%4*3)*(1-q*.4);g.fillStyle=p[1];g.beginPath();g.moveTo(0,-h);g.lineTo(4,0);g.lineTo(0,h*.55);g.lineTo(-3,0);g.closePath();g.fill();g.fillStyle=p[3];g.beginPath();g.moveTo(0,-h);g.lineTo(1,0);g.lineTo(-3,0);g.closePath();g.fill();g.restore();}
  for(let i=0;i<5;i++)mist(470+i*25+(i-2)*q*15,321-q*12,25+q*27,p[1],Math.sin(Math.PI*q)*.12);
 }
 if(kind==='thunder'&&age<410){
  for(let k=0;k<7;k++){const a=k*.9-2.5,life=160+k%3*85,q=age/life;if(q>=1)continue;const pts=[[506,264]];for(let j=1;j<=6;j++){const r=j*(12+k%3*3),bend=Math.sin(j*7+k*5)*11*Math.sin(j/6*Math.PI);pts.push([506+Math.cos(a)*r-Math.sin(a)*bend,264+Math.sin(a)*r+Math.cos(a)*bend]);}g.save();g.globalCompositeOperation='lighter';g.shadowColor=p[1];g.shadowBlur=10;line(pts,p[1],4,(1-q)*.5);line(pts,p[3],1.2,1-q);if(k%2===0){const b=pts[3];line([b,[b[0]+22,b[1]-16],[b[0]+36,b[1]-13]],p[2],.8,1-q);}g.restore();}
 }
}

elementEffects(615+age);g.restore();}};
