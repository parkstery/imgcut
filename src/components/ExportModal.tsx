import React, { useState, useEffect } from 'react';
import {
  Layer,
  CanvasElement,
  CanvasConfig,
} from '../types';
import { generateSVGString, downloadSVGFile } from '../utils/svgExport';
import { exportToRaster, downloadDataUrl } from '../utils/rasterExport';
import { X, Download, FileCode, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  elements: CanvasElement[];
  config: CanvasConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  layers,
  elements,
  config,
}) => {
  const [format, setFormat] = useState<'svg' | 'png' | 'jpeg'>('svg');
  const [scale, setScale] = useState<number>(1);
  const [transparent, setTransparent] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>('vector-studio-drawing');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Generate a live preview when modal opens or settings change
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function updatePreview() {
      try {
        const url = await exportToRaster(
          layers,
          elements,
          config,
          'png',
          Math.min(1, 400 / config.width),
          transparent
        );
        if (!isCancelled) {
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error('Preview error:', err);
      }
    }

    updatePreview();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, layers, elements, config, transparent]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const baseName = filename.trim() || 'drawing';
      if (format === 'svg') {
        const svgStr = generateSVGString(layers, elements, config, transparent);
        downloadSVGFile(svgStr, `${baseName}.svg`);
      } else {
        const dataUrl = await exportToRaster(
          layers,
          elements,
          config,
          format,
          scale,
          transparent,
          0.92
        );
        downloadDataUrl(dataUrl, `${baseName}.${format}`);
      }
      onClose();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const outputWidth = config.width * scale;
  const outputHeight = config.height * scale;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl max-w-xl w-full p-6 text-stone-200 select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100">그래픽 내보내기 (Export)</h2>
              <p className="text-xs text-stone-400">벡터 SVG 및 고해상도 이미지 포맷 지원</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5">
          {/* Left: Format & Settings */}
          <div className="space-y-4 text-xs">
            {/* Format Picker */}
            <div>
              <label className="text-stone-300 font-medium block mb-2">포맷 선택</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFormat('svg')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    format === 'svg'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold ring-1 ring-amber-500/40'
                      : 'border-stone-800 hover:border-stone-700 text-stone-400'
                  }`}
                >
                  <FileCode className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <span>SVG (벡터)</span>
                </button>

                <button
                  onClick={() => setFormat('png')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    format === 'png'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold ring-1 ring-amber-500/40'
                      : 'border-stone-800 hover:border-stone-700 text-stone-400'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span>PNG (비트맵)</span>
                </button>

                <button
                  onClick={() => setFormat('jpeg')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    format === 'jpeg'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold ring-1 ring-amber-500/40'
                      : 'border-stone-800 hover:border-stone-700 text-stone-400'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <span>JPEG (사진)</span>
                </button>
              </div>
            </div>

            {/* Resolution Scale (for PNG/JPEG) */}
            {format !== 'svg' && (
              <div>
                <label className="text-stone-300 font-medium block mb-1">해상도 배율</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '1x (표준)', val: 1 },
                    { label: '2x (고화질)', val: 2 },
                    { label: '3x (인쇄용)', val: 3 },
                  ].map((s) => (
                    <button
                      key={s.val}
                      onClick={() => setScale(s.val)}
                      className={`py-1.5 px-2 rounded border text-center text-[11px] ${
                        scale === s.val
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-medium'
                          : 'border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  출력 해상도: {outputWidth} × {outputHeight} px
                </p>
              </div>
            )}

            {/* Transparent background toggle */}
            {format !== 'jpeg' && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="chk-transparent"
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chk-transparent" className="text-stone-300 cursor-pointer">
                  배경 투명하게 내보내기 (Transparent)
                </label>
              </div>
            )}

            {/* File Name */}
            <div>
              <label className="text-stone-300 font-medium block mb-1">파일명</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="flex-1 bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 focus:border-amber-500 text-xs"
                />
                <span className="text-stone-400 font-mono text-xs">.{format}</span>
              </div>
            </div>

            {/* Format Info callout */}
            <div className="p-2.5 rounded bg-stone-800/60 border border-stone-700/60 text-[11px] text-stone-400">
              {format === 'svg' && (
                <p className="flex items-start space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    SVG는 무한 확대해도 깨지지 않는 순수 벡터 그래픽으로, 일러스트레이터, 피그마, PPT 등에서 자유롭게 편집 가능합니다.
                  </span>
                </p>
              )}
              {format === 'png' && (
                <p>무손실 압축 포맷으로 투명 배경을 지원하며 그래픽, 로고, 아이콘에 적합합니다.</p>
              )}
              {format === 'jpeg' && (
                <p>사진 및 배경이 포함된 이미지에 최적화된 고압축 래스터 포맷입니다.</p>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex flex-col items-center justify-center bg-stone-950/80 rounded-lg p-3 border border-stone-800">
            <span className="text-[11px] text-stone-400 mb-2 font-medium">내보내기 미리보기</span>
            <div
              className={`w-full h-44 rounded border border-stone-800 flex items-center justify-center overflow-hidden ${
                transparent ? 'bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:8px_8px]' : 'bg-white'
              }`}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Export preview"
                  className="max-w-full max-h-full object-contain shadow-sm"
                />
              ) : (
                <span className="text-stone-500 text-xs">미리보기 로딩 중...</span>
              )}
            </div>
            <span className="text-[10px] text-stone-500 mt-2 font-mono">
              {config.width} × {config.height} px ({layers.length}개 레이어, {elements.length}개 개체)
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            취소
          </button>
          <button
            id="btn-confirm-export"
            disabled={isGenerating}
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGenerating ? '생성 중...' : '파일 다운로드'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
