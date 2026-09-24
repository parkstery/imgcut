import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'V', desc: '선택 및 이동 도구' },
  { key: 'H / Space + 드래그', desc: '손(화면 이동 / 팬) 도구' },
  { key: 'B', desc: '자유 브러시 / 펜 드로잉' },
  { key: 'Y', desc: '형광펜 도구' },
  { key: 'E', desc: '지우개 도구 (전용 커서)' },
  { key: 'U', desc: '도형 그리기 도구 (연속 드로잉)' },
  { key: 'T', desc: '텍스트 상자 도구' },
  { key: 'K', desc: '스포이트 색상 추출' },
  { key: 'G', desc: '페인트통 / 채우기' },
  { key: 'C', desc: '자르기/캡쳐 도구 (드래그로 화면 영역 지정)' },
  { key: 'Ctrl + X', desc: '드래그 영역 또는 선택 객체 오리기' },
  { key: 'Ctrl + C', desc: '드래그 영역 또는 선택 객체 복사' },
  { key: 'Ctrl + V', desc: '오리기/복사한 이미지 또는 객체 붙여넣기' },
  { key: 'Enter', desc: '캔버스 또는 이미지 자르기 완료' },
  { key: 'Esc', desc: '자르기 작업 취소' },
  { key: '[', desc: '왼쪽 레이어 패널 접기 / 펼치기' },
  { key: ']', desc: '오른쪽 속성 패널 접기 / 펼치기' },
  { key: '드래그 / Shift+클릭', desc: '여러 개체 다중 선택' },
  { key: 'Ctrl + Z', desc: '실행 취소 (Undo)' },
  { key: 'Ctrl + Y / Ctrl+Shift+Z', desc: '다시 실행 (Redo)' },
  { key: '방향키 (↑ ↓ ← →)', desc: '선택 개체 1px 미세 이동' },
  { key: 'Shift + 방향키', desc: '선택 개체 10px 빠른 이동' },
  { key: 'Ctrl + D', desc: '선택한 개체 복제' },
  { key: 'Delete / Backspace', desc: '선택한 개체 삭제' },
  { key: 'Ctrl + 마우스 휠', desc: '캔버스 확대 / 축소' },
  { key: 'Shift + 드래그', desc: '도형 정비율(1:1) / 직선 각도스냅' },
];

export const ShortcutsGuideModal: React.FC<ShortcutsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full p-6 text-stone-200 select-none">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-stone-100">단축키 안내 (Keyboard Shortcuts)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 py-4 text-xs max-h-96 overflow-y-auto">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded bg-stone-800/40 border border-stone-800"
            >
              <span className="text-stone-400 text-[11px]">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-amber-300 font-mono text-[10px] font-bold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-white"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
