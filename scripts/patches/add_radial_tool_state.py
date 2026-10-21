with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find the exact insertion point: after handleSelectTool and before toggleLeftPanel
handle_select_start = content.find('const handleSelectTool = useCallback')
if handle_select_start < 0:
    print('Could not find handleSelectTool')
    exit(1)

# Find toggleLeftPanel after handleSelectTool
toggle_left_start = content.find('const toggleLeftPanel = useCallback', handle_select_start)
if toggle_left_start < 0:
    print('Could not find toggleLeftPanel after handleSelectTool')
    exit(1)

# Find pushHistory after toggleLeftPanel
push_history_start = content.find('const pushHistory = useCallback', toggle_left_start)
if push_history_start < 0:
    print('Could not find pushHistory after toggleLeftPanel')
    exit(1)

# Find the end of pushHistory
paren = 0
brace = 0
i = push_history_start
while i < len(content):
    c = content[i]
    if c == '(':
        paren += 1
    elif c == ')':
        paren -= 1
    elif c == '{':
        brace += 1
    elif c == '}':
        brace -= 1
    if paren == 0 and brace == 0 and i > push_history_start:
        insert_pos = i + 1
        break
    i += 1
else:
    print('Could not find end of pushHistory')
    exit(1)

# The radial tool state section to insert
radial_state_section = '''  // Radial Object Tool State
  const [radialToolState, setRadialToolState] = useState<{\n    step: 'idle' | 'placing_center' | 'adjusting_radius' | 'preview';\n    center?: { x: number; y: number };\n    radius: number;\n    count: number;\n    startAngle: number;\n    sweepAngle: number;\n    rotateObjects: boolean;\n    sourceElement?: CanvasElement;\n    previewElements: CanvasElement[];\n  }>({\n    step: 'idle',\n    radius: 100,\n    count: 8,\n    startAngle: 0,\n    sweepAngle: 360,\n    rotateObjects: false,\n    previewElements: [],\n  });\n\n  const handleRadialStart = useCallback(() => {\n    let source: CanvasElement | undefined;\n    if (selectedElementId) {\n      source = elements.find((e) => e.id === selectedElementId);\n    }\n    setRadialToolState({\n      step: 'placing_center',\n      radius: 100,\n      count: 8,\n      startAngle: 0,\n      sweepAngle: 360,\n      rotateObjects: false,\n      sourceElement: source,\n      previewElements: [],\n    });\n    showToast('캔버스를 클릭하여 중심점을 지정하세요. 드래그로 반지름 조정, Shift로 15도 각도 스냅');\n  }, [selectedElementId, elements, showToast]);\n\n  const handleRadialSetCenter = useCallback((x: number, y: number) => {\n    setRadialToolState((prev) => ({\n      ...prev,\n      step: 'adjusting_radius',\n      center: { x, y },\n      previewElements: [],\n    }));\n  }, []);\n\n  const handleRadialUpdateRadius = useCallback(\n    (radius: number, angle?: number) => {\n      setRadialToolState((prev) => ({\n        ...prev,\n        radius,\n        startAngle: angle ?? prev.startAngle,\n      }));\n  }, []);\n\n  const handleRadialConfirm = useCallback(() => {\n    setRadialToolState((prev) => {\n      if (!prev.center || prev.count < 2) return prev;\n      const cx = prev.center.x;\n      const cy = prev.center.y;\n      const radius = prev.radius;\n      const count = Math.max(2, Math.min(50, prev.count));\n      const sweep = Math.max(0, Math.min(360, prev.sweepAngle));\n      const start = prev.startAngle;\n      const rotate = prev.rotateObjects;\n      const source = prev.sourceElement;\n      let baseW = 50;\n      let baseH = 50;\n      let baseRotation = 0;\n      let fillColor = '#FF0000';\n      let strokeColor = '#FF0000';\n      let strokeW = 2;\n      let shapeType: ShapeType = 'ellipse';\n      let points: Point[] | undefined;\n\n      if (source) {\n        baseW = source.width;\n        baseH = source.height;\n        baseRotation = source.rotation || 0;\n        fillColor = source.type === 'shape' ? source.fill : '#FF0000';\n        strokeColor = source.type === 'shape' ? source.stroke : '#FF0000';\n        strokeW = source.type === 'shape' ? source.strokeWidth : 2;\n        if (source.type === 'shape') {\n          shapeType = source.shapeType;\n          points = source.points;\n        } else if (source.type === 'text') {\n          shapeType = 'rect';\n        } else if (source.type === 'image') {\n          shapeType = 'ellipse';\n        }\n      }\n\n      const preview: CanvasElement[] = [];\n      let angleStep = sweep / (count - 1);\n      if (sweep >= 360 && count > 1) {\n        angleStep = 360 / count;\n      }\n      for (let i = 0; i < count; i++) {\n        const theta = start + angleStep * i;\n        const rad = (theta * Math.PI) / 180;\n        const px = cx + radius * Math.cos(rad);\n        const py = cy + radius * Math.sin(rad);\n\n        let rot = baseRotation;\n        if (rotate) {\n          rot = theta + 90;\n        }\n\n        const newEl: CanvasElement = {\n          id: 'radial-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 7),\n          layerId: activeLayerId,\n          name: (source?.name || '도형') + ' (미리보기 ' + (i + 1) + ')',\n          type: source?.type || 'shape',\n          x: px - baseW / 2,\n          y: py - baseH / 2,\n          width: baseW,\n          height: baseH,\n          rotation: rot,\n          opacity: source?.opacity ?? 1,\n          flipH: source?.flipH,\n          flipV: source?.flipV,\n          shadow: source?.shadow,\n          ...(source?.type === 'shape'\n            ? {\n              shapeType,\n              fill: fillColor,\n              stroke: strokeColor,\n              strokeWidth: strokeW,\n              strokeDash: source.strokeDash || 'solid',\n              cornerRadius: source.cornerRadius,\n              gradient: source.gradient,\n              points,\n            }\n            : source?.type === 'text'\n            ? {\n              text: source.text,\n              fontFamily: source.fontFamily,\n              fontSize: source.fontSize,\n              color: source.color,\n              bold: source.bold,\n              italic: source.italic,\n              underline: source.underline,\n              align: source.align,\n              backgroundColor: source.backgroundColor,\n            }\n            : source?.type === 'brush'\n            ? {\n              points: source.points,\n              color: source.color,\n              strokeWidth: source.strokeWidth,\n              isHighlighter: source.isHighlighter,\n            }\n            : source?.type === 'image'\n            ? {\n              src: source.src,\n              naturalWidth: source.naturalWidth,\n              naturalHeight: source.naturalHeight,\n              filters: source.filters,\n              lockAspectRatio: source.lockAspectRatio,\n              cornerRadius: source.cornerRadius,\n              borderWidth: source.borderWidth,\n              borderColor: source.borderColor,\n            }\n            : {}),\n        } as CanvasElement;\n        preview.push(newEl);\n      }\n\n      const nextElements = [...elements, ...preview];\n      setElements(nextElements);\n      setSelectedElementIds(preview.map((e) => e.id));\n      pushHistory(nextElements, layers, config);\n      showToast(preview.length + '개 객체로 방사상 배열이 생성되었습니다.');\n      return { ...prev, step: 'idle', previewElements: [], sourceElement: undefined };\n    });\n  }, [elements, layers, config, pushHistory, showToast]);\n\n  const handleRadialCancel = useCallback(() => {\n    setRadialToolState({\n      step: 'idle',\n      radius: 100,\n      count: 8,\n      startAngle: 0,\n      sweepAngle: 360,\n      rotateObjects: false,\n      previewElements: [],\n    });\n    showToast('방사상 도구가 취소되었습니다.');\n  }, [showToast]);\n\n'''

# Insert the radial tool state section after handleSelectTool and before toggleLeftPanel
content = content[:toggle_left_start] + radial_state_section + content[toggle_left_start:]

with open(r'C:\\20.HDev\\imgman\\src\\App.tsx', 'w', encoding='utf-8', errors='replace') as f:
    f.write(content)

print('Radial tool state added to App.tsx')