import {
  BrushStrokeElement,
  CanvasElement,
  RadialToolState,
} from '../types';

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
    const x = px - baseW / 2;
    const y = py - baseH / 2;
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
