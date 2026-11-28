// R62: independently drawn visible sword, including the guard, with the gripping hand retained.
// Existing gear modes are unchanged. The hidden grip is not reconstructed.
export const resultSegment=Object.freeze([94,145,55,186]);
export function replacementPlan(raw,texture,segment,{fallen=false,result=false}={}){
 if(raw.length!==240*216*4||texture.length!==256*96*4||segment.length!==4)throw Error('sword source size');
 const [rx,ry,tx,ty]=segment,dx=tx-rx,dy=ty-ry,L=Math.hypot(dx,dy);
 if(!Number.isFinite(L)||L<20)throw Error('invalid sword segment');
 const cut=[],draw=[],start=fallen?.12:.04,stretch=result?.96:1.04;
 for(let y=0;y<216;y++)for(let x=0;x<240;x++){
  const t=((x-rx)*dx+(y-ry)*dy)/(L*L),d=((x-rx)*-dy+(y-ry)*dx)/L,j=(y*240+x)*4;
  if(raw[j+3]&&t>=start&&t<=1.2&&Math.abs(d)<(t<.24?12:9))cut.push(j);
  if(t<-.16||t>1.2||Math.abs(d)>=18)continue;
  const sx=Math.round(67-(t-.10)*65/stretch),sy=Math.round(19+d*65/L/.88);
  if(sx<2||sx>95||sy<2||sy>35)continue;
  const q=(sy*256+sx)*4;if(texture[q+3]>=128)draw.push(j,q);
 }
 return {raw:new Uint8ClampedArray(raw),texture,cut:Uint32Array.from(cut),draw:Uint32Array.from(draw),start};
}
export function applyReplacement(plan,base){
 if(base.length!==plan.raw.length)throw Error('sword base size');
 const out=new Uint8ClampedArray(base);let removed=0,placed=0,protectedCount=0;
 for(const i of plan.cut){
  if(![0,1,2,3].every(k=>Math.abs(base[i+k]-plan.raw[i+k])<=(k===3?0:2))){protectedCount++;continue}
  out.fill(0,i,i+4);removed++;
 }
 for(let k=0;k<plan.draw.length;k+=2){
  const i=plan.draw[k],q=plan.draw[k+1];
  if(out[i+3]!==0||(!base[i+3]&&plan.raw[i+3]))continue;
  out.set(plan.texture.subarray(q,q+4),i);placed++;
 }
 return {pixels:out,removed,placed,protectedCount};
}
export function replaceSwordCell(raw,base,texture,segment,opts){return applyReplacement(replacementPlan(raw,texture,segment,opts),base)}
