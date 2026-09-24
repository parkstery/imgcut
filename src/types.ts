export type ShapeType =
  | 'rect'
  | 'rounded-rect'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'arrow-right'
  | 'arrow-bidirectional'
  | 'speech-bubble'
  | 'heart'
  | 'hexagon'
  | 'line'
  | 'line-arrow';

export type ElementType = 'shape' | 'brush' | 'text' | 'image';

export interface ShadowSettings {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface BaseElement {
  id: string;
  layerId: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0 to 1
  locked?: boolean;
  visible?: boolean;
  shadow?: ShadowSettings;
}

export interface GradientSettings {
  enabled: boolean;
  type: 'linear' | 'radial';
  startColor: string;
  endColor: string;
  angle: number; // 0-360 for linear
}

export interface ShapeStylePreset {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDash: 'solid' | 'dashed' | 'dotted';
  cornerRadius: number;
  opacity: number;
  gradient?: GradientSettings;
  shadow?: ShadowSettings;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fill: string; // color or 'none'
  gradient?: GradientSettings;
  stroke: string;
  strokeWidth: number;
  strokeDash: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface BrushStrokeElement extends BaseElement {
  type: 'brush';
  points: Point[];
  color: string;
  strokeWidth: number;
  isHighlighter?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
  backgroundColor?: string;
}

export interface ImageFilters {
  brightness: number; // 0 to 200, 100 is normal
  contrast: number; // 0 to 200, 100 is normal
  saturation: number; // 0 to 200, 100 is normal
  blur: number; // 0 to 20 px
  grayscale: number; // 0 to 100%
  invert: number; // 0 to 100%
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // base64 or URL
  naturalWidth: number;
  naturalHeight: number;
  filters: ImageFilters;
  flipH?: boolean;
  flipV?: boolean;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

export type CanvasElement =
  | ShapeElement
  | BrushStrokeElement
  | TextElement
  | ImageElement;

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export type ToolType =
  | 'select'
  | 'pan'
  | 'brush'
  | 'highlighter'
  | 'eraser'
  | 'shape'
  | 'text'
  | 'eyedropper'
  | 'fill'
  | 'crop';

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface HistorySnapshot {
  elements: CanvasElement[];
  layers: Layer[];
  activeLayerId: string;
  canvasConfig: CanvasConfig;
}

export type HandleType =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotate'
  | 'line-start'
  | 'line-end';
