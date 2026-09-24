import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  CanvasConfig,
  CanvasElement,
  Layer,
  ToolType,
  ShapeType,
  Point,
  ShapeElement,
  BrushStrokeElement,
  TextElement,
  ImageElement,
  HandleType,
  ShapeStylePreset,
} from '../types';
import { getShapePath } from '../utils/shapeGenerators';
import { generateBrushSmoothPath } from '../utils/svgExport';
import { sampleColorFromCanvas } from '../utils/rasterExport';
import { getToolCursor } from '../utils/cursorUtils';
import { Crop, Scissors, Copy, Clipboard } from 'lucide-react';

interface CanvasAreaProps {
  config: CanvasConfig;
  onUpdateConfig: (partial: Partial<CanvasConfig>) => void;
  onCropCanvas?: (crop: { x: number; y: number; w: number; h: number }) => void;
  onCutCanvasRegion?: (crop: { x: number; y: number; w: number; h: number }) => Promise<void> | void;
  onCopyCanvasRegion?: (crop: { x: number; y: number; w: number; h: number }) => Promise<void> | void;
  onPasteCanvasRegion?: (crop: { x: number; y: number; w: number; h: number }) => Promise<void> | void;
  onTriggerPaste?: () => void;
  onMouseMoveCanvas?: (pt: Point) => void;
  onCopyImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;
  onCutImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;
  onCropBoxChange?: (box: { x: number; y: number; w: number; h: number } | null) => void;
  layers: Layer[];
  elements: CanvasElement[];
  onAddElement: (element: CanvasElement) => void;
  onUpdateElement: (updated: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  activeLayerId: string;
  selectedElementId: string | null;
  selectedElementIds: string[];
  onSelectElement: (id: string | null) => void;
  onSelectMultipleElements: (ids: string[]) => void;
  onToggleSelectElement: (id: string, isShift: boolean) => void;
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedShapeType: ShapeType;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  strokeWidth: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  lastShapeStyle: ShapeStylePreset;
  croppingImageId?: string | null;
  onStartCropImage?: (id: string) => void;
  onFinishCropImage?: () => void;
  onInsertImage?: (file: File) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  config,
  onUpdateConfig,
  onCropCanvas,
  onCutCanvasRegion,
  onCopyCanvasRegion,
  onPasteCanvasRegion,
  onTriggerPaste,
  onMouseMoveCanvas,
  onCopyImagePart,
  onCutImagePart,
  onCropBoxChange,
  layers,
  elements,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  activeLayerId,
  selectedElementId,
  selectedElementIds,
  onSelectElement,
  onSelectMultipleElements,
  onToggleSelectElement,
  currentTool,
  onSelectTool,
  selectedShapeType,
  primaryColor,
  onPrimaryColorChange,
  strokeWidth,
  zoom,
  onZoomChange,
  lastShapeStyle,
  croppingImageId,
  onStartCropImage,
  onFinishCropImage,
  onInsertImage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Mouse coordinate tracker for rulers & line drawing
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });

  // Active drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point>({ x: 0, y: 0 });
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Line drawing preview state (start to current)
  const [linePreviewEnd, setLinePreviewEnd] = useState<Point | null>(null);

  // Marquee selection box state (for multi-selection)
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Transform states (Move / Resize / Rotate selected element(s))
  const [isTransforming, setIsTransforming] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandleType | 'move' | null>(null);
  const [transformStart, setTransformStart] = useState<{
    clientX: number;
    clientY: number;
    elemX: number;
    elemY: number;
    elemW: number;
    elemH: number;
    elemRotation: number;
    elementsStartPositions: { id: string; x: number; y: number }[];
    lineStart?: Point;
    lineEnd?: Point;
  } | null>(null);

  // Canvas crop tool state
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // PowerPoint-style Image Crop States
  const [imgCropBox, setImgCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });
  const [imgCropActiveHandle, setImgCropActiveHandle] = useState<
    'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move' | null
  >(null);
  const [imgCropDragStart, setImgCropDragStart] = useState<{
    clientX: number;
    clientY: number;
    initialBox: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const croppingImage = useMemo(
    () =>
      croppingImageId
        ? (elements.find((el) => el.id === croppingImageId && el.type === 'image') as
            | ImageElement
            | undefined) || null
        : null,
    [elements, croppingImageId]
  );

  // Initialize crop box to image full bounds whenever entering crop mode
  useEffect(() => {
    if (croppingImage) {
      const initial = {
        x: 0,
        y: 0,
        w: croppingImage.width,
        h: croppingImage.height,
      };
      setImgCropBox(initial);
      onCropBoxChange?.(initial);
    } else {
      onCropBoxChange?.(null);
    }
  }, [croppingImageId, croppingImage?.id, onCropBoxChange]);

  useEffect(() => {
    if (croppingImageId) {
      onCropBoxChange?.(imgCropBox);
    }
  }, [imgCropBox, croppingImageId, onCropBoxChange]);

  // Is current tool an element manipulation tool or a drawing tool?
  // When in drawing tool mode (shape, brush, text, crop, pan), elements become transparent to clicks
  // so the user can freely draw shapes/lines on top of images without any blocking or hand-cursor!
  const isSelectOrElementTool =
    currentTool === 'select' ||
    currentTool === 'eyedropper' ||
    currentTool === 'fill' ||
    currentTool === 'eraser';

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId) || null,
    [elements, selectedElementId]
  );

  const selectedLineEndpoints = useMemo(() => {
    if (!selectedElement || selectedElement.type !== 'shape') return null;
    if (selectedElement.shapeType !== 'line' && selectedElement.shapeType !== 'line-arrow') return null;
    const sx = selectedElement.x;
    const sy = selectedElement.y + selectedElement.height / 2;
    const rad = ((selectedElement.rotation || 0) * Math.PI) / 180;
    const ex = sx + Math.cos(rad) * selectedElement.width;
    const ey = sy + Math.sin(rad) * selectedElement.width;
    return { start: { x: sx, y: sy }, end: { x: ex, y: ey } };
  }, [selectedElement]);

  const selectedElements = useMemo(
    () => elements.filter((el) => selectedElementIds.includes(el.id)),
    [elements, selectedElementIds]
  );

  const activeLayer = useMemo(
    () => layers.find((l) => l.id === activeLayerId) || layers[0],
    [layers, activeLayerId]
  );

  // Center canvas initially
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const initialPanX = Math.max(20, (rect.width - config.width * zoom) / 2);
      const initialPanY = Math.max(20, (rect.height - config.height * zoom) / 2);
      setPan({ x: initialPanX, y: initialPanY });
    }
  }, []);

  // Convert screen client coordinates to Canvas local coordinates (in px)
  const clientToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Snap to grid helper
  const snapValue = useCallback(
    (val: number): number => {
      if (!config.snapToGrid) return val;
      const size = config.gridSize;
      return Math.round(val / size) * size;
    },
    [config.snapToGrid, config.gridSize]
  );

  // Wheel zoom / pan handling
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const nextZoom = Math.min(4, Math.max(0.25, zoom + delta));
      onZoomChange(nextZoom);
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  };

  // MOUSE DOWN on Stage (Background)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Bring window and container focus so keyboard events (e.g. Ctrl+V paste) work reliably in iframe
    window.focus();
    containerRef.current?.focus();

    // Middle click or Pan mode or Space key triggers pan
    if (e.button === 1 || currentTool === 'pan' || (e as any).spaceKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Left click only

    const pt = clientToCanvas(e.clientX, e.clientY);

    // Eyedropper tool
    if (currentTool === 'eyedropper') {
      sampleColorFromCanvas(layers, elements, config, pt.x, pt.y).then((color) => {
        onPrimaryColorChange(color);
        onSelectTool('select');
      });
      return;
    }

    // Paint Bucket tool
    if (currentTool === 'fill') {
      if (selectedElement && selectedElement.type === 'shape') {
        onUpdateElement({
          ...selectedElement,
          fill: primaryColor,
        });
      } else {
        onUpdateConfig({ backgroundColor: primaryColor });
      }
      return;
    }

    // Crop tool click
    if (currentTool === 'crop') {
      setIsDrawing(true);
      setDrawStart(pt);
      setCropBox({ x: pt.x, y: pt.y, w: 0, h: 0 });
      return;
    }

    // Brush or Highlighter tool
    if (currentTool === 'brush' || currentTool === 'highlighter') {
      if (activeLayer.locked) return;
      setIsDrawing(true);
      setCurrentPoints([pt]);
      return;
    }

    // Eraser tool
    if (currentTool === 'eraser') {
      setIsDrawing(true);
      eraseAtPoint(pt);
      return;
    }

    // Shape Drawing Tool (including Line, Rectangle, Circle, etc.)
    if (currentTool === 'shape') {
      if (activeLayer.locked) return;
      const startPt = config.snapToGrid ? { x: snapValue(pt.x), y: snapValue(pt.y) } : pt;
      setIsDrawing(true);
      setDrawStart(startPt);

      if (selectedShapeType === 'line' || selectedShapeType === 'line-arrow') {
        setLinePreviewEnd(startPt);
      } else {
        setPreviewRect({ x: startPt.x, y: startPt.y, w: 0, h: 0 });
      }
      return;
    }

    // Text Creation Tool
    if (currentTool === 'text') {
      if (activeLayer.locked) return;
      const newTextElem: TextElement = {
        id: 'text-' + Date.now(),
        layerId: activeLayer.id,
        name: '텍스트',
        type: 'text',
        x: Math.max(0, snapValue(pt.x)),
        y: Math.max(0, snapValue(pt.y)),
        width: 180,
        height: 48,
        rotation: 0,
        opacity: 1,
        text: '텍스트 입력',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 28,
        color: primaryColor,
        bold: false,
        italic: false,
        underline: false,
        align: 'left',
      };
      onAddElement(newTextElem);
      onSelectElement(newTextElem.id);
      return;
    }

    // Select Tool on empty canvas: Start marquee selection box
    if (currentTool === 'select' && !isTransforming) {
      if (!e.shiftKey) {
        onSelectElement(null);
      }
      setIsMarqueeSelecting(true);
      setDrawStart(pt);
      setMarqueeRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
    }
  };

  // Erase elements intersecting with point
  const eraseAtPoint = (pt: Point) => {
    const radius = Math.max(strokeWidth * 2, 16);
    const toDelete = elements.filter((el) => {
      if (el.layerId !== activeLayer.id) return false;
      return (
        pt.x >= el.x - radius &&
        pt.x <= el.x + el.width + radius &&
        pt.y >= el.y - radius &&
        pt.y <= el.y + el.height + radius
      );
    });

    if (toDelete.length > 0) {
      toDelete.forEach((el) => onDeleteElement(el.id));
    }
  };

  // Element MouseDown (for immediate 1-click selection and drag)
  const handleElementMouseDown = (el: CanvasElement, e: React.MouseEvent) => {
    // If a drawing or pan tool is active, do NOT stop propagation!
    // This allows mouse down to reach the canvas stage so drawing on top of images/shapes starts seamlessly!
    if (
      currentTool === 'shape' ||
      currentTool === 'brush' ||
      currentTool === 'highlighter' ||
      currentTool === 'text' ||
      currentTool === 'crop' ||
      currentTool === 'pan'
    ) {
      return;
    }

    e.stopPropagation();

    // In non-select modes, let the stage handle it (e.g., eyedropper, eraser, fill)
    if (currentTool === 'eyedropper') {
      const pt = clientToCanvas(e.clientX, e.clientY);
      sampleColorFromCanvas(layers, elements, config, pt.x, pt.y).then((color) => {
        onPrimaryColorChange(color);
        onSelectTool('select');
      });
      return;
    }

    if (currentTool === 'fill') {
      if (el.type === 'shape') {
        onUpdateElement({
          ...el,
          fill: primaryColor,
        });
      }
      return;
    }

    if (currentTool === 'eraser') {
      onDeleteElement(el.id);
      return;
    }

    if (currentTool !== 'select') return;

    if (e.shiftKey) {
      // Toggle element selection with Shift key
      onToggleSelectElement(el.id, true);
      return;
    }

    // Normal 1-click selection:
    // If the clicked element is already in selectedElementIds, maintain the multi-selection for group dragging
    if (!selectedElementIds.includes(el.id)) {
      onSelectElement(el.id);
    }

    // Start moving the selected element(s)
    if (!activeLayer.locked) {
      setIsTransforming(true);
      setActiveHandle('move');
      const startPositions = elements
        .filter((item) => selectedElementIds.includes(item.id) || item.id === el.id)
        .map((item) => ({ id: item.id, x: item.x, y: item.y }));

      setTransformStart({
        clientX: e.clientX,
        clientY: e.clientY,
        elemX: el.x,
        elemY: el.y,
        elemW: el.width,
        elemH: el.height,
        elemRotation: el.rotation || 0,
        elementsStartPositions: startPositions,
      });
    }
  };

  // Element Double Click: Double-clicking an image enters PowerPoint crop mode!
  const handleElementDoubleClick = (el: CanvasElement) => {
    if (el.type === 'image' && onStartCropImage) {
      onStartCropImage(el.id);
    }
  };

  // Image Crop Handle Mouse Down
  const handleCropHandleMouseDown = (
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setImgCropActiveHandle(handle);
    setImgCropDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      initialBox: { ...imgCropBox },
    });
  };

  // Set Crop Aspect Ratio Preset
  const setCropAspectRatio = (ratioW: number, ratioH: number, img: ImageElement) => {
    const maxW = img.width;
    const maxH = img.height;
    let targetW = imgCropBox.w;
    let targetH = targetW * (ratioH / ratioW);
    if (targetH > maxH) {
      targetH = maxH;
      targetW = targetH * (ratioW / ratioH);
    }
    const newX = Math.max(0, Math.min(maxW - targetW, imgCropBox.x));
    const newY = Math.max(0, Math.min(maxH - targetH, imgCropBox.y));
    setImgCropBox({ x: Math.round(newX), y: Math.round(newY), w: Math.round(targetW), h: Math.round(targetH) });
  };

  // Apply Image Crop
  const handleApplyImageCrop = useCallback(
    (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => {
      if (crop.w < 10 || crop.h < 10) return;
      const naturalW = imgElem.naturalWidth || imgElem.width;
      const naturalH = imgElem.naturalHeight || imgElem.height;
      const scaleX = naturalW / imgElem.width;
      const scaleY = naturalH / imgElem.height;

      const sx = Math.max(0, crop.x * scaleX);
      const sy = Math.max(0, crop.y * scaleY);
      const sw = Math.min(naturalW - sx, crop.w * scaleX);
      const sh = Math.min(naturalH - sy, crop.h * scaleY);

      if (sw < 1 || sh < 1) return;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = Math.round(sw);
      offCanvas.height = Math.round(sh);
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const croppedSrc = offCanvas.toDataURL('image/png');
        onUpdateElement({
          ...imgElem,
          src: croppedSrc,
          x: Math.round(imgElem.x + crop.x),
          y: Math.round(imgElem.y + crop.y),
          width: Math.round(crop.w),
          height: Math.round(crop.h),
          naturalWidth: Math.round(sw),
          naturalHeight: Math.round(sh),
        });
        onFinishCropImage?.();
      };
      img.src = imgElem.src;
    },
    [onUpdateElement, onFinishCropImage]
  );

  // Keyboard shortcuts for Image Crop (Enter to apply, Ctrl+X to cut slice, Ctrl+C to copy slice, Esc to cancel)
  useEffect(() => {
    if (!croppingImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cut: Ctrl+X
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        e.stopPropagation();
        onCutImagePart?.(croppingImage, imgCropBox);
        return;
      }
      // Copy: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        e.stopPropagation();
        onCopyImagePart?.(croppingImage, imgCropBox);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApplyImageCrop(croppingImage, imgCropBox);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onFinishCropImage?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    croppingImage,
    imgCropBox,
    handleApplyImageCrop,
    onCutImagePart,
    onCopyImagePart,
    onFinishCropImage,
  ]);

  // MOUSE MOVE
  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = clientToCanvas(e.clientX, e.clientY);
    setCursorPos(pt);
    onMouseMoveCanvas?.(pt);

    // Panning canvas
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Active marquee selection drag
    if (isMarqueeSelecting) {
      const x = Math.min(drawStart.x, pt.x);
      const y = Math.min(drawStart.y, pt.y);
      const w = Math.abs(pt.x - drawStart.x);
      const h = Math.abs(pt.y - drawStart.y);
      setMarqueeRect({ x, y, w, h });
      return;
    }

    // Active brush / highlighter
    if (isDrawing && (currentTool === 'brush' || currentTool === 'highlighter')) {
      setCurrentPoints((prev) => [...prev, pt]);
      return;
    }

    // Active eraser
    if (isDrawing && currentTool === 'eraser') {
      eraseAtPoint(pt);
      return;
    }

    // Active line preview drag
    if (isDrawing && currentTool === 'shape' && (selectedShapeType === 'line' || selectedShapeType === 'line-arrow')) {
      let targetPt = config.snapToGrid ? { x: snapValue(pt.x), y: snapValue(pt.y) } : pt;
      if (e.shiftKey) {
        // Snap line angle to 0, 45, 90, 135, 180, 225, 270, 315 degrees
        const dx = targetPt.x - drawStart.x;
        const dy = targetPt.y - drawStart.y;
        const dist = Math.hypot(dx, dy);
        const rad = Math.atan2(dy, dx);
        const deg = (rad * 180) / Math.PI;
        const snappedDeg = Math.round(deg / 45) * 45;
        const snappedRad = (snappedDeg * Math.PI) / 180;
        targetPt = {
          x: drawStart.x + Math.cos(snappedRad) * dist,
          y: drawStart.y + Math.sin(snappedRad) * dist,
        };
      }
      setLinePreviewEnd(targetPt);
      return;
    }

    // Active non-line shape preview drag
    if (isDrawing && currentTool === 'shape') {
      let x = Math.min(drawStart.x, pt.x);
      let y = Math.min(drawStart.y, pt.y);
      let w = Math.abs(pt.x - drawStart.x);
      let h = Math.abs(pt.y - drawStart.y);

      // Shift key constrains to 1:1 square/circle
      if (e.shiftKey) {
        const side = Math.max(w, h);
        w = side;
        h = side;
        if (pt.x < drawStart.x) x = drawStart.x - side;
        if (pt.y < drawStart.y) y = drawStart.y - side;
      }

      setPreviewRect({ x, y, w, h });
      return;
    }

    // Active crop box
    if (isDrawing && currentTool === 'crop') {
      const x = Math.min(drawStart.x, pt.x);
      const y = Math.min(drawStart.y, pt.y);
      const w = Math.abs(pt.x - drawStart.x);
      const h = Math.abs(pt.y - drawStart.y);
      setCropBox({ x, y, w, h });
      return;
    }

    // Active Image Crop dragging (Crop handles or moving crop window)
    if (imgCropActiveHandle && imgCropDragStart && croppingImage) {
      const dx = (e.clientX - imgCropDragStart.clientX) / zoom;
      const dy = (e.clientY - imgCropDragStart.clientY) / zoom;
      const init = imgCropDragStart.initialBox;
      const maxW = croppingImage.width;
      const maxH = croppingImage.height;

      let nextX = init.x;
      let nextY = init.y;
      let nextW = init.w;
      let nextH = init.h;

      if (imgCropActiveHandle === 'move') {
        nextX = Math.max(0, Math.min(maxW - init.w, init.x + dx));
        nextY = Math.max(0, Math.min(maxH - init.h, init.y + dy));
      } else {
        if (imgCropActiveHandle.includes('w')) {
          const candidateX = Math.max(0, Math.min(init.x + init.w - 20, init.x + dx));
          nextW = init.w - (candidateX - init.x);
          nextX = candidateX;
        }
        if (imgCropActiveHandle.includes('e')) {
          nextW = Math.max(20, Math.min(maxW - init.x, init.w + dx));
        }
        if (imgCropActiveHandle.includes('n')) {
          const candidateY = Math.max(0, Math.min(init.y + init.h - 20, init.y + dy));
          nextH = init.h - (candidateY - init.y);
          nextY = candidateY;
        }
        if (imgCropActiveHandle.includes('s')) {
          nextH = Math.max(20, Math.min(maxH - init.y, init.h + dy));
        }
      }

      setImgCropBox({
        x: Math.round(nextX),
        y: Math.round(nextY),
        w: Math.round(nextW),
        h: Math.round(nextH),
      });
      return;
    }

    // Active element transform (Move / Resize / Rotate / Line Endpoints)
    if (isTransforming && transformStart && selectedElement) {
      const dx = (e.clientX - transformStart.clientX) / zoom;
      const dy = (e.clientY - transformStart.clientY) / zoom;

      // Specialized Line Start Point handle drag
      if (activeHandle === 'line-start' && transformStart.lineEnd) {
        const fixedEnd = transformStart.lineEnd;
        let curPt = pt;
        if (config.snapToGrid) {
          curPt = { x: snapValue(curPt.x), y: snapValue(curPt.y) };
        }
        if (e.shiftKey) {
          const ldx = curPt.x - fixedEnd.x;
          const ldy = curPt.y - fixedEnd.y;
          const dist = Math.hypot(ldx, ldy);
          const rad = Math.atan2(ldy, ldx);
          const deg = (rad * 180) / Math.PI;
          const snappedDeg = Math.round(deg / 45) * 45;
          const snappedRad = (snappedDeg * Math.PI) / 180;
          curPt = {
            x: fixedEnd.x + Math.cos(snappedRad) * dist,
            y: fixedEnd.y + Math.sin(snappedRad) * dist,
          };
        }
        const deltaX = fixedEnd.x - curPt.x;
        const deltaY = fixedEnd.y - curPt.y;
        const len = Math.hypot(deltaX, deltaY);
        // Angle points from start (curPt) to end (fixedEnd)
        const deg = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
        const thickness = selectedElement.height;
        onUpdateElement({
          ...selectedElement,
          x: Math.round(curPt.x),
          y: Math.round(curPt.y - thickness / 2),
          width: Math.max(5, Math.round(len)),
          rotation: Math.round(deg),
        });
        return;
      }

      // Specialized Line End Point handle drag
      if (activeHandle === 'line-end' && transformStart.lineStart) {
        const fixedStart = transformStart.lineStart;
        let curPt = pt;
        if (config.snapToGrid) {
          curPt = { x: snapValue(curPt.x), y: snapValue(curPt.y) };
        }
        if (e.shiftKey) {
          const ldx = curPt.x - fixedStart.x;
          const ldy = curPt.y - fixedStart.y;
          const dist = Math.hypot(ldx, ldy);
          const rad = Math.atan2(ldy, ldx);
          const deg = (rad * 180) / Math.PI;
          const snappedDeg = Math.round(deg / 45) * 45;
          const snappedRad = (snappedDeg * Math.PI) / 180;
          curPt = {
            x: fixedStart.x + Math.cos(snappedRad) * dist,
            y: fixedStart.y + Math.sin(snappedRad) * dist,
          };
        }
        const deltaX = curPt.x - fixedStart.x;
        const deltaY = curPt.y - fixedStart.y;
        const len = Math.hypot(deltaX, deltaY);
        const deg = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
        onUpdateElement({
          ...selectedElement,
          width: Math.max(5, Math.round(len)),
          rotation: Math.round(deg),
        });
        return;
      }

      if (activeHandle === 'move') {
        // Group move if multiple selected
        if (transformStart.elementsStartPositions && transformStart.elementsStartPositions.length > 1) {
          transformStart.elementsStartPositions.forEach((pos) => {
            const el = elements.find((item) => item.id === pos.id);
            if (el) {
              let nx = pos.x + dx;
              let ny = pos.y + dy;
              if (config.snapToGrid) {
                nx = snapValue(nx);
                ny = snapValue(ny);
              }
              onUpdateElement({ ...el, x: nx, y: ny });
            }
          });
        } else {
          // Single move
          let newX = transformStart.elemX + dx;
          let newY = transformStart.elemY + dy;
          if (config.snapToGrid) {
            newX = snapValue(newX);
            newY = snapValue(newY);
          }
          onUpdateElement({
            ...selectedElement,
            x: newX,
            y: newY,
          });
        }
      } else if (activeHandle === 'rotate') {
        // Calculate angle between center and current mouse
        const cx = transformStart.elemX + transformStart.elemW / 2;
        const cy = transformStart.elemY + transformStart.elemH / 2;
        const rad = Math.atan2(pt.y - cy, pt.x - cx);
        let deg = Math.round((rad * 180) / Math.PI) + 90;
        if (deg < 0) deg += 360;
        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
        }
        onUpdateElement({
          ...selectedElement,
          rotation: deg % 360,
        });
      } else if (activeHandle) {
        // 8-point resize logic
        let { elemX: newX, elemY: newY, elemW: newW, elemH: newH } = transformStart;

        if (activeHandle.includes('e')) newW = Math.max(10, transformStart.elemW + dx);
        if (activeHandle.includes('s')) newH = Math.max(10, transformStart.elemH + dy);
        if (activeHandle.includes('w')) {
          const possibleW = transformStart.elemW - dx;
          if (possibleW > 10) {
            newW = possibleW;
            newX = transformStart.elemX + dx;
          }
        }
        if (activeHandle.includes('n')) {
          const possibleH = transformStart.elemH - dy;
          if (possibleH > 10) {
            newH = possibleH;
            newY = transformStart.elemY + dy;
          }
        }

        // Shift key preserves aspect ratio
        if (
          e.shiftKey &&
          (activeHandle === 'se' || activeHandle === 'ne' || activeHandle === 'sw' || activeHandle === 'nw')
        ) {
          const ratio = transformStart.elemW / transformStart.elemH;
          if (newW / newH > ratio) {
            newW = newH * ratio;
          } else {
            newH = newW / ratio;
          }
        }

        if (config.snapToGrid) {
          newX = snapValue(newX);
          newY = snapValue(newY);
          newW = snapValue(newW);
          newH = snapValue(newH);
        }

        onUpdateElement({
          ...selectedElement,
          x: newX,
          y: newY,
          width: Math.max(10, newW),
          height: Math.max(10, newH),
        });
      }
    }
  };

  // MOUSE UP
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    // Finish marquee selection
    if (isMarqueeSelecting && marqueeRect) {
      if (marqueeRect.w > 4 && marqueeRect.h > 4) {
        const hitIds: string[] = [];
        elements.forEach((el) => {
          if (el.visible === false) return;
          // Check AABB overlap
          const elRight = el.x + el.width;
          const elBottom = el.y + el.height;
          const mqRight = marqueeRect.x + marqueeRect.w;
          const mqBottom = marqueeRect.y + marqueeRect.h;

          const overlaps =
            el.x < mqRight &&
            elRight > marqueeRect.x &&
            el.y < mqBottom &&
            elBottom > marqueeRect.y;

          if (overlaps) {
            hitIds.push(el.id);
          }
        });

        onSelectMultipleElements(hitIds);
      }
      setIsMarqueeSelecting(false);
      setMarqueeRect(null);
    }

    // Finish brush stroke
    if (isDrawing && (currentTool === 'brush' || currentTool === 'highlighter')) {
      if (currentPoints.length > 1) {
        const minX = Math.min(...currentPoints.map((p) => p.x));
        const minY = Math.min(...currentPoints.map((p) => p.y));
        const maxX = Math.max(...currentPoints.map((p) => p.x));
        const maxY = Math.max(...currentPoints.map((p) => p.y));

        const isHigh = currentTool === 'highlighter';
        const newStroke: BrushStrokeElement = {
          id: 'brush-' + Date.now(),
          layerId: activeLayer.id,
          name: isHigh ? '형광펜 획' : '브러시 획',
          type: 'brush',
          x: minX,
          y: minY,
          width: Math.max(maxX - minX, 10),
          height: Math.max(maxY - minY, 10),
          rotation: 0,
          opacity: isHigh ? 0.45 : 1,
          points: currentPoints,
          color: primaryColor,
          strokeWidth: isHigh ? Math.max(strokeWidth * 3, 16) : strokeWidth,
          isHighlighter: isHigh,
        };
        onAddElement(newStroke);
      }
      setCurrentPoints([]);
      setIsDrawing(false);
    }

    // Finish LINE Shape creation (Direct Start Point to End Point)
    if (isDrawing && currentTool === 'shape' && (selectedShapeType === 'line' || selectedShapeType === 'line-arrow')) {
      const endPt = linePreviewEnd || drawStart;
      let startX = drawStart.x;
      let startY = drawStart.y;
      let endX = endPt.x;
      let endY = endPt.y;

      if (config.snapToGrid) {
        startX = snapValue(startX);
        startY = snapValue(startY);
        endX = snapValue(endX);
        endY = snapValue(endY);
      }

      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.hypot(dx, dy);

      // Create line if length is at least 4px (or default horizontal line if just clicked)
      const finalLength = length >= 4 ? length : 140;
      const deg = length >= 4 ? (Math.atan2(dy, dx) * 180) / Math.PI : 0;
      const strokeW = (lastShapeStyle.strokeWidth && lastShapeStyle.strokeWidth > 0) ? lastShapeStyle.strokeWidth : (strokeWidth || 2);
      const thickness = Math.max(strokeW * 4, 16);
      const lineStroke = (lastShapeStyle.stroke && lastShapeStyle.stroke !== 'none') ? lastShapeStyle.stroke : (primaryColor || '#000000');

      const newLineShape: ShapeElement = {
        id: 'shape-line-' + Date.now(),
        layerId: activeLayer.id,
        name: selectedShapeType === 'line-arrow' ? '화살표 선' : '직선',
        type: 'shape',
        shapeType: selectedShapeType,
        x: Math.round(startX),
        y: Math.round(startY - thickness / 2),
        width: Math.max(5, Math.round(finalLength)),
        height: thickness,
        rotation: Math.round(deg),
        opacity: lastShapeStyle.opacity ?? 1,
        fill: 'none',
        stroke: lineStroke,
        strokeWidth: strokeW,
        strokeDash: lastShapeStyle.strokeDash || 'solid',
        shadow: lastShapeStyle.shadow,
      };

      onAddElement(newLineShape);
      onSelectElement(newLineShape.id);
      // NOTE: Do NOT automatically switch to 'select' mode! Allow continuous drawing.
      setLinePreviewEnd(null);
      setIsDrawing(false);
    }

    // Finish Regular Shape creation (Inheriting lastShapeStyle for persistent styles)
    if (isDrawing && currentTool === 'shape' && previewRect && selectedShapeType !== 'line' && selectedShapeType !== 'line-arrow') {
      if (previewRect.w >= 5 && previewRect.h >= 5) {
        const newShape: ShapeElement = {
          id: 'shape-' + Date.now(),
          layerId: activeLayer.id,
          name: getShapeKoreanName(selectedShapeType),
          type: 'shape',
          shapeType: selectedShapeType,
          x: config.snapToGrid ? snapValue(previewRect.x) : previewRect.x,
          y: config.snapToGrid ? snapValue(previewRect.y) : previewRect.y,
          width: config.snapToGrid ? snapValue(previewRect.w) : previewRect.w,
          height: config.snapToGrid ? snapValue(previewRect.h) : previewRect.h,
          rotation: 0,
          opacity: lastShapeStyle.opacity ?? 1,
          fill: lastShapeStyle.fill || primaryColor,
          gradient: lastShapeStyle.gradient,
          stroke: lastShapeStyle.stroke || '#000000',
          strokeWidth: lastShapeStyle.strokeWidth ?? (strokeWidth > 0 ? strokeWidth : 2),
          strokeDash: lastShapeStyle.strokeDash || 'solid',
          cornerRadius: lastShapeStyle.cornerRadius ?? 16,
          shadow: lastShapeStyle.shadow,
        };
        onAddElement(newShape);
        onSelectElement(newShape.id);
        // NOTE: Keep tool in 'shape' mode to allow drawing multiple shapes sequentially!
      }
      setPreviewRect(null);
      setIsDrawing(false);
    }

    // Finish crop drag
    if (isDrawing && currentTool === 'crop') {
      setIsDrawing(false);
    }

    // Finish element transform
    if (isTransforming) {
      setIsTransforming(false);
      setActiveHandle(null);
      setTransformStart(null);
    }

    // Finish active image crop handle dragging
    if (imgCropActiveHandle) {
      setImgCropActiveHandle(null);
      setImgCropDragStart(null);
    }
  };

  const getShapeKoreanName = (type: ShapeType): string => {
    switch (type) {
      case 'rect': return '직사각형';
      case 'rounded-rect': return '둥근 모서리 사각형';
      case 'ellipse': return '원 / 타원';
      case 'triangle': return '삼각형';
      case 'diamond': return '다이아몬드';
      case 'star': return '오각별';
      case 'arrow-right': return '오른쪽 화살표';
      case 'arrow-bidirectional': return '양방향 화살표';
      case 'speech-bubble': return '말풍선';
      case 'heart': return '하트';
      case 'hexagon': return '육각형';
      case 'line': return '직선';
      case 'line-arrow': return '화살표 선';
    }
  };

  // Synchronize Canvas Crop Box changes with parent
  useEffect(() => {
    if (currentTool === 'crop' && cropBox && cropBox.w >= 5 && cropBox.h >= 5) {
      onCropBoxChange?.(cropBox);
    } else if (!croppingImageId) {
      onCropBoxChange?.(null);
    }
  }, [cropBox, currentTool, croppingImageId, onCropBoxChange]);

  // Reset cropBox when switching away from crop tool
  useEffect(() => {
    if (currentTool !== 'crop' && cropBox) {
      setCropBox(null);
    }
  }, [currentTool, cropBox]);

  // Flash state when capture copy/cut succeeds
  const [isCropFlashing, setIsCropFlashing] = useState(false);

  // Cut Canvas Crop Region (Ctrl+X)
  const handleCutCrop = useCallback(async () => {
    if (!cropBox || cropBox.w < 5 || cropBox.h < 5) return;
    setIsCropFlashing(true);
    setTimeout(() => setIsCropFlashing(false), 300);

    if (onCutCanvasRegion) {
      await onCutCanvasRegion(cropBox);
      setCropBox(null);
      onSelectTool('select');
    }
  }, [cropBox, onCutCanvasRegion, onSelectTool]);

  // Copy Canvas Crop Region (Ctrl+C)
  const handleCopyCrop = useCallback(async () => {
    if (!cropBox || cropBox.w < 5 || cropBox.h < 5) return;
    setIsCropFlashing(true);
    setTimeout(() => setIsCropFlashing(false), 300);

    if (onCopyCanvasRegion) {
      await onCopyCanvasRegion(cropBox);
    }
  }, [cropBox, onCopyCanvasRegion]);

  // Paste Canvas Crop Region into canvas as a new image element (Ctrl+V)
  const handlePasteCropDirectly = useCallback(async () => {
    if (!cropBox || cropBox.w < 5 || cropBox.h < 5) return;
    setIsCropFlashing(true);
    setTimeout(() => setIsCropFlashing(false), 300);

    if (onPasteCanvasRegion) {
      await onPasteCanvasRegion(cropBox);
      setCropBox(null);
      onSelectTool('select');
    } else if (onCopyCanvasRegion) {
      await onCopyCanvasRegion(cropBox);
      onTriggerPaste?.();
      setCropBox(null);
      onSelectTool('select');
    }
  }, [cropBox, onPasteCanvasRegion, onCopyCanvasRegion, onTriggerPaste, onSelectTool]);

  // Apply Crop (Canvas Resize)
  const applyCrop = useCallback(() => {
    if (!cropBox || cropBox.w < 20 || cropBox.h < 20) {
      setCropBox(null);
      return;
    }
    if (onCropCanvas) {
      onCropCanvas(cropBox);
    } else {
      onUpdateConfig({
        width: Math.round(cropBox.w),
        height: Math.round(cropBox.h),
      });
      elements.forEach((el) => {
        onUpdateElement({
          ...el,
          x: el.x - cropBox.x,
          y: el.y - cropBox.y,
        });
      });
    }
    setCropBox(null);
    onSelectTool('select');
  }, [cropBox, onCropCanvas, onUpdateConfig, elements, onUpdateElement, onSelectTool]);

  // Keyboard shortcuts for Canvas Crop:
  // Ctrl+X: Cut dragged region
  // Ctrl+C: Copy dragged region
  // Ctrl+V: Paste captured image
  // Enter: Apply canvas resize
  // Esc: Cancel
  useEffect(() => {
    if (currentTool !== 'crop' || !cropBox) return;
    const handleCropKeyDown = (e: KeyboardEvent) => {
      // Cut: Ctrl+X or Cmd+X
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        e.stopPropagation();
        handleCutCrop();
        return;
      }
      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        e.stopPropagation();
        handleCopyCrop();
        return;
      }
      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        e.stopPropagation();
        onTriggerPaste?.();
        setCropBox(null);
        onSelectTool('select');
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setCropBox(null);
        onSelectTool('select');
      }
    };
    window.addEventListener('keydown', handleCropKeyDown);
    return () => window.removeEventListener('keydown', handleCropKeyDown);
  }, [currentTool, cropBox, applyCrop, onSelectTool, handleCutCrop, handleCopyCrop, onTriggerPaste]);

  // Start handle transform
  const startTransform = (handle: HandleType | 'move', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedElement || activeLayer.locked) return;
    setIsTransforming(true);
    setActiveHandle(handle);
    const startPositions = selectedElements.map((item) => ({ id: item.id, x: item.x, y: item.y }));

    let lineStart: Point | undefined;
    let lineEnd: Point | undefined;
    if (
      selectedElement.type === 'shape' &&
      (selectedElement.shapeType === 'line' || selectedElement.shapeType === 'line-arrow')
    ) {
      const sx = selectedElement.x;
      const sy = selectedElement.y + selectedElement.height / 2;
      const rad = ((selectedElement.rotation || 0) * Math.PI) / 180;
      const ex = sx + Math.cos(rad) * selectedElement.width;
      const ey = sy + Math.sin(rad) * selectedElement.width;
      lineStart = { x: sx, y: sy };
      lineEnd = { x: ex, y: ey };
    }

    setTransformStart({
      clientX: e.clientX,
      clientY: e.clientY,
      elemX: selectedElement.x,
      elemY: selectedElement.y,
      elemW: selectedElement.width,
      elemH: selectedElement.height,
      elemRotation: selectedElement.rotation || 0,
      elementsStartPositions: startPositions,
      lineStart,
      lineEnd,
    });
  };

  // Calculate Ruler markers
  const rulerStep = zoom > 1.5 ? 50 : zoom < 0.5 ? 200 : 100;
  const hMarkers = [];
  for (let x = 0; x <= config.width; x += rulerStep) {
    hMarkers.push(x);
  }
  const vMarkers = [];
  for (let y = 0; y <= config.height; y += rulerStep) {
    vMarkers.push(y);
  }

  // Active cursor style based on tool and interactions
  const currentCursor = useMemo(() => {
    if (isPanning) return 'grabbing';
    if (currentTool === 'pan') return 'grab';
    return getToolCursor(currentTool);
  }, [currentTool, isPanning]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onInsertImage) {
          for (let i = 0; i < e.dataTransfer.files.length; i++) {
            const file = e.dataTransfer.files[i];
            if (
              file.type.startsWith('image/') ||
              /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)$/i.test(file.name)
            ) {
              onInsertImage(file);
              break;
            }
          }
        }
      }}
      style={{ cursor: currentCursor }}
      className="flex-1 relative overflow-hidden bg-stone-950 select-none outline-none focus:ring-0"
    >
      {/* Horizontal Top Ruler */}
      {config.showRulers && (
        <div className="absolute top-0 left-6 right-0 h-6 bg-stone-900 border-b border-stone-800 z-10 pointer-events-none overflow-hidden font-mono text-[9px] text-stone-500">
          <div
            style={{
              transform: `translateX(${pan.x}px)`,
              width: `${config.width * zoom}px`,
              height: '100%',
              position: 'relative',
            }}
          >
            {hMarkers.map((m) => (
              <div
                key={m}
                className="absolute top-0 border-l border-stone-700 pl-1"
                style={{ left: `${m * zoom}px`, height: '100%' }}
              >
                {m}
              </div>
            ))}
            {/* Dynamic cursor tick */}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-amber-500 z-20"
              style={{ left: `${cursorPos.x * zoom}px` }}
            />
          </div>
        </div>
      )}

      {/* Vertical Left Ruler */}
      {config.showRulers && (
        <div className="absolute top-6 left-0 bottom-0 w-6 bg-stone-900 border-r border-stone-800 z-10 pointer-events-none overflow-hidden font-mono text-[9px] text-stone-500">
          <div
            style={{
              transform: `translateY(${pan.y}px)`,
              height: `${config.height * zoom}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {vMarkers.map((m) => (
              <div
                key={m}
                className="absolute left-0 border-t border-stone-700 pt-0.5 pl-0.5"
                style={{ top: `${m * zoom}px`, width: '100%' }}
              >
                {m}
              </div>
            ))}
            {/* Dynamic cursor tick */}
            <div
              className="absolute left-0 right-0 h-[1px] bg-amber-500 z-20"
              style={{ top: `${cursorPos.y * zoom}px` }}
            />
          </div>
        </div>
      )}

      {/* Top Left Ruler Corner */}
      {config.showRulers && (
        <div className="absolute top-0 left-0 w-6 h-6 bg-stone-900 border-r border-b border-stone-800 z-20 flex items-center justify-center font-mono text-[8px] text-stone-600">
          px
        </div>
      )}

      {/* Interactive Transform Viewport */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: config.width,
          height: config.height,
        }}
        className="absolute shadow-2xl transition-transform duration-75 ease-out"
      >
        {/* Canvas Background Paper */}
        <div
          className={`absolute inset-0 rounded-sm shadow-xl ${
            config.backgroundColor === 'transparent'
              ? 'bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:12px_12px] bg-stone-900/60'
              : ''
          }`}
          style={{
            backgroundColor:
              config.backgroundColor === 'transparent' ? undefined : config.backgroundColor,
          }}
        />

        {/* Grid lines overlay */}
        {config.showGrid && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <pattern
                id="grid-pattern"
                width={config.gridSize}
                height={config.gridSize}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${config.gridSize} 0 L 0 0 0 ${config.gridSize}`}
                  fill="none"
                  stroke="#78716c"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        )}

        {/* SVG Drawing & Elements Stage */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          viewBox={`0 0 ${config.width} ${config.height}`}
        >
          {/* Shadow, Gradient, and Image ClipPath Filters */}
          <defs>
            {elements.map((el) => {
              const nodes = [];
              if (el.shadow?.enabled) {
                nodes.push(
                  <filter
                    key={`shadow-${el.id}`}
                    id={`shadow-${el.id}`}
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feDropShadow
                      dx={el.shadow.offsetX}
                      dy={el.shadow.offsetY}
                      stdDeviation={el.shadow.blur / 2}
                      floodColor={el.shadow.color}
                    />
                  </filter>
                );
              }
              if (el.type === 'shape' && el.gradient?.enabled) {
                const grad = el.gradient;
                if (grad.type === 'linear') {
                  const rad = (grad.angle * Math.PI) / 180;
                  const x1 = Math.round(50 - Math.cos(rad) * 50);
                  const y1 = Math.round(50 - Math.sin(rad) * 50);
                  const x2 = Math.round(50 + Math.cos(rad) * 50);
                  const y2 = Math.round(50 + Math.sin(rad) * 50);
                  nodes.push(
                    <linearGradient
                      key={`grad-${el.id}`}
                      id={`grad-${el.id}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                    >
                      <stop offset="0%" stopColor={grad.startColor} />
                      <stop offset="100%" stopColor={grad.endColor} />
                    </linearGradient>
                  );
                } else {
                  nodes.push(
                    <radialGradient key={`grad-${el.id}`} id={`grad-${el.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={grad.startColor} />
                      <stop offset="100%" stopColor={grad.endColor} />
                    </radialGradient>
                  );
                }
              }
              if (el.type === 'image' && el.cornerRadius) {
                nodes.push(
                  <clipPath key={`clip-${el.id}`} id={`clip-${el.id}`}>
                    <rect
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      rx={el.cornerRadius}
                      ry={el.cornerRadius}
                    />
                  </clipPath>
                );
              }
              return nodes;
            })}
          </defs>

          {/* Render Elements by Layer */}
          {layers.map((layer) => {
            if (!layer.visible) return null;
            const layerElements = elements.filter(
              (el) => el.layerId === layer.id && el.visible !== false
            );

            return (
              <g key={layer.id} opacity={layer.opacity}>
                {layerElements.map((el) => {
                  const isSelected = selectedElementIds.includes(el.id);
                  const rot = el.rotation || 0;
                  const filterAttr = el.shadow?.enabled ? `url(#shadow-${el.id})` : undefined;

                  return (
                    <g
                      key={el.id}
                      onMouseDown={(e) => handleElementMouseDown(el, e)}
                      onDoubleClick={() => handleElementDoubleClick(el)}
                      style={{ pointerEvents: isSelectOrElementTool ? 'all' : 'none' }}
                      className={currentTool === 'select' ? 'cursor-pointer' : ''}
                    >
                      {/* SHAPE ELEMENT */}
                      {el.type === 'shape' && (
                        <g
                          transform={`translate(${el.x}, ${el.y}) rotate(${rot} ${
                            el.shapeType === 'line' || el.shapeType === 'line-arrow'
                              ? `0 ${el.height / 2}`
                              : `${el.width / 2} ${el.height / 2}`
                          })`}
                        >
                          {/* Invisible Extra-Wide Hitbox for 1-Click Selection */}
                          {el.shapeType === 'line' || el.shapeType === 'line-arrow' ? (
                            <line
                              x1={0}
                              y1={el.height / 2}
                              x2={el.width}
                              y2={el.height / 2}
                              stroke="transparent"
                              strokeWidth={Math.max(el.strokeWidth, 24)}
                              pointerEvents={isSelectOrElementTool ? 'all' : 'none'}
                              className={currentTool === 'select' ? 'cursor-pointer' : ''}
                            />
                          ) : (
                            <path
                              d={getShapePath(el.shapeType, el.width, el.height, el.cornerRadius)}
                              fill="transparent"
                              stroke="transparent"
                              strokeWidth={Math.max(el.strokeWidth, 16)}
                              pointerEvents={isSelectOrElementTool ? 'all' : 'none'}
                              className={currentTool === 'select' ? 'cursor-pointer' : ''}
                            />
                          )}

                          {/* Visual Visible Shape Path */}
                          <path
                            d={getShapePath(el.shapeType, el.width, el.height, el.cornerRadius)}
                            fill={
                              el.shapeType === 'line' || el.shapeType === 'line-arrow'
                                ? 'none'
                                : el.gradient?.enabled
                                ? `url(#grad-${el.id})`
                                : el.fill
                            }
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                            strokeLinecap={el.shapeType === 'line' || el.shapeType === 'line-arrow' ? 'round' : undefined}
                            strokeLinejoin={el.shapeType === 'line' || el.shapeType === 'line-arrow' ? 'round' : undefined}
                            strokeDasharray={
                              el.strokeDash === 'dashed'
                                ? '8 6'
                                : el.strokeDash === 'dotted'
                                ? '3 4'
                                : undefined
                            }
                            opacity={el.opacity}
                            filter={filterAttr}
                            pointerEvents={isSelectOrElementTool ? 'all' : 'none'}
                          />
                        </g>
                      )}

                      {/* BRUSH STROKE ELEMENT */}
                      {el.type === 'brush' && (
                        <g>
                          {/* Invisible wide hitbox for brush */}
                          <path
                            d={generateBrushSmoothPath(el.points)}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={Math.max(el.strokeWidth, 20)}
                            pointerEvents={isSelectOrElementTool ? 'all' : 'none'}
                            className={currentTool === 'select' ? 'cursor-pointer' : ''}
                          />
                          <path
                            d={generateBrushSmoothPath(el.points)}
                            fill="none"
                            stroke={el.color}
                            strokeWidth={el.strokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={el.isHighlighter ? el.opacity * 0.45 : el.opacity}
                            filter={filterAttr}
                            pointerEvents={isSelectOrElementTool ? 'all' : 'none'}
                          />
                        </g>
                      )}

                      {/* TEXT ELEMENT */}
                      {el.type === 'text' && (
                        <g
                          transform={
                            rot !== 0
                              ? `rotate(${rot} ${el.x + el.width / 2} ${el.y + el.height / 2})`
                              : undefined
                          }
                        >
                          {/* Text hitbox rect */}
                          <rect
                            x={el.x}
                            y={el.y}
                            width={el.width}
                            height={el.height}
                            fill="transparent"
                            pointerEvents={isSelectOrElementTool ? 'all' : 'none'}
                            className={currentTool === 'select' ? 'cursor-pointer' : ''}
                          />
                          <text
                            x={
                              el.align === 'center'
                                ? el.x + el.width / 2
                                : el.align === 'right'
                                ? el.x + el.width
                                : el.x
                            }
                            y={el.y + el.fontSize}
                            fontFamily={el.fontFamily}
                            fontSize={el.fontSize}
                            fontWeight={el.bold ? 'bold' : 'normal'}
                            fontStyle={el.italic ? 'italic' : 'normal'}
                            textDecoration={el.underline ? 'underline' : 'none'}
                            fill={el.color}
                            textAnchor={
                              el.align === 'center'
                                ? 'middle'
                                : el.align === 'right'
                                ? 'end'
                                : 'start'
                            }
                            opacity={el.opacity}
                            filter={filterAttr}
                            pointerEvents="none"
                          >
                            {el.text}
                          </text>
                        </g>
                      )}

                      {/* IMAGE ELEMENT (Supports ClipPath Corner Radius, Border, and Non-blocking pointer events) */}
                      {el.type === 'image' && (
                        <g
                          transform={
                            rot !== 0
                              ? `rotate(${rot} ${el.x + el.width / 2} ${el.y + el.height / 2})`
                              : undefined
                          }
                        >
                          <image
                            href={el.src}
                            x={el.x}
                            y={el.y}
                            width={el.width}
                            height={el.height}
                            preserveAspectRatio="none"
                            opacity={el.opacity}
                            filter={filterAttr}
                            clipPath={el.cornerRadius ? `url(#clip-${el.id})` : undefined}
                            pointerEvents={isSelectOrElementTool ? 'all' : 'none'}
                            className={currentTool === 'select' ? 'cursor-pointer' : ''}
                            style={{
                              filter: `brightness(${el.filters.brightness}%) contrast(${el.filters.contrast}%) saturate(${el.filters.saturation}%) blur(${el.filters.blur}px) grayscale(${el.filters.grayscale}%) invert(${el.filters.invert}%)`,
                              transform: `${el.flipH ? 'scaleX(-1)' : ''} ${
                                el.flipV ? 'scaleY(-1)' : ''
                              }`,
                              transformOrigin: `${el.x + el.width / 2}px ${
                                el.y + el.height / 2
                              }px`,
                            }}
                          />
                          {/* Optional Picture Border */}
                          {el.borderWidth ? (
                            <rect
                              x={el.x}
                              y={el.y}
                              width={el.width}
                              height={el.height}
                              rx={el.cornerRadius || 0}
                              ry={el.cornerRadius || 0}
                              fill="none"
                              stroke={el.borderColor || '#000000'}
                              strokeWidth={el.borderWidth}
                              pointerEvents="none"
                            />
                          ) : null}
                        </g>
                      )}

                      {/* Multi-selection indicator highlight border if element is selected */}
                      {isSelected && selectedElementIds.length > 1 && (
                        <rect
                          x={el.x - 2}
                          y={el.y - 2}
                          width={el.width + 4}
                          height={el.height + 4}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          pointerEvents="none"
                          transform={
                            rot !== 0
                              ? `rotate(${rot} ${
                                  el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'line-arrow')
                                    ? `${el.x} ${el.y + el.height / 2}`
                                    : `${el.x + el.width / 2} ${el.y + el.height / 2}`
                                })`
                              : undefined
                          }
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Active Brush Stroke Live Drawing Preview */}
          {isDrawing && currentPoints.length > 1 && (
            <path
              d={generateBrushSmoothPath(currentPoints)}
              fill="none"
              stroke={primaryColor}
              strokeWidth={
                currentTool === 'highlighter' ? Math.max(strokeWidth * 3, 16) : strokeWidth
              }
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={currentTool === 'highlighter' ? 0.45 : 1}
            />
          )}

          {/* Active LINE Live Drawing Preview (Direct from start to end) */}
          {isDrawing && currentTool === 'shape' && (selectedShapeType === 'line' || selectedShapeType === 'line-arrow') && linePreviewEnd && (() => {
            const activeLineStroke = (lastShapeStyle.stroke && lastShapeStyle.stroke !== 'none') ? lastShapeStyle.stroke : (primaryColor || '#000000');
            const activeStrokeW = (lastShapeStyle.strokeWidth && lastShapeStyle.strokeWidth > 0) ? lastShapeStyle.strokeWidth : (strokeWidth || 2);
            return (
              <g pointerEvents="none">
                <line
                  x1={drawStart.x}
                  y1={drawStart.y}
                  x2={linePreviewEnd.x}
                  y2={linePreviewEnd.y}
                  stroke={activeLineStroke}
                  strokeWidth={activeStrokeW}
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                />
                {selectedShapeType === 'line-arrow' && (() => {
                  const dx = linePreviewEnd.x - drawStart.x;
                  const dy = linePreviewEnd.y - drawStart.y;
                  const len = Math.hypot(dx, dy);
                  if (len < 6) return null;
                  const angle = Math.atan2(dy, dx);
                  const headSize = Math.min(18, Math.max(10, len * 0.2));
                  const a1 = angle - Math.PI / 6;
                  const a2 = angle + Math.PI / 6;
                  const x1 = linePreviewEnd.x - headSize * Math.cos(a1);
                  const y1 = linePreviewEnd.y - headSize * Math.sin(a1);
                  const x2 = linePreviewEnd.x - headSize * Math.cos(a2);
                  const y2 = linePreviewEnd.y - headSize * Math.sin(a2);
                  return (
                    <path
                      d={`M ${x1} ${y1} L ${linePreviewEnd.x} ${linePreviewEnd.y} L ${x2} ${y2}`}
                      fill="none"
                      stroke={activeLineStroke}
                      strokeWidth={activeStrokeW}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })()}
                {/* Start point dot */}
                <circle cx={drawStart.x} cy={drawStart.y} r={4} fill="#F59E0B" stroke="#000000" strokeWidth={1} />
                {/* End point dot / indicator */}
                <circle cx={linePreviewEnd.x} cy={linePreviewEnd.y} r={4} fill="#F59E0B" stroke="#000000" strokeWidth={1} />
              </g>
            );
          })()}

          {/* Active Shape Live Drawing Preview (for non-line shapes) */}
          {isDrawing && previewRect && selectedShapeType !== 'line' && selectedShapeType !== 'line-arrow' && (
            <g transform={`translate(${previewRect.x}, ${previewRect.y})`}>
              <path
                d={getShapePath(selectedShapeType, previewRect.w, previewRect.h)}
                fill={lastShapeStyle.fill || primaryColor}
                stroke={lastShapeStyle.stroke || '#000000'}
                strokeWidth={lastShapeStyle.strokeWidth || strokeWidth || 1}
                opacity={0.8}
                strokeDasharray="4 4"
              />
            </g>
          )}
        </svg>

        {/* Marquee Selection Drag Box (Multi-selection) */}
        {isMarqueeSelecting && marqueeRect && (
          <div
            style={{
              position: 'absolute',
              left: `${marqueeRect.x}px`,
              top: `${marqueeRect.y}px`,
              width: `${marqueeRect.w}px`,
              height: `${marqueeRect.h}px`,
            }}
            className="border-2 border-dashed border-amber-400 bg-amber-500/15 pointer-events-none z-30"
          />
        )}

        {/* Selected LINE Endpoint Handles & Move Overlay (PowerPoint Style) */}
        {currentTool === 'select' && selectedLineEndpoints && selectedElement && !activeLayer.locked && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <svg className="w-full h-full absolute inset-0 overflow-visible pointer-events-none">
              {/* Move hitbox along the entire line */}
              <line
                x1={selectedLineEndpoints.start.x}
                y1={selectedLineEndpoints.start.y}
                x2={selectedLineEndpoints.end.x}
                y2={selectedLineEndpoints.end.y}
                stroke="transparent"
                strokeWidth={Math.max(selectedElement.strokeWidth + 18, 24)}
                className="pointer-events-auto cursor-move"
                onMouseDown={(e) => startTransform('move', e)}
              />
              {/* Dashed line selection indicator */}
              <line
                x1={selectedLineEndpoints.start.x}
                y1={selectedLineEndpoints.start.y}
                x2={selectedLineEndpoints.end.x}
                y2={selectedLineEndpoints.end.y}
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                className="pointer-events-none"
              />
            </svg>
            {/* Start Point Handle */}
            <div
              style={{
                left: `${selectedLineEndpoints.start.x}px`,
                top: `${selectedLineEndpoints.start.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={(e) => startTransform('line-start', e)}
              className="absolute w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-full shadow-md cursor-crosshair pointer-events-auto hover:scale-125 transition-transform"
              title="선 시작점 이동"
            />
            {/* End Point Handle */}
            <div
              style={{
                left: `${selectedLineEndpoints.end.x}px`,
                top: `${selectedLineEndpoints.end.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={(e) => startTransform('line-end', e)}
              className="absolute w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-full shadow-md cursor-crosshair pointer-events-auto hover:scale-125 transition-transform"
              title="선 끝점 이동"
            />
          </div>
        )}

        {/* Selected Non-Line Element Interactive Transform Box (PowerPoint Style Handles) */}
        {currentTool === 'select' && !selectedLineEndpoints && selectedElement && !activeLayer.locked && selectedElement.id !== croppingImageId && (
          <div
            style={{
              position: 'absolute',
              left: `${selectedElement.x}px`,
              top: `${selectedElement.y}px`,
              width: `${selectedElement.width}px`,
              height: `${selectedElement.height}px`,
              transform: `rotate(${selectedElement.rotation || 0}deg)`,
              transformOrigin: 'center center',
            }}
            className="pointer-events-none border border-amber-500 ring-1 ring-amber-500/50 z-20"
          >
            {/* Move handle area */}
            <div
              onMouseDown={(e) => startTransform('move', e)}
              className="absolute inset-0 cursor-move pointer-events-auto bg-amber-500/5"
              title="드래그하여 이동 (Shift+클릭으로 다중 선택)"
            />

            {/* Rotation handle and line */}
            <div className="absolute left-1/2 -top-6 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
              <div
                onMouseDown={(e) => startTransform('rotate', e)}
                className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white cursor-grab shadow hover:scale-125 transition-transform"
                title="회전 핸들 (Shift 누르면 15도 스냅)"
              />
              <div className="w-[1px] h-3 bg-amber-500" />
            </div>

            {/* 8 Resize Handles */}
            {[
              { type: 'nw', cursor: 'nwse-resize', pos: '-top-1.5 -left-1.5' },
              { type: 'n', cursor: 'ns-resize', pos: '-top-1.5 left-1/2 -translate-x-1/2' },
              { type: 'ne', cursor: 'nesw-resize', pos: '-top-1.5 -right-1.5' },
              { type: 'e', cursor: 'ew-resize', pos: 'top-1/2 -right-1.5 -translate-y-1/2' },
              { type: 'se', cursor: 'nwse-resize', pos: '-bottom-1.5 -right-1.5' },
              { type: 's', cursor: 'ns-resize', pos: '-bottom-1.5 left-1/2 -translate-x-1/2' },
              { type: 'sw', cursor: 'nesw-resize', pos: '-bottom-1.5 -left-1.5' },
              { type: 'w', cursor: 'ew-resize', pos: 'top-1/2 -left-1.5 -translate-y-1/2' },
            ].map((h) => (
              <div
                key={h.type}
                onMouseDown={(e) => startTransform(h.type as HandleType, e)}
                style={{ cursor: h.cursor }}
                className={`absolute w-3 h-3 bg-white border border-amber-600 rounded-sm shadow-sm pointer-events-auto hover:scale-125 transition-transform ${h.pos}`}
              />
            ))}
          </div>
        )}

        {/* PowerPoint-style Image Cropping Overlay */}
        {croppingImage && croppingImageId === croppingImage.id && (
          <div
            style={{
              position: 'absolute',
              left: `${croppingImage.x}px`,
              top: `${croppingImage.y}px`,
              width: `${croppingImage.width}px`,
              height: `${croppingImage.height}px`,
              transform: `rotate(${croppingImage.rotation || 0}deg)`,
              transformOrigin: 'center center',
            }}
            className="pointer-events-none z-30"
          >
            {/* Dimmed Areas (outside crop box) */}
            {/* Top Dim */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: `${imgCropBox.y}px`,
              }}
              className="bg-stone-950/65 pointer-events-auto"
            />
            {/* Bottom Dim */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: `${imgCropBox.y + imgCropBox.h}px`,
                width: '100%',
                height: `${Math.max(0, croppingImage.height - (imgCropBox.y + imgCropBox.h))}px`,
              }}
              className="bg-stone-950/65 pointer-events-auto"
            />
            {/* Left Dim */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: `${imgCropBox.y}px`,
                width: `${imgCropBox.x}px`,
                height: `${imgCropBox.h}px`,
              }}
              className="bg-stone-950/65 pointer-events-auto"
            />
            {/* Right Dim */}
            <div
              style={{
                position: 'absolute',
                left: `${imgCropBox.x + imgCropBox.w}px`,
                top: `${imgCropBox.y}px`,
                width: `${Math.max(0, croppingImage.width - (imgCropBox.x + imgCropBox.w))}px`,
                height: `${imgCropBox.h}px`,
              }}
              className="bg-stone-950/65 pointer-events-auto"
            />

            {/* Active Crop Box Frame with 3x3 Rule-of-Thirds Grid */}
            <div
              style={{
                position: 'absolute',
                left: `${imgCropBox.x}px`,
                top: `${imgCropBox.y}px`,
                width: `${imgCropBox.w}px`,
                height: `${imgCropBox.h}px`,
              }}
              className="border-2 border-white shadow-2xl pointer-events-none"
            >
              {/* Internal 3x3 Rule-of-Thirds Guidelines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Move Area inside crop box */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('move', e)}
                className="absolute inset-0 cursor-move pointer-events-auto hover:bg-amber-500/10 transition-colors"
                title="드래그하여 자르기 영역 이동"
              />

              {/* PowerPoint Style Thick Corner Handles */}
              {/* NW */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('nw', e)}
                className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-black pointer-events-auto cursor-nwse-resize shadow bg-white/50"
              />
              {/* NE */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('ne', e)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-black pointer-events-auto cursor-nesw-resize shadow bg-white/50"
              />
              {/* SE */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('se', e)}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-black pointer-events-auto cursor-nwse-resize shadow bg-white/50"
              />
              {/* SW */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('sw', e)}
                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-black pointer-events-auto cursor-nesw-resize shadow bg-white/50"
              />

              {/* PowerPoint Style Edge Mid-bars */}
              {/* N */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('n', e)}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-black border border-white pointer-events-auto cursor-ns-resize shadow"
              />
              {/* S */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('s', e)}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-black border border-white pointer-events-auto cursor-ns-resize shadow"
              />
              {/* W */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('w', e)}
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-1.5 h-6 bg-black border border-white pointer-events-auto cursor-ew-resize shadow"
              />
              {/* E */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('e', e)}
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-1.5 h-6 bg-black border border-white pointer-events-auto cursor-ew-resize shadow"
              />
            </div>

            {/* Floating Crop Control Toolbar */}
            <div
              style={{
                position: 'absolute',
                left: `${imgCropBox.x}px`,
                top: `${imgCropBox.y + imgCropBox.h + 10}px`,
              }}
              className="pointer-events-auto flex items-center bg-stone-900 border border-stone-700 rounded-lg p-1.5 shadow-2xl space-x-1.5 z-40 text-xs text-stone-200 backdrop-blur whitespace-nowrap"
            >
              <div className="flex items-center px-1.5 font-mono text-[11px] text-amber-400 font-semibold border-r border-stone-700 pr-2">
                <Crop className="w-3.5 h-3.5 mr-1" />
                {Math.round(imgCropBox.w)} × {Math.round(imgCropBox.h)} px
              </div>

              {/* Aspect ratio quick presets */}
              <div className="flex items-center space-x-1 pr-1.5 border-r border-stone-700">
                <button
                  type="button"
                  onClick={() => setCropAspectRatio(1, 1, croppingImage)}
                  className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-stone-300 transition-colors"
                  title="1:1 정사각형"
                >
                  1:1
                </button>
                <button
                  type="button"
                  onClick={() => setCropAspectRatio(4, 3, croppingImage)}
                  className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-stone-300 transition-colors"
                  title="4:3 비율"
                >
                  4:3
                </button>
                <button
                  type="button"
                  onClick={() => setCropAspectRatio(16, 9, croppingImage)}
                  className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-stone-300 transition-colors"
                  title="16:9 와이드"
                >
                  16:9
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImgCropBox({
                      x: 0,
                      y: 0,
                      w: croppingImage.width,
                      h: croppingImage.height,
                    })
                  }
                  className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-stone-400 transition-colors"
                  title="전체 영역으로 초기화"
                >
                  초기화
                </button>
              </div>

              {/* Cut & Copy image portion */}
              <div className="flex items-center space-x-1 pr-1.5 border-r border-stone-700">
                <button
                  type="button"
                  onClick={() => onCutImagePart?.(croppingImage, imgCropBox)}
                  className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 text-[11px] font-semibold rounded transition-colors flex items-center space-x-1"
                  title="선택 영역을 오려내어 클립보드에 저장하고 원본에서 비웁니다 (Ctrl+X)"
                >
                  <Scissors className="w-3 h-3" />
                  <span>오려내기 (Ctrl+X)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCopyImagePart?.(croppingImage, imgCropBox)}
                  className="px-2 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 hover:text-sky-200 border border-sky-500/30 text-[11px] font-semibold rounded transition-colors flex items-center space-x-1"
                  title="선택 영역을 클립보드에 복사합니다 (Ctrl+C)"
                >
                  <Copy className="w-3 h-3" />
                  <span>복사 (Ctrl+C)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleApplyImageCrop(croppingImage, imgCropBox)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded transition-colors shadow flex items-center"
                title="지정한 영역만 남기고 나머지 이미지를 자릅니다 (Enter)"
              >
                남기기 완료 (Enter)
              </button>
              <button
                type="button"
                onClick={() => onFinishCropImage?.()}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded transition-colors"
              >
                취소 (Esc)
              </button>
            </div>
          </div>
        )}

        {/* Crop Box Overlay with Cut / Copy / Paste Floating Bar */}
        {cropBox && (
          <div
            style={{
              left: `${cropBox.x}px`,
              top: `${cropBox.y}px`,
              width: `${cropBox.w}px`,
              height: `${cropBox.h}px`,
            }}
            className={`absolute border-2 border-dashed border-amber-400 pointer-events-none z-30 transition-all duration-150 ${
              isCropFlashing
                ? 'bg-white/80 ring-4 ring-amber-400 shadow-2xl'
                : 'bg-amber-500/15'
            }`}
          >
            {/* Corner resize indicators */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-400 rounded-sm border border-stone-900 shadow-sm" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-sm border border-stone-900 shadow-sm" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-400 rounded-sm border border-stone-900 shadow-sm" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-sm border border-stone-900 shadow-sm" />

            {/* Dimension Badge */}
            <div className="absolute -top-7 left-0 bg-stone-950/90 text-amber-300 font-mono text-[11px] px-2 py-0.5 rounded shadow border border-amber-500/40 pointer-events-none flex items-center space-x-1.5">
              <span className="font-bold">{Math.round(cropBox.w)} × {Math.round(cropBox.h)} px</span>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute -bottom-10 left-0 flex items-center flex-wrap gap-1 pointer-events-auto bg-stone-950/95 backdrop-blur-md px-2 py-1.5 rounded-lg border border-stone-700/80 shadow-2xl z-40 w-max max-w-full">
              {/* Cut (Ctrl+X) */}
              <button
                type="button"
                onClick={handleCutCrop}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded transition-all shadow flex items-center space-x-1 active:scale-95 cursor-pointer"
                title="선택한 영역을 오려내어 클립보드에 저장합니다 (Ctrl+X)"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>오리기</span>
                <span className="text-[10px] bg-rose-700 text-rose-100 font-mono px-1 rounded">Ctrl+X</span>
              </button>

              {/* Copy (Ctrl+C) */}
              <button
                type="button"
                onClick={handleCopyCrop}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded transition-all shadow flex items-center space-x-1 active:scale-95 cursor-pointer"
                title="선택한 영역을 이미지로 클립보드에 복사합니다 (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>복사</span>
                <span className="text-[10px] bg-amber-600/80 text-white font-mono px-1 rounded">Ctrl+C</span>
              </button>

              {/* Paste (Ctrl+V) */}
              <button
                type="button"
                onClick={handlePasteCropDirectly}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded transition-colors flex items-center space-x-1 active:scale-95 cursor-pointer shadow"
                title="복사/오려낸 영역을 캔버스에 붙여넣습니다 (Ctrl+V)"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>붙여넣기</span>
                <span className="text-[10px] bg-sky-700 text-sky-100 font-mono px-1 rounded">Ctrl+V</span>
              </button>

              {/* Resize Canvas Crop */}
              <button
                type="button"
                onClick={applyCrop}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded transition-colors flex items-center space-x-1 cursor-pointer"
                title="캔버스 크기를 이 영역으로 자릅니다 (Enter)"
              >
                <span>자르기</span>
                <span className="text-[10px] text-stone-400 font-mono">Enter</span>
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => {
                  setCropBox(null);
                  onSelectTool('select');
                }}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs rounded transition-colors cursor-pointer"
                title="취소 (Esc)"
              >
                취소 (Esc)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Info Bar */}
      <div className="absolute bottom-2 right-4 bg-stone-900/90 backdrop-blur border border-stone-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-stone-400 flex items-center space-x-4 pointer-events-none z-10 shadow-lg">
        <div>
          캔버스: <span className="text-stone-200">{config.width} × {config.height} px</span>
        </div>
        <div>
          마우스: <span className="text-stone-200">{Math.round(cursorPos.x)}, {Math.round(cursorPos.y)}</span>
        </div>
        <div>
          배율: <span className="text-amber-400 font-semibold">{Math.round(zoom * 100)}%</span>
        </div>
        {selectedElements.length > 1 ? (
          <div className="text-amber-400 font-semibold">
            선택: {selectedElements.length}개 개체 다중 선택됨
          </div>
        ) : selectedElement ? (
          <div className="text-stone-300">
            선택: {selectedElement.name || selectedElement.type} ({Math.round(selectedElement.width)}×{Math.round(selectedElement.height)})
          </div>
        ) : null}
      </div>
    </div>
  );
};
