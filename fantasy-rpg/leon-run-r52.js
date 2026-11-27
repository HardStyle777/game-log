// R52 running-only dye extension. Preserve the R50 walk and battle artwork.
import {appearance,recolour} from './leon-appearance-r50.js?v=50';
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
const trailingBoots={1:[[25,42,70,77],[25,46,70,77],[35,50,65,77],[20,43,61,77]],3:[[54,71,70,77],[50,71,70,77],[46,61,65,77],[53,76,61,77]]};
export function runningPixels(source,gear={}){
 const g=appearance(gear),result=recolour(source,384,384,'field',g),out=result.pixels;let cloth=0,boots=0;
 for(let y=0;y<384;y++)for(let x=0;x<384;x++){
  const i=(y*384+x)*4;if(!source[i+3])continue;const u=x%96,v=y%96,row=Math.floor(y/96),col=Math.floor(x/96),r=source[i],gr=source[i+1],b=source[i+2],l=(r*3+gr*5+b*2)/10;
  const cape=v<44&&((row===0&&v>=39&&(u<37||u>60))||(row===1&&v>=35&&u<48)||(row===2&&v>=36)||(row===3&&v>=35&&u>48));
  if(g.body==='crimson'&&cape&&r<110&&b>r+18&&b>gr+9){out[i]=clamp(l*1.48+20);out[i+1]=clamp(l*.60+8);out[i+2]=clamp(l*.55+10);cloth++}
  const p=trailingBoots[row]?.[col],foot=v<77&&(p?u>=p[0]&&u<=p[1]&&v>=p[2]&&v<p[3]:(row===0||row===2)&&u>=34&&u<=63&&v>=70);
  if(g.feet==='black'&&foot&&r>gr+10&&gr>b+5&&r<150&&r-gr>=gr-b){out[i]=clamp(l*.65+5);out[i+1]=clamp(l*.70+8);out[i+2]=clamp(l*.82+14);boots++}
 }
 return {...result,extraCloth:cloth,extraBoots:boots};
}
export function runningImage(source,gear={}){
 const g=appearance(gear);if((source.naturalWidth??source.width)!==384||(source.naturalHeight??source.height)!==384)throw Error('Leon R52 run dimensions');
 if(g.body==='blue'&&g.feet==='brown')return source;
 const c=document.createElement('canvas');c.width=c.height=384;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);const p=ctx.getImageData(0,0,384,384);p.data.set(runningPixels(p.data,g).pixels);ctx.putImageData(p,0,0);return c;
}
