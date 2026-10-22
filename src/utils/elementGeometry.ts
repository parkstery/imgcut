import { CanvasElement } from '../types';

/**
 * The point an element is rotated around, relative to its top-left corner.
 *
 * Straight lines and arrow lines rotate around their START point, every
 * other element around the centre of its bounding box.
 *
 * The canvas renderer, the SVG export and the radial array placement must all
 * agree on this – otherwise rotated elements drift away from where they were
 * placed.
 */
export function getRotationPivot(el: CanvasElement): { x: number; y: number } {
  if (
    el.type === 'shape' &&
    (el.shapeType === 'line' || el.shapeType.startsWith('line-arrow'))
  ) {
    return { x: 0, y: el.height / 2 };
  }
  return { x: el.width / 2, y: el.height / 2 };
}

/** `getRotationPivot` formatted for an SVG `rotate(angle cx cy)` attribute. */
export function getRotationOriginAttr(el: CanvasElement): string {
  const p = getRotationPivot(el);
  return `${p.x} ${p.y}`;
}
