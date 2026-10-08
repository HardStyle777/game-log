import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('movement and battle feedback remain wired with reduced-motion support', () => {
  const game = fs.readFileSync('dist/game.js', 'utf8');
  const css = fs.readFileSync('dist/style.css', 'utf8');
  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /duration:110/);
  for (const name of ['battle-hit', 'battle-skill', 'battle-capture', 'battle-finish']) {
    assert.match(game, new RegExp(name));
    assert.match(css, new RegExp(name));
  }
  assert.match(css, /@keyframes strike/);
  assert.match(css, /@keyframes skillHit/);
  assert.match(css, /@keyframes capturePop/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
