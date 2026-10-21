with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find pushHistory end
idx = content.find('const pushHistory = useCallback')
if idx >= 0:
    paren = 0
    brace = 0
    i = idx
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
        if paren == 0 and brace == 0 and i > idx:
            insert_pos = i + 1
            break
        i += 1
else:
    insert_pos = 0

if insert_pos:
    new_callbacks = "\n\n"
    new_callbacks += "  const handleRadialConfirm = useCallback(() => {\n"
    new_callbacks += "    setRadialToolState((prev) => {\n"
    new_callbacks += "      if (!prev.center || prev.count < 2) return prev;\n"
    new_callbacks += "      const cx = prev.center.x;\n"
    new_callbacks += "      const cy = prev.center.y;\n"
    new_callbacks += "      const radius = prev.radius;\n"
    new_callbacks += "      const count = Math.max(2, Math.min(50, prev.count));\n"
    new_callbacks += "      const sweep = Math.max(0, Math.min(360, prev.sweepAngle));\n"
    new_callbacks += "      const start = prev.startAngle;\n"
    new_callbacks += "      const rotate = prev.rotateObjects;\n"
    new_callbacks += "      const source = prev.sourceElement;\n"
    new_callbacks += "      let baseW = 50;\n"
    new_callbacks += "      let baseH = 50;\n"
    new_callbacks += "      let baseRotation = 0;\n"
    new_callbacks += "      let fillColor = '#FF0000';\n"
    new_callbacks += "      let strokeColor = '#FF0000';\n"
    new_callbacks += "      let strokeW = 2;\n"
    new_callbacks += "      let shapeType: ShapeType = 'ellipse';\n"
    new_callbacks += "      let points: Point[] | undefined;\n"
    new_callbacks += "\n"
    new_callbacks += "      if (source) {\n"
    new_callbacks += "        baseW = source.width;\n"
    new_callbacks += "        baseH = source.height;\n"
    new_callbacks += "        baseRotation = source.rotation || 0;\n"
    new_callbacks += "        fillColor = source.type === 'shape' ? source.fill : '#FF0000';\n"
    new_callbacks += "        strokeColor = source.type === 'shape' ? source.stroke : '#FF0000';\n"
    new_callbacks += "        strokeW = source.type === 'shape' ? source.strokeWidth : 2;\n"
    new_callbacks += "        if (source.type === 'shape') {\n"
    new_callbacks += "          shapeType = source.shapeType;\n"
    new_callbacks += "          points = source.points;\n"
    new_callbacks += "        } else if (source.type === 'text') {\n"
    new_callbacks += "          shapeType = 'rect';\n"
    new_callbacks += "        } else if (source.type === 'image') {\n"
    new_callbacks += "          shapeType = 'ellipse';\n"
    new_callbacks += "        }\n"
    new_callbacks += "      }\n"
    new_callbacks += "\n"
    new_callbacks += "      const preview: CanvasElement[] = [];\n"
    new_callbacks += "      let angleStep = sweep / (count - 1);\n"
    new_callbacks += "      if (sweep >= 360 && count > 1) {\n"
    new_callbacks += "        angleStep = 360 / count;\n"
    new_callbacks += "      }\n"
    new_callbacks += "      for (let i = 0; i < count; i++) {\n"
    new_callbacks += "        const theta = start + angleStep * i;\n"
    new_callbacks += "        const rad = (theta * Math.PI) / 180;\n"
    new_callbacks += "        const px = cx + radius * Math.cos(rad);\n"
    new_callbacks += "        const py = cy + radius * Math.sin(rad);\n"
    new_callbacks += "\n"
    new_callbacks += "        let rot = baseRotation;\n"
    new_callbacks += "        if (rotate) {\n"
    new_callbacks += "          rot = theta + 90;\n"
    new_callbacks += "        }\n"
    new_callbacks += "\n"
    new_callbacks += "        const newEl: CanvasElement = {\n"
    new_callbacks += "          id: 'radial-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 7),\n"
    new_callbacks += "          layerId: activeLayerId,\n"
    new_callbacks += "          name: (source?.name || '도형') + ' (미리보기 ' + (i + 1) + ')',\n"
    new_callbacks += "          type: source?.type || 'shape',\n"
    new_callbacks += "          x: px - baseW / 2,\n"
    new_callbacks += "          y: py - baseH / 2,\n"
    new_callbacks += "          width: baseW,\n"
    new_callbacks += "          height: baseH,\n"
    new_callbacks += "          rotation: rot,\n"
    new_callbacks += "          opacity: source?.opacity ?? 1,\n"
    new_callbacks += "          flipH: source?.flipH,\n"
    new_callbacks += "          flipV: source?.flipV,\n"
    new_callbacks += "          shadow: source?.shadow,\n"
    new_callbacks += "          ...(source?.type === 'shape'\n"
    new_callbacks += "            ? {\n"
    new_callbacks += "                shapeType,\n"
    new_callbacks += "                fill: fillColor,\n"
    new_callbacks += "                stroke: strokeColor,\n"
    new_callbacks += "                strokeWidth: strokeW,\n"
    new_callbacks += "                strokeDash: source.strokeDash || 'solid',\n"
    new_callbacks += "                cornerRadius: source.cornerRadius,\n"
    new_callbacks += "                gradient: source.gradient,\n"
    new_callbacks += "                points,\n"
    new_callbacks += "              }\n"
    new_callbacks += "            : source?.type === 'text'\n"
    new_callbacks += "            ? {\n"
    new_callbacks += "                text: source.text,\n"
    new_callbacks += "                fontFamily: source.fontFamily,\n"
    new_callbacks += "                fontSize: source.fontSize,\n"
    new_callbacks += "                color: source.color,\n"
    new_callbacks += "                bold: source.bold,\n"
    new_callbacks += "                italic: source.italic,\n"
    new_callbacks += "                underline: source.underline,\n"
    new_callbacks += "                align: source.align,\n"
    new_callbacks += "                backgroundColor: source.backgroundColor,\n"
    new_callbacks += "              }\n"
    new_callbacks += "            : source?.type === 'brush'\n"
    new_callbacks += "            ? {\n"
    new_callbacks += "                points: source.points,\n"
    new_callbacks += "                color: source.color,\n"
    new_callbacks += "                strokeWidth: source.strokeWidth,\n"
    new_callbacks += "                isHighlighter: source.isHighlighter,\n"
    new_callbacks += "              }\n"
    new_callbacks += "            : source?.type === 'image'\n"
    new_callbacks += "            ? {\n"
    new_callbacks += "                src: source.src,\n"
    new_callbacks += "                naturalWidth: source.naturalWidth,\n"
    new_callbacks += "                naturalHeight: source.naturalHeight,\n"
    new_callbacks += "                filters: source.filters,\n"
    new_callbacks += "                lockAspectRatio: source.lockAspectRatio,\n"
    new_callbacks += "                cornerRadius: source.cornerRadius,\n"
    new_callbacks += "                borderWidth: source.borderWidth,\n"
    new_callbacks += "                borderColor: source.borderColor,\n"
    new_callbacks += "              }\n"
    new_callbacks += "            : {}),\n"
    new_callbacks += "        } as CanvasElement;\n"
    new_callbacks += "        preview.push(newEl);\n"
    new_callbacks += "      }\n"
    new_callbacks += "\n"
    new_callbacks += "      const nextElements = [...elements, ...preview];\n"
    new_callbacks += "      setElements(nextElements);\n"
    new_callbacks += "      setSelectedElementIds(preview.map((e) => e.id));\n"
    new_callbacks += "      pushHistory(nextElements, layers, config);\n"
    new_callbacks += "      showToast(preview.length + '개 객체로 방사상 배열이 생성되었습니다.');\n"
    new_callbacks += "      return { ...prev, step: 'idle', previewElements: [], sourceElement: undefined };\n"
    new_callbacks += "    });\n"
    new_callbacks += "  }, [elements, layers, config, pushHistory, showToast]);\n"
    new_callbacks += "\n\n"
    new_callbacks += "  const handleRadialCancel = useCallback(() => {\n"
    new_callbacks += "    setRadialToolState({\n"
    new_callbacks += "      step: 'idle',\n"
    new_callbacks += "      radius: 100,\n"
    new_callbacks += "      count: 8,\n"
    new_callbacks += "      startAngle: 0,\n"
    new_callbacks += "      sweepAngle: 360,\n"
    new_callbacks += "      rotateObjects: false,\n"
    new_callbacks += "      previewElements: [],\n"
    new_callbacks += "    });\n"
    new_callbacks += "    showToast('방사상 도구가 취소되었습니다.');\n"
    new_callbacks += "  }, [showToast]);\n"

    content = content[:insert_pos] + "\n\n" + new_callbacks + "\n" + content[insert_pos:]
    print("Inserted callbacks")
else:
    print("Could not find pushHistory end")

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")