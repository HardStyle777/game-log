// Server exposes exactly four verified source files from the private repository.
export async function loadRuntime(){
 const [{core},{battle},reference,fixture]=await Promise.all([import('./engine/src/core/combat-math.js'),import('./engine/src/core/battle-engine.js'),fetch('./engine/data/core/reference-input-v0.4.json').then(r=>{if(!r.ok)throw Error('参照データがありません');return r.json()}),fetch('./engine/tests/fixtures/personal-contracts-v0.5.json').then(r=>{if(!r.ok)throw Error('固有能力データがありません');return r.json()})]);return {core,battle,reference,fixture};
}
