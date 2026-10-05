import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CanvasConfig,
  CanvasElement,
  Layer,
  ToolType,
  ShapeType,
  HistorySnapshot,
  ImageElement,
  ShapeStylePreset,
} from './types';
import { HeaderNavbar } from './components/HeaderNavbar';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';
import { CanvasArea } from './components/CanvasArea';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExportModal } from './components/ExportModal';
import { ShortcutsGuideModal } from './components/ShortcutsGuideModal';
import { NewCanvasModal } from './components/NewCanvasModal';
import { ClipboardGuideModal } from './components/ClipboardGuideModal';
import { exportRegionToRaster } from './utils/rasterExport';
import {
  extractImageSlice,
  getImageLocalIntersection,
  punchHoleInImageElement,
} from './utils/imageEdit';

const INITIAL_CONFIG: CanvasConfig = {
  width: 1280,
  height: 720,
  backgroundColor: '#FFFFFF',
  showGrid: false,
  showRulers: true,
  snapToGrid: false,
  gridSize: 20,
};

const INITIAL_LAYERS: Layer[] = [
  {
    id: 'layer-1',
    name: '레이어1',
    visible: true,
    locked: false,
    opacity: 1,
  },
];

/** Next free name in 레이어1, 레이어2, … form */
function nextLayerName(existing: Layer[]): string {
  let max = 0;
  for (const layer of existing) {
    const m = /^레이어(\d+)$/.exec(layer.name.trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  let n = max + 1;
  if (n < 1) n = 1;
  while (existing.some((l) => l.name === `레이어${n}`)) n += 1;
  return `레이어${n}`;
}

const INITIAL_ELEMENTS: CanvasElement[] = [];

/** Offset when pasting / duplicating objects (right + down) */
const PASTE_OFFSET_PX = 10;

export default function App() {
  // State
  const [config, setConfig] = useState<CanvasConfig>(INITIAL_CONFIG);
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [activeLayerId, setActiveLayerId] = useState<string>(INITIAL_LAYERS[0].id);
  const [elements, setElements] = useState<CanvasElement[]>(INITIAL_ELEMENTS);

  // Multi-element selection state
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const selectedElementId = selectedElementIds[selectedElementIds.length - 1] || null;

  // Persistent shape styling (Feature 5: applied to subsequent shapes)
  const [lastShapeStyle, setLastShapeStyle] = useState<ShapeStylePreset>({
    fill: 'none',
    stroke: '#FF0000',
    strokeWidth: 2,
    strokeDash: 'solid',
    cornerRadius: 16,
    opacity: 1,
  });

  // Tool & styling state
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('rounded-rect');
  const [primaryColor, setPrimaryColor] = useState<string>('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(0.9);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNewCanvasOpen, setIsNewCanvasOpen] = useState(false);
  const [isClipboardGuideOpen, setIsClipboardGuideOpen] = useState(false);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Left & Right Panels Collapse State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // PowerPoint-style Image Cropping State
  const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
  const [activeImgCropBox, setActiveImgCropBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const activeImgCropBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Canvas-wide Crop Box State (for Screen/Canvas Region Capture)
  const activeCanvasCropBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const lastMouseCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  // Internal Clipboard for Object Copy/Cut and Image Slice Cut/Copy
  const internalClipboardRef = useRef<{
    type: 'image-slice' | 'elements';
    imageSlice?: {
      src: string;
      width: number;
      height: number;
      naturalWidth: number;
      naturalHeight: number;
      suggestedX?: number;
      suggestedY?: number;
    };
    elements?: CanvasElement[];
  } | null>(null);

  const handleStartCropImage = useCallback((id: string) => {
    setCroppingImageId(id);
    setSelectedElementIds([id]);
    setCurrentTool('select');
  }, []);

  const handleFinishCropImage = useCallback(() => {
    setCroppingImageId(null);
    setActiveImgCropBox(null);
    activeImgCropBoxRef.current = null;
  }, []);

  // Picture-crop reports the live rectangle. Ignore identical boxes so parent
  // renders do not bounce back into the canvas and reset the crop.
  const handleCropBoxChange = useCallback(
    (box: { x: number; y: number; w: number; h: number } | null) => {
      if (croppingImageId) {
        activeImgCropBoxRef.current = box;
        setActiveImgCropBox((prev) => {
          if (box === prev) return prev;
          if (!box || !prev) return box;
          if (prev.x === box.x && prev.y === box.y && prev.w === box.w && prev.h === box.h) {
            return prev;
          }
          return box;
        });
      } else {
        activeCanvasCropBoxRef.current = box;
      }
    },
    [croppingImageId]
  );

  // Switching tools: canvas crop must not keep selection/transform active
  const handleSelectTool = useCallback((tool: ToolType) => {
    if (tool === 'crop') {
      setSelectedElementIds([]);
      setCroppingImageId(null);
      setActiveImgCropBox(null);
      activeImgCropBoxRef.current = null;
    } else if (tool !== 'select' && croppingImageId) {
      setCroppingImageId(null);
      setActiveImgCropBox(null);
      activeImgCropBoxRef.current = null;
    }
    setCurrentTool(tool);
  }, [croppingImageId]);

  const toggleLeftPanel = useCallback(() => {
    setIsLeftPanelOpen((prev) => !prev);
  }, []);

  const toggleRightPanel = useCallback(() => {
    setIsRightPanelOpen((prev) => !prev);
  }, []);

  // History for Undo / Redo
  const [history, setHistory] = useState<HistorySnapshot[]>([
    {
      elements: INITIAL_ELEMENTS,
      layers: INITIAL_LAYERS,
      activeLayerId: INITIAL_LAYERS[0].id,
      canvasConfig: INITIAL_CONFIG,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isHistoryActionRef = useRef(false);

  // Push new snapshot to history
  const pushHistory = useCallback(
    (newElements: CanvasElement[], newLayers: Layer[], newConfig: CanvasConfig) => {
      if (isHistoryActionRef.current) {
        isHistoryActionRef.current = false;
        return;
      }
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const newSnap: HistorySnapshot = {
          elements: newElements,
          layers: newLayers,
          activeLayerId,
          canvasConfig: newConfig,
        };
        // Keep up to 30 snapshots
        const updated = [...sliced, newSnap];
        if (updated.length > 30) updated.shift();
        return updated;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [historyIndex, activeLayerId]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const targetSnap = history[historyIndex - 1];
      setElements(targetSnap.elements);
      setLayers(targetSnap.layers);
      setActiveLayerId(targetSnap.activeLayerId);
      setConfig(targetSnap.canvasConfig);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex, history]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryActionRef.current = true;
      const targetSnap = history[historyIndex + 1];
      setElements(targetSnap.elements);
      setLayers(targetSnap.layers);
      setActiveLayerId(targetSnap.activeLayerId);
      setConfig(targetSnap.canvasConfig);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, history]);

  // Selection handlers ??sync selected object's color/style for subsequent drawing
  const handleSelectElement = useCallback(
    (id: string | null) => {
      setSelectedElementIds(id ? [id] : []);
      if (!id) return;

      const target = elements.find((e) => e.id === id);
      if (!target) return;

      if (target.type === 'shape') {
        const isLineShape =
          target.shapeType === 'line' ||
          target.shapeType === 'line-arrow' ||
          target.shapeType === 'polyline' || target.shapeType === 'arc';

        if (isLineShape) {
          setSelectedShapeType(target.shapeType);
          if (target.stroke && target.stroke !== 'none') {
            setPrimaryColor(target.stroke);
          }
          if (target.strokeWidth) {
            setStrokeWidth(target.strokeWidth);
          }
          setLastShapeStyle((prev) => ({
            ...prev,
            stroke: target.stroke !== 'none' ? target.stroke : prev.stroke,
            strokeWidth: target.strokeWidth,
            strokeDash: target.strokeDash,
            opacity: target.opacity,
            shadow: target.shadow,
            gradient: target.gradient?.enabled
              ? { ...target.gradient, enabled: false }
              : prev.gradient
                ? { ...prev.gradient, enabled: false }
                : undefined,
          }));
        } else {
          setSelectedShapeType(target.shapeType);
          const fillColor =
            target.fill && target.fill !== 'none'
              ? target.fill
              : target.gradient?.enabled
                ? target.gradient.startColor
                : null;
          if (fillColor) {
            setPrimaryColor(fillColor);
          } else if (target.stroke && target.stroke !== 'none') {
            setPrimaryColor(target.stroke);
          }
          if (target.strokeWidth) {
            setStrokeWidth(target.strokeWidth);
          }
          setLastShapeStyle((prev) => ({
            ...prev,
            fill: fillColor || prev.fill,
            stroke:
              target.stroke && target.stroke !== 'none' ? target.stroke : fillColor || prev.stroke,
            strokeWidth: target.strokeWidth,
            strokeDash: target.strokeDash,
            cornerRadius: target.cornerRadius ?? prev.cornerRadius,
            opacity: target.opacity,
            gradient: target.gradient,
            shadow: target.shadow,
          }));
        }
      } else if (target.type === 'brush') {
        setPrimaryColor(target.color);
        setStrokeWidth(
          target.isHighlighter
            ? Math.max(2, Math.round(target.strokeWidth / 3))
            : target.strokeWidth
        );
        setLastShapeStyle((prev) => ({
          ...prev,
          fill: target.color,
          stroke: target.color,
          strokeWidth: target.isHighlighter
            ? Math.max(2, Math.round(target.strokeWidth / 3))
            : target.strokeWidth,
          gradient: prev.gradient ? { ...prev.gradient, enabled: false } : undefined,
        }));
      } else if (target.type === 'text') {
        setPrimaryColor(target.color);
        setLastShapeStyle((prev) => ({
          ...prev,
          fill: target.color,
          stroke: target.color,
          gradient: prev.gradient ? { ...prev.gradient, enabled: false } : undefined,
        }));
      }
    },
    [elements]
  );

  const handleSelectMultipleElements = useCallback((ids: string[]) => {
    setSelectedElementIds(ids);
  }, []);

  const handleToggleSelectElement = useCallback((id: string, isShift: boolean) => {
    setSelectedElementIds((prev) => {
      if (isShift) {
        if (prev.includes(id)) {
          return prev.filter((item) => item !== id);
        } else {
          return [...prev, id];
        }
      }
      return [id];
    });
  }, []);

  // Clear Canvas
  const handleClearCanvas = () => {
    if (window.confirm('캔버스의 모든 요소를 비우시겠습니까?')) {
      const nextElements: CanvasElement[] = [];
      setElements(nextElements);
      setSelectedElementIds([]);
      pushHistory(nextElements, layers, config);
    }
  };

  // Add Element
  const handleAddElement = useCallback(
    (newElem: CanvasElement) => {
      const next = [...elements, newElem];
      setElements(next);
      if (newElem.type === 'shape') {
        const isLineShape =
          newElem.shapeType === 'line' ||
          newElem.shapeType === 'line-arrow' ||
          newElem.shapeType === 'polyline' || newElem.shapeType === 'arc';
        if (isLineShape) {
          setSelectedShapeType(newElem.shapeType);
          if (newElem.stroke && newElem.stroke !== 'none') {
            setPrimaryColor(newElem.stroke);
          }
          if (newElem.strokeWidth) {
            setStrokeWidth(newElem.strokeWidth);
          }
        } else if (newElem.fill && newElem.fill !== 'none') {
          setPrimaryColor(newElem.fill);
        }
        setLastShapeStyle((prev) => ({
          ...prev,
          fill: isLineShape
            ? prev.fill
            : newElem.fill && newElem.fill !== 'none'
              ? newElem.fill
              : prev.fill,
          stroke: newElem.stroke && newElem.stroke !== 'none' ? newElem.stroke : prev.stroke,
          strokeWidth: newElem.strokeWidth,
          strokeDash: newElem.strokeDash,
          cornerRadius: newElem.cornerRadius ?? prev.cornerRadius,
          opacity: newElem.opacity,
          gradient: newElem.gradient?.enabled ? newElem.gradient : undefined,
          shadow: newElem.shadow,
        }));
      } else if (newElem.type === 'brush') {
        setPrimaryColor(newElem.color);
        setLastShapeStyle((prev) => ({
          ...prev,
          fill: newElem.color,
          stroke: newElem.color,
          strokeWidth: newElem.isHighlighter
            ? Math.max(2, Math.round(newElem.strokeWidth / 3))
            : newElem.strokeWidth,
          gradient: prev.gradient ? { ...prev.gradient, enabled: false } : undefined,
        }));
      } else if (newElem.type === 'text') {
        setPrimaryColor(newElem.color);
        setSelectedElementIds([newElem.id]);
        setLastShapeStyle((prev) => ({
          ...prev,
          fill: newElem.color,
          stroke: newElem.color,
          gradient: prev.gradient ? { ...prev.gradient, enabled: false } : undefined,
        }));
      }
      pushHistory(next, layers, config);
    },
    [elements, layers, config, pushHistory]
  );

  // Update Element (skipHistory: live drag/resize — commit once on mouse up)
  const handleUpdateElement = useCallback(
    (updated: CanvasElement, options?: { skipHistory?: boolean }) => {
      const next = elements.map((el) => (el.id === updated.id ? updated : el));
      elementsRef.current = next;
      setElements(next);
      // Feature 5: Keep style persistent for future shapes & lines
      if (updated.type === 'shape') {
        const isLineShape = updated.shapeType === 'line' || updated.shapeType === 'line-arrow' || updated.shapeType === 'polyline' || updated.shapeType === 'arc';
        if (isLineShape) {
          // Keep line shape type sticky for next drawings
          setSelectedShapeType(updated.shapeType);
          if (updated.stroke && updated.stroke !== 'none') {
            setPrimaryColor(updated.stroke);
          }
          if (updated.strokeWidth) {
            setStrokeWidth(updated.strokeWidth);
          }
        } else if (updated.fill && updated.fill !== 'none') {
          setPrimaryColor(updated.fill);
        }

        setLastShapeStyle((prev) => ({
          ...prev,
          fill: isLineShape
            ? prev.fill
            : updated.fill && updated.fill !== 'none'
              ? updated.fill
              : prev.fill,
          stroke: updated.stroke && updated.stroke !== 'none' ? updated.stroke : prev.stroke,
          strokeWidth: updated.strokeWidth,
          strokeDash: updated.strokeDash,
          cornerRadius: updated.cornerRadius ?? prev.cornerRadius,
          opacity: updated.opacity,
          gradient: updated.gradient?.enabled ? updated.gradient : undefined,
          shadow: updated.shadow,
        }));
      } else if (updated.type === 'brush') {
        setPrimaryColor(updated.color);
        setLastShapeStyle((prev) => ({
          ...prev,
          fill: updated.color,
          stroke: updated.color,
          strokeWidth: updated.isHighlighter
            ? Math.max(2, Math.round(updated.strokeWidth / 3))
            : updated.strokeWidth,
          gradient: prev.gradient ? { ...prev.gradient, enabled: false } : undefined,
        }));
      } else if (updated.type === 'text') {
        setPrimaryColor(updated.color);
        setLastShapeStyle((prev) => ({
          ...prev,
          fill: updated.color,
          stroke: updated.color,
          gradient: prev.gradient ? { ...prev.gradient, enabled: false } : undefined,
        }));
      }
      if (!options?.skipHistory) {
        pushHistory(next, layers, config);
      }
    },
    [elements, layers, config, pushHistory]
  );

  // Batch-update multiple elements in one commit (group move / multi-edit)
  const handleUpdateElements = useCallback(
    (updatedList: CanvasElement[], options?: { skipHistory?: boolean }) => {
      if (updatedList.length === 0) return;
      const map = new Map(updatedList.map((u) => [u.id, u]));
      setElements((prev) => {
        const next = prev.map((el) => map.get(el.id) ?? el);
        elementsRef.current = next;
        if (!options?.skipHistory) {
          pushHistory(next, layers, config);
        }
        return next;
      });
    },
    [layers, config, pushHistory]
  );

  // Commit live edits (e.g. finished drag) as a single undo step
  const handleCommitHistory = useCallback(() => {
    pushHistory(elementsRef.current, layers, config);
  }, [layers, config, pushHistory]);

  /** Keep only the selected crop region (남기기) — same as canvas crop toolbar Enter */
  const handleApplyCropImage = useCallback(async () => {
    const crop = activeImgCropBoxRef.current || activeImgCropBox;
    if (!croppingImageId || !crop || crop.w < 10 || crop.h < 10) return;
    const imgElem = elements.find(
      (el) => el.id === croppingImageId && el.type === 'image'
    ) as ImageElement | undefined;
    if (!imgElem) return;
    try {
      const slice = await extractImageSlice(imgElem, crop);
      handleUpdateElement({
        ...imgElem,
        src: slice.src,
        x: Math.round(imgElem.x + crop.x),
        y: Math.round(imgElem.y + crop.y),
        width: Math.round(crop.w),
        height: Math.round(crop.h),
        naturalWidth: slice.naturalWidth,
        naturalHeight: slice.naturalHeight,
      });
      handleFinishCropImage();
    } catch (err) {
      console.error('Failed to apply image crop:', err);
      showToast('그림 자르기 적용 중 오류가 발생했습니다.');
    }
  }, [
    croppingImageId,
    activeImgCropBox,
    elements,
    handleUpdateElement,
    handleFinishCropImage,
    showToast,
  ]);

  // Delete Element (single or multiple)
  const handleDeleteElement = useCallback(
    (id: string) => {
      const next = elements.filter((el) => el.id !== id);
      setElements(next);
      setSelectedElementIds((prev) => prev.filter((item) => item !== id));
      pushHistory(next, layers, config);
    },
    [elements, layers, config, pushHistory]
  );

  const handleDeleteSelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const next = elements.filter((el) => !selectedElementIds.includes(el.id));
    setElements(next);
    setSelectedElementIds([]);
    pushHistory(next, layers, config);
  }, [elements, selectedElementIds, layers, config, pushHistory]);

  // Duplicate Element (single or multiple)
  const handleDuplicateElement = useCallback(
    (el: CanvasElement) => {
      const dup: CanvasElement = {
        ...el,
        id: `${el.type}-${Date.now()}`,
        x: el.x + PASTE_OFFSET_PX,
        y: el.y + PASTE_OFFSET_PX,
        name: `${el.name || el.type} (복제)`,
      };
      const next = [...elements, dup];
      setElements(next);
      setSelectedElementIds([dup.id]);
      pushHistory(next, layers, config);
    },
    [elements, layers, config, pushHistory]
  );

  const handleDuplicateSelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const toDuplicate = elements.filter((el) => selectedElementIds.includes(el.id));
    const newItems: CanvasElement[] = toDuplicate.map((el, i) => ({
      ...el,
      id: `${el.type}-${Date.now()}-${i}`,
      x: el.x + PASTE_OFFSET_PX,
      y: el.y + PASTE_OFFSET_PX,
      name: `${el.name || el.type} (복제)`,
    }));
    const next = [...elements, ...newItems];
    setElements(next);
    setSelectedElementIds(newItems.map((item) => item.id));
    pushHistory(next, layers, config);
  }, [elements, selectedElementIds, layers, config, pushHistory]);

  // Crop Canvas: crops the entire canvas to specified bounding box and repositions all elements atomically
  const handleCropCanvas = useCallback(
    (crop: { x: number; y: number; w: number; h: number }) => {
      if (crop.w < 20 || crop.h < 20) return;
      const nextConfig: CanvasConfig = {
        ...config,
        width: Math.round(crop.w),
        height: Math.round(crop.h),
      };
      const nextElements = elements.map((el) => {
        const nextX = Math.round(el.x - crop.x);
        const nextY = Math.round(el.y - crop.y);
        if (el.type === 'brush' && el.points) {
          return {
            ...el,
            x: nextX,
            y: nextY,
            points: el.points.map((p) => ({
              x: Math.round(p.x - crop.x),
              y: Math.round(p.y - crop.y),
            })),
          };
        }
        return {
          ...el,
          x: nextX,
          y: nextY,
        };
      });
      setConfig(nextConfig);
      setElements(nextElements);
      pushHistory(nextElements, layers, nextConfig);
      showToast(`캔버스가 ${nextConfig.width}×${nextConfig.height}px 크기로 잘렸습니다.`);
    },
    [config, elements, layers, pushHistory, showToast]
  );

  // Cut Screen/Canvas Dragged Region (Ctrl+X when Crop box is active)
  // Punches transparent holes in intersecting images; slice goes to clipboard only (not placed on canvas).
  const handleCutCanvasRegion = useCallback(
    async (region: { x: number; y: number; w: number; h: number }) => {
      if (region.w < 5 || region.h < 5) return;
      try {
        const { dataUrl, blob } = await exportRegionToRaster(
          layers,
          elements,
          config,
          region,
          1,
          false
        );

        const sliceW = Math.round(region.w);
        const sliceH = Math.round(region.h);
        const sliceX = Math.round(region.x);
        const sliceY = Math.round(region.y);

        internalClipboardRef.current = {
          type: 'image-slice',
          imageSlice: {
            src: dataUrl,
            width: sliceW,
            height: sliceH,
            naturalWidth: sliceW,
            naturalHeight: sliceH,
            suggestedX: sliceX + PASTE_OFFSET_PX,
            suggestedY: sliceY + PASTE_OFFSET_PX,
          },
        };

        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
          } catch (e) {
            console.warn('System clipboard write error:', e);
          }
        }

        const regRight = region.x + region.w;
        const regBottom = region.y + region.h;

        const keptSlots: CanvasElement[] = [];
        const punchById = new Map<string, Promise<ImageElement>>();

        for (const el of elements) {
          const elRight = el.x + el.width;
          const elBottom = el.y + el.height;
          const isFullyInside =
            el.x >= region.x &&
            elRight <= regRight &&
            el.y >= region.y &&
            elBottom <= regBottom;

          // Fully inside -> remove (contents already captured in the slice)
          if (isFullyInside) continue;

          if (el.type === 'image') {
            const local = getImageLocalIntersection(el, region);
            if (local) {
              punchById.set(el.id, punchHoleInImageElement(el, local));
              keptSlots.push(el); // placeholder; replaced after punch resolves
              continue;
            }
          }

          keptSlots.push(el);
        }

        const punchedEntries = await Promise.all(
          [...punchById.entries()].map(async ([id, task]) => [id, await task] as const)
        );
        const punchedMap = new Map<string, ImageElement>(punchedEntries);

        const nextElements = keptSlots.map((el) => punchedMap.get(el.id) ?? el);
        setElements(nextElements);
        setSelectedElementIds([]);
        pushHistory(nextElements, layers, config);
        showToast('선택 영역을 오려냈습니다. Ctrl+V로 붙여넣기 하세요.');
      } catch (err) {
        console.error('Failed to cut region:', err);
        showToast('영역 오려내기 중 오류가 발생했습니다.');
      }
    },
    [layers, elements, config, pushHistory, showToast]
  );

  // Copy Screen/Canvas Dragged Region (Ctrl+C when Crop box is active)
  const handleCopyCanvasRegion = useCallback(
    async (region: { x: number; y: number; w: number; h: number }) => {
      if (region.w < 5 || region.h < 5) return;
      try {
        const { dataUrl, blob } = await exportRegionToRaster(
          layers,
          elements,
          config,
          region,
          1,
          false
        );

        internalClipboardRef.current = {
          type: 'image-slice',
          imageSlice: {
            src: dataUrl,
            width: Math.round(region.w),
            height: Math.round(region.h),
            naturalWidth: Math.round(region.w),
            naturalHeight: Math.round(region.h),
            suggestedX: Math.round(region.x + PASTE_OFFSET_PX),
            suggestedY: Math.round(region.y + PASTE_OFFSET_PX),
          },
        };

        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
          } catch (e) {
            console.warn('System clipboard write error:', e);
          }
        }

        showToast('지정한 화면 영역을 캡쳐 복사했습니다. (Ctrl+V로 붙여넣기)');
      } catch (err) {
        console.error('Failed to capture region:', err);
        showToast('영역 캡쳐 중 오류가 발생했습니다.');
      }
    },
    [layers, elements, config, showToast]
  );

  // Copy Selected Canvas Elements (Ctrl+C)
  const handleCopySelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const selected = elements.filter((el) => selectedElementIds.includes(el.id));
    if (selected.length === 0) return;

    internalClipboardRef.current = {
      type: 'elements',
      elements: JSON.parse(JSON.stringify(selected)),
    };
    // Replace any leftover OS clipboard image so Ctrl+V pastes these elements
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }
    showToast(`${selected.length}개 객체가 복사되었습니다. (Ctrl+V로 붙여넣기)`);
  }, [elements, selectedElementIds, showToast]);

  // Cut (오려내기/잘라내기) Selected Canvas Elements (Ctrl+X)
  const handleCutSelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const selected = elements.filter((el) => selectedElementIds.includes(el.id));
    if (selected.length === 0) return;

    internalClipboardRef.current = {
      type: 'elements',
      elements: JSON.parse(JSON.stringify(selected)),
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }
    handleDeleteSelectedElements();
    showToast(`${selected.length}개 객체를 잘라냈습니다. (Ctrl+V로 붙여넣기)`);
  }, [elements, selectedElementIds, handleDeleteSelectedElements, showToast]);

  // Copy Selected Region of an Image (Ctrl+C in crop mode)
  const handleCopyImagePart = useCallback(
    async (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => {
      if (crop.w < 5 || crop.h < 5) return;
      try {
        const slice = await extractImageSlice(imgElem, crop);

        internalClipboardRef.current = {
          type: 'image-slice',
          imageSlice: {
            src: slice.src,
            width: Math.round(crop.w),
            height: Math.round(crop.h),
            naturalWidth: slice.naturalWidth,
            naturalHeight: slice.naturalHeight,
            suggestedX: Math.round(imgElem.x + crop.x + PASTE_OFFSET_PX),
            suggestedY: Math.round(imgElem.y + crop.y + PASTE_OFFSET_PX),
          },
        };

        if (navigator.clipboard && window.ClipboardItem) {
          try {
            const res = await fetch(slice.src);
            const blob = await res.blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          } catch (e) {
            console.warn('System clipboard write warning:', e);
          }
        }

        showToast('선택한 이미지 영역을 복사했습니다. (Ctrl+V로 붙여넣기)');
      } catch (err) {
        console.error('Failed to copy image part:', err);
        showToast('이미지 복사 중 오류가 발생했습니다.');
      }
    },
    [showToast]
  );

  // Cut (오려내기) Selected Region of an Image (Ctrl+X in crop mode)
  // Clipboard only + transparent hole in original. Do not place the slice back on canvas.
  const handleCutImagePart = useCallback(
    async (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => {
      if (crop.w < 5 || crop.h < 5) return;
      try {
        const [slice, punched] = await Promise.all([
          extractImageSlice(imgElem, crop),
          punchHoleInImageElement(imgElem, crop),
        ]);

        const pieceX = Math.round(imgElem.x + crop.x);
        const pieceY = Math.round(imgElem.y + crop.y);
        const pieceW = Math.round(crop.w);
        const pieceH = Math.round(crop.h);

        internalClipboardRef.current = {
          type: 'image-slice',
          imageSlice: {
            src: slice.src,
            width: pieceW,
            height: pieceH,
            naturalWidth: slice.naturalWidth,
            naturalHeight: slice.naturalHeight,
            suggestedX: pieceX + PASTE_OFFSET_PX,
            suggestedY: pieceY + PASTE_OFFSET_PX,
          },
        };

        if (navigator.clipboard && window.ClipboardItem) {
          try {
            const res = await fetch(slice.src);
            const blob = await res.blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          } catch (e) {
            console.warn('System clipboard write warning:', e);
          }
        }

        setElements((prev) => {
          const next = prev.map((el) => (el.id === imgElem.id ? punched : el));
          pushHistory(next, layers, config);
          return next;
        });
        setSelectedElementIds([imgElem.id]);
        setCroppingImageId(null);
        setCurrentTool('select');
        showToast('선택 영역을 오려냈습니다. Ctrl+V로 붙여넣기 하세요.');
      } catch (err) {
        console.error('Failed to cut image part:', err);
        showToast('이미지 오려내기 중 오류가 발생했습니다.');
      }
    },
    [layers, config, pushHistory, showToast]
  );

  // Bring Forward / Send Backward
  const handleBringForward = useCallback(
    (id: string) => {
      const idx = elements.findIndex((el) => el.id === id);
      if (idx < elements.length - 1) {
        const next = [...elements];
        const temp = next[idx];
        next[idx] = next[idx + 1];
        next[idx + 1] = temp;
        setElements(next);
        pushHistory(next, layers, config);
      }
    },
    [elements, layers, config, pushHistory]
  );

  const handleSendBackward = useCallback(
    (id: string) => {
      const idx = elements.findIndex((el) => el.id === id);
      if (idx > 0) {
        const next = [...elements];
        const temp = next[idx];
        next[idx] = next[idx - 1];
        next[idx - 1] = temp;
        setElements(next);
        pushHistory(next, layers, config);
      }
    },
    [elements, layers, config, pushHistory]
  );

  const handleBringToFront = useCallback(
    (id: string) => {
      const target = elements.find((el) => el.id === id);
      if (target) {
        const next = elements.filter((el) => el.id !== id).concat(target);
        setElements(next);
        pushHistory(next, layers, config);
      }
    },
    [elements, layers, config, pushHistory]
  );

  const handleSendToBack = useCallback(
    (id: string) => {
      const target = elements.find((el) => el.id === id);
      if (target) {
        const next = [target].concat(elements.filter((el) => el.id !== id));
        setElements(next);
        pushHistory(next, layers, config);
      }
    },
    [elements, layers, config, pushHistory]
  );

  // Alignment relative to canvas
  const handleAlign = useCallback(
    (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (!selectedElementId) return;
      const el = elements.find((e) => e.id === selectedElementId);
      if (!el) return;

      let newX = el.x;
      let newY = el.y;

      switch (type) {
        case 'left':
          newX = 0;
          break;
        case 'center':
          newX = (config.width - el.width) / 2;
          break;
        case 'right':
          newX = config.width - el.width;
          break;
        case 'top':
          newY = 0;
          break;
        case 'middle':
          newY = (config.height - el.height) / 2;
          break;
        case 'bottom':
          newY = config.height - el.height;
          break;
      }

      handleUpdateElement({ ...el, x: newX, y: newY });
    },
    [selectedElementId, elements, config, handleUpdateElement]
  );

  // Update Config
  const handleUpdateConfig = useCallback(
    (partial: Partial<CanvasConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        pushHistory(elements, layers, next);
        return next;
      });
    },
    [elements, layers, pushHistory]
  );

  // New document: apply the chosen canvas and drop every object from the previous one.
  const handleCreateNewCanvas = useCallback(
    (newCfg: { width: number; height: number; backgroundColor: string }) => {
      const nextLayers: Layer[] = [
        {
          id: 'layer-' + Date.now(),
          name: '레이어1',
          visible: true,
          locked: false,
          opacity: 1,
        },
      ];
      const nextElements: CanvasElement[] = [];
      const nextConfig: CanvasConfig = {
        ...config,
        width: newCfg.width,
        height: newCfg.height,
        backgroundColor: newCfg.backgroundColor,
      };
      setElements(nextElements);
      setLayers(nextLayers);
      setActiveLayerId(nextLayers[0].id);
      setSelectedElementIds([]);
      setCroppingImageId(null);
      setActiveImgCropBox(null);
      activeImgCropBoxRef.current = null;
      activeCanvasCropBoxRef.current = null;
      setConfig(nextConfig);
      setHistory([
        {
          elements: nextElements,
          layers: nextLayers,
          activeLayerId: nextLayers[0].id,
          canvasConfig: nextConfig,
        },
      ]);
      setHistoryIndex(0);
    },
    [config]
  );

  // Layers Handlers
  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: 'layer-' + Date.now(),
      name: nextLayerName(layers),
      visible: true,
      locked: false,
      opacity: 1,
    };
    const nextLayers = [...layers, newLayer];
    setLayers(nextLayers);
    setActiveLayerId(newLayer.id);
    pushHistory(elements, nextLayers, config);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length <= 1) return;
    const nextLayers = layers.filter((l) => l.id !== layerId);
    const nextElements = elements.filter((el) => el.layerId !== layerId);
    setLayers(nextLayers);
    setElements(nextElements);
    setActiveLayerId(nextLayers[nextLayers.length - 1].id);
    if (selectedElementId && !nextElements.some((e) => e.id === selectedElementId)) {
      handleSelectElement(null);
    }
    pushHistory(nextElements, nextLayers, config);
  };

  const handleDuplicateLayer = (layerId: string) => {
    const targetLayer = layers.find((l) => l.id === layerId);
    if (!targetLayer) return;

    const newLayerId = 'layer-' + Date.now();
    const newLayer: Layer = {
      ...targetLayer,
      id: newLayerId,
      name: nextLayerName(layers),
    };

    // Duplicate all elements belonging to this layer
    const layerElems = elements.filter((el) => el.layerId === layerId);
    const dupElems = layerElems.map((el) => ({
      ...el,
      id: `${el.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      layerId: newLayerId,
      x: el.x + 15,
      y: el.y + 15,
    }));

    const nextLayers = [...layers, newLayer];
    const nextElements = [...elements, ...dupElems];
    setLayers(nextLayers);
    setElements(nextElements);
    setActiveLayerId(newLayerId);
    pushHistory(nextElements, nextLayers, config);
  };

  const handleMoveLayerUp = (layerId: string) => {
    const idx = layers.findIndex((l) => l.id === layerId);
    if (idx < layers.length - 1) {
      const next = [...layers];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      setLayers(next);
      pushHistory(elements, next, config);
    }
  };

  const handleMoveLayerDown = (layerId: string) => {
    const idx = layers.findIndex((l) => l.id === layerId);
    if (idx > 0) {
      const next = [...layers];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      setLayers(next);
      pushHistory(elements, next, config);
    }
  };

  /** Bring element forward within its layer (drawn later = on top). */
  const handleMoveElementForward = useCallback(
    (elementId: string) => {
      const idx = elements.findIndex((el) => el.id === elementId);
      if (idx < 0) return;
      const layerId = elements[idx].layerId;
      let swapWith = -1;
      for (let i = idx + 1; i < elements.length; i++) {
        if (elements[i].layerId === layerId) {
          swapWith = i;
          break;
        }
      }
      if (swapWith < 0) return;
      const next = [...elements];
      const temp = next[idx];
      next[idx] = next[swapWith];
      next[swapWith] = temp;
      setElements(next);
      pushHistory(next, layers, config);
    },
    [elements, layers, config, pushHistory]
  );

  /** Send element backward within its layer (drawn earlier = behind). */
  const handleMoveElementBackward = useCallback(
    (elementId: string) => {
      const idx = elements.findIndex((el) => el.id === elementId);
      if (idx < 0) return;
      const layerId = elements[idx].layerId;
      let swapWith = -1;
      for (let i = idx - 1; i >= 0; i--) {
        if (elements[i].layerId === layerId) {
          swapWith = i;
          break;
        }
      }
      if (swapWith < 0) return;
      const next = [...elements];
      const temp = next[idx];
      next[idx] = next[swapWith];
      next[swapWith] = temp;
      setElements(next);
      pushHistory(next, layers, config);
    },
    [elements, layers, config, pushHistory]
  );

  const handleUpdateLayer = (updated: Layer) => {
    const next = layers.map((l) => (l.id === updated.id ? updated : l));
    setLayers(next);
    pushHistory(elements, next, config);
  };

  // Insert Image from source URL or data URL
  const handleInsertImageSrc = useCallback(
    (src: string, name = '붙여넣은 이미지') => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxWidth = Math.min(600, config.width * 0.7);
        const naturalW = img.naturalWidth || 400;
        const naturalH = img.naturalHeight || 300;
        const ratio = naturalW / naturalH;
        const width = Math.min(maxWidth, naturalW);
        const height = width / ratio;
        let x = Math.round((config.width - width) / 2);
        let y = Math.round((config.height - height) / 2);
        if (lastMouseCanvasPosRef.current) {
          const mx = lastMouseCanvasPosRef.current.x;
          const my = lastMouseCanvasPosRef.current.y;
          if (mx >= 0 && mx <= config.width && my >= 0 && my <= config.height) {
            x = Math.round(mx - width / 2);
            y = Math.round(my - height / 2);
          }
        }
        x = Math.min(Math.max(0, x), Math.max(0, config.width - width));
        y = Math.min(Math.max(0, y), Math.max(0, config.height - height));

        const newImgElem: ImageElement = {
          id: 'image-' + Date.now(),
          layerId: activeLayerId || layers[0]?.id || 'layer-default',
          name: name.substring(0, 20),
          type: 'image',
          src,
          naturalWidth: naturalW,
          naturalHeight: naturalH,
          x,
          y,
          width: Math.round(width),
          height: Math.round(height),
          rotation: 0,
          opacity: 1,
          filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            invert: 0,
          },
        };

        setElements((prev) => {
          const next = [...prev, newImgElem];
          pushHistory(next, layers, config);
          return next;
        });
        setSelectedElementIds([newImgElem.id]);
        setCurrentTool('select');
        showToast('클립보드 이미지를 캔버스에 붙여넣었습니다.');
      };
      img.onerror = () => {
        alert('이미지 데이터를 불러오는 데 실패했습니다.');
      };
      img.src = src;
    },
    [activeLayerId, config, layers, pushHistory, showToast]
  );

  // Insert Image file (File object)
  const handleInsertImage = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          handleInsertImageSrc(src, file.name || '삽입한 이미지');
        }
      };
      reader.readAsDataURL(file);
    },
    [handleInsertImageSrc]
  );

  // Paste only from the app's internal clipboard (cut/copy inside the app).
  // Returns true if something was pasted.
  const pasteFromInternalClipboard = useCallback((): boolean => {
    const clip = internalClipboardRef.current;
    if (!clip) return false;

    if (clip.type === 'image-slice' && clip.imageSlice) {
      const slice = clip.imageSlice;
      // Crop/cut slices paste at origin + offset (not under the mouse)
      const targetX = slice.suggestedX ?? 50;
      const targetY = slice.suggestedY ?? 50;

      const newImg: ImageElement = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'image',
        name: '오려낸 이미지',
        layerId: activeLayerId,
        x: Math.min(Math.max(0, targetX), Math.max(0, config.width - slice.width)),
        y: Math.min(Math.max(0, targetY), Math.max(0, config.height - slice.height)),
        width: slice.width,
        height: slice.height,
        src: slice.src,
        naturalWidth: slice.naturalWidth,
        naturalHeight: slice.naturalHeight,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        filters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          grayscale: 0,
          invert: 0,
        },
      };
      slice.suggestedX = targetX + PASTE_OFFSET_PX;
      slice.suggestedY = targetY + PASTE_OFFSET_PX;

      setElements((prev) => {
        const next = [...prev, newImg];
        pushHistory(next, layers, config);
        return next;
      });
      setSelectedElementIds([newImg.id]);
      setCurrentTool('select');
      showToast('클립보드 이미지를 붙여넣었습니다.');
      return true;
    }

    if (clip.type === 'elements' && clip.elements) {
      const cloned = clip.elements.map((el, i) => {
        const newId = `${el.type}-${Date.now()}-${i}`;
        const nextX = el.x + PASTE_OFFSET_PX;
        const nextY = el.y + PASTE_OFFSET_PX;
        if (el.type === 'brush' && el.points) {
          return {
            ...el,
            id: newId,
            layerId: activeLayerId,
            x: nextX,
            y: nextY,
            points: el.points.map((p) => ({
              x: p.x + PASTE_OFFSET_PX,
              y: p.y + PASTE_OFFSET_PX,
            })),
          };
        }
        return {
          ...el,
          id: newId,
          layerId: activeLayerId,
          x: nextX,
          y: nextY,
        };
      });

      clip.elements = cloned;

      setElements((prev) => {
        const next = [...prev, ...cloned];
        pushHistory(next, layers, config);
        return next;
      });
      setSelectedElementIds(cloned.map((c) => c.id));
      setCurrentTool('select');
      showToast(`${cloned.length}개 객체를 붙여넣었습니다.`);
      return true;
    }

    return false;
  }, [activeLayerId, config, layers, pushHistory, showToast]);

  // Read image/text from the OS clipboard (Windows screenshot, Snipping Tool, etc.)
  const handlePasteFromClipboard = useCallback(async (): Promise<boolean> => {
    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'clipboard-image.png', { type: imageType });
            handleInsertImage(file);
            return true;
          }
        }
      } catch (err) {
        console.warn('Clipboard read() failed:', err);
      }
    }

    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        const text = (await navigator.clipboard.readText()).trim();
        if (
          text.startsWith('data:image/') ||
          /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(text)
        ) {
          handleInsertImageSrc(text, '클립보드 이미지');
          return true;
        }
      } catch (err) {
        console.warn('Clipboard readText() failed:', err);
      }
    }

    return false;
  }, [handleInsertImage, handleInsertImageSrc]);

  // Unified Paste: app internal clipboard first (crop slice keeps origin+10px),
  // then OS clipboard (screenshots, etc.)
  const handlePasteAction = useCallback(async () => {
    if (pasteFromInternalClipboard()) return;

    const fromSystem = await handlePasteFromClipboard();
    if (fromSystem) return;

    setIsClipboardGuideOpen(true);
  }, [handlePasteFromClipboard, pasteFromInternalClipboard]);

  // Global Clipboard Paste (Ctrl+V): OS image first, then internal clipboard
  useEffect(() => {
    const extractImageFileFromClipboard = (clipboardData: DataTransfer): File | null => {
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (
            file.type.startsWith('image/') ||
            /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)$/i.test(file.name)
          ) {
            return file;
          }
        }
      }

      if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.indexOf('image') !== -1 || item.kind === 'file') {
            const file = item.getAsFile();
            if (
              file &&
              (file.type.startsWith('image/') ||
                /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)$/i.test(file.name) ||
                file.size > 0)
            ) {
              return file;
            }
          }
        }
      }
      return null;
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1) App-internal cut/copy first — crop slices use origin + 10px offset
      //    (crop also writes PNG to OS clipboard; without this, OS paste wins and loses position)
      if (internalClipboardRef.current) {
        e.preventDefault();
        e.stopPropagation();
        pasteFromInternalClipboard();
        return;
      }

      // 2) Windows / OS clipboard image (Snipping Tool, Win+Shift+S, Explorer copy, etc.)
      const imageFile = extractImageFileFromClipboard(clipboardData);
      if (imageFile) {
        e.preventDefault();
        e.stopPropagation();
        handleInsertImage(imageFile);
        return;
      }

      // 3) HTML embedded image (Word / browser)
      const html = clipboardData.getData('text/html');
      if (html) {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match && match[1]) {
          e.preventDefault();
          handleInsertImageSrc(match[1], '복사한 이미지');
          return;
        }
      }

      // 4) Image URL / data-URI / SVG text
      const text = clipboardData.getData('text/plain')?.trim();
      if (text) {
        if (
          text.startsWith('data:image/') ||
          /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(text)
        ) {
          e.preventDefault();
          handleInsertImageSrc(text, 'URL 이미지');
          return;
        }
        if (text.startsWith('<svg') && text.includes('</svg>')) {
          e.preventDefault();
          const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
          handleInsertImageSrc(svgDataUrl, '붙여넣은 SVG');
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste, true);
    return () => {
      document.removeEventListener('paste', handlePaste, true);
    };
  }, [handleInsertImage, handleInsertImageSrc, pasteFromInternalClipboard]);

  // Save Project as JSON
  const handleSaveProject = () => {
    const projectData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      config,
      layers,
      elements,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imgman-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load Project from JSON
  const handleLoadProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data && data.config && data.layers && data.elements) {
          setConfig(data.config);
          setLayers(data.layers);
          setActiveLayerId(data.layers[0]?.id || 'layer-1');
          setElements(data.elements);
          setSelectedElementIds([]);
          pushHistory(data.elements, data.layers, data.config);
        } else {
          alert('올바른 프로젝트 JSON 파일이 아닙니다.');
        }
      } catch (err) {
        alert('파일을 불러오는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const handlePrimaryColorChange = useCallback(
    (color: string) => {
      setPrimaryColor(color);
      // Persist for subsequent shapes / lines / paint; clear sticky gradient so solid color wins
      setLastShapeStyle((prev) => ({
        ...prev,
        fill: color,
        stroke: color,
        gradient: prev.gradient
          ? { ...prev.gradient, enabled: false, startColor: color }
          : undefined,
      }));

      // Immediately update selected element if any
      if (selectedElementIds.length > 0) {
        setElements((prevElements) => {
          let hasChanges = false;
          const next = prevElements.map((el) => {
            if (!selectedElementIds.includes(el.id)) return el;
            hasChanges = true;
            if (el.type === 'shape') {
              const isLineShape =
                el.shapeType === 'line' ||
                el.shapeType === 'line-arrow' ||
                el.shapeType === 'polyline' || el.shapeType === 'arc';
              if (isLineShape || el.fill === 'none') {
                return { ...el, stroke: color };
              }
              return {
                ...el,
                fill: color,
                gradient: el.gradient
                  ? { ...el.gradient, enabled: false, startColor: color }
                  : undefined,
              };
            } else if (el.type === 'text') {
              return { ...el, color };
            } else if (el.type === 'brush') {
              return { ...el, color };
            }
            return el;
          });
          if (hasChanges) {
            pushHistory(next, layers, config);
          }
          return next;
        });
      }
    },
    [selectedElementIds, layers, config, pushHistory]
  );

  const handleStrokeWidthChange = useCallback(
    (w: number) => {
      setStrokeWidth(w);
      setLastShapeStyle((prev) => ({ ...prev, strokeWidth: w }));

      if (selectedElementIds.length > 0) {
        setElements((prevElements) => {
          let hasChanges = false;
          const next = prevElements.map((el) => {
            if (!selectedElementIds.includes(el.id)) return el;
            hasChanges = true;
            if (el.type === 'shape') {
              const isStraightLine =
                el.shapeType === 'line' || el.shapeType === 'line-arrow';
              return {
                ...el,
                strokeWidth: w,
                height: isStraightLine ? Math.max(w * 4, 16) : el.height,
              };
            } else if (el.type === 'brush') {
              return { ...el, strokeWidth: w };
            }
            return el;
          });
          if (hasChanges) {
            pushHistory(next, layers, config);
          }
          return next;
        });
      }
    },
    [selectedElementIds, layers, config, pushHistory]
  );

  // Keyboard Nudge logic (Arrow keys for 1px, Shift + Arrow for 10px)
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isNudgingRef = useRef(false);

  const handleNudgeSelectedElements = useCallback(
    (dx: number, dy: number) => {
      if (selectedElementIds.length === 0) return;

      if (!isNudgingRef.current) {
        isNudgingRef.current = true;
      }

      setElements((prevElements) => {
        let changed = false;
        const nextElements = prevElements.map((el) => {
          if (!selectedElementIds.includes(el.id)) return el;
          if (el.locked) return el;
          const layer = layers.find((l) => l.id === el.layerId);
          if (layer && layer.locked) return el;

          changed = true;
          const nextX = Math.round(el.x + dx);
          const nextY = Math.round(el.y + dy);

          if (el.type === 'brush' && el.points) {
            return {
              ...el,
              x: nextX,
              y: nextY,
              points: el.points.map((p) => ({
                x: Math.round(p.x + dx),
                y: Math.round(p.y + dy),
              })),
            };
          }

          return {
            ...el,
            x: nextX,
            y: nextY,
          };
        });

        if (!changed) return prevElements;

        if (nudgeTimerRef.current) {
          clearTimeout(nudgeTimerRef.current);
        }
        nudgeTimerRef.current = setTimeout(() => {
          if (isNudgingRef.current) {
            pushHistory(nextElements, layers, config);
            isNudgingRef.current = false;
          }
          nudgeTimerRef.current = null;
        }, 400);

        return nextElements;
      });
    },
    [selectedElementIds, layers, config, pushHistory]
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Keyboard Nudge: Arrow keys for fine movement (1px), Shift + Arrow for fast movement (10px)
      if (
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !croppingImageId
      ) {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowLeft') dx = -step;
          else if (e.key === 'ArrowRight') dx = step;
          else if (e.key === 'ArrowUp') dy = -step;
          else if (e.key === 'ArrowDown') dy = step;

          handleNudgeSelectedElements(dx, dy);
          return;
        }
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedElementIds.length > 0) {
          handleDuplicateSelectedElements();
        }
        return;
      }

      // Copy: Ctrl+C (in crop mode: copy canvas region or image slice, in select mode: copy elements)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (currentTool === 'crop' && activeCanvasCropBoxRef.current && activeCanvasCropBoxRef.current.w >= 5) {
          e.preventDefault();
          handleCopyCanvasRegion(activeCanvasCropBoxRef.current);
          return;
        }
        if (croppingImageId) {
          e.preventDefault();
          const imgElem = elements.find((el) => el.id === croppingImageId && el.type === 'image') as ImageElement;
          if (imgElem && activeImgCropBoxRef.current) {
            handleCopyImagePart(imgElem, activeImgCropBoxRef.current);
          }
          return;
        }
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          handleCopySelectedElements();
          return;
        }
      }

      // Cut: Ctrl+X (in crop mode: cut canvas region or image slice, in select mode: cut elements)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if (currentTool === 'crop' && activeCanvasCropBoxRef.current && activeCanvasCropBoxRef.current.w >= 5) {
          e.preventDefault();
          handleCutCanvasRegion(activeCanvasCropBoxRef.current);
          return;
        }
        if (croppingImageId) {
          e.preventDefault();
          const imgElem = elements.find((el) => el.id === croppingImageId && el.type === 'image') as ImageElement;
          if (imgElem && activeImgCropBoxRef.current) {
            handleCutImagePart(imgElem, activeImgCropBoxRef.current);
          }
          return;
        }
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          handleCutSelectedElements();
          return;
        }
      }

      // Paste: Ctrl+V is handled by the native 'paste' event so Windows clipboard images work.
      // (Do not preventDefault here — that would block clipboardData from the OS.)

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedElements();
        }
        return;
      }

      // Toggle side panels: [ for left, ] for right
      if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleLeftPanel();
        return;
      }
      if (e.key === ']' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleRightPanel();
        return;
      }

      // Tool switches (single key only, without Ctrl/Cmd/Alt)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            handleSelectTool('select');
            break;
          case 'h':
            handleSelectTool('pan');
            break;
          case 'b':
            handleSelectTool('brush');
            break;
          case 'y':
            handleSelectTool('highlighter');
            break;
          case 'e':
            handleSelectTool('eraser');
            break;
          case 'u':
            handleSelectTool('shape');
            break;
          case 't':
            handleSelectTool('text');
            break;
          case 'k':
            handleSelectTool('eyedropper');
            break;
          case 'g':
            handleSelectTool('fill');
            break;
          case 'c': {
            const currentSelected = elements.find((el) => el.id === selectedElementId);
            if (currentSelected && currentSelected.type === 'image') {
              handleStartCropImage(currentSelected.id);
            } else {
              handleSelectTool('crop');
            }
            break;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        if (nudgeTimerRef.current) {
          clearTimeout(nudgeTimerRef.current);
          nudgeTimerRef.current = null;
        }
        if (isNudgingRef.current) {
          pushHistory(elementsRef.current, layers, config);
          isNudgingRef.current = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    elements,
    selectedElementId,
    selectedElementIds,
    croppingImageId,
    handleNudgeSelectedElements,
    layers,
    config,
    pushHistory,
    handleUndo,
    handleRedo,
    handleDuplicateSelectedElements,
    handleDeleteSelectedElements,
    handleCopySelectedElements,
    handleCutSelectedElements,
    handleCopyImagePart,
    handleCutImagePart,
    handlePasteAction,
    handleStartCropImage,
    handleSelectTool,
    toggleLeftPanel,
    toggleRightPanel,
  ]);

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  return (
    <div
      onMouseEnter={() => window.focus()}
      onClick={() => window.focus()}
      className="flex h-screen w-screen overflow-hidden bg-stone-950 font-sans text-stone-100"
    >
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
      {/* 1. Header Navigation Bar */}
      <HeaderNavbar
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClearCanvas}
        zoom={zoom}
        onZoomChange={setZoom}
        onZoomFit={() => setZoom(0.85)}
        onZoom100={() => setZoom(1)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onOpenNewCanvas={() => setIsNewCanvasOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onInsertImage={handleInsertImage}
        onPasteFromClipboard={handlePasteAction}
      />

      {/* 2. Top Tool Palette */}
      <Toolbar
        currentTool={currentTool}
        onSelectTool={handleSelectTool}
        selectedShapeType={selectedShapeType}
        onSelectShapeType={setSelectedShapeType}
        primaryColor={primaryColor}
        onPrimaryColorChange={handlePrimaryColorChange}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={handleStrokeWidthChange}
      />

      {/* 3. Main Workspace: Layers Panel + Canvas */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left: Layers Panel */}
        <LayersPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onMoveLayerUp={handleMoveLayerUp}
          onMoveLayerDown={handleMoveLayerDown}
          onMoveElementForward={handleMoveElementForward}
          onMoveElementBackward={handleMoveElementBackward}
          onUpdateLayer={handleUpdateLayer}
          elements={elements}
          selectedElementId={selectedElementId}
          onSelectElement={handleSelectElement}
          isOpen={isLeftPanelOpen}
          onToggleCollapse={toggleLeftPanel}
        />

        {/* Center: Canvas Viewport */}
        <CanvasArea
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onCropCanvas={handleCropCanvas}
          onCutCanvasRegion={handleCutCanvasRegion}
          onCopyCanvasRegion={handleCopyCanvasRegion}
          onTriggerPaste={handlePasteAction}
          onMouseMoveCanvas={(pt) => {
            lastMouseCanvasPosRef.current = pt;
          }}
          onCopyImagePart={handleCopyImagePart}
          onCutImagePart={handleCutImagePart}
          onCropBoxChange={handleCropBoxChange}
          layers={layers}
          elements={elements}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onUpdateElements={handleUpdateElements}
          onCommitHistory={handleCommitHistory}
          onDeleteElement={handleDeleteElement}
          activeLayerId={activeLayerId}
          selectedElementId={selectedElementId}
          selectedElementIds={selectedElementIds}
          onSelectElement={handleSelectElement}
          onSelectMultipleElements={handleSelectMultipleElements}
          onToggleSelectElement={handleToggleSelectElement}
          currentTool={currentTool}
          onSelectTool={handleSelectTool}
          selectedShapeType={selectedShapeType}
          primaryColor={primaryColor}
          onPrimaryColorChange={handlePrimaryColorChange}
          strokeWidth={strokeWidth}
          zoom={zoom}
          onZoomChange={setZoom}
          lastShapeStyle={lastShapeStyle}
          croppingImageId={croppingImageId}
          onStartCropImage={handleStartCropImage}
          onFinishCropImage={handleFinishCropImage}
          onInsertImage={handleInsertImage}
        />
      </div>
      </div>

      {/* Right: Properties panel spans the full window height */}
      <PropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onAlign={handleAlign}
          config={config}
          onUpdateConfig={handleUpdateConfig}
          isOpen={isRightPanelOpen}
          onToggleCollapse={toggleRightPanel}
          croppingImageId={croppingImageId}
          onStartCropImage={handleStartCropImage}
          onApplyCropImage={handleApplyCropImage}
          onCancelCropImage={handleFinishCropImage}
          onCutImagePart={handleCutImagePart}
          onCopyImagePart={handleCopyImagePart}
          activeCropBox={activeImgCropBox}
      />

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        layers={layers}
        elements={elements}
        config={config}
      />

      <ShortcutsGuideModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <NewCanvasModal
        isOpen={isNewCanvasOpen}
        onClose={() => setIsNewCanvasOpen(false)}
        currentConfig={config}
        onCreate={handleCreateNewCanvas}
      />

      <ClipboardGuideModal
        isOpen={isClipboardGuideOpen}
        onClose={() => setIsClipboardGuideOpen(false)}
        onInsertImage={handleInsertImage}
        onInsertImageSrc={handleInsertImageSrc}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-stone-100 border border-amber-500/60 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
