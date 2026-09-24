import { CanvasConfig, CanvasElement, Layer } from '../types';
import { getShapePath } from './shapeGenerators';

export function generateSVGString(
  layers: Layer[],
  elements: CanvasElement[],
  config: CanvasConfig,
  transparentBackground = false
): string {
  const { width, height, backgroundColor } = config;

  // Build defs for filters, shadows, and gradients
  let defs = '';
  
  // Shadows
  elements.forEach((el) => {
    if (el.shadow && el.shadow.enabled) {
      defs += `
      <filter id="shadow-${el.id}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="${el.shadow.offsetX}" dy="${el.shadow.offsetY}" stdDeviation="${el.shadow.blur / 2}" flood-color="${el.shadow.color}" />
      </filter>`;
    }
    if (el.type === 'shape' && el.gradient && el.gradient.enabled) {
      const grad = el.gradient;
      if (grad.type === 'linear') {
        const rad = (grad.angle * Math.PI) / 180;
        const x1 = Math.round(50 - Math.cos(rad) * 50);
        const y1 = Math.round(50 - Math.sin(rad) * 50);
        const x2 = Math.round(50 + Math.cos(rad) * 50);
        const y2 = Math.round(50 + Math.sin(rad) * 50);
        defs += `
        <linearGradient id="grad-${el.id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          <stop offset="0%" stop-color="${grad.startColor}" />
          <stop offset="100%" stop-color="${grad.endColor}" />
        </linearGradient>`;
      } else {
        defs += `
        <radialGradient id="grad-${el.id}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${grad.startColor}" />
          <stop offset="100%" stop-color="${grad.endColor}" />
        </radialGradient>`;
      }
    }
  });

  let content = '';

  // Background
  if (!transparentBackground && backgroundColor && backgroundColor !== 'transparent') {
    content += `  <rect width="${width}" height="${height}" fill="${backgroundColor}" />\n`;
  }

  // Iterate layers in bottom-to-top order
  layers.forEach((layer) => {
    if (!layer.visible) return;

    const layerElements = elements.filter((el) => el.layerId === layer.id && el.visible !== false);
    if (layerElements.length === 0) return;

    content += `  <g id="layer-${layer.id}" data-name="${encodeXML(layer.name)}" opacity="${layer.opacity}">\n`;

    layerElements.forEach((el) => {
      const rot = el.rotation || 0;
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const transform = rot !== 0 ? `transform="rotate(${rot} ${cx} ${cy})"` : '';
      const filterAttr = el.shadow?.enabled ? `filter="url(#shadow-${el.id})"` : '';

      switch (el.type) {
        case 'shape': {
          const isLine = el.shapeType === 'line' || el.shapeType === 'line-arrow';
          const pathD = getShapePath(el.shapeType, el.width, el.height, el.cornerRadius);
          let fillAttr = isLine ? 'none' : el.fill;
          if (!isLine && el.gradient?.enabled) {
            fillAttr = `url(#grad-${el.id})`;
          }
          let dashAttr = '';
          if (el.strokeDash === 'dashed') dashAttr = 'stroke-dasharray="8 6"';
          if (el.strokeDash === 'dotted') dashAttr = 'stroke-dasharray="3 4"';

          const rotOrigin = isLine ? `0 ${el.height / 2}` : `${el.width / 2} ${el.height / 2}`;
          const rotAttr = rot !== 0 ? `transform="rotate(${rot} ${rotOrigin})"` : '';
          const lineCaps = isLine ? 'stroke-linecap="round" stroke-linejoin="round"' : '';

          content += `    <g transform="translate(${el.x}, ${el.y})">\n`;
          content += `      <path d="${pathD}" fill="${fillAttr}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" ${lineCaps} ${dashAttr} opacity="${el.opacity}" ${filterAttr} ${rotAttr} />\n`;
          content += `    </g>\n`;
          break;
        }

        case 'brush': {
          if (el.points.length < 2) return;
          const strokeColor = el.color;
          const strokeWidth = el.strokeWidth;
          const opacity = el.isHighlighter ? el.opacity * 0.4 : el.opacity;
          const d = generateBrushSmoothPath(el.points);

          content += `    <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ${filterAttr} />\n`;
          break;
        }

        case 'text': {
          let textAnchor = 'start';
          let textX = el.x;
          if (el.align === 'center') {
            textAnchor = 'middle';
            textX = el.x + el.width / 2;
          } else if (el.align === 'right') {
            textAnchor = 'end';
            textX = el.x + el.width;
          }

          const fontStyle = el.italic ? 'italic' : 'normal';
          const fontWeight = el.bold ? 'bold' : 'normal';
          const textDeco = el.underline ? 'underline' : 'none';

          content += `    <text x="${textX}" y="${el.y + el.fontSize}" font-family="${encodeXML(el.fontFamily)}" font-size="${el.fontSize}" font-style="${fontStyle}" font-weight="${fontWeight}" text-decoration="${textDeco}" fill="${el.color}" text-anchor="${textAnchor}" opacity="${el.opacity}" ${transform} ${filterAttr}>\n`;
          content += `      ${encodeXML(el.text)}\n`;
          content += `    </text>\n`;
          break;
        }

        case 'image': {
          const f = el.filters;
          const filterStyle = `filter: brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) blur(${f.blur}px) grayscale(${f.grayscale}%) invert(${f.invert}%);`;
          content += `    <image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" preserveAspectRatio="none" style="${filterStyle}" opacity="${el.opacity}" ${transform} ${filterAttr} />\n`;
          break;
        }
      }
    });

    content += `  </g>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>${defs}
  </defs>
${content}
</svg>`;
}

function encodeXML(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateBrushSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}, ${xc.toFixed(1)} ${yc.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

export function downloadSVGFile(svgString: string, filename = 'drawing.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
