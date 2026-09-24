import React from 'react';
import {
  CanvasElement,
  ShapeElement,
  TextElement,
  ImageElement,
  CanvasConfig,
} from '../types';
import { FONT_FAMILIES } from '../utils/colorUtils';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  PanelRightClose,
  PanelRightOpen,
  Crop,
  Scissors,
  Square,
  Circle,
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (updated: CanvasElement) => void;
  onDuplicateElement: (element: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  config: CanvasConfig;
  onUpdateConfig: (partial: Partial<CanvasConfig>) => void;
  isOpen?: boolean;
  onToggleCollapse?: () => void;
  croppingImageId?: string | null;
  onStartCropImage?: (id: string) => void;
  onApplyCropImage?: () => void;
  onCancelCropImage?: () => void;
  onCutImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;
  onCopyImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;
  activeCropBox?: { x: number; y: number; w: number; h: number } | null;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onAlign,
  config,
  onUpdateConfig,
  isOpen = true,
  onToggleCollapse,
  croppingImageId,
  onStartCropImage,
  onApplyCropImage,
  onCancelCropImage,
  onCutImagePart,
  onCopyImagePart,
  activeCropBox,
}) => {
  // Collapsed Rail View
  if (!isOpen) {
    return (
      <aside
        onClick={onToggleCollapse}
        className="w-10 bg-stone-900 border-l border-stone-800 text-stone-200 flex flex-col items-center py-3 select-none text-xs shrink-0 cursor-pointer hover:bg-stone-850 transition-colors group"
        title="속성 패널 펼치기 (단축키: ])"
      >
        <button
          id="btn-expand-properties"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          className="p-1.5 rounded hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-colors"
          title="속성 패널 펼치기 (단축키: ])"
        >
          <PanelRightOpen className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
        </button>

        <Sliders className="w-4 h-4 text-amber-400 mt-3" />

        <span className="text-[11px] text-stone-400 group-hover:text-stone-200 font-medium tracking-wider mt-4 [writing-mode:vertical-lr]">
          {selectedElement ? '개체 속성' : '캔버스 설정'}
        </span>
      </aside>
    );
  }

  if (!selectedElement) {
    // Canvas settings when nothing is selected
    return (
      <aside className="w-72 bg-stone-900 border-l border-stone-800 text-stone-200 p-4 flex flex-col space-y-5 overflow-y-auto text-xs shrink-0 select-none">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <div>
            <h2 className="font-semibold text-sm text-stone-100 mb-0.5">캔버스 속성</h2>
            <p className="text-[11px] text-stone-400">작업 영역 크기 및 배경 설정</p>
          </div>
          {onToggleCollapse && (
            <button
              id="btn-collapse-properties"
              onClick={onToggleCollapse}
              className="p-1.5 rounded text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 transition-colors"
              title="속성 패널 접기 (단축키: ])"
            >
              <PanelRightClose className="w-4 h-4 text-orange-400" />
            </button>
          )}
        </div>

        {/* Canvas Dimension Presets */}
        <div className="space-y-2">
          <label className="text-stone-300 font-medium block">규격 프리셋</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'FHD (1920×1080)', w: 1920, h: 1080 },
              { label: 'HD (1280×720)', w: 1280, h: 720 },
              { label: '정사각형 (1080×1080)', w: 1080, h: 1080 },
              { label: '그림판 (800×600)', w: 800, h: 600 },
              { label: 'A4 세로 (794×1123)', w: 794, h: 1123 },
              { label: '배너 (1200×630)', w: 1200, h: 630 },
            ].map((preset) => (
              <button
                key={preset.label}
                id={`preset-${preset.w}x${preset.h}`}
                onClick={() => onUpdateConfig({ width: preset.w, height: preset.h })}
                className={`px-2 py-1.5 rounded border text-[11px] text-left transition-colors ${
                  config.width === preset.w && config.height === preset.h
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-medium'
                    : 'border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Width / Height */}
        <div className="space-y-2">
          <label className="text-stone-300 font-medium block">직접 크기 입력 (px)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">가로 (너비)</span>
              <input
                id="input-canvas-width"
                type="number"
                min="100"
                max="4000"
                value={config.width}
                onChange={(e) => onUpdateConfig({ width: Math.max(100, parseInt(e.target.value) || 800) })}
                className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">세로 (높이)</span>
              <input
                id="input-canvas-height"
                type="number"
                min="100"
                max="4000"
                value={config.height}
                onChange={(e) => onUpdateConfig({ height: Math.max(100, parseInt(e.target.value) || 600) })}
                className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2 pt-2 border-t border-stone-800">
          <label className="text-stone-300 font-medium block">캔버스 배경색</label>
          <div className="flex items-center space-x-2">
            <input
              id="input-canvas-bg"
              type="color"
              value={config.backgroundColor === 'transparent' ? '#ffffff' : config.backgroundColor}
              onChange={(e) => onUpdateConfig({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded border border-stone-700 cursor-pointer bg-transparent"
            />
            <div className="flex space-x-1">
              <button
                onClick={() => onUpdateConfig({ backgroundColor: '#FFFFFF' })}
                className={`px-2 py-1 rounded border text-[11px] ${
                  config.backgroundColor === '#FFFFFF' ? 'border-amber-500 text-amber-300' : 'border-stone-800 text-stone-400'
                }`}
              >
                흰색
              </button>
              <button
                onClick={() => onUpdateConfig({ backgroundColor: '#18181B' })}
                className={`px-2 py-1 rounded border text-[11px] ${
                  config.backgroundColor === '#18181B' ? 'border-amber-500 text-amber-300' : 'border-stone-800 text-stone-400'
                }`}
              >
                다크
              </button>
              <button
                onClick={() => onUpdateConfig({ backgroundColor: 'transparent' })}
                className={`px-2 py-1 rounded border text-[11px] ${
                  config.backgroundColor === 'transparent' ? 'border-amber-500 text-amber-300' : 'border-stone-800 text-stone-400'
                }`}
              >
                투명
              </button>
            </div>
          </div>
        </div>

        {/* Grid Setting */}
        <div className="space-y-2 pt-2 border-t border-stone-800">
          <div className="flex justify-between items-center">
            <label className="text-stone-300 font-medium">격자 크기</label>
            <span className="font-mono text-stone-400">{config.gridSize}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={config.gridSize}
            onChange={(e) => onUpdateConfig({ gridSize: parseInt(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </aside>
    );
  }

  // Element is selected! Contextual PPT & Paint property panels
  const isShape = selectedElement.type === 'shape';
  const shape = isShape ? (selectedElement as ShapeElement) : null;
  const isLine = isShape && (shape?.shapeType === 'line' || shape?.shapeType === 'line-arrow');
  const isText = selectedElement.type === 'text';
  const isImage = selectedElement.type === 'image';
  const isBrush = selectedElement.type === 'brush';

  const text = isText ? (selectedElement as TextElement) : null;
  const img = isImage ? (selectedElement as ImageElement) : null;

  return (
    <aside className="w-72 bg-stone-900 border-l border-stone-800 text-stone-200 p-4 flex flex-col space-y-4 overflow-y-auto text-xs shrink-0 select-none">
      {/* Header with Title and Quick Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div>
          <h2 className="font-semibold text-sm text-stone-100 capitalize">
            {isShape && (isLine ? '선 속성 (라인 서식)' : '도형 속성 (PPT 서식)')}
            {isText && '텍스트 서식'}
            {isImage && '이미지 및 필터 조정'}
            {isBrush && '브러시 획 속성'}
          </h2>
          <span className="text-[11px] text-stone-400">{selectedElement.name || selectedElement.type}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            id="btn-duplicate-elem"
            onClick={() => onDuplicateElement(selectedElement)}
            className="p-1.5 rounded text-stone-400 hover:text-white hover:bg-stone-800"
            title="복제 (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-delete-elem"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1.5 rounded text-stone-400 hover:text-rose-400 hover:bg-stone-800"
            title="삭제 (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onToggleCollapse && (
            <button
              id="btn-collapse-properties-elem"
              onClick={onToggleCollapse}
              className="p-1.5 rounded text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 ml-1 border-l border-stone-800 transition-colors"
              title="속성 패널 접기 (단축키: ])"
            >
              <PanelRightClose className="w-3.5 h-3.5 text-orange-400" />
            </button>
          )}
        </div>
      </div>

      {/* Geometry / Transform */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-stone-300 font-medium block">
            {isLine ? '위치 및 길이' : '위치 및 크기'}
          </label>
          <span className="text-[10px] text-amber-400/80 font-mono tracking-tight" title="선택 후 키보드 방향키로 1px, Shift+방향키로 10px씩 미세 이동할 수 있습니다.">
            방향키로 1px / Shift로 10px 이동
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-stone-500 block mb-0.5">X 좌표</span>
            <input
              type="number"
              value={Math.round(selectedElement.x)}
              onChange={(e) =>
                onUpdateElement({ ...selectedElement, x: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 block mb-0.5">Y 좌표</span>
            <input
              type="number"
              value={Math.round(selectedElement.y)}
              onChange={(e) =>
                onUpdateElement({ ...selectedElement, y: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 block mb-0.5">
              {isLine ? '길이 (Length)' : '너비 (W)'}
            </span>
            <input
              type="number"
              value={Math.round(selectedElement.width)}
              min="5"
              onChange={(e) =>
                onUpdateElement({ ...selectedElement, width: Math.max(5, parseFloat(e.target.value) || 10) })
              }
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
            />
          </div>
          {isLine ? (
            <div>
              <span className="text-[10px] text-stone-500 block mb-0.5">선 두께 (굵기)</span>
              <input
                type="number"
                value={shape?.strokeWidth || 2}
                min="1"
                max="50"
                onChange={(e) => {
                  const sw = Math.max(1, parseInt(e.target.value) || 2);
                  onUpdateElement({
                    ...shape!,
                    strokeWidth: sw,
                    height: Math.max(sw * 4, 16),
                  });
                }}
                className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
              />
            </div>
          ) : (
            <div>
              <span className="text-[10px] text-stone-500 block mb-0.5">높이 (H)</span>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                min="5"
                onChange={(e) =>
                  onUpdateElement({ ...selectedElement, height: Math.max(5, parseFloat(e.target.value) || 10) })
                }
                className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Rotation */}
        <div className="flex items-center space-x-2 pt-1">
          <RotateCw className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[10px] text-stone-400">회전:</span>
          <input
            type="range"
            min="0"
            max="360"
            value={selectedElement.rotation || 0}
            onChange={(e) =>
              onUpdateElement({ ...selectedElement, rotation: parseInt(e.target.value) || 0 })
            }
            className="flex-1 accent-amber-500"
          />
          <span className="font-mono text-stone-300 text-xs w-8 text-right">
            {selectedElement.rotation || 0}°
          </span>
        </div>

        {/* Opacity */}
        <div className="flex items-center space-x-2 pt-1">
          <span className="text-[10px] text-stone-400">불투명도:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(selectedElement.opacity * 100)}
            onChange={(e) =>
              onUpdateElement({ ...selectedElement, opacity: parseInt(e.target.value) / 100 })
            }
            className="flex-1 accent-amber-500"
          />
          <span className="font-mono text-stone-300 text-xs w-8 text-right">
            {Math.round(selectedElement.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* SHAPE SPECIFIC PROPERTIES: Fill, Gradient, Stroke, Corner */}
      {isShape && shape && (
        <div className="space-y-3 pt-3 border-t border-stone-800">
          <label className="text-stone-300 font-medium block">
            {isLine ? '선 스타일 및 화살표' : '채우기 및 테두리 (PPT 스타일)'}
          </label>

          {/* Line Type Toggle if Line */}
          {isLine && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-stone-400">선 종류 (다음 그리기에도 유지)</span>
              <div className="flex items-center space-x-2">
                <button
                  id="prop-line-type-straight"
                  onClick={() =>
                    onUpdateElement({
                      ...shape,
                      shapeType: 'line',
                      name: '직선',
                    })
                  }
                  className={`flex-1 py-1.5 rounded border text-xs font-medium transition-colors ${
                    shape.shapeType === 'line'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold shadow-xs'
                      : 'border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  ─ 직선
                </button>
                <button
                  id="prop-line-type-arrow"
                  onClick={() =>
                    onUpdateElement({
                      ...shape,
                      shapeType: 'line-arrow',
                      name: '화살표 선',
                    })
                  }
                  className={`flex-1 py-1.5 rounded border text-xs font-medium transition-colors ${
                    shape.shapeType === 'line-arrow'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold shadow-xs'
                      : 'border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  ↗ 화살표 선
                </button>
              </div>
            </div>
          )}

          {/* Fill Type: Solid vs None vs Gradient (for non-lines) */}
          {!isLine && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-stone-400">면 채우기</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={shape.fill === 'none' ? '#ffffff' : shape.fill}
                  onChange={(e) =>
                    onUpdateElement({
                      ...shape,
                      fill: e.target.value,
                      gradient: shape.gradient ? { ...shape.gradient, enabled: false } : undefined,
                    })
                  }
                  className="w-7 h-7 rounded border border-stone-700 bg-transparent cursor-pointer"
                />
                <button
                  onClick={() =>
                    onUpdateElement({
                      ...shape,
                      fill: 'none',
                      gradient: shape.gradient ? { ...shape.gradient, enabled: false } : undefined,
                    })
                  }
                  className={`px-2 py-1 rounded border text-[11px] ${
                    shape.fill === 'none' && !shape.gradient?.enabled
                      ? 'border-amber-500 text-amber-300'
                      : 'border-stone-800 text-stone-400'
                  }`}
                >
                  투명 채우기
                </button>

                <button
                  onClick={() => {
                    const enabled = !shape.gradient?.enabled;
                    onUpdateElement({
                      ...shape,
                      gradient: {
                        enabled,
                        type: 'linear',
                        startColor: shape.fill === 'none' ? '#3B82F6' : shape.fill,
                        endColor: '#9333EA',
                        angle: 90,
                      },
                    });
                  }}
                  className={`px-2 py-1 rounded border text-[11px] ${
                    shape.gradient?.enabled
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-stone-800 text-stone-400'
                  }`}
                >
                  그라데이션
                </button>
              </div>

              {/* Gradient options if active */}
              {shape.gradient?.enabled && (
                <div className="bg-stone-800/60 p-2 rounded border border-stone-700 space-y-2 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">시작 / 끝 색상</span>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="color"
                        value={shape.gradient.startColor}
                        onChange={(e) =>
                          onUpdateElement({
                            ...shape,
                            gradient: { ...shape.gradient!, startColor: e.target.value },
                          })
                        }
                        className="w-5 h-5 rounded cursor-pointer bg-transparent"
                      />
                      <input
                        type="color"
                        value={shape.gradient.endColor}
                        onChange={(e) =>
                          onUpdateElement({
                            ...shape,
                            gradient: { ...shape.gradient!, endColor: e.target.value },
                          })
                        }
                        className="w-5 h-5 rounded cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-stone-400">각도</span>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={shape.gradient.angle}
                      onChange={(e) =>
                        onUpdateElement({
                          ...shape,
                          gradient: { ...shape.gradient!, angle: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="flex-1 accent-amber-500"
                    />
                    <span className="text-[10px] font-mono text-stone-300">{shape.gradient.angle}°</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stroke / Outline */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-stone-400">{isLine ? '선 색상 및 굵기' : '윤곽선 (Stroke)'}</span>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={shape.stroke === 'none' ? '#000000' : shape.stroke}
                onChange={(e) => onUpdateElement({ ...shape, stroke: e.target.value })}
                className="w-7 h-7 rounded border border-stone-700 bg-transparent cursor-pointer"
              />
              {!isLine && (
                <button
                  onClick={() => onUpdateElement({ ...shape, stroke: 'none' })}
                  className={`px-2 py-1 rounded border text-[11px] ${
                    shape.stroke === 'none' ? 'border-amber-500 text-amber-300' : 'border-stone-800 text-stone-400'
                  }`}
                >
                  선 없음
                </button>
              )}
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={shape.strokeWidth}
                  onChange={(e) => {
                    const sw = Math.max(1, parseInt(e.target.value) || 1);
                    onUpdateElement({
                      ...shape,
                      strokeWidth: sw,
                      height: isLine ? Math.max(sw * 4, 16) : shape.height,
                    });
                  }}
                  className="w-14 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs"
                />
                <span className="text-[10px] text-stone-500">px</span>
              </div>
            </div>

            {/* Quick Stroke Color Chips */}
            <div className="flex items-center space-x-1 pt-1 overflow-x-auto py-0.5">
              {[
                '#000000',
                '#FFFFFF',
                '#EF4444',
                '#F97316',
                '#F59E0B',
                '#10B981',
                '#06B6D4',
                '#3B82F6',
                '#4F46E5',
                '#8B5CF6',
                '#EC4899',
                '#64748B',
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateElement({ ...shape, stroke: c })}
                  className={`w-4 h-4 rounded-sm border shrink-0 transition-transform ${
                    shape.stroke.toLowerCase() === c.toLowerCase()
                      ? 'border-amber-400 ring-1 ring-amber-400 scale-110'
                      : 'border-stone-700 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Stroke Dash Style */}
            <div className="flex items-center space-x-1 mt-1">
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdateElement({ ...shape, strokeDash: style })}
                  className={`flex-1 py-1 rounded border text-[11px] capitalize ${
                    shape.strokeDash === style
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-stone-800 text-stone-400'
                  }`}
                >
                  {style === 'solid' ? '실선' : style === 'dashed' ? '파선' : '점선'}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Radius for Rect */}
          {!isLine && (shape.shapeType === 'rect' || shape.shapeType === 'rounded-rect') && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between">
                <span className="text-[11px] text-stone-400">모서리 둥글기 (Radius)</span>
                <span className="font-mono text-stone-300">{shape.cornerRadius || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={shape.cornerRadius || 0}
                onChange={(e) =>
                  onUpdateElement({ ...shape, cornerRadius: parseInt(e.target.value) || 0 })
                }
                className="w-full accent-amber-500"
              />
            </div>
          )}
        </div>
      )}

      {/* TEXT SPECIFIC PROPERTIES */}
      {isText && text && (
        <div className="space-y-3 pt-3 border-t border-stone-800">
          <label className="text-stone-300 font-medium block">텍스트 내용 및 서식</label>

          <div>
            <span className="text-[10px] text-stone-500 block mb-1">내용</span>
            <textarea
              value={text.text}
              onChange={(e) => onUpdateElement({ ...text, text: e.target.value })}
              rows={3}
              className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-stone-100 text-xs focus:border-amber-500"
            />
          </div>

          {/* Font Family */}
          <div>
            <span className="text-[10px] text-stone-500 block mb-1">글꼴 (Font)</span>
            <select
              value={text.fontFamily}
              onChange={(e) => onUpdateElement({ ...text, fontFamily: e.target.value })}
              className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1.5 text-stone-100 text-xs focus:border-amber-500"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.name} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Color */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">글자 크기 (px)</span>
              <input
                type="number"
                min="8"
                max="180"
                value={text.fontSize}
                onChange={(e) =>
                  onUpdateElement({ ...text, fontSize: Math.max(8, parseInt(e.target.value) || 12) })
                }
                className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 font-mono text-stone-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">글자 색상</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={text.color}
                  onChange={(e) => onUpdateElement({ ...text, color: e.target.value })}
                  className="w-7 h-7 rounded border border-stone-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-stone-300 text-[11px]">{text.color}</span>
              </div>
            </div>
          </div>

          {/* Formatting: Bold, Italic, Underline, Align */}
          <div className="flex items-center space-x-1 pt-1">
            <button
              onClick={() => onUpdateElement({ ...text, bold: !text.bold })}
              className={`px-2.5 py-1.5 rounded border text-xs font-bold ${
                text.bold ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-stone-800 text-stone-400'
              }`}
            >
              B
            </button>
            <button
              onClick={() => onUpdateElement({ ...text, italic: !text.italic })}
              className={`px-2.5 py-1.5 rounded border text-xs italic ${
                text.italic ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-stone-800 text-stone-400'
              }`}
            >
              I
            </button>
            <button
              onClick={() => onUpdateElement({ ...text, underline: !text.underline })}
              className={`px-2.5 py-1.5 rounded border text-xs underline ${
                text.underline ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-stone-800 text-stone-400'
              }`}
            >
              U
            </button>

            <div className="w-[1px] h-6 bg-stone-800 mx-1" />

            <button
              onClick={() => onUpdateElement({ ...text, align: 'left' })}
              className={`p-1.5 rounded border ${
                text.align === 'left' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-stone-800 text-stone-400'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateElement({ ...text, align: 'center' })}
              className={`p-1.5 rounded border ${
                text.align === 'center' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-stone-800 text-stone-400'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateElement({ ...text, align: 'right' })}
              className={`p-1.5 rounded border ${
                text.align === 'right' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-stone-800 text-stone-400'
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* IMAGE SPECIFIC PROPERTIES: Crop, Border, Corner Radius, Flip, Filters */}
      {isImage && img && (
        <div className="space-y-4 pt-3 border-t border-stone-800">
          {/* 1. PowerPoint-style Image Crop Section */}
          <div className="bg-stone-850 border border-stone-750 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-stone-200 font-semibold text-xs flex items-center space-x-1.5">
                <Crop className="w-4 h-4 text-amber-400" />
                <span>그림 자르기 (Picture Crop)</span>
              </label>
              {croppingImageId === img.id && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-medium animate-pulse">
                  자르기 진행 중
                </span>
              )}
            </div>

            {croppingImageId === img.id ? (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onCutImagePart && activeCropBox) {
                        onCutImagePart(img, activeCropBox);
                      }
                    }}
                    className="py-1.5 px-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-semibold rounded transition-colors flex items-center justify-center space-x-1"
                    title="선택 영역을 오려내어 클립보드에 저장하고 원본에서 비웁니다 (Ctrl+X)"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>오려내기 (Ctrl+X)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCopyImagePart && activeCropBox) {
                        onCopyImagePart(img, activeCropBox);
                      }
                    }}
                    className="py-1.5 px-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 hover:text-sky-200 border border-sky-500/30 text-xs font-semibold rounded transition-colors flex items-center justify-center space-x-1"
                    title="선택 영역을 클립보드에 복사합니다 (Ctrl+C)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>복사 (Ctrl+C)</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={onApplyCropImage}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded shadow transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>✓ 남기기 완료 (Enter)</span>
                  </button>
                  <button
                    onClick={onCancelCropImage}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded transition-colors"
                  >
                    ✕ 취소 (Esc)
                  </button>
                </div>
                <p className="text-[11px] text-stone-400 leading-tight">
                  캔버스 위의 자르기 핸들로 영역을 지정한 후, <span className="text-red-300 font-medium">오려내기</span>(Ctrl+X) 또는 <span className="text-sky-300 font-medium">복사</span>(Ctrl+C)하여 원하는 곳에 붙여넣을 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  onClick={() => onStartCropImage?.(img.id)}
                  className="w-full py-2 bg-stone-800 hover:bg-stone-700 hover:border-amber-500/50 border border-stone-700 text-stone-200 hover:text-amber-300 font-medium text-xs rounded-md shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Crop className="w-3.5 h-3.5 text-amber-400" />
                  <span>그림 자르기 시작</span>
                </button>
                <p className="text-[10px] text-stone-500">
                  Tip: 캔버스에서 이미지를 <strong className="text-stone-400">더블 클릭</strong>하거나 단축키 <strong className="text-amber-400 font-mono">C</strong>를 눌러도 즉시 자를 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* 2. Picture Border & Corner Radius (PowerPoint Style) */}
          <div className="space-y-3 pt-1">
            <label className="text-stone-300 font-medium block text-xs">그림 스타일 (테두리 및 모서리)</label>

            {/* Corner Radius */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">모서리 둥글기 (Radius)</span>
                <span className="font-mono text-stone-300">{img.cornerRadius || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                value={img.cornerRadius || 0}
                onChange={(e) =>
                  onUpdateElement({ ...img, cornerRadius: parseInt(e.target.value) || 0 })
                }
                className="w-full accent-amber-500"
              />
              <div className="flex items-center space-x-1 pt-0.5">
                <button
                  onClick={() => onUpdateElement({ ...img, cornerRadius: 0 })}
                  className={`flex-1 py-0.5 rounded border text-[10px] ${
                    !img.cornerRadius ? 'border-amber-500 text-amber-300' : 'border-stone-800 text-stone-400'
                  }`}
                >
                  각진 모서리 (0px)
                </button>
                <button
                  onClick={() => onUpdateElement({ ...img, cornerRadius: 24 })}
                  className={`flex-1 py-0.5 rounded border text-[10px] ${
                    img.cornerRadius === 24 ? 'border-amber-500 text-amber-300' : 'border-stone-800 text-stone-400'
                  }`}
                >
                  둥근 모서리 (24px)
                </button>
                <button
                  onClick={() => onUpdateElement({ ...img, cornerRadius: Math.min(img.width, img.height) / 2 })}
                  className={`flex-1 py-0.5 rounded border text-[10px] ${
                    img.cornerRadius && img.cornerRadius >= Math.min(img.width, img.height) / 2 - 2
                      ? 'border-amber-500 text-amber-300'
                      : 'border-stone-800 text-stone-400'
                  }`}
                >
                  원형 / 알약
                </button>
              </div>
            </div>

            {/* Border Width & Color */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">그림 외곽 테두리 (Border)</span>
                <span className="font-mono text-stone-300">{img.borderWidth || 0}px</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={img.borderColor || '#000000'}
                  onChange={(e) => onUpdateElement({ ...img, borderColor: e.target.value })}
                  className="w-7 h-7 rounded border border-stone-700 bg-transparent cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={img.borderWidth || 0}
                  onChange={(e) =>
                    onUpdateElement({ ...img, borderWidth: parseInt(e.target.value) || 0 })
                  }
                  className="flex-1 accent-amber-500"
                />
                <span className="text-xs font-mono text-stone-400 w-8 text-right">{img.borderWidth || 0}px</span>
              </div>
            </div>
          </div>

          {/* 3. Image Correction & Filters */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-stone-300 font-medium flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>이미지 보정 및 필터</span>
              </label>
              <button
                onClick={() =>
                  onUpdateElement({
                    ...img,
                    filters: {
                      brightness: 100,
                      contrast: 100,
                      saturation: 100,
                      blur: 0,
                      grayscale: 0,
                      invert: 0,
                    },
                  })
                }
                className="text-[10px] text-amber-400 hover:underline"
              >
                필터 초기화
              </button>
            </div>

          {/* Flip Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdateElement({ ...img, flipH: !img.flipH })}
              className={`flex-1 flex items-center justify-center space-x-1 py-1 rounded border text-[11px] ${
                img.flipH ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-stone-800 text-stone-400'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>좌우 반전</span>
            </button>
            <button
              onClick={() => onUpdateElement({ ...img, flipV: !img.flipV })}
              className={`flex-1 flex items-center justify-center space-x-1 py-1 rounded border text-[11px] ${
                img.flipV ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-stone-800 text-stone-400'
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>상하 반전</span>
            </button>
          </div>

          {/* Filter Sliders */}
          <div className="space-y-2 pt-1 text-[11px]">
            {/* Brightness */}
            <div>
              <div className="flex justify-between text-stone-400">
                <span>밝기 (Brightness)</span>
                <span className="font-mono">{img.filters.brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={img.filters.brightness}
                onChange={(e) =>
                  onUpdateElement({
                    ...img,
                    filters: { ...img.filters, brightness: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-stone-400">
                <span>대비 (Contrast)</span>
                <span className="font-mono">{img.filters.contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={img.filters.contrast}
                onChange={(e) =>
                  onUpdateElement({
                    ...img,
                    filters: { ...img.filters, contrast: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-stone-400">
                <span>채도 (Saturation)</span>
                <span className="font-mono">{img.filters.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={img.filters.saturation}
                onChange={(e) =>
                  onUpdateElement({
                    ...img,
                    filters: { ...img.filters, saturation: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Blur */}
            <div>
              <div className="flex justify-between text-stone-400">
                <span>흐림 효과 (Blur)</span>
                <span className="font-mono">{img.filters.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={img.filters.blur}
                onChange={(e) =>
                  onUpdateElement({
                    ...img,
                    filters: { ...img.filters, blur: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Grayscale */}
            <div>
              <div className="flex justify-between text-stone-400">
                <span>흑백 (Grayscale)</span>
                <span className="font-mono">{img.filters.grayscale}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={img.filters.grayscale}
                onChange={(e) =>
                  onUpdateElement({
                    ...img,
                    filters: { ...img.filters, grayscale: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Invert */}
            <div>
              <div className="flex justify-between text-stone-400">
                <span>색상 반전 (Invert)</span>
                <span className="font-mono">{img.filters.invert}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={img.filters.invert}
                onChange={(e) =>
                  onUpdateElement({
                    ...img,
                    filters: { ...img.filters, invert: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>
        </div>
      )}

      {/* DROP SHADOW (Supports all elements) */}
      <div className="space-y-2 pt-3 border-t border-stone-800">
        <div className="flex items-center justify-between">
          <label className="text-stone-300 font-medium">그림자 효과 (Shadow)</label>
          <input
            type="checkbox"
            checked={!!selectedElement.shadow?.enabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              onUpdateElement({
                ...selectedElement,
                shadow: {
                  enabled,
                  color: selectedElement.shadow?.color || '#000000',
                  blur: selectedElement.shadow?.blur || 8,
                  offsetX: selectedElement.shadow?.offsetX || 4,
                  offsetY: selectedElement.shadow?.offsetY || 4,
                },
              });
            }}
            className="rounded border-stone-700 text-amber-500 focus:ring-0 cursor-pointer"
          />
        </div>

        {selectedElement.shadow?.enabled && (
          <div className="bg-stone-800/60 p-2.5 rounded border border-stone-700 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">그림자 색상</span>
              <input
                type="color"
                value={selectedElement.shadow.color}
                onChange={(e) =>
                  onUpdateElement({
                    ...selectedElement,
                    shadow: { ...selectedElement.shadow!, color: e.target.value },
                  })
                }
                className="w-5 h-5 rounded cursor-pointer bg-transparent"
              />
            </div>
            <div>
              <div className="flex justify-between text-stone-400">
                <span>흐림 반경 (Blur)</span>
                <span className="font-mono">{selectedElement.shadow.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={selectedElement.shadow.blur}
                onChange={(e) =>
                  onUpdateElement({
                    ...selectedElement,
                    shadow: { ...selectedElement.shadow!, blur: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-stone-500 block mb-0.5">X 오프셋</span>
                <input
                  type="number"
                  value={selectedElement.shadow.offsetX}
                  onChange={(e) =>
                    onUpdateElement({
                      ...selectedElement,
                      shadow: { ...selectedElement.shadow!, offsetX: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block mb-0.5">Y 오프셋</span>
                <input
                  type="number"
                  value={selectedElement.shadow.offsetY}
                  onChange={(e) =>
                    onUpdateElement({
                      ...selectedElement,
                      shadow: { ...selectedElement.shadow!, offsetY: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ARRANGE / Z-ORDER & ALIGNMENT (PowerPoint style) */}
      <div className="space-y-2 pt-3 border-t border-stone-800">
        <label className="text-stone-300 font-medium block">정렬 및 순서 (Arrange)</label>

        {/* Z-order controls */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => onBringToFront(selectedElement.id)}
            className="flex flex-col items-center p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-[10px] text-stone-300 hover:text-white"
            title="맨 앞으로 가져오기"
          >
            <BringToFront className="w-3.5 h-3.5 mb-1 text-amber-400" />
            <span>맨 앞</span>
          </button>
          <button
            onClick={() => onBringForward(selectedElement.id)}
            className="flex flex-col items-center p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-[10px] text-stone-300 hover:text-white"
            title="앞으로 가져오기"
          >
            <ArrowUp className="w-3.5 h-3.5 mb-1 text-stone-400" />
            <span>앞으로</span>
          </button>
          <button
            onClick={() => onSendBackward(selectedElement.id)}
            className="flex flex-col items-center p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-[10px] text-stone-300 hover:text-white"
            title="뒤로 보내기"
          >
            <ArrowDown className="w-3.5 h-3.5 mb-1 text-stone-400" />
            <span>뒤로</span>
          </button>
          <button
            onClick={() => onSendToBack(selectedElement.id)}
            className="flex flex-col items-center p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-[10px] text-stone-300 hover:text-white"
            title="맨 뒤로 보내기"
          >
            <SendToBack className="w-3.5 h-3.5 mb-1 text-amber-400" />
            <span>맨 뒤</span>
          </button>
        </div>

        {/* Alignment relative to canvas */}
        <div className="grid grid-cols-6 gap-1 pt-1">
          <button
            onClick={() => onAlign('left')}
            className="p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 flex justify-center"
            title="왼쪽 맞춤"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('center')}
            className="p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 flex justify-center"
            title="가운데 맞춤"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('right')}
            className="p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 flex justify-center"
            title="오른쪽 맞춤"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('top')}
            className="p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 flex justify-center"
            title="위쪽 맞춤"
          >
            <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('middle')}
            className="p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 flex justify-center"
            title="중간 맞춤"
          >
            <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('bottom')}
            className="p-1.5 rounded border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 flex justify-center"
            title="아래쪽 맞춤"
          >
            <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
