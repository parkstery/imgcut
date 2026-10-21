with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the marker for TEXT SPECIFIC PROPERTIES
marker = '{/* TEXT SPECIFIC PROPERTIES */}'
idx = content.find(marker)

if idx >= 0:
    radial_ui = '''
      {/* Radial Tool Properties */}
      {radialToolState && radialToolState.step !== 'idle' && (
        <PropertyGroup title="방사상 배열 설정">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-stone-400 shrink-0 w-12">개수</span>
              <input
                type="number"
                min="2"
                max="50"
                value={radialToolState.count}
                onChange={(e) => onRadialUpdateCount?.(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
                className="flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-stone-400 shrink-0 w-12">전체 각도</span>
              <input
                type="number"
                min="0"
                max="360"
                value={radialToolState.sweepAngle}
                onChange={(e) => onRadialUpdateSweepAngle?.(Math.max(0, Math.min(360, parseInt(e.target.value) || 0)))}
                className="flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
              />
              <span className="text-stone-400 text-xs">도</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-stone-400 shrink-0 w-12">시작 각도</span>
              <input
                type="number"
                min="0"
                max="359"
                value={radialToolState.startAngle}
                onChange={(e) => onRadialUpdateStartAngle?.(((parseInt(e.target.value) || 0) % 360 + 360) % 360)}
                className="flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
              />
              <span className="text-stone-400 text-xs">도</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-stone-300">
              <input
                type="checkbox"
                checked={radialToolState.rotateObjects}
                onChange={(e) => onRadialToggleRotate?.(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5"
              />
              <span>객체 회전 (방사형)</span>
            </label>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={onRadialConfirm}
                className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                적용
              </button>
              <button
                onClick={onRadialCancel}
                className="flex-1 py-1.5 rounded border border-stone-700 text-stone-300 hover:border-stone-500 hover:bg-stone-800 text-xs font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </PropertyGroup>
      )}

'''
    if idx >= 0:
        content = content[:idx] + radial_ui + content[idx:]
        with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Added radial tool UI panel to PropertiesPanel')
    else:
        print('Marker not found')