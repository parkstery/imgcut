import { CanvasElement, Layer } from '../types';

export interface ContentBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FitBoundsOptions {
  /** false (default): visible=false 요소 및 숨김 레이어 제외 */
  includeHidden?: boolean;
  /** 바깥 여백(px). 기본 0 */
  padding?: number;
}

function rotatePoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  deg: number
): { x: number; y: number } {
  if (!deg) return { x: px, y: py };
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

function boundsOfCorners(corners: { x: number; y: number }[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of corners) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function shadowExpansion(el: CanvasElement): number {
  const s = el.shadow;
  if (!s || !s.enabled) return 0;
  const blur = Number.isFinite(s.blur) ? Math.max(0, s.blur) : 0;
  const off = Math.max(Math.abs(s.offsetX || 0), Math.abs(s.offsetY || 0));
  return blur + off;
}

function getElementBounds(el: CanvasElement): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  if (!Number.isFinite(el.x) || !Number.isFinite(el.y)) return null;
  const rotation = el.rotation || 0;
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  // Brush: points가 절대좌표이므로 그대로 사용
  if (el.type === 'brush' && el.points && el.points.length > 0) {
    const pts = el.points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pts.length === 0) return null;
    const b = boundsOfCorners(pts);
    if (!Number.isFinite(b.minX)) return null;
    const expand = (el.strokeWidth || 2) / 2 + shadowExpansion(el);
    return {
      minX: b.minX - expand,
      minY: b.minY - expand,
      maxX: b.maxX + expand,
      maxY: b.maxY + expand,
    };
  }

  // Polyline / Arc: points가 요소 기준 상대좌표
  if (el.type === 'shape' && el.points && el.points.length >= 2) {
    const abs = el.points
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .map((p) => ({ x: el.x + p.x, y: el.y + p.y }));
    if (abs.length === 0) return null;
    const b = boundsOfCorners(abs);
    if (!Number.isFinite(b.minX)) return null;
    const expand = (el.strokeWidth || 2) / 2 + shadowExpansion(el);
    const corners = [
      { x: b.minX - expand, y: b.minY - expand },
      { x: b.maxX + expand, y: b.minY - expand },
      { x: b.minX - expand, y: b.maxY + expand },
      { x: b.maxX + expand, y: b.maxY + expand },
    ].map((p) => rotatePoint(p.x, p.y, cx, cy, rotation));
    return boundsOfCorners(corners);
  }

  // Rect 계열 (shape / image / text): x,y,w,h 박스를 회전까지 반영
  if (!Number.isFinite(el.width) || !Number.isFinite(el.height)) return null;
  let expand = shadowExpansion(el);
  if (el.type === 'shape') expand += (el.strokeWidth || 0) / 2;
  if (el.type === 'image') expand += el.borderWidth || 0;
  const corners = [
    { x: el.x - expand, y: el.y - expand },
    { x: el.x + el.width + expand, y: el.y - expand },
    { x: el.x - expand, y: el.y + el.height + expand },
    { x: el.x + el.width + expand, y: el.y + el.height + expand },
  ].map((p) => rotatePoint(p.x, p.y, cx, cy, rotation));
  const b = boundsOfCorners(corners);
  if (!Number.isFinite(b.minX)) return null;
  return b;
}

/**
 * 화면에 표시된 요소들의 최대 범위를 구한다.
 * 숨김 레이어 / visible=false 요소는 기본 제외한다.
 */
export function getContentBounds(
  elements: CanvasElement[],
  layers?: Layer[],
  options?: FitBoundsOptions
): ContentBounds | null {
  const includeHidden = options?.includeHidden ?? false;
  const padding = Math.max(0, options?.padding ?? 0);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (!includeHidden) {
      if (el.visible === false) continue;
      if (layers) {
        const layer = layers.find((l) => l.id === el.layerId);
        if (layer && !layer.visible) continue;
      }
    }
    const b = getElementBounds(el);
    if (!b) continue;
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

  // 잘림 방지를 위해 바깥쪽으로 내림/올림
  let x = Math.floor(minX - padding);
  let y = Math.floor(minY - padding);
  let w = Math.ceil(maxX + padding) - x;
  let h = Math.ceil(maxY + padding) - y;
  if (!(w >= 1) || !(h >= 1)) return null;
  return { x, y, w, h };
}
