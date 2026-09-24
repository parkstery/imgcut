import React, { useState } from 'react';
import {
  Layer,
  CanvasElement,
} from '../types';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  Square,
  Type,
  Image as ImageIcon,
  Paintbrush,
  Edit2,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onMoveLayerUp: (layerId: string) => void;
  onMoveLayerDown: (layerId: string) => void;
  onUpdateLayer: (updated: Layer) => void;
  elements: CanvasElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  isOpen?: boolean;
  onToggleCollapse?: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onUpdateLayer,
  elements,
  selectedElementId,
  onSelectElement,
  isOpen = true,
  onToggleCollapse,
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  const handleStartRename = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleSaveRename = (layer: Layer) => {
    if (editingName.trim()) {
      onUpdateLayer({ ...layer, name: editingName.trim() });
    }
    setEditingLayerId(null);
  };

  const getElementIcon = (type: CanvasElement['type']) => {
    switch (type) {
      case 'shape':
        return <Square className="w-3 h-3 text-amber-400" />;
      case 'text':
        return <Type className="w-3 h-3 text-blue-400" />;
      case 'image':
        return <ImageIcon className="w-3 h-3 text-emerald-400" />;
      case 'brush':
        return <Paintbrush className="w-3 h-3 text-rose-400" />;
    }
  };

  // Collapsed Rail View
  if (!isOpen) {
    return (
      <aside
        onClick={onToggleCollapse}
        className="w-10 bg-stone-900 border-r border-stone-800 text-stone-200 flex flex-col items-center py-3 select-none text-xs shrink-0 cursor-pointer hover:bg-stone-850 transition-colors group"
        title="레이어 패널 펼치기 (단축키: [)"
      >
        <button
          id="btn-expand-layers"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          className="p-1.5 rounded hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-colors"
          title="레이어 패널 펼치기 (단축키: [)"
        >
          <PanelLeftOpen className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
        </button>

        <Layers className="w-4 h-4 text-amber-400 mt-3" />
        <span className="mt-1 text-[10px] font-semibold bg-stone-800 text-stone-300 rounded px-1.5 py-0.5">
          {layers.length}
        </span>

        <span className="text-[11px] text-stone-400 group-hover:text-stone-200 font-medium tracking-wider mt-4 [writing-mode:vertical-lr]">
          레이어 목록
        </span>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-stone-900 border-r border-stone-800 text-stone-200 flex flex-col shrink-0 select-none text-xs">
      {/* Header & Controls */}
      <div className="p-3 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 font-semibold text-stone-100">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>레이어 관리</span>
          <span className="text-[10px] text-stone-400 font-normal">({layers.length})</span>
        </div>
        <div className="flex items-center space-x-0.5">
          <button
            id="btn-add-layer"
            onClick={onAddLayer}
            className="p-1.5 rounded hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
            title="새 레이어 추가"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            id="btn-duplicate-layer"
            onClick={() => onDuplicateLayer(activeLayerId)}
            className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            title="현재 레이어 복제"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-delete-layer"
            disabled={layers.length <= 1}
            onClick={() => onDeleteLayer(activeLayerId)}
            className={`p-1.5 rounded transition-colors ${
              layers.length > 1
                ? 'hover:bg-stone-800 text-stone-400 hover:text-rose-400'
                : 'text-stone-700 cursor-not-allowed'
            }`}
            title="현재 레이어 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onToggleCollapse && (
            <button
              id="btn-collapse-layers"
              onClick={onToggleCollapse}
              className="p-1.5 rounded hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-colors ml-1 border-l border-stone-800"
              title="레이어 패널 접기 (단축키: [)"
            >
              <PanelLeftClose className="w-3.5 h-3.5 text-orange-400" />
            </button>
          )}
        </div>
      </div>

      {/* Layer Stack (Rendered in reverse order: top layer on top) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {[...layers].reverse().map((layer, reverseIndex) => {
          const originalIndex = layers.length - 1 - reverseIndex;
          const isActive = layer.id === activeLayerId;
          const layerElements = elements.filter((el) => el.layerId === layer.id);

          return (
            <div
              key={layer.id}
              className={`group rounded-md border transition-all ${
                isActive
                  ? 'border-amber-500/50 bg-stone-800/80 shadow-sm'
                  : 'border-transparent hover:bg-stone-800/40 text-stone-400 hover:text-stone-200'
              }`}
            >
              {/* Layer Header Row */}
              <div
                onClick={() => onSelectLayer(layer.id)}
                className="p-2 flex items-center justify-between cursor-pointer space-x-1"
              >
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer({ ...layer, visible: !layer.visible });
                  }}
                  className={`p-1 rounded hover:bg-stone-700/50 ${
                    layer.visible ? 'text-stone-300' : 'text-stone-600'
                  }`}
                  title={layer.visible ? '레이어 숨기기' : '레이어 표시'}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Lock Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer({ ...layer, locked: !layer.locked });
                  }}
                  className={`p-1 rounded hover:bg-stone-700/50 ${
                    layer.locked ? 'text-amber-400' : 'text-stone-600 hover:text-stone-400'
                  }`}
                  title={layer.locked ? '레이어 잠금 해제' : '레이어 잠금'}
                >
                  {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                {/* Layer Name or Edit Input */}
                <div className="flex-1 px-1 min-w-0">
                  {editingLayerId === layer.id ? (
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(layer);
                          if (e.key === 'Escape') setEditingLayerId(null);
                        }}
                        autoFocus
                        className="w-full bg-stone-900 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white"
                      />
                      <button
                        onClick={() => handleSaveRename(layer)}
                        className="p-1 text-emerald-400 hover:bg-stone-700 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(layer);
                      }}
                      className="flex items-center space-x-1 truncate"
                    >
                      <span className={`truncate text-xs font-medium ${isActive ? 'text-white' : 'text-stone-300'}`}>
                        {layer.name}
                      </span>
                      <span className="text-[10px] text-stone-500">({layerElements.length})</span>
                    </div>
                  )}
                </div>

                {/* Reorder Up / Down */}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayerUp(layer.id);
                    }}
                    disabled={originalIndex === layers.length - 1}
                    className={`p-0.5 hover:text-white ${
                      originalIndex === layers.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    title="위로 이동"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayerDown(layer.id);
                    }}
                    disabled={originalIndex === 0}
                    className={`p-0.5 hover:text-white ${
                      originalIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    title="아래로 이동"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(layer);
                    }}
                    className="p-0.5 hover:text-amber-400 ml-0.5"
                    title="이름 바꾸기"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Elements within active layer */}
              {isActive && layerElements.length > 0 && (
                <div className="px-2 pb-2 pt-0.5 space-y-0.5">
                  {layerElements.map((el) => {
                    const isSelected = el.id === selectedElementId;
                    return (
                      <div
                        key={el.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectElement(el.id);
                        }}
                        className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 font-medium'
                            : 'hover:bg-stone-700/50 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {getElementIcon(el.type)}
                        <span className="truncate flex-1">
                          {el.name || (el.type === 'shape' ? (el as any).shapeType : el.type)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Layer Opacity Controller */}
      {activeLayer && (
        <div className="p-3 border-t border-stone-800 space-y-1.5 bg-stone-900/90">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>선택 레이어 불투명도</span>
            <span className="font-mono text-stone-200">{Math.round(activeLayer.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(activeLayer.opacity * 100)}
            onChange={(e) =>
              onUpdateLayer({ ...activeLayer, opacity: parseInt(e.target.value) / 100 })
            }
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      )}
    </aside>
  );
};
