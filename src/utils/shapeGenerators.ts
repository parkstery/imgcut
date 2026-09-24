import { ShapeType } from '../types';

export function getShapePath(
  shapeType: ShapeType,
  width: number,
  height: number,
  cornerRadius = 16
): string {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);

  switch (shapeType) {
    case 'rect':
      return `M 0 0 H ${w} V ${h} H 0 Z`;

    case 'rounded-rect': {
      const r = Math.min(cornerRadius, w / 2, h / 2);
      return `
        M ${r} 0
        H ${w - r}
        A ${r} ${r} 0 0 1 ${w} ${r}
        V ${h - r}
        A ${r} ${r} 0 0 1 ${w - r} ${h}
        H ${r}
        A ${r} ${r} 0 0 1 0 ${h - r}
        V ${r}
        A ${r} ${r} 0 0 1 ${r} 0
        Z
      `.replace(/\s+/g, ' ').trim();
    }

    case 'ellipse': {
      const rx = w / 2;
      const ry = h / 2;
      return `
        M ${rx} 0
        A ${rx} ${ry} 0 1 1 ${rx} ${h}
        A ${rx} ${ry} 0 1 1 ${rx} 0
        Z
      `.replace(/\s+/g, ' ').trim();
    }

    case 'triangle':
      return `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`;

    case 'diamond':
      return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;

    case 'star': {
      // 5-point star
      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.42;
      const points: string[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
      }
      return `${points.join(' ')} Z`;
    }

    case 'arrow-right': {
      const headW = w * 0.35;
      const shaftH = h * 0.45;
      const topY = (h - shaftH) / 2;
      const botY = topY + shaftH;
      return `
        M 0 ${topY}
        H ${w - headW}
        V 0
        L ${w} ${h / 2}
        L ${w - headW} ${h}
        V ${botY}
        H 0
        Z
      `.replace(/\s+/g, ' ').trim();
    }

    case 'arrow-bidirectional': {
      const headW = Math.min(w * 0.28, 40);
      const shaftH = h * 0.4;
      const topY = (h - shaftH) / 2;
      const botY = topY + shaftH;
      return `
        M 0 ${h / 2}
        L ${headW} 0
        V ${topY}
        H ${w - headW}
        V 0
        L ${w} ${h / 2}
        L ${w - headW} ${h}
        V ${botY}
        H ${headW}
        V ${h}
        Z
      `.replace(/\s+/g, ' ').trim();
    }

    case 'speech-bubble': {
      const bubbleH = h * 0.8;
      const r = Math.min(16, w / 4, bubbleH / 4);
      return `
        M ${r} 0
        H ${w - r}
        A ${r} ${r} 0 0 1 ${w} ${r}
        V ${bubbleH - r}
        A ${r} ${r} 0 0 1 ${w - r} ${bubbleH}
        H ${w * 0.45}
        L ${w * 0.25} ${h}
        L ${w * 0.3} ${bubbleH}
        H ${r}
        A ${r} ${r} 0 0 1 0 ${bubbleH - r}
        V ${r}
        A ${r} ${r} 0 0 1 ${r} 0
        Z
      `.replace(/\s+/g, ' ').trim();
    }

    case 'heart': {
      const topCurveH = h * 0.3;
      return `
        M ${w / 2} ${h}
        C ${w / 2} ${h * 0.75} 0 ${h * 0.6} 0 ${topCurveH}
        C 0 0 ${w / 2} 0 ${w / 2} ${topCurveH}
        C ${w / 2} 0 ${w} 0 ${w} ${topCurveH}
        C ${w} ${h * 0.6} ${w / 2} ${h * 0.75} ${w / 2} ${h}
        Z
      `.replace(/\s+/g, ' ').trim();
    }

    case 'hexagon': {
      const side = w * 0.25;
      return `
        M ${side} 0
        H ${w - side}
        L ${w} ${h / 2}
        L ${w - side} ${h}
        H ${side}
        L 0 ${h / 2}
        Z
      `.replace(/\s+/g, ' ').trim();
    }

    case 'line':
      return `M 0 ${h / 2} L ${w} ${h / 2}`;

    case 'line-arrow': {
      // Line with clean arrowhead at end
      const headSize = Math.min(14, Math.max(8, w * 0.2));
      return `
        M 0 ${h / 2}
        L ${w} ${h / 2}
        M ${w - headSize} ${h / 2 - headSize * 0.6}
        L ${w} ${h / 2}
        L ${w - headSize} ${h / 2 + headSize * 0.6}
      `.replace(/\s+/g, ' ').trim();
    }

    default:
      return `M 0 0 H ${w} V ${h} H 0 Z`;
  }
}
