import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root));
const pngSize = path => {
  const data = read(path);
  assert.equal(data.subarray(1, 4).toString(), 'PNG');
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};

test('iPhone home-screen metadata, icons and offline cache stay complete', () => {
  const html = read('dist/index.html').toString();
  const manifest = JSON.parse(read('dist/manifest.webmanifest'));
  const worker = read('dist/sw.js').toString();
  const style = read('dist/style.css').toString();

  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /apple-mobile-web-app-status-bar-style/);
  assert.match(html, /rel="apple-touch-icon" href="icons\/apple-touch-icon\.png"/);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'any');
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512']);
  assert.deepEqual(pngSize('dist/icons/apple-touch-icon.png'), [180, 180]);
  assert.deepEqual(pngSize('dist/icons/icon-192.png'), [192, 192]);
  assert.deepEqual(pngSize('dist/icons/icon-512.png'), [512, 512]);
  for (const path of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
    assert.match(worker, new RegExp(`icons/${path.replace('.', '\\.')}`));
  }
  assert.match(worker, /monsters-extra\.webp/);
  assert.match(style, /\.sprite\.extra\{background-image:url\('monsters-extra\.webp'\);background-size:400% 200%\}/);
  assert.ok(read('dist/monsters-extra.webp').length > 500000);
});
