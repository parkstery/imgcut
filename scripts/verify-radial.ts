/**
 * Verification for the radial array placement.
 *
 * The renderer rotates straight lines / arrow lines around their START point
 * (0, height/2) and every other element around its bounding-box centre.
 * buildRadialPreview has to compensate for that, otherwise the ring drifts.
 *
 * Run: npx tsx scripts/verify-radial.ts
 */
import { CanvasElement, RadialToolState } from '../src/types';
import { buildRadialPreview } from '../src/utils/radialArray';
import { getRotationPivot } from '../src/utils/elementGeometry';

/** Where the renderer actually puts the visual centre of an element. */
function visualCenter(el: CanvasElement): { x: number; y: number } {
  const pivot = getRotationPivot(el);
  const rot = ((el.rotation || 0) * Math.PI) / 180;
  const dx = el.width / 2 - pivot.x;
  const dy = el.height / 2 - pivot.y;
  return {
    x: el.x + pivot.x + dx * Math.cos(rot) - dy * Math.sin(rot),
    y: el.y + pivot.y + dx * Math.sin(rot) + dy * Math.cos(rot),
  };
}

const lineSource: CanvasElement = {
  id: 'src',
  layerId: 'layer-1',
  name: '화살표',
  type: 'shape',
  shapeType: 'line-arrow',
  x: 0,
  y: 0,
  width: 100,
  height: 16,
  rotation: 0,
  opacity: 1,
  fill: 'none',
  stroke: '#FF0000',
  strokeWidth: 2,
  strokeDash: 'solid',
};

const rectSource: CanvasElement = {
  id: 'src2',
  layerId: 'layer-1',
  name: '사각형',
  type: 'shape',
  shapeType: 'rect',
  x: 0,
  y: 0,
  width: 40,
  height: 40,
  rotation: 0,
  opacity: 1,
  fill: '#FF0000',
  stroke: 'none',
  strokeWidth: 1,
  strokeDash: 'solid',
};

const cases: { name: string; source: CanvasElement; count: number; sweep: number; radius: number }[] = [
  { name: '선/화살표 · 12개 · 360°', source: lineSource, count: 12, sweep: 360, radius: 134 },
  { name: '선/화살표 · 8개 · 180°', source: lineSource, count: 8, sweep: 180, radius: 100 },
  { name: '선/화살표 · 3개 · 90°', source: lineSource, count: 3, sweep: 90, radius: 60 },
  { name: '사각형 · 12개 · 360°', source: rectSource, count: 12, sweep: 360, radius: 134 },
];

let failed = 0;

for (const c of cases) {
  for (const rotateMode of ['none', 'tangential', 'radial'] as const) {
    const state: RadialToolState = {
      step: 'preview',
      center: { x: 500, y: 400 },
      radius: c.radius,
      count: c.count,
      startAngle: 0,
      sweepAngle: c.sweep,
      rotateMode,
      sourceElement: c.source,
      previewElements: [],
    };

    const copies = buildRadialPreview(state, 'layer-1');
    const centres = copies.map(visualCenter);

    // 1) every copy must sit exactly on the circle
    const radii = centres.map((p) =>
      Math.hypot(p.x - state.center!.x, p.y - state.center!.y)
    );
    const radiusErr = Math.max(...radii.map((r) => Math.abs(r - c.radius)));

    // 2) the angles must match the expected layout
    const step = c.sweep >= 360 ? 360 / c.count : c.sweep / (c.count - 1);
    const angleErr = Math.max(
      ...centres.map((p, i) => {
        const a = (Math.atan2(p.y - state.center!.y, p.x - state.center!.x) * 180) / Math.PI;
        const expected = state.startAngle + step * i;
        return Math.abs(((a - expected) % 360 + 540) % 360 - 180);
      })
    );

    // 3) a full circle must not drift: the mean of all copies is the centre.
    //    (a partial arc is legitimately off-centre – its centroid is not the
    //     circle centre, so this only applies to a complete ring)
    const mean = {
      x: centres.reduce((s, p) => s + p.x, 0) / centres.length,
      y: centres.reduce((s, p) => s + p.y, 0) / centres.length,
    };
    const drift =
      c.sweep >= 360
        ? Math.hypot(mean.x - state.center!.x, mean.y - state.center!.y)
        : 0;

    const ok = radiusErr < 1e-6 && angleErr < 1e-6 && drift < 1e-6;
    if (!ok) failed++;
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${c.name} / ${rotateMode.padEnd(10)} ` +
        `반지름 오차=${radiusErr.toExponential(1)}  각도 오차=${angleErr.toExponential(1)}  ` +
        `중심 이탈=${drift.toExponential(1)}`
    );
  }
}

console.log(failed === 0 ? '\n모든 케이스 통과' : `\n${failed}건 실패`);
process.exit(failed === 0 ? 0 : 1);
