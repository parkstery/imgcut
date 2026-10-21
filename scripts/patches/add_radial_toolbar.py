with open(r'C:\20.HDev\imgman\src\components\Toolbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add RotateCcw to imports
old_import = "import {\n  MousePointer,\n  Hand,\n  Paintbrush,\n  Highlighter,\n  Eraser,\n  Shapes,\n  Type,\n  Pipette,\n  PaintBucket,\n  Crop,\n  Square,\n  Circle,\n  Triangle,\n  Star,\n  ArrowRight,\n  MoveHorizontal,\n  MessageSquare,\n  Heart,\n  Hexagon,\n  Minus,\n  ArrowUpRight,\n  Waypoints,\n  Spline,\n  ChevronDown,\n  X,\n} from 'lucide-react';"

new_import = "import {\n  MousePointer,\n  Hand,\n  Paintbrush,\n  Highlighter,\n  Eraser,\n  Shapes,\n  Type,\n  Pipette,\n  PaintBucket,\n  Crop,\n  Square,\n  Circle,\n  Triangle,\n  Star,\n  ArrowRight,\n  MoveHorizontal,\n  MessageSquare,\n  Heart,\n  Hexagon,\n  Minus,\n  ArrowUpRight,\n  Waypoints,\n  Spline,\n  ChevronDown,\n  X,\n  RotateCcw,\n} from 'lucide-react';"

if old_import in content:
    content = content.replace(old_import, new_import)
    print("Added RotateCcw import")
else:
    print("Import pattern not found")

# Add radial tool button after crop button
old_crop_button = """{/* Crop Tool — always emphasized (frequently used) + reserved space on its right */}\n        <button\n          id=\"tool-crop\"\n          onClick={() => onSelectTool('crop')}\n          className={`p-2 rounded-md border transition-colors ${\n            currentTool === 'crop'\n              ? 'bg-amber-500 text-stone-950 font-bold shadow-md border-amber-400 ring-2 ring-amber-400/60'\n              : 'text-amber-300 bg-amber-500/15 border-amber-500/50 hover:bg-amber-500/30 hover:text-amber-100'\n          }`}\n          title=\"화면 영역 캡쳐 및 자르기 (Crop) - 드래그 후 Ctrl+C로 캡쳐 복사, Ctrl+V로 붙여넣기 (C)\"\n        >\n          <Crop className=\"w-4 h-4\" />\n        </button>\n\n        {/* Empty spacer (~1 button width) so the crop button stands out */}\n        <div className=\"w-9 shrink-0\" aria-hidden=\"true\" />"""

new_crop_button = """{/* Crop Tool — always emphasized (frequently used) + reserved space on its right */}\n        <button\n          id=\"tool-crop\"\n          onClick={() => onSelectTool('crop')}\n          className={`p-2 rounded-md border transition-colors ${\n            currentTool === 'crop'\n              ? 'bg-amber-500 text-stone-950 font-bold shadow-md border-amber-400 ring-2 ring-amber-400/60'\n              : 'text-amber-300 bg-amber-500/15 border-amber-500/50 hover:bg-amber-500/30 hover:text-amber-100'\n          }`}\n          title=\"화면 영역 캡쳐 및 자르기 (Crop) - 드래그 후 Ctrl+C로 캡쳐 복사, Ctrl+V로 붙여넣기 (C)\"\n        >\n          <Crop className=\"w-4 h-4\" />\n        </button>\n\n        {/* Radial Object Tool — create radial arrays of objects */}\n        <button\n          id=\"tool-radial\"\n          onClick={() => onSelectTool('radial')}\n          className={`p-2 rounded-md transition-colors ${\n            currentTool === 'radial'\n              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'\n              : 'text-stone-300 hover:text-white hover:bg-stone-800'\n          }`}\n          title=\"방사상 객체 생성 (Radial Array) — 중심점 기준 원형/부분 원형 반복 배치\"\n        >\n          <RotateCcw className=\"w-4 h-4\" />\n        </button>\n\n        {/* Empty spacer (~1 button width) so the crop button stands out */}\n        <div className=\"w-9 shrink-0\" aria-hidden=\"true\" />"""

if old_crop_button in content:
    content = content.replace(old_crop_button, new_crop_button)
    print("Added radial tool button to toolbar")
else:
    print("Crop button pattern not found")

with open(r'C:\20.HDev\imgman\src\components\Toolbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Toolbar done")