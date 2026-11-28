import {artSize} from './gear-options-r66.js';
import {bladeMask} from './fia-blades-r54.js?v=54';
import {materialMasks} from './fia-blades-r55.js?v=55';

const tileWidth = 128;
const tileHeight = 96;
const tileBounds = [2, 2, 124, 92];
const [artWidth, artHeight] = artSize;

function sampleArt(tile, u, v, texture) {
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return -1;
  const [left, top, width, height] = tileBounds;
  const x = tile % 3 * tileWidth + left + Math.floor(u * width);
  const y = Math.floor(tile / 3) * tileHeight + top + Math.floor(v * height);
  const offset = (y * artWidth + x) * 4;
  return texture[offset + 3] === 255 ? offset : -1;
}

export function rectanglePlan(raw, width, height, texture, tile, placement, mode = 'ink', view = [0, 1]) {
  if (!placement) return null;
  const [cx, cy, w, h, angle = 0] = placement;
  const cos = Math.cos(angle * Math.PI / 180), sin = Math.sin(angle * Math.PI / 180);
  const radius = Math.ceil(Math.hypot(w, h) / 2);
  const paint = [];
  for (let y = Math.max(1, Math.floor(cy - radius)); y <= Math.min(height - 2, Math.ceil(cy + radius)); y++) {
    for (let x = Math.max(1, Math.floor(cx - radius)); x <= Math.min(width - 2, Math.ceil(cx + radius)); x++) {
      const offset = (y * width + x) * 4;
      if (mode === 'ink' && !raw[offset + 3]) continue;
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const u = (dx * cos + dy * sin) / w + 0.5;
      const v = (-dx * sin + dy * cos) / h + 0.5;
      if (u < 0 || u >= 1) continue;
      const q = sampleArt(tile, view[0] + u * (view[1] - view[0]), v, texture);
      if (q >= 0) paint.push(offset, q);
    }
  }
  return {paint: Uint32Array.from(paint), mode};
}

export function weaponPlan(raw, texture, segment, {tile, kind, pose, slot, fallen = false, result = false}) {
  const [rootX, rootY, tipX, tipY] = segment;
  const dx = tipX - rootX, dy = tipY - rootY, length = Math.hypot(dx, dy);
  const leon = slot === undefined;
  const overlap = leon ? null : materialMasks(raw, kind, pose)?.[slot];
  const exposed = leon || overlap ? null : bladeMask(kind, pose, slot);
  const remove = [], paint = [], tint = [];
  for (let y = 1; y < 215; y++) for (let x = 1; x < 239; x++) {
    const pixel = y * 240 + x, i = pixel * 4;
    const t = ((x - rootX) * dx + (y - rootY) * dy) / (length * length);
    const across = ((x - rootX) * -dy + (y - rootY) * dx) / length;
    if (overlap) {
      if (overlap[pixel]) tint.push(i);
      continue;
    }
    if (t < -.30 || t > 1.22 || Math.abs(across) > 17) continue;
    // Leave the hand and any wrapped hilt in front of the new weapon.
    const start = leon ? (fallen ? .13 : .06) : .06;
    if (raw[i + 3] && t >= start && (leon ? t <= 1.17 && Math.abs(across) < (t < .22 ? 10 : 8) : exposed?.[pixel])) {
      remove.push(i);
    }
    const u = (leon ? .83 : slot === 0 ? .80 : .735) - t * (result ? .82 : .76);
    const band = leon ? 22 : slot === 0 ? 19 : 22;
    const q = sampleArt(tile, u, .5 + across / band, texture);
    if (q >= 0) paint.push(i, q);
  }
  return {remove: Uint32Array.from(remove), paint: Uint32Array.from(paint), tint: Uint32Array.from(tint),
    kind: slot === 0 ? 'ivy' : 'amethyst', mode: 'under'};
}

function samePixel(a, b, i) {
  return a[i + 3] === b[i + 3] && Math.abs(a[i] - b[i]) <= 2 &&
    Math.abs(a[i + 1] - b[i + 1]) <= 2 && Math.abs(a[i + 2] - b[i + 2]) <= 2;
}

export function applyLayers(raw, base, texture, layers) {
  const out = new Uint8ClampedArray(base);
  for (const layer of layers) {
    if (!layer) continue;
    const {remove, paint, tint, mode, kind} = layer;
    if (remove) for (const i of remove) if (samePixel(out, raw, i)) out.fill(0, i, i + 4);
    if (tint) {
      const colors = kind === 'ivy' ? [.49, 1.19, .80] : [1.12, .71, 1.34];
      for (const i of tint) {
        if (!samePixel(out, raw, i)) continue;
        for (let channel = 0; channel < 3; channel++) out[i + channel] = raw[i + channel] * colors[channel];
      }
    }
    for (let index = 0; index < paint.length; index += 2) {
      const i = paint[index], q = paint[index + 1];
      if (mode === 'under' && (out[i + 3] || (!base[i + 3] && raw[i + 3]))) continue;
      if (mode === 'ink' && (!out[i + 3] || !raw[i + 3])) continue;
      out[i] = texture[q]; out[i + 1] = texture[q + 1]; out[i + 2] = texture[q + 2];
      if (mode !== 'ink') out[i + 3] = 255;
    }
  }
  return out;
}

export function readGearTexture(context) {
  if (context.canvas.width !== artWidth || context.canvas.height !== artHeight) throw new Error('Invalid gear art dimensions');
  return context.getImageData(0, 0, artWidth, artHeight).data;
}
