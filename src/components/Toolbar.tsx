import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Hand,
  Paintbrush,
  Highlighter,
  Eraser,
  Shapes,
  Type,
  Pipette,
  PaintBucket,
  Crop,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  MoveHorizontal,
  MessageSquare,
  Heart,
  Hexagon,
  Minus,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import { ToolType, ShapeType } from '../types';
import { PAINT_COLORS } from '../utils/colorUtils';

interface ToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedShapeType: ShapeType;
  onSelectShapeType: (shape: ShapeType) => void;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

const SHAPE_ITEMS: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
  { type: 'rect', label: '직사각형', icon: <Square className="w-4 h-4" /> },
  { type: 'rounded-rect', label: '둥근 모서리 사각형', icon: <Square className="w-4 h-4 rounded-sm" /> },
  { type: 'ellipse', label: '타원 / 원', icon: <Circle className="w-4 h-4" /> },
  { type: 'triangle', label: '삼각형', icon: <Triangle className="w-4 h-4" /> },
  { type: 'diamond', label: '다이아몬드 (마름모)', icon: <span className="text-xs font-bold">◇</span> },
  { type: 'star', label: '오각별', icon: <Star className="w-4 h-4" /> },
  { type: 'arrow-right', label: '블록 오른쪽 화살표', icon: <ArrowRight className="w-4 h-4" /> },
  { type: 'arrow-bidirectional', label: '양방향 화살표', icon: <MoveHorizontal className="w-4 h-4" /> },
  { type: 'speech-bubble', label: '말풍선 (Callout)', icon: <MessageSquare className="w-4 h-4" /> },
  { type: 'heart', label: '하트 도형', icon: <Heart className="w-4 h-4" /> },
  { type: 'hexagon', label: '육각형', icon: <Hexagon className="w-4 h-4" /> },
  { type: 'line', label: '직선', icon: <Minus className="w-4 h-4" /> },
  { type: 'line-arrow', label: '화살표 선', icon: <ArrowUpRight className="w-4 h-4" /> }
];

const STROKE_WIDTHS = [1, 2, 4, 8, 12, 20];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  selectedShapeType,
  onSelectShapeType,
  primaryColor,
  onPrimaryColorChange,
  strokeWidth,
  onStrokeWidthChange,
}) => {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);

  // Close shape menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(e.target as Node)) {
        setShowShapeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentShape = SHAPE_ITEMS.find((s) => s.type === selectedShapeType) || SHAPE_ITEMS[0];

  return (
    <div className="h-12 bg-stone-900/95 border-b border-stone-800 text-stone-200 px-4 flex items-center justify-between select-none z-20 shrink-0">
      {/* Left: Tools List */}
      <div className="flex items-center space-x-1">
        {/* Select Tool */}
        <button
          id="tool-select"
          onClick={() => onSelectTool('select')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'select'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="선택 / 이동 도구 (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Pan Tool */}
        <button
          id="tool-pan"
          onClick={() => onSelectTool('pan')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'pan'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="손 / 화면 이동 도구 (H, Space+드래그)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-stone-800 mx-1" />

        {/* Brush */}
        <button
          id="tool-brush"
          onClick={() => onSelectTool('brush')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'brush'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="브러시 / 펜 도구 (B)"
        >
          <Paintbrush className="w-4 h-4" />
        </button>

        {/* Highlighter */}
        <button
          id="tool-highlighter"
          onClick={() => onSelectTool('highlighter')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'highlighter'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="형광펜 도구 (Y)"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Eraser */}
        <button
          id="tool-eraser"
          onClick={() => onSelectTool('eraser')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'eraser'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="지우개 도구 (E)"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-stone-800 mx-1" />

        {/* Quick Shape Buttons: Straight Line, Arrow Line, Rectangle, Circle */}
        <button
          id="tool-quick-line"
          onClick={() => {
            onSelectShapeType('line');
            onSelectTool('shape');
          }}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'shape' && selectedShapeType === 'line'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="직선 그리기"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          id="tool-quick-line-arrow"
          onClick={() => {
            onSelectShapeType('line-arrow');
            onSelectTool('shape');
          }}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'shape' && selectedShapeType === 'line-arrow'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="화살표 선 그리기"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>

        <button
          id="tool-quick-rect"
          onClick={() => {
            onSelectShapeType('rect');
            onSelectTool('shape');
          }}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'shape' && selectedShapeType === 'rect'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="직사각형 그리기"
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          id="tool-quick-circle"
          onClick={() => {
            onSelectShapeType('ellipse');
            onSelectTool('shape');
          }}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'shape' && selectedShapeType === 'ellipse'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="원 / 타원 그리기"
        >
          <Circle className="w-4 h-4" />
        </button>

        {/* Shapes Menu Dropdown for Other PPT Shapes */}
        <div className="relative" ref={shapeMenuRef}>
          <button
            id="tool-shape"
            onClick={() => {
              onSelectTool('shape');
              setShowShapeMenu(!showShapeMenu);
            }}
            className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-md transition-colors ${
              currentTool === 'shape' && selectedShapeType !== 'line' && selectedShapeType !== 'line-arrow' && selectedShapeType !== 'rect' && selectedShapeType !== 'ellipse'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
            title="기타 도형 모음 (U)"
          >
            <Shapes className="w-4 h-4" />
            <span className="text-xs font-medium hidden md:inline">
              {selectedShapeType !== 'line' && selectedShapeType !== 'line-arrow' && selectedShapeType !== 'rect' && selectedShapeType !== 'ellipse'
                ? currentShape.label
                : '도형 더보기'}
            </span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
          </button>

          {showShapeMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-2 z-50 grid grid-cols-2 gap-1 max-h-80 overflow-y-auto">
              <div className="col-span-2 text-[11px] font-semibold text-stone-400 px-2 py-1">
                MS 파워포인트 도형 모음 (13종)
              </div>
              {SHAPE_ITEMS.map((item) => (
                <button
                  key={item.type}
                  id={`shape-option-${item.type}`}
                  onClick={() => {
                    onSelectShapeType(item.type);
                    onSelectTool('shape');
                    setShowShapeMenu(false);
                  }}
                  className={`flex items-center space-x-2 px-2 py-2 rounded text-xs text-left transition-colors ${
                    selectedShapeType === item.type && currentTool === 'shape'
                      ? 'bg-amber-500/20 text-amber-400 font-medium'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <span className="text-stone-400">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text */}
        <button
          id="tool-text"
          onClick={() => onSelectTool('text')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'text'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="텍스트 상자 도구 (T)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Eyedropper */}
        <button
          id="tool-eyedropper"
          onClick={() => onSelectTool('eyedropper')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'eyedropper'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="색상 추출 스포이트 (K)"
        >
          <Pipette className="w-4 h-4" />
        </button>

        {/* Paint Bucket */}
        <button
          id="tool-fill"
          onClick={() => onSelectTool('fill')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'fill'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="페인트통 / 채우기 도구 (G)"
        >
          <PaintBucket className="w-4 h-4" />
        </button>

        {/* Crop Tool */}
        <button
          id="tool-crop"
          onClick={() => onSelectTool('crop')}
          className={`p-2 rounded-md transition-colors ${
            currentTool === 'crop'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800'
          }`}
          title="화면 영역 캡쳐 및 자르기 (Crop) - 드래그 후 Ctrl+C로 캡쳐 복사, Ctrl+V로 붙여넣기 (C)"
        >
          <Crop className="w-4 h-4" />
        </button>
      </div>

      {/* Center/Right: Stroke Width & Quick Color Palette */}
      <div className="flex items-center space-x-3">
        {/* Stroke Width Selector */}
        <div className="flex items-center space-x-1.5 px-2 border-l border-stone-800">
          <span className="text-xs text-stone-400 mr-1 hidden sm:inline">두께:</span>
          <div className="flex items-center space-x-1">
            {STROKE_WIDTHS.map((width) => (
              <button
                key={width}
                id={`stroke-width-${width}`}
                onClick={() => onStrokeWidthChange(width)}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  strokeWidth === width
                    ? 'bg-stone-700 text-amber-400 font-bold'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
                title={`선 두께 ${width}px`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: Math.min(width + 2, 14), height: Math.min(width + 2, 14) }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Primary Color Selector */}
        <div className="flex items-center space-x-2 pl-2 border-l border-stone-800">
          {/* Active color preview button with native color input */}
          <div className="relative group">
            <label
              htmlFor="primary-color-input"
              className="w-7 h-7 rounded border-2 border-stone-600 block shadow-inner cursor-pointer"
              style={{ backgroundColor: primaryColor }}
              title="색상 선택 (클릭하여 팔레트 열기)"
            />
            <input
              id="primary-color-input"
              type="color"
              value={primaryColor.startsWith('#') ? primaryColor : '#000000'}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="opacity-0 absolute -top-1 -left-1 w-0 h-0"
            />
          </div>

          {/* Quick Palette (Classic 20 Paint colors in 2 rows) */}
          <div className="grid grid-cols-10 gap-0.5">
            {PAINT_COLORS.map((c, i) => (
              <button
                key={`${c}-${i}`}
                id={`palette-color-${i}`}
                onClick={() => onPrimaryColorChange(c)}
                className={`w-4 h-4 rounded-sm border ${
                  primaryColor.toLowerCase() === c.toLowerCase()
                    ? 'border-amber-400 ring-1 ring-amber-400 scale-110 z-10'
                    : 'border-stone-700/60 hover:scale-110'
                } transition-transform`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
