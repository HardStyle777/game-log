// Shared character visual catalogue. Do not substitute another character's source.
export const actorIds=Object.freeze(['leon','fia']);
export const slotIds=Object.freeze(['main','offhand','head','body','feet','accessory']);
const frozen=x=>Object.freeze(x);
export const characters=frozen({
 leon:frozen({name:'レオン',editable:true,portrait:'assets/leon-portrait.png',field:'assets/field-atlas.png',battle:'assets/r26/leon-battle.png',battleFrame:'idle',fieldFrame:frozen({x:0,y:0,w:96,h:96}),fieldMotion:'R6.1 candidate integer lean/bob run and idle; original walk',slots:frozen({main:'鉄の剣',offhand:'なし',head:'なし',body:'青の鎧',feet:'茶革ブーツ',accessory:'なし'})}),
 fia:frozen({name:'フィア',editable:true,portrait:'assets/r37/fia-portrait.png',field:'assets/r42/fia-field.png',motion:'assets/r43/fia-motion.png',battle:'assets/r37/fia-sprite.png',battleFrame:'source',fieldFrame:frozen({x:0,y:0,w:96,h:96}),fieldMotion:'dedicated walk/run/idle',slots:frozen({main:'初期短剣',offhand:'初期短剣',head:'なし',body:'深緑の軽装',feet:'茶革ブーツ',accessory:'なし'})})
});
export function character(id){if(!Object.hasOwn(characters,id))throw Error('unknown character '+id);return characters[id]}
export function normalBattleFrame(id,meta){const c=character(id),f=c.battleFrame==='source'?{x:0,y:0,w:240,h:216}:meta?.actors?.[id]?.clips?.idle?.[0];if(!f||f.w!==240||f.h!==216||!Number.isInteger(f.x)||!Number.isInteger(f.y)||f.x<0||f.y<0)throw Error('invalid normal battle frame '+id);return {x:f.x,y:f.y,w:f.w,h:f.h}}
export function drawPreview(ctx,image,frame,w,h){if(!image||frame.x+frame.w>(image.naturalWidth??image.width)||frame.y+frame.h>(image.naturalHeight??image.height))throw Error('preview source bounds');ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,0,0,w,h)}
