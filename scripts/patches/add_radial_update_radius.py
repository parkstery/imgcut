with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with "const handleRadialSetCenter = useCallback"
for i, line in enumerate(lines):
    if 'const handleRadialSetCenter = useCallback' in line:
        # Find the end of this function
        j = i
        brace_count = 0
        while j < len(lines):
            for c in lines[j]:
                if c == '{':
                    brace_count += 1
                elif c == '}':
                    brace_count -= 1
            if brace_count == 0:
                insert_idx = j + 1
                break
            j += 1
        break

# Add handleRadialUpdateRadius
radial_update_radius = [
    '\n',
    '  const handleRadialUpdateRadius = useCallback(\n',
    '    (radius: number, angle?: number) => {\n',
    '      setRadialToolState((prev) => {\n',
    '        if (!prev.center || prev.count < 2) return prev;\n',
    '        const cx = prev.center.x;\n',
    '        const cy = prev.center.y;\n',
    '        const count = Math.max(2, Math.min(50, prev.count));\n',
    '        const sweep = Math.max(0, Math.min(360, prev.sweepAngle));\n',
    '        const start = prev.startAngle;\n',
    '        const rotate = prev.rotateObjects;\n',
    '\n',
    '        // Calculate positions\n',
    '        const preview: CanvasElement[] = [];\n',
    '        const source = prev.sourceElement;\n',
    '        let baseW = 50;\n',
    '        let baseH = 50;\n',
    '        let baseRotation = 0;\n',
    '        let fillColor = \'#FF0000\';\n',
    '        let strokeColor = \'#FF0000\';\n',
    '        let strokeW = 2;\n',
    '        let shapeType: ShapeType = \'ellipse\';\n',
    '        let points: Point[] | undefined;\n',
    '\n',
    '        if (source) {\n',
    '          baseW = source.width;\n',
    '        baseH = source.height;\n',
    '        baseRotation = source.rotation || 0;\n',
    '        fillColor = source.type === \'shape\' ? source.fill : \'#FF0000\';\n',
    '        strokeColor = source.type === \'shape\' ? source.stroke : \'#FF0000\';\n',
    '        strokeW = source.type === \'shape\' ? source.strokeWidth : 2;\n',
    '        if (source.type === \'shape\') {\n',
    '          shapeType = source.shapeType;\n',
    '          points = source.points;\n',
    '        } else if (source.type === \'text\') {\n',
    '          shapeType = \'rect\';\n',
    '        } else if (source.type === \'image\') {\n',
    '          shapeType = \'ellipse\';\n',
    '        }\n',
    '        }\n',
    '\n',
    '        // Generate preview elements\n',
    '        let angleStep = sweep / (count - 1);\n',
    '        if (sweep >= 360 && count > 1) {\n',
    '          angleStep = 360 / count;\n',
    '        }\n',
    '        for (let i = 0; i < count; i++) {\n',
    '          const theta = start + angleStep * i;\n',
    '          const rad = (theta * Math.PI) / 180;\n',
    '          const px = cx + radius * Math.cos(rad);\n',
    '          const py = cy + radius * Math.sin(rad);\n',
    '\n',
    '          let rot = baseRotation;\n',
    '          if (rotate) {\n',
    '            rot = theta + 90; // Point outward from center\n',
    '          }\n',
    '\n',
    '          const newEl: CanvasElement = {\n',
    '            id: `radial-preview-${i}`,\n',
    '            layerId: activeLayerId,\n',
    '            name: `${source?.name || \'도형\'} (미리보기 ${i + 1})`,\n',
    '            type: source?.type || \'shape\',\n',
    '            x: px - baseW / 2,\n',
    '            y: py - baseH / 2,\n',
    '            width: baseW,\n',
    '            height: baseH,\n',
    '            rotation: rot,\n',
    '            opacity: source?.opacity ?? 1,\n',
    '            flipH: source?.flipH,\n',
    '            flipV: source?.flipV,\n',
    '            shadow: source?.shadow,\n',
    '            ...(source?.type === \'shape\'\n',
    '              ? {\n',
    '                  shapeType,\n',
    '                  fill: fillColor,\n',
    '                  stroke: strokeColor,\n',
    '                  strokeWidth: strokeW,\n',
    '                  strokeDash: source.strokeDash || \'solid\',\n',
    '                  cornerRadius: source.cornerRadius,\n',
    '                  gradient: source.gradient,\n',
    '                  points,\n',
    '                }\n',
    '              : source?.type === \'text\'\n',
    '              ? {\n',
    '                  text: source.text,\n',
    '                  fontFamily: source.fontFamily,\n',
    '                  fontSize: source.fontSize,\n',
    '                  color: source.color,\n',
    '                  bold: source.bold,\n',
    '                  italic: source.italic,\n',
    '                  underline: source.underline,\n',
    '                  align: source.align,\n',
    '                  backgroundColor: source.backgroundColor,\n',
    '                }\n',
    '              : source?.type === \'brush\'\n',
    '              ? {\n',
    '                  points: source.points,\n',
    '                  color: source.color,\n',
    '                  strokeWidth: source.strokeWidth,\n',
    '                  isHighlighter: source.isHighlighter,\n',
    '                }\n',
    '              : source?.type === \'image\'\n',
    '              ? {\n',
    '                  src: source.src,\n',
    '                  naturalWidth: source.naturalWidth,\n',
    '                  naturalHeight: source.naturalHeight,\n',
    '                  filters: source.filters,\n',
    '                  lockAspectRatio: source.lockAspectRatio,\n',
    '                  cornerRadius: source.cornerRadius,\n',
    '                  borderWidth: source.borderWidth,\n',
    '                  borderColor: source.borderColor,\n',
    '                }\n',
    '              : {}),\n',
    '          } as CanvasElement;\n',
    '          preview.push(newEl);\n',
    '        }\n',
    '        return { ...prev, previewElements: preview };\n',
    '      },\n',
    '      [activeLayerId, showToast]\n',
    '    );\n',
    '\n',
]

# Insert after handleRadialSetCenter
new_lines = lines[:insert_idx] + radial_update_radius + lines[insert_idx:]

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Added handleRadialUpdateRadius')