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
