with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add radial tool props to PropertiesPanelProps interface
old_props_interface = """  onCutImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;\n  onCopyImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;\n  activeCropBox?: { x: number; y: number; w: number; h: number } | null;\n  onFitCanvasToContent?: () => void;\n  canFitCanvas?: boolean;\n  fitPreview?: string | null;\n}"""

new_props_interface = """  onCutImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;\n  onCopyImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;\n  activeCropBox?: { x: number; y: number; w: number; h: number } | null;\n  onFitCanvasToContent?: () => void;\n  canFitCanvas?: boolean;\n  fitPreview?: string | null;\n  // Radial Tool\n  radialToolState?: {\n    step: 'idle' | 'placing_center' | 'adjusting_radius' | 'preview';\n    center?: { x: number; y: number };\n    radius: number;\n    count: number;\n    startAngle: number;\n    sweepAngle: number;\n    rotateObjects: boolean;\n    sourceElement?: CanvasElement;\n    previewElements: CanvasElement[];\n  };\n  onRadialUpdateCount?: (count: number) => void;\n  onRadialUpdateSweepAngle?: (angle: number) => void;\n  onRadialToggleRotate?: (rotate: boolean) => void;\n  onRadialUpdateStartAngle?: (angle: number) => void;\n  onRadialConfirm?: () => void;\n  onRadialCancel?: () => void;\n}"""

if old_props_interface in content:
    content = content.replace(old_props_interface, new_props_interface)
    print("1. Added radial tool props to PropertiesPanelProps")
else:
    print("1. Props interface pattern not found")

# 2. Update the component destructuring
old_destructure = """export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({\n  selectedElement,\n  onUpdateElement,\n  onDuplicateElement,\n  onDeleteElement,\n  onBringForward,\n  onSendBackward,\n  onBringToFront,\n  onSendToBack,\n  onAlign,\n  config,\n  onUpdateConfig,\n  isOpen = true,\n  onToggleCollapse,\n  croppingImageId,\n  onStartCropImage,\n  onApplyCropImage,\n  onCancelCropImage,\n  onCutImagePart,\n  onCopyImagePart,\n  activeCropBox,\n  onFitCanvasToContent,\n  canFitCanvas = false,\n  fitPreview = null,\n}) => {"""

new_destructure = """export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({\n  selectedElement,\n  onUpdateElement,\n  onDuplicateElement,\n  onDeleteElement,\n  onBringForward,\n  onSendBackward,\n  onBringToFront,\n  onSendToBack,\n  onAlign,\n  config,\n  onUpdateConfig,\n  isOpen = true,\n  onToggleCollapse,\n  croppingImageId,\n  onStartCropImage,\n  onApplyCropImage,\n  onCancelCropImage,\n  onCutImagePart,\n  onCopyImagePart,\n  activeCropBox,\n  onFitCanvasToContent,\n  canFitCanvas = false,\n  fitPreview = null,\n  // Radial Tool\n  radialToolState,\n  onRadialUpdateCount,\n  onRadialUpdateSweepAngle,\n  onRadialToggleRotate,\n  onRadialUpdateStartAngle,\n  onRadialConfirm,\n  onRadialCancel,\n}) => {"""

if old_destructure in content:
    content = content.replace(old_destructure, new_destructure)
    print("2. Updated PropertiesPanel destructuring")
else:
    print("2. Destructuring pattern not found")

# 3. Add the radial tool UI panel after TEXT SPECIFIC PROPERTIES marker
marker = '{/* TEXT SPECIFIC PROPERTIES */}'
idx = content.find(marker)
if idx >= 0:
    radial_ui = '''\n      {/* Radial Tool Properties */}\n      {radialToolState && radialToolState.step !== 'idle' && (\n        <PropertyGroup title=\"방사상 배열 설정\">\n          <div className=\"space-y-3\">\n            <div className=\"flex items-center space-x-2\">\n              <span className=\"text-[10px] text-stone-400 shrink-0 w-12\">개수</span>\n              <input\n                type=\"number\"\n                min=\"2\"\n                max=\"50\"\n                value={radialToolState.count}\n                onChange={(e) => onRadialUpdateCount?.(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}\n                className=\"flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500\"\n              />\n            </div>\n            <div className=\"flex items-center space-x-2\">\n              <span className=\"text-[10px] text-stone-400 shrink-0 w-12\">전체 각도</span>\n              <input\n                type=\"number\"\n                min=\"0\"\n                max=\"360\"\n                value={radialToolState.sweepAngle}\n                onChange={(e) => onRadialUpdateSweepAngle?.(Math.max(0, Math.min(360, parseInt(e.target.value) || 0)))}\n                className=\"flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500\"\n                />\n              <span className=\"text-stone-400 text-xs\">도</span>\n            </div>\n            <div className=\"flex items-center space-x-2\">\n              <span className=\"text-[10px] text-stone-400 shrink-0 w-12\">시작 각도</span>\n              <input\n                type=\"number\"\n                min=\"0\"\n                max=\"359\"\n                value={radialToolState.startAngle}\n                onChange={(e) => onRadialUpdateStartAngle?.(((parseInt(e.target.value) || 0) % 360 + 360) % 360)}\n                className=\"flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono text-xs focus:border-amber-500\"\n                />\n              <span className=\"text-stone-400 text-xs\">도</span>\n            </div>\n            <label className=\"flex items-center gap-2 cursor-pointer select-none text-[11px] text-stone-300\">\n              <input\n                type=\"checkbox\"\n                checked={radialToolState.rotateObjects}\n                onChange={(e) => onRadialToggleRotate?.(e.target.checked)}\n                className=\"accent-amber-500 w-3.5 h-3.5\"\n              />\n              <span>객체 회전 (방사형)</span>\n            </label>\n            <div className=\"flex items-center space-x-2 pt-2\">\n              <button\n                onClick={onRadialConfirm}\n                className=\"flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all\"\n              >\n                적용\n              </button>\n              <button\n                onClick={onRadialCancel}\n                className=\"flex-1 py-1.5 rounded border border-stone-700 text-stone-300 hover:border-stone-500 hover:bg-stone-800 text-xs font-medium transition-colors\"\n              >\n                취소\n              </button>\n            </div>\n          </div>\n        </PropertyGroup>\n      )}\n\n'''

    if idx >= 0:
        content = content[:idx] + radial_ui + content[idx:]
        print("3. Added radial tool UI panel to PropertiesPanel")
    else:
        print("3. Marker not found")
else:
    print("3. TEXT SPECIFIC PROPERTIES marker not found")

with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nPropertiesPanel.tsx done")