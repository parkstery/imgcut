import {
  BrushStrokeElement,
  CanvasElement,
  RadialToolState,
} from '../types';
import { getRotationPivot } from './elementGeometry';

export { getRotationPivot } from './elementGeometry';

/** Normalize an angle in degrees into the [0, 360) range. */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Angular distance between two consecutive copies.
 * - Full circle (360°): 360 / count, so the last copy never overlaps the first.
 * - Partial sweep: the copies are spread across both edges of the sweep.
 */
export function getRadialAngleStep(count: number, sweepAngle: number): number {
  const n = Math.max(2, Math.min(50, count));
  const sweep = Math.max(0, Math.min(360, sweepAngle));
  if (sweep >= 360) return 360 / n;
  return sweep / (n - 1);
}

/** Absolute angles (degrees) of every copy of the current arrangement. */
export function getRadialAngles(state: RadialToolState): number[] {
  const n = Math.max(2, Math.min(50, state.count));
  const step = getRadialAngleStep(n, state.sweepAngle);
  return Array.from({ length: n }, (_, i) => state.startAngle + step * i);
}

/**
 * The point an element is rotated around, relative to its top-left corner.
 * Straight lines and arrow lines rotate around their start point,
 * every other element around the centre of its bounding box.
 */
/**
 * Build the copies of `source` arranged on a circle.
 * Used for the live preview while the user drags, and reused when the
 * parameters in the properties panel change.
 */
export function buildRadialPreview(
  state: RadialToolState,
  layerId: string
): CanvasElement[] {
  const { center, sourceElement: source, radius } = state;
  if (!center || !source) return [];

  const baseW = source.width;
  const baseH = source.height;
  const baseRotation = source.rotation || 0;

  return getRadialAngles(state).map((theta, i) => {
    const rad = (theta * Math.PI) / 180;
    const px = center.x + radius * Math.cos(rad);
    const py = center.y + radius * Math.sin(rad);
    // Orientation of the copy:
    // - none      : every copy keeps the original angle
    // - tangential: copies follow the circle (first copy keeps its angle)
    // - radial    : copies point away from the center (sunburst)
    const rot =
      state.rotateMode === 'radial'
        ? baseRotation + theta
        : state.rotateMode === 'tangential'
        ? baseRotation + (theta - state.startAngle)
        : baseRotation;

    // The element is rotated around its own pivot, which is NOT always the
    // centre of its bounding box: lines and arrow lines rotate around their
    // start point. Compensate so that the visual centre of every copy lands
    // exactly on the circle (otherwise the whole ring drifts sideways).
    const pivot = getRotationPivot(source);
    const dx = baseW / 2 - pivot.x;
    const dy = baseH / 2 - pivot.y;
    const cr = Math.cos((rot * Math.PI) / 180);
    const sr = Math.sin((rot * Math.PI) / 180);
    const pivotX = px - (dx * cr - dy * sr);
    const pivotY = py - (dx * sr + dy * cr);
    const x = pivotX - pivot.x;
    const y = pivotY - pivot.y;

    const copy = {
      ...(source as CanvasElement),
      id: `radial-preview-${i}`,
      layerId,
      name: `${source.name} (방사상 ${i + 1})`,
      x,
      y,
      width: baseW,
      height: baseH,
      rotation: rot,
      opacity: source.opacity ?? 1,
      flipH: source.flipH,
      flipV: source.flipV,
      shadow: source.shadow,
    } as CanvasElement;

    if (source.type === 'brush') {
      // Brush points are stored in absolute canvas coordinates.
      (copy as BrushStrokeElement).points = source.points.map((p) => ({
        x: p.x + (x - source.x),
        y: p.y + (y - source.y),
      }));
    }
    return copy;
  });
}
