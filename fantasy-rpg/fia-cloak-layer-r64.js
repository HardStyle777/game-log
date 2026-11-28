// R64: independent four-view cloak art, with pose-specific rear layer and rear-facing torso panel.
// All existing foreground equipment and intentionally removed source pixels remain protected.
const placements={"battle":[[1,116,99,84,74]],"recovery":[[1,110,102,82,70],[1,110,132,78,52],[3,99,143,96,40],[1,113,119,75,65]],"attack":[[1,120,101,84,71],[1,120,98,99,70],[1,115,111,86,66],[1,116,101,83,72],[1,111,103,84,69],[1,119,105,77,69]],"stance":[[1,114,108,72,65],[1,113,119,69,56],[1,119,104,73,66],[1,119,98,70,72],[1,119,97,77,72],[1,120,98,71,72]],"field":[[0,27,40,44,36],[0,28,40,43,36],[0,27,40,44,36],[0,28,40,43,36],[2,22,40,39,36],[2,20,40,43,36],[2,24,40,37,37],[2,20,40,43,36],[0,27,40,44,38],[0,27,40,43,36],[0,27,40,44,38],[0,27,40,43,36],[1,35,40,39,36],[1,33,40,43,36],[1,35,40,37,37],[1,33,40,43,36]],"motion":[[0,27,40,44,37],[0,27,43,44,35],[0,27,40,44,37],[0,27,40,44,36],[2,15,43,46,31],[2,14,47,48,29],[2,13,43,49,31],[2,22,40,39,36],[0,27,40,44,37],[0,27,44,44,34],[0,27,40,44,37],[0,27,40,44,38],[1,34,44,48,31],[1,35,47,48,29],[1,34,44,48,31],[1,35,40,39,36]]};
export const cloakSource='r64/fia-cloak';
export function cloakPlacements(kind){if(!Object.hasOwn(placements,kind))throw Error('cloak kind');return placements[kind].map(r=>r.slice())}
export function cloakPlan(raw,texture,kind,index){
 const small=kind==='field'||kind==='motion',w=small?96:240,h=small?96:216,p=placements[kind]?.[index];
 if(!p||raw.length!==w*h*4||texture.length!==384*96*4)throw Error('cloak source size');
 const [art,x,y,ww,hh]=p;if(x<1||y<1||x+ww>=w||y+hh>=h)throw Error('cloak bounds');
 const rear=[],panel=[];
 for(let yy=0;yy<hh;yy++)for(let xx=0;xx<ww;xx++){
  const px=x+xx,py=y+yy,i=(py*w+px)*4,q=(Math.min(95,Math.floor((yy+.5)*96/hh))*384+art*96+Math.min(95,Math.floor((xx+.5)*96/ww)))*4;
  if(texture[q+3]===0)continue;if(texture[q+3]!==255)throw Error('cloak alpha');
  if(!raw[i+3])rear.push(i,q);
  else if(small&&index>=8&&index<12&&py>=y+5&&py<y+28&&px>=39&&px<=58){
   const r=raw[i],g=raw[i+1],b=raw[i+2],green=g>=r*.88&&g>b+4&&r<180,dark=Math.max(r,g,b)<85&&r<g*1.4;
   if(green||dark)panel.push(i,q);
  }
 }
 return {raw:new Uint8ClampedArray(raw),texture,rear:Uint32Array.from(rear),panel:Uint32Array.from(panel)};
}
export function applyCloak(plan,base){
 if(base.length!==plan.raw.length)throw Error('cloak base size');
 const out=new Uint8ClampedArray(base);let rear=0,panel=0,protectedCount=0;
 for(let j=0;j<plan.rear.length;j+=2){const i=plan.rear[j],q=plan.rear[j+1];if(base[i+3]!==0){protectedCount++;continue}out.set(plan.texture.subarray(q,q+4),i);rear++}
 for(let j=0;j<plan.panel.length;j+=2){const i=plan.panel[j],q=plan.panel[j+1];if(base[i+3]!==plan.raw[i+3]||[0,1,2].some(k=>Math.abs(base[i+k]-plan.raw[i+k])>2)){protectedCount++;continue}out.set(plan.texture.subarray(q,q+4),i);panel++}
 return {pixels:out,rear,panel,protectedCount};
}
