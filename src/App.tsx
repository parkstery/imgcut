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
    id: 'layer-bg',
    name: '배경 (Background)',
    visible: true,
    locked: false,
    opacity: 1,
  },
  {
    id: 'layer-shapes',
    name: '도형 및 벡터 (Shapes)',
    visible: true,
    locked: false,
    opacity: 1,
  },
  {
    id: 'layer-text',
    name: '텍스트 & 브러시 (Foreground)',
    visible: true,
    locked: false,
    opacity: 1,
  },
];

const INITIAL_ELEMENTS: CanvasElement[] = [
  // Background card shape
  {
    id: 'elem-banner',
    layerId: 'layer-shapes',
    name: '메인 배너 카드',
    type: 'shape',
    shapeType: 'rounded-rect',
    x: 100,
    y: 80,
    width: 1080,
    height: 560,
    rotation: 0,
    opacity: 1,
    fill: '#F8FAFC',
    stroke: '#E2E8F0',
    strokeWidth: 2,
    strokeDash: 'solid',
    cornerRadius: 24,
    shadow: {
      enabled: true,
      color: 'rgba(0, 0, 0, 0.08)',
      blur: 24,
      offsetX: 0,
      offsetY: 8,
    },
  },
  // Sample PPT Shape: Gradient Rounded Box
  {
    id: 'elem-card-1',
    layerId: 'layer-shapes',
    name: '디자인 그라데이션 박스',
    type: 'shape',
    shapeType: 'rounded-rect',
    x: 160,
    y: 160,
    width: 320,
    height: 380,
    rotation: -2,
    opacity: 1,
    fill: '#4F46E5',
    gradient: {
      enabled: true,
      type: 'linear',
      startColor: '#4F46E5',
      endColor: '#EC4899',
      angle: 135,
    },
    stroke: '#312E81',
    strokeWidth: 0,
    strokeDash: 'solid',
    cornerRadius: 16,
    shadow: {
      enabled: true,
      color: 'rgba(79, 70, 229, 0.35)',
      blur: 20,
      offsetX: 4,
      offsetY: 10,
    },
  },
  // Sample Star Shape
  {
    id: 'elem-star',
    layerId: 'layer-shapes',
    name: '골드 스타',
    type: 'shape',
    shapeType: 'star',
    x: 520,
    y: 160,
    width: 140,
    height: 140,
    rotation: 12,
    opacity: 1,
    fill: '#F59E0B',
    stroke: '#D97706',
    strokeWidth: 2,
    strokeDash: 'solid',
    shadow: {
      enabled: true,
      color: 'rgba(245, 158, 11, 0.4)',
      blur: 16,
      offsetX: 0,
      offsetY: 6,
    },
  },
  // Sample PPT Arrow
  {
    id: 'elem-arrow',
    layerId: 'layer-shapes',
    name: '진행 화살표',
    type: 'shape',
    shapeType: 'arrow-right',
    x: 700,
    y: 195,
    width: 130,
    height: 70,
    rotation: 0,
    opacity: 1,
    fill: '#10B981',
    stroke: '#059669',
    strokeWidth: 1,
    strokeDash: 'solid',
  },
  // Sample Speech Bubble
  {
    id: 'elem-callout',
    layerId: 'layer-shapes',
    name: '안내 말풍선',
    type: 'shape',
    shapeType: 'speech-bubble',
    x: 860,
    y: 160,
    width: 260,
    height: 140,
    rotation: 0,
    opacity: 1,
    fill: '#FFFFFF',
    stroke: '#0284C7',
    strokeWidth: 2,
    strokeDash: 'solid',
    shadow: {
      enabled: true,
      color: 'rgba(2, 132, 199, 0.2)',
      blur: 12,
      offsetX: 2,
      offsetY: 6,
    },
  },
];

export default function App() {
  // State
  const [config, setConfig] = useState<CanvasConfig>(INITIAL_CONFIG);
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [activeLayerId, setActiveLayerId] = useState<string>(INITIAL_LAYERS[1].id);
  const [elements, setElements] = useState<CanvasElement[]>(INITIAL_ELEMENTS);

  // Multi-element selection state
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(['elem-card-1']);
  const selectedElementId = selectedElementIds[selectedElementIds.length - 1] || null;

  // Persistent shape styling (Feature 5: applied to subsequent shapes)
  const [lastShapeStyle, setLastShapeStyle] = useState<ShapeStylePreset>({
    fill: '#4F46E5',
    stroke: '#4F46E5',
    strokeWidth: 2,
    strokeDash: 'solid',
    cornerRadius: 16,
    opacity: 1,
  });

  // Tool & styling state
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('rounded-rect');
  const [primaryColor, setPrimaryColor] = useState<string>('#4F46E5');
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
  const activeImgCropBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Canvas-wide Crop Box State (for Screen/Canvas Region Capture)
  const activeCanvasCropBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const lastMouseCanvasPosRef = useRef<{ x: number; y: number } | null>(null);

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
  }, []);

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
      activeLayerId: INITIAL_LAYERS[1].id,
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

  // Selection handlers
  const handleSelectElement = useCallback(
    (id: string | null) => {
      setSelectedElementIds(id ? [id] : []);
      if (id) {
        const target = elements.find((e) => e.id === id);
        if (target && target.type === 'shape') {
          const isLineShape = target.shapeType === 'line' || target.shapeType === 'line-arrow';
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
              stroke: target.stroke,
              strokeWidth: target.strokeWidth,
              strokeDash: target.strokeDash,
            }));
          }
        }
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
        const isLineShape = newElem.shapeType === 'line' || newElem.shapeType === 'line-arrow';
        if (isLineShape) {
          setSelectedShapeType(newElem.shapeType);
          if (newElem.stroke && newElem.stroke !== 'none') {
            setPrimaryColor(newElem.stroke);
          }
          if (newElem.strokeWidth) {
            setStrokeWidth(newElem.strokeWidth);
          }
        }
        setLastShapeStyle((prev) => ({
          ...prev,
          fill: isLineShape ? prev.fill : newElem.fill,
          stroke: newElem.stroke && newElem.stroke !== 'none' ? newElem.stroke : prev.stroke,
          strokeWidth: newElem.strokeWidth,
          strokeDash: newElem.strokeDash,
          cornerRadius: newElem.cornerRadius ?? prev.cornerRadius,
          opacity: newElem.opacity,
          gradient: newElem.gradient,
          shadow: newElem.shadow,
        }));
      }
      pushHistory(next, layers, config);
    },
    [elements, layers, config, pushHistory]
  );

  // Update Element
  const handleUpdateElement = useCallback(
    (updated: CanvasElement) => {
      const next = elements.map((el) => (el.id === updated.id ? updated : el));
      setElements(next);
      // Feature 5: Keep style persistent for future shapes & lines
      if (updated.type === 'shape') {
        const isLineShape = updated.shapeType === 'line' || updated.shapeType === 'line-arrow';
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
          fill: isLineShape ? prev.fill : updated.fill,
          stroke: updated.stroke && updated.stroke !== 'none' ? updated.stroke : prev.stroke,
          strokeWidth: updated.strokeWidth,
          strokeDash: updated.strokeDash,
          cornerRadius: updated.cornerRadius ?? prev.cornerRadius,
          opacity: updated.opacity,
          gradient: updated.gradient,
          shadow: updated.shadow,
        }));
      }
      pushHistory(next, layers, config);
    },
    [elements, layers, config, pushHistory]
  );

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
        x: el.x + 20,
        y: el.y + 20,
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
      x: el.x + 24,
      y: el.y + 24,
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
      setCurrentTool('select');
      showToast(`캔버스가 ${nextConfig.width}×${nextConfig.height}px 크기로 잘라졌습니다.`);
    },
    [config, elements, layers, pushHistory, showToast]
  );

  // Cut Screen/Canvas Dragged Region (Ctrl+X when Crop box is active)
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

        internalClipboardRef.current = {
          type: 'image-slice',
          imageSlice: {
            src: dataUrl,
            width: Math.round(region.w),
            height: Math.round(region.h),
            naturalWidth: Math.round(region.w),
            naturalHeight: Math.round(region.h),
            suggestedX: Math.round(region.x + 24),
            suggestedY: Math.round(region.y + 24),
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

        // Remove elements completely inside region
        const remainingElements = elements.filter((el) => {
          const elRight = el.x + el.width;
          const elBottom = el.y + el.height;
          const isInside =
            el.x >= region.x &&
            elRight <= regRight &&
            el.y >= region.y &&
            elBottom <= regBottom;
          return !isInside;
        });

        // Add a background patch to cut out any intersecting shapes/images cleanly
        const cutoutPatch: CanvasElement = {
          id: `cutout-${Date.now()}`,
          layerId: activeLayerId,
          name: '오려낸 배경 패치',
          type: 'shape',
          shapeType: 'rect',
          x: Math.round(region.x),
          y: Math.round(region.y),
          width: Math.round(region.w),
          height: Math.round(region.h),
          rotation: 0,
          opacity: 1,
          fill: config.backgroundColor || '#FFFFFF',
          stroke: 'none',
          strokeWidth: 0,
          strokeDash: 'solid',
        };

        const nextElements = [...remainingElements, cutoutPatch];
        setElements(nextElements);
        pushHistory(nextElements, layers, config);
        setCurrentTool('select');
        showToast('✂️ 지정한 영역을 오려냈습니다. (Ctrl+V로 붙여넣기)');
      } catch (err) {
        console.error('Failed to cut region:', err);
        showToast('영역 오려내기 중 오류가 발생했습니다.');
      }
    },
    [layers, elements, config, activeLayerId, pushHistory, showToast]
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
            suggestedX: Math.round(region.x + 24),
            suggestedY: Math.round(region.y + 24),
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

        showToast('📸 지정한 화면 영역이 캡쳐 복사되었습니다! (Ctrl+V로 붙여넣기)');
      } catch (err) {
        console.error('Failed to capture region:', err);
        showToast('영역 캡쳐 중 오류가 발생했습니다.');
      }
    },
    [layers, elements, config, showToast]
  );

  // Directly Copy and Paste Dragged Canvas Region as a new ImageElement
  const handlePasteCanvasRegion = useCallback(
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
            suggestedX: Math.round(region.x + 36),
            suggestedY: Math.round(region.y + 36),
          },
        };

        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]).catch(() => {});
          } catch (e) {}
        }

        const newImg: ImageElement = {
          id: `img-crop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'image',
          name: '캡쳐된 이미지',
          layerId: activeLayerId,
          x: Math.min(Math.max(0, region.x + 24), Math.max(0, config.width - region.w)),
          y: Math.min(Math.max(0, region.y + 24), Math.max(0, config.height - region.h)),
          width: Math.round(region.w),
          height: Math.round(region.h),
          src: dataUrl,
          naturalWidth: Math.round(region.w),
          naturalHeight: Math.round(region.h),
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

        setElements((prev) => {
          const next = [...prev, newImg];
          pushHistory(next, layers, config);
          return next;
        });
        setSelectedElementIds([newImg.id]);
        setCurrentTool('select');
        showToast('📋 캡쳐된 이미지가 화면에 붙여넣어졌습니다. 원하는 위치로 이동하세요.');
      } catch (err) {
        console.error('Failed to paste captured region:', err);
        showToast('붙여넣기 중 오류가 발생했습니다.');
      }
    },
    [layers, elements, config, activeLayerId, pushHistory, showToast]
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
    handleDeleteSelectedElements();
    showToast(`${selected.length}개 객체를 잘라냈습니다. (Ctrl+V로 붙여넣기)`);
  }, [elements, selectedElementIds, handleDeleteSelectedElements, showToast]);

  // Copy Selected Region of an Image (Ctrl+C in crop mode)
  const handleCopyImagePart = useCallback(
    async (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => {
      if (crop.w < 5 || crop.h < 5) return;
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

        internalClipboardRef.current = {
          type: 'image-slice',
          imageSlice: {
            src: croppedSrc,
            width: Math.round(crop.w),
            height: Math.round(crop.h),
            naturalWidth: Math.round(sw),
            naturalHeight: Math.round(sh),
            suggestedX: Math.round(imgElem.x + crop.x + 24),
            suggestedY: Math.round(imgElem.y + crop.y + 24),
          },
        };

        if (navigator.clipboard && window.ClipboardItem) {
          try {
            offCanvas.toBlob((blob) => {
              if (blob) {
                navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob }),
                ]).catch(() => {});
              }
            }, 'image/png');
          } catch (e) {
            console.warn('System clipboard write warning:', e);
          }
        }

        showToast('선택한 이미지 영역이 복사되었습니다. (Ctrl+V로 붙여넣기)');
      };
      img.src = imgElem.src;
    },
    [showToast]
  );

  // Cut (오려내기) Selected Region of an Image (Ctrl+X in crop mode)
  // Copies selected portion to clipboard AND clears it out from original image
  const handleCutImagePart = useCallback(
    async (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => {
      if (crop.w < 5 || crop.h < 5) return;
      const naturalW = imgElem.naturalWidth || imgElem.width;
      const naturalH = imgElem.naturalHeight || imgElem.height;
      const scaleX = naturalW / imgElem.width;
      const scaleY = naturalH / imgElem.height;

      const sx = Math.max(0, crop.x * scaleX);
      const sy = Math.max(0, crop.y * scaleY);
      const sw = Math.min(naturalW - sx, crop.w * scaleX);
      const sh = Math.min(naturalH - sy, crop.h * scaleY);

      if (sw < 1 || sh < 1) return;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = Math.round(sw);
      sliceCanvas.height = Math.round(sh);
      const sliceCtx = sliceCanvas.getContext('2d');
      if (!sliceCtx) return;

      const origCanvas = document.createElement('canvas');
      origCanvas.width = naturalW;
      origCanvas.height = naturalH;
      const origCtx = origCanvas.getContext('2d');
      if (!origCtx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Extract sliced portion
        sliceCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const slicedSrc = sliceCanvas.toDataURL('image/png');

        // Draw original and cut out transparent hole
        origCtx.drawImage(img, 0, 0);
        origCtx.clearRect(sx, sy, sw, sh);
        const modifiedOrigSrc = origCanvas.toDataURL('image/png');

        internalClipboardRef.current = {
          type: 'image-slice',
          imageSlice: {
            src: slicedSrc,
            width: Math.round(crop.w),
            height: Math.round(crop.h),
            naturalWidth: Math.round(sw),
            naturalHeight: Math.round(sh),
            suggestedX: Math.round(imgElem.x + crop.x + 24),
            suggestedY: Math.round(imgElem.y + crop.y + 24),
          },
        };

        if (navigator.clipboard && window.ClipboardItem) {
          try {
            sliceCanvas.toBlob((blob) => {
              if (blob) {
                navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob }),
                ]).catch(() => {});
              }
            }, 'image/png');
          } catch (e) {
            console.warn('System clipboard write warning:', e);
          }
        }

        // Update original image element with transparent cutout
        setElements((prev) => {
          const next = prev.map((el) =>
            el.id === imgElem.id
              ? {
                  ...el,
                  src: modifiedOrigSrc,
                }
              : el
          );
          pushHistory(next, layers, config);
          return next;
        });

        setCroppingImageId(null);
        showToast('선택 영역을 오려냈습니다. (Ctrl+V로 새 객체로 붙여넣기)');
      };
      img.src = imgElem.src;
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

  // Layers Handlers
  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: 'layer-' + Date.now(),
      name: `레이어 ${layers.length + 1}`,
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
      name: `${targetLayer.name} (복사본)`,
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
        const x = Math.round((config.width - width) / 2);
        const y = Math.round((config.height - height) / 2);

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
        showToast('🖼️ 클립보드 이미지가 성공적으로 캔버스에 추가되었습니다!');
      };
      img.onerror = () => {
        alert('이미지 데이터를 불러오는데 실패했습니다.');
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
          handleInsertImageSrc(src, file.name || '삽입된 이미지');
        }
      };
      reader.readAsDataURL(file);
    },
    [handleInsertImageSrc]
  );

  // Button-triggered Paste from Clipboard (Async Clipboard API)
  const handlePasteFromClipboard = useCallback(async () => {
    // 1. Try reading from Clipboard API directly
    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'clipboard-image.png', { type: imageType });
            handleInsertImage(file);
            return;
          }
        }
      } catch (err) {
        console.warn('Clipboard read() permission denied or unsupported in iframe:', err);
        // Show guidance modal if iframe policy blocks direct clipboard reading
        setIsClipboardGuideOpen(true);
        return;
      }
    }

    // 2. Try reading clipboard text (e.g. image URL or data-URI)
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        const text = (await navigator.clipboard.readText()).trim();
        if (
          text.startsWith('data:image/') ||
          /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(text)
        ) {
          handleInsertImageSrc(text, '클립보드 이미지');
          return;
        }
      } catch (err) {
        console.warn('Clipboard readText() failed in iframe:', err);
        setIsClipboardGuideOpen(true);
        return;
      }
    }

    // If neither succeeded (e.g. sandbox block or empty clipboard), open guide modal
    setIsClipboardGuideOpen(true);
  }, [handleInsertImage, handleInsertImageSrc]);

  // Unified Paste Action (Internal Clipboard > System Clipboard)
  const handlePasteAction = useCallback(() => {
    // 1. Check internal clipboard first (e.g. cut/copied image slice or elements)
    if (internalClipboardRef.current) {
      if (
        internalClipboardRef.current.type === 'image-slice' &&
        internalClipboardRef.current.imageSlice
      ) {
        const slice = internalClipboardRef.current.imageSlice;

        // If mouse is currently hovering over the canvas, paste at cursor position!
        let targetX = slice.suggestedX ?? 50;
        let targetY = slice.suggestedY ?? 50;

        if (lastMouseCanvasPosRef.current) {
          const mx = lastMouseCanvasPosRef.current.x;
          const my = lastMouseCanvasPosRef.current.y;
          if (mx >= 0 && mx <= config.width && my >= 0 && my <= config.height) {
            targetX = Math.round(mx - slice.width / 2);
            targetY = Math.round(my - slice.height / 2);
          }
        }

        const newImg: ImageElement = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'image',
          name: '캡쳐된 이미지',
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
        slice.suggestedX = (slice.suggestedX ?? 50) + 24;
        slice.suggestedY = (slice.suggestedY ?? 50) + 24;

        setElements((prev) => {
          const next = [...prev, newImg];
          pushHistory(next, layers, config);
          return next;
        });
        setSelectedElementIds([newImg.id]);
        setCurrentTool('select');
        showToast('📋 캡쳐된 이미지를 붙여넣었습니다. 마우스로 원하는 위치로 이동하세요.');
        return;
      }

      if (
        internalClipboardRef.current.type === 'elements' &&
        internalClipboardRef.current.elements
      ) {
        const cloned = internalClipboardRef.current.elements.map((el, i) => {
          const newId = `${el.type}-${Date.now()}-${i}`;
          const nextX = el.x + 24;
          const nextY = el.y + 24;
          if (el.type === 'brush' && el.points) {
            return {
              ...el,
              id: newId,
              layerId: activeLayerId,
              x: nextX,
              y: nextY,
              points: el.points.map((p) => ({ x: p.x + 24, y: p.y + 24 })),
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

        internalClipboardRef.current.elements = cloned;

        setElements((prev) => {
          const next = [...prev, ...cloned];
          pushHistory(next, layers, config);
          return next;
        });
        const newIds = cloned.map((c) => c.id);
        setSelectedElementIds(newIds);
        setCurrentTool('select');
        showToast(`📋 ${cloned.length}개 객체를 붙여넣었습니다.`);
        return;
      }
    }

    // 2. Fallback to system clipboard
    handlePasteFromClipboard();
  }, [
    activeLayerId,
    config,
    layers,
    pushHistory,
    showToast,
    handlePasteFromClipboard,
  ]);

  // Global Clipboard Paste (Feature 7: CTRL+V Image Paste)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept when typing in text input fields or contenteditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Check direct file copies (e.g. files copied in Windows Explorer / Mac Finder)
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (
            file.type.startsWith('image/') ||
            /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)$/i.test(file.name)
          ) {
            e.preventDefault();
            handleInsertImage(file);
            return;
          }
        }
      }

      // 2. Check clipboard items (e.g. screenshots, Snipping Tool Win+Shift+S, web images)
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
              e.preventDefault();
              handleInsertImage(file);
              return;
            }
          }
        }
      }

      // 3. Check HTML content (e.g. copied from PowerPoint, Word, browser web page)
      const html = clipboardData.getData('text/html');
      if (html) {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match && match[1]) {
          e.preventDefault();
          handleInsertImageSrc(match[1], '웹 복사 이미지');
          return;
        }
      }

      // 4. Check plain text if it's an image link, base64 data-URL, or SVG code
      const text = clipboardData.getData('text/plain')?.trim();
      if (text) {
        if (
          text.startsWith('data:image/') ||
          /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(text)
        ) {
          e.preventDefault();
          setIsClipboardGuideOpen(false);
          handleInsertImageSrc(text, 'URL 이미지');
          return;
        } else if (text.startsWith('<svg') && text.includes('</svg>')) {
          e.preventDefault();
          setIsClipboardGuideOpen(false);
          const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
          handleInsertImageSrc(svgDataUrl, '붙여넣은 SVG');
          return;
        }
      }
    };

    // Attach to both window and document with capture to ensure event interception
    window.addEventListener('paste', handlePaste, true);
    document.addEventListener('paste', handlePaste, true);
    return () => {
      window.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('paste', handlePaste, true);
    };
  }, [handleInsertImage, handleInsertImageSrc]);

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
    a.download = `vector-studio-${Date.now()}.json`;
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
      setLastShapeStyle((prev) => ({
        ...prev,
        fill: color,
        stroke: color,
      }));

      // Immediately update selected element if any
      if (selectedElementIds.length > 0) {
        setElements((prevElements) => {
          let hasChanges = false;
          const next = prevElements.map((el) => {
            if (!selectedElementIds.includes(el.id)) return el;
            hasChanges = true;
            if (el.type === 'shape') {
              const isLineShape = el.shapeType === 'line' || el.shapeType === 'line-arrow';
              if (isLineShape || el.fill === 'none') {
                return { ...el, stroke: color };
              }
              return { ...el, fill: color };
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
              const isLineShape = el.shapeType === 'line' || el.shapeType === 'line-arrow';
              return {
                ...el,
                strokeWidth: w,
                height: isLineShape ? Math.max(w * 4, 16) : el.height,
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
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

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

      // Paste: Ctrl+V (prioritizes cut/copied slices or elements)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (internalClipboardRef.current) {
          e.preventDefault();
          handlePasteAction();
          return;
        }
      }

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
            setCurrentTool('select');
            break;
          case 'h':
            setCurrentTool('pan');
            break;
          case 'b':
            setCurrentTool('brush');
            break;
          case 'y':
            setCurrentTool('highlighter');
            break;
          case 'e':
            setCurrentTool('eraser');
            break;
          case 'u':
            setCurrentTool('shape');
            break;
          case 't':
            setCurrentTool('text');
            break;
          case 'k':
            setCurrentTool('eyedropper');
            break;
          case 'g':
            setCurrentTool('fill');
            break;
          case 'c': {
            const currentSelected = elements.find((el) => el.id === selectedElementId);
            if (currentSelected && currentSelected.type === 'image') {
              handleStartCropImage(currentSelected.id);
            } else {
              setCurrentTool('crop');
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
    toggleLeftPanel,
    toggleRightPanel,
  ]);

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  return (
    <div
      onMouseEnter={() => window.focus()}
      onClick={() => window.focus()}
      className="flex flex-col h-screen w-screen overflow-hidden bg-stone-950 font-sans text-stone-100"
    >
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
        onSelectTool={setCurrentTool}
        selectedShapeType={selectedShapeType}
        onSelectShapeType={setSelectedShapeType}
        primaryColor={primaryColor}
        onPrimaryColorChange={handlePrimaryColorChange}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={handleStrokeWidthChange}
      />

      {/* 3. Main Workspace: Layers Panel + Canvas + Properties Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
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
          onPasteCanvasRegion={handlePasteCanvasRegion}
          onTriggerPaste={handlePasteAction}
          onMouseMoveCanvas={(pt) => {
            lastMouseCanvasPosRef.current = pt;
          }}
          onCopyImagePart={handleCopyImagePart}
          onCutImagePart={handleCutImagePart}
          onCropBoxChange={(box) => {
            activeCanvasCropBoxRef.current = box;
            if (croppingImageId) {
              activeImgCropBoxRef.current = box;
            }
          }}
          layers={layers}
          elements={elements}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          activeLayerId={activeLayerId}
          selectedElementId={selectedElementId}
          selectedElementIds={selectedElementIds}
          onSelectElement={handleSelectElement}
          onSelectMultipleElements={handleSelectMultipleElements}
          onToggleSelectElement={handleToggleSelectElement}
          currentTool={currentTool}
          onSelectTool={setCurrentTool}
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

        {/* Right: Properties Inspector Panel */}
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
          onCancelCropImage={handleFinishCropImage}
          onCutImagePart={handleCutImagePart}
          onCopyImagePart={handleCopyImagePart}
          activeCropBox={activeImgCropBoxRef.current}
        />
      </div>

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
        onCreate={(newCfg) => {
          handleUpdateConfig({
            width: newCfg.width,
            height: newCfg.height,
            backgroundColor: newCfg.backgroundColor,
          });
        }}
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
