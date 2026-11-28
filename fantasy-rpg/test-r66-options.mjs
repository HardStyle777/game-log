import assert from 'node:assert/strict';
import {leonGear, fiaGear, leonOptions, fiaOptions} from './gear-options-r66.js';

const variants = slots => Object.entries(slots).reduce((rows, [slot, choices]) =>
  rows.flatMap(row => choices.map(choice => ({...row, [slot]: choice}))), [{}]);

for (const [id, gear, extras, oldVersion, number] of [
  ['leon', leonGear, leonOptions, 65, 864], ['fia', fiaGear, fiaOptions, 64, 1920],
]) {
  const oldKey = `fantasy-${id}-appearance-r${oldVersion}`;
  const legacy = id === 'leon' ? {body: 'crimsonmantle', main: 'royalsword'} : {body: 'royalcloak', main: 'moonfang'};
  const records = new Map([[oldKey, JSON.stringify(legacy)]]);
  const storage = {getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value)};
  assert.deepEqual(gear.readAppearance(storage), gear.appearance(legacy));
  const cases = variants(gear.slots);
  assert.equal(cases.length, number);
  for (const selected of cases) {
    assert.deepEqual(gear.saveAppearance(storage, selected), selected);
    assert.deepEqual(gear.readAppearance(storage), selected);
    const prior = gear.previousAppearance(selected);
    for (const [slot, choice] of Object.entries(selected)) {
      assert.equal(prior[slot], choice === extras[slot]?.id ? extras[slot].fallback : choice);
    }
  }
  assert.throws(() => gear.appearance({main: 'unknown'}));
  assert.throws(() => gear.appearance({unknown: 'main'}));
  records.set(gear.key, '{');
  assert.deepEqual(gear.readAppearance(storage), gear.appearance(legacy));
  assert.equal(records.get(oldKey), JSON.stringify(legacy));
  console.log(JSON.stringify({id, combinations: cases.length, saveMigration: true, failures: 0}));
}
