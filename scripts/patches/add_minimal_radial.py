with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with "const toggleLeftPanel = useCallback(() => {"
for i, line in enumerate(lines):
    if 'const toggleLeftPanel = useCallback(() => {' in line:
        insert_idx = i
        break

# Minimal radial code - just state and simple handlers
radial_code = [
    '\n',
    '  // Radial Object Tool State\n',
    '  const [radialToolState, setRadialToolState] = useState<{\n',
    '    step: \'idle\' | \'placing_center\' | \'adjusting_radius\' | \'preview\';\n',
    '    center?: { x: number; y: number };\n',
    '    radius: number;\n',
    '    count: number;\n',
    '    startAngle: number;\n',
    '    sweepAngle: number;\n',
    '    rotateObjects: boolean;\n',
    '    sourceElement?: CanvasElement;\n',
    '    previewElements: CanvasElement[];\n',
    '  }>({\n',
    '    step: \'idle\',\n',
    '    radius: 100,\n',
    '    count: 8,\n',
    '    startAngle: 0,\n',
    '    sweepAngle: 360,\n',
    '    rotateObjects: false,\n',
    '    previewElements: [],\n',
    '  });\n',
    '\n',
    '  const handleRadialStart = useCallback(() => {\n',
    '    let source: CanvasElement | undefined;\n',
    '    if (selectedElementId) {\n',
    '      source = elements.find((e) => e.id === selectedElementId);\n',
    '    }\n',
    '    setRadialToolState({\n',
    '      step: \'placing_center\',\n',
    '      radius: 100,\n',
    '      count: 8,\n',
    '      startAngle: 0,\n',
    '      sweepAngle: 360,\n',
    '      rotateObjects: false,\n',
    '      sourceElement: source,\n',
    '      previewElements: [],\n',
    '    });\n',
    '    showToast(\'캔버스를 클릭하여 중심점을 지정하세요. 드래그로 반지름 조정, Shift로 15도 각도 스냅\');\n',
    '  }, [selectedElementId, elements, showToast]);\n',
    '\n',
    '  const handleRadialCancel = useCallback(() => {\n',
    '    setRadialToolState({\n',
    '      step: \'idle\',\n',
    '      radius: 100,\n',
    '      count: 8,\n',
    '      startAngle: 0,\n',
    '      sweepAngle: 360,\n',
    '      rotateObjects: false,\n',
    '      previewElements: [],\n',
    '    });\n',
    '    showToast(\'방사상 도구가 취소되었습니다.\');\n',
    '  }, [showToast]);\n',
    '\n',
]

# Insert the radial code before toggleLeftPanel
new_lines = lines[:insert_idx] + radial_code + lines[insert_idx:]

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Added minimal radial tool state and handlers')