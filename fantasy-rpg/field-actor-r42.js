// R42 field presentation only. No changes to collision, movement speed or battle membership.
export const FIELD_ACTORS=Object.freeze(['leon','fia']);
export function fieldActor(value){return FIELD_ACTORS.includes(value)?value:'fia'}
export function nextFieldActor(value){return fieldActor(value)==='fia'?'leon':'fia'}
const rows=Object.freeze({south:0,east:1,north:2,west:3});
export function fieldFrame(state,anim=0,run=false){
 const row=Object.hasOwn(rows,state.spriteFacing)?rows[state.spriteFacing]:0;
 const elapsed=Number.isFinite(anim)?Math.max(0,anim):0;
 const col=state.moving?[1,2,3,0][Math.floor(elapsed/(run?83:125))%4]:0;
 return {row,col,sx:col*96,sy:row*96,sw:96,sh:96,dx:Math.round(state.x)-24,dy:Math.round(state.y)-45,dw:48,dh:48};
}
export function drawFieldActor(ctx,state,images,anim,run,actor){
 const f=fieldFrame(state,anim,run),image=images[fieldActor(actor)];
 if(!image)throw Error('field actor asset missing');
 ctx.drawImage(image,f.sx,f.sy,f.sw,f.sh,f.dx,f.dy,f.dw,f.dh);
}
