import { ImageElement } from '../types';

export type Rect = { x: number; y: number; w: number; h: number };

/** Load an image source into an HTMLImageElement (CORS-friendly for data URLs). */
export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for edit'));
    img.src = src;
  });
}

/** Intersection of image AABB with a canvas-space region, in image-local display coords. */
export function getImageLocalIntersection(img: ImageElement, region: Rect): Rect | null {
  const left = Math.max(img.x, region.x);
  const top = Math.max(img.y, region.y);
  const right = Math.min(img.x + img.width, region.x + region.w);
  const bottom = Math.min(img.y + img.height, region.y + region.h);
  const w = right - left;
  const h = bottom - top;
  if (w < 1 || h < 1) return null;
  return {
    x: left - img.x,
    y: top - img.y,
    w,
    h,
  };
}

function toNaturalCrop(
  imgElem: ImageElement,
  localCrop: Rect
): { sx: number; sy: number; sw: number; sh: number; naturalW: number; naturalH: number } {
  const naturalW = Math.max(1, Math.round(imgElem.naturalWidth || imgElem.width));
  const naturalH = Math.max(1, Math.round(imgElem.naturalHeight || imgElem.height));
  const scaleX = naturalW / Math.max(1, imgElem.width);
  const scaleY = naturalH / Math.max(1, imgElem.height);

  let sx = Math.round(localCrop.x * scaleX);
  let sy = Math.round(localCrop.y * scaleY);
  let sw = Math.round(localCrop.w * scaleX);
  let sh = Math.round(localCrop.h * scaleY);

  sx = Math.max(0, Math.min(naturalW - 1, sx));
  sy = Math.max(0, Math.min(naturalH - 1, sy));
  sw = Math.max(1, Math.min(naturalW - sx, sw));
  sh = Math.max(1, Math.min(naturalH - sy, sh));

  return { sx, sy, sw, sh, naturalW, naturalH };
}

/** Extract a display-local crop of an image as a PNG data URL. */
export async function extractImageSlice(
  imgElem: ImageElement,
  localCrop: Rect
): Promise<{ src: string; naturalWidth: number; naturalHeight: number }> {
  const { sx, sy, sw, sh } = toNaturalCrop(imgElem, localCrop);
  const img = await loadHtmlImage(imgElem.src);
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return {
    src: canvas.toDataURL('image/png'),
    naturalWidth: sw,
    naturalHeight: sh,
  };
}

/**
 * Punch a transparent hole in the image bitmap for the given display-local crop.
 * Returns a new ImageElement with updated PNG src (alpha hole).
 */
export async function punchHoleInImageElement(
  imgElem: ImageElement,
  localCrop: Rect
): Promise<ImageElement> {
  const { sx, sy, sw, sh, naturalW, naturalH } = toNaturalCrop(imgElem, localCrop);
  const img = await loadHtmlImage(imgElem.src);
  const canvas = document.createElement('canvas');
  canvas.width = naturalW;
  canvas.height = naturalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.drawImage(img, 0, 0, naturalW, naturalH);
  ctx.clearRect(sx, sy, sw, sh);

  return {
    ...imgElem,
    src: canvas.toDataURL('image/png'),
    naturalWidth: naturalW,
    naturalHeight: naturalH,
  };
}

/**
 * Pure core of background removal — classifies background pixels IN PLACE.
 * Two-phase: (1) color-key every pixel similar to the border seed color,
 * (2) keep only the component CONNECTED to the image border, so same-colored
 * details inside the subject survive. Boundary kept pixels get feathered alpha.
 * Returns the number of cleared pixels and an abort reason, if any.
 */
export function clearBackgroundColorInPlace(
  px: Uint8ClampedArray,
  w: number,
  h: number,
  tolerance: number
): { removed: number; aborted: string | null } {
  const total = w * h;
  const t = Math.max(0, Math.min(255, Math.round(tolerance * 2.55)));
  const t2 = 3 * t * t; // hard threshold (squared, summed channels)
  const softT = t * 1.5; // soft edge ramp end
  const soft2 = 3 * softT * softT;

  // --- seed color = average of OPAQUE border pixels -------------------------
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let opaqueCount = 0;
  let transparentCount = 0;
  const seedBorder = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    if (px[i + 3] <= 16) {
      transparentCount++;
      return;
    }
    opaqueCount++;
    sr += px[i];
    sg += px[i + 1];
    sb += px[i + 2];
  };
  for (let x = 0; x < w; x++) {
    seedBorder(x, 0);
    seedBorder(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    seedBorder(0, y);
    seedBorder(w - 1, y);
  }

  // Border already transparent — nothing to key on.
  if (opaqueCount === 0) {
    return { removed: 0, aborted: 'border-transparent' };
  }
  sr = sr / opaqueCount;
  sg = sg / opaqueCount;
  sb = sb / opaqueCount;

  // --- phase 1: color-key candidates (anywhere in the image) ----------------
  const candidate = new Uint8Array(total);
  for (let idx = 0; idx < total; idx++) {
    const i = idx * 4;
    if (px[i + 3] <= 16) {
      candidate[idx] = 1; // already-transparent pixels expand like background
      continue;
    }
    const dr = px[i] - sr;
    const dg = px[i + 1] - sg;
    const db = px[i + 2] - sb;
    if (dr * dr + dg * dg + db * db <= t2) candidate[idx] = 1;
  }

  // --- phase 2: keep only candidates connected to the border ---------------
  const removed = new Uint8Array(total);
  const queue: number[] = [];
  const connect = (x: number, y: number) => {
    const idx = y * w + x;
    if (candidate[idx] && !removed[idx]) {
      removed[idx] = 1;
      queue.push(idx);
    }
  };
  for (let x = 0; x < w; x++) {
    connect(x, 0);
    connect(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    connect(0, y);
    connect(w - 1, y);
  }
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % w;
    const y = (idx / w) | 0;
    if (x > 0 && candidate[idx - 1] && !removed[idx - 1]) {
      removed[idx - 1] = 1;
      queue.push(idx - 1);
    }
    if (x < w - 1 && candidate[idx + 1] && !removed[idx + 1]) {
      removed[idx + 1] = 1;
      queue.push(idx + 1);
    }
    if (y > 0 && candidate[idx - w] && !removed[idx - w]) {
      removed[idx - w] = 1;
      queue.push(idx - w);
    }
    if (y < h - 1 && candidate[idx + w] && !removed[idx + w]) {
      removed[idx + w] = 1;
      queue.push(idx + w);
    }
  }

  const removedCount = queue.length;
  if (removedCount === 0) {
    return { removed: 0, aborted: 'no-match' };
  }
  // Safety: fill must not swallow (almost) the whole image — subject lost
  if (removedCount >= total * 0.985) {
    return { removed: removedCount, aborted: 'flood-everything' };
  }

  // --- apply: hard-clear removed pixels, feather the 1px boundary band -----
  for (let idx = 0; idx < total; idx++) {
    if (removed[idx]) {
      px[idx * 4 + 3] = 0;
      continue;
    }
    const x = idx % w;
    const y = (idx / w) | 0;
    const adjacentRemoved =
      (x > 0 && removed[idx - 1]) ||
      (x < w - 1 && removed[idx + 1]) ||
      (y > 0 && removed[idx - w]) ||
      (y < h - 1 && removed[idx + w]);
    if (!adjacentRemoved || soft2 <= t2) continue;
    const i = idx * 4;
    if (px[i + 3] === 0) continue;
    const dr = px[i] - sr;
    const dg = px[i + 1] - sg;
    const db = px[i + 2] - sb;
    const d2 = dr * dr + dg * dg + db * db;
    if (d2 <= soft2) {
      const factor = (d2 - t2) / (soft2 - t2);
      px[i + 3] = Math.round(px[i + 3] * Math.max(0, Math.min(1, factor)));
    }
  }

  return { removed: removedCount, aborted: null };
}

/**
 * Remove a (mostly uniform) background from an image by flood-filling from the
 * border inward and clearing matching pixels to transparent.
 * tolerance: 0-100 (0 = exact color only, ~30 = typical anti-aliased photos).
 * Returns the updated element plus the percentage of pixels that were cleared.
 */
export async function removeImageBackground(
  imgElem: ImageElement,
  tolerance = 30
): Promise<{ element: ImageElement; removedPct: number }> {
  const naturalW = Math.max(1, Math.round(imgElem.naturalWidth || imgElem.width));
  const naturalH = Math.max(1, Math.round(imgElem.naturalHeight || imgElem.height));
  const img = await loadHtmlImage(imgElem.src);
  const canvas = document.createElement('canvas');
  canvas.width = naturalW;
  canvas.height = naturalH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('캔버스 컨텍스트를 만들 수 없습니다.');
  ctx.drawImage(img, 0, 0, naturalW, naturalH);

  let image: ImageData;
  try {
    image = ctx.getImageData(0, 0, naturalW, naturalH);
  } catch {
    throw new Error('보안 정책(CORS)으로 픽셀을 읽을 수 없는 이미지입니다. 파일로 삽입한 이미지를 사용해 보세요.');
  }

  const { removed, aborted } = clearBackgroundColorInPlace(
    image.data,
    naturalW,
    naturalH,
    tolerance
  );
  const removedPct = Math.round((removed / (naturalW * naturalH)) * 100);

  if (aborted === 'no-match') {
    throw new Error(`배경색 후보를 찾지 못했습니다 (제거 대상 0픽셀). 허용치를 높여 보세요.`);
  }
  if (aborted === 'border-transparent') {
    throw new Error('이미지 가장자리가 이미 투명합니다. 남은 배경 조각이 있다면 직접 크롭 후 다시 시도해 보세요.');
  }
  if (aborted === 'flood-everything') {
    throw new Error(`배경과 대상을 구분하지 못했습니다. 허용치(${tolerance}%)를 낮춰 다시 시도해 보세요.`);
  }

  ctx.putImageData(image, 0, 0);
  return {
    element: {
      ...imgElem,
      src: canvas.toDataURL('image/png'),
      naturalWidth: naturalW,
      naturalHeight: naturalH,
    },
    removedPct,
  };
}
