import {appearanceSources, buildBattleAppearance, buildLuciaField} from './battle-appearance-r68.js';
import {luciaBattle, luciaField} from './lucia-motion-r68.js';
import {luciaGear} from './lucia-options-r68.js';
import {buildBattleAppearance as previous} from './battle-appearance-r67.js?v=67';

export async function verifyLucia() {
  const keys = [...appearanceSources, luciaField];
  const assets = Object.fromEntries(await Promise.all(keys.map(async key => {
    const image = new Image(); image.src = 'assets/' + key + '.png'; await image.decode(); return [key, image];
  })));
  let checks = 0, frames = 0;
  function ok(value, message) {checks++; if (!value) throw Error(message);}
  function raster(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth ?? image.width; canvas.height = image.naturalHeight ?? image.height;
    const ctx = canvas.getContext('2d',{willReadFrequently:true}); ctx.drawImage(image,0,0);
    return {w:canvas.width, data:ctx.getImageData(0,0,canvas.width,canvas.height).data};
  }
  const configurations = Object.entries(luciaGear.slots).reduce((rows,[slot,values]) =>
    rows.flatMap(row => values.map(value => ({...row,[slot]:value}))), [{}]);
  const base = {battle:raster(assets[luciaBattle]), field:raster(assets[luciaField])};
  const changes = {};
  function frameChanges(image, reference, cellWidth, cellHeight, count, label) {
    const {w, data} = raster(image), differences = [];
    for (let idx = 0; idx < count; idx++) {
      const x = idx % 4 * cellWidth, y = Math.floor(idx / 4) * cellHeight;
      let seen = 0, border = 0, difference = 0;
      for (let row = 0; row < cellHeight; row++) for (let col = 0; col < cellWidth; col++) {
        const n = ((y+row)*w+x+col)*4;
        if (data[n+3]) {
          seen++;
          if (!row||!col||row===cellHeight-1||col===cellWidth-1) border++;
        }
        if (data[n]!==reference.data[n]||data[n+1]!==reference.data[n+1]||data[n+2]!==reference.data[n+2]||data[n+3]!==reference.data[n+3]) difference++;
      }
      ok(seen>0&&border===0, `${label}: invalid sprite cell ${idx}`);
      differences.push(difference);frames++;
    }
    return differences;
  }
  for (const gear of configurations) {
    const altered = Object.keys(gear).filter(slot=>gear[slot]!==luciaGear.defaults[slot]);
    const combat = frameChanges(buildBattleAppearance('lucia',assets,gear),base.battle,240,216,12,'battle');
    const field = frameChanges(buildLuciaField(assets,gear),base.field,96,96,16,'field');
    ok(combat.some(Boolean)===(altered.length>0), 'Battle choices visible');
    ok(field.some(Boolean)===(altered.length>0), 'Exploration alternatives are visible');
    if (altered.length===1) changes[altered[0]] = {battle:combat.filter(Boolean).length,field:field.filter(Boolean).length};
  }
  for (const [id, gear] of [['leon',{main:'sunblade',offhand:'sunshield',body:'crimsonmantle',accessory:'sunclasp'}],
    ['fia',{main:'ivyfang',offhand:'amethystguard',head:'amethystband',body:'royalcloak'}],['glen',{main:'fortressblade',offhand:'fortressshield',head:'helm'}]]) {
    const a=raster(previous(id,assets,gear)).data, b=raster(buildBattleAppearance(id,assets,gear)).data;
    ok(a.length===b.length&&a.every((value,index)=>value===b[index]), `${id} R67 battle appearance`);
  }
  return {checks,frames,configurations:configurations.length,slotCoverage:changes,failures:0};
}
