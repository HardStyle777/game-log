// The mantle is fitted to the same source cells used by exploration and combat.
// Each row gives the art view, target rectangle and the safe edge of the old cape.
const battle = [
  [1, 128, 103, 86, 78, 156], [1, 128, 101, 87, 78, 156],
  [1, 127, 105, 85, 77, 156], [1, 128, 103, 87, 78, 156],
  [1, 130, 102, 90, 77, 159], [1, 128, 103, 86, 77, 156],
  [1, 127, 106, 88, 76, 155], [1, 130, 107, 85, 77, 158],
  [1, 128, 104, 89, 77, 157], [1, 128, 105, 86, 77, 156],
  [1, 129, 103, 87, 78, 157], [1, 128, 105, 87, 77, 157],
  [1, 127, 103, 87, 77, 156], [1, 133, 105, 89, 77, 162],
  [1, 132, 106, 88, 76, 161], [2, 133, 100, 91, 55, 162],
  [2, 134, 73, 84, 54, 162], [3, 124, 82, 87, 49, 155],
  [3, 116, 95, 79, 34, 148], [1, 128, 102, 86, 77, 156],
];
const result = [[1, 139, 102, 65, 83, 164], [1, 143, 103, 66, 82, 166]];
const walk = [
  [0, 20, 44, 58, 38, 0], [0, 21, 45, 56, 38, 0],
  [0, 21, 44, 56, 38, 0], [0, 22, 45, 54, 38, 0],
  [1, 19, 43, 37, 41, 42, true], [1, 17, 43, 37, 41, 40, true],
  [1, 19, 44, 37, 40, 42, true], [1, 19, 44, 37, 39, 42, true],
  [0, 19, 43, 56, 40, 0], [0, 19, 43, 56, 40, 0],
  [0, 20, 44, 56, 40, 0], [0, 20, 43, 56, 41, 0],
  [1, 41, 43, 36, 41, 54], [1, 41, 43, 39, 40, 54],
  [1, 42, 44, 35, 40, 54], [1, 41, 44, 36, 40, 54],
];
const run = [
  [0, 16, 42, 63, 36, 0], [0, 16, 43, 64, 35, 0],
  [0, 15, 42, 65, 37, 0], [0, 18, 43, 60, 35, 0],
  [2, 11, 43, 48, 32, 42, true], [2, 10, 42, 49, 30, 42, true],
  [2, 10, 43, 49, 32, 42, true], [2, 10, 42, 48, 31, 42, true],
  [0, 18, 41, 61, 39, 0], [0, 18, 46, 61, 34, 0],
  [0, 17, 42, 62, 39, 0], [0, 20, 42, 57, 38, 0],
  [2, 41, 44, 44, 32, 56], [2, 41, 43, 46, 31, 56],
  [2, 41, 43, 47, 33, 56], [2, 40, 42, 47, 31, 56],
];

export const mantleSource = 'r65/leon-mantle';
const poses = {battle, result, field: walk, run};
export const poseCounts = Object.freeze(Object.fromEntries(
  Object.entries(poses).map(([kind, cells]) => [kind, cells.length]),
));

function isCloth(raw, offset) {
  const [r, g, b] = raw.subarray(offset, offset + 3);
  return b > r + 8 && b > g + 3 && r < 132;
}

function visibleOldCape(kind, pose, x, y, top, edge, mirrored) {
  if (kind === 'battle' || kind === 'result') {
    const falling = kind === 'battle' && pose >= 15 && pose <= 18;
    return x >= edge && (falling || y >= top + Math.max(5, 18 - (x - edge) * 0.45));
  }
  const direction = Math.floor(pose / 4);
  if (direction === 2) return y >= top + 4 && y <= top + 34 && x >= 27 && x <= 69;
  if (direction === 0) return y >= top + 9 && (x <= 36 || x >= 61);
  return y >= top + 6 && (mirrored ? x <= edge : x >= edge);
}

export function makeMantlePlan(raw, texture, kind, pose) {
  const spec = Object.hasOwn(poses, kind) ? poses[kind][pose] : null;
  const small = kind === 'field' || kind === 'run';
  const width = small ? 96 : 240;
  const height = small ? 96 : 216;
  if (!spec || raw.length !== width * height * 4 || texture.length !== 384 * 96 * 4) {
    throw new Error('Invalid Leon mantle source');
  }

  const [view, x, y, w, h, edge, mirrored = false] = spec;
  const rear = [];
  const cloth = [];
  for (let row = 0; row < h; row++) {
    for (let column = 0; column < w; column++) {
      const px = x + column;
      const py = y + row;
      const offset = (py * width + px) * 4;
      const sx = Math.floor((column + 0.5) * 96 / w);
      const sy = Math.floor((row + 0.5) * 96 / h);
      const sample = (sy * 384 + view * 96 + (mirrored ? 95 - sx : sx)) * 4;
      if (raw[offset + 3] === 0) {
        if (texture[sample + 3] === 255) rear.push(offset, sample);
      } else if (visibleOldCape(kind, pose, px, py, y, edge, mirrored) && isCloth(raw, offset)) {
        // Recolor the surviving edge where the independent art does not overlap it.
        cloth.push(offset, texture[sample + 3] === 255 ? sample : -1);
      }
    }
  }
  return {raw, texture, rear: Int32Array.from(rear), cloth: Int32Array.from(cloth)};
}

export function applyMantle(plan, pixels) {
  const {raw, texture, rear, cloth} = plan;
  if (pixels.length !== raw.length) throw new Error('Invalid Leon mantle destination');
  for (let i = 0; i < rear.length; i += 2) {
    const offset = rear[i];
    if (pixels[offset + 3] === 0) pixels.set(texture.subarray(rear[i + 1], rear[i + 1] + 4), offset);
  }
  for (let i = 0; i < cloth.length; i += 2) {
    const offset = cloth[i];
    // Existing equipment may have altered or deliberately erased the source pixel.
    if (pixels[offset] !== raw[offset] || pixels[offset + 1] !== raw[offset + 1] ||
        pixels[offset + 2] !== raw[offset + 2] || pixels[offset + 3] !== raw[offset + 3]) continue;
    const sample = cloth[i + 1];
    if (sample >= 0) {
      pixels.set(texture.subarray(sample, sample + 3), offset);
    } else {
      const shade = raw[offset] * 0.25 + raw[offset + 1] * 0.6 + raw[offset + 2] * 0.15;
      pixels[offset] = shade * 1.35 + 11;
      pixels[offset + 1] = shade * 0.54 + 2;
      pixels[offset + 2] = shade * 0.64 + 3;
    }
  }
}
