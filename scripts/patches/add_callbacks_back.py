with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find pushHistory end
push_idx = content.find('const pushHistory = useCallback')
if push_idx >= 0:
    paren_count = 0
    brace_count = 0
    i = push_idx
    while i < len(content):
        c = content[i]
        if c == '(':
            paren_count += 1
        elif c == ')':
            paren_count -= 1
        elif c == '{':
            brace_count += 1
        elif c == '}':
            brace_count -= 1
        if paren_count == 0 and brace_count == 0 and i > push_idx:
            insert_pos = i + 1
            break
    else:
        insert_pos = 0

if insert_pos:
    new_callbacks = '''\n\n  const handleRadialConfirm = useCallback(() => {
    setRadialToolState((prev) => {
      if (!prev.center || prev.count < 2) return prev;
      // Generate the actual elements from the radial tool state
      const cx = prev.center.x;
      const cy = prev.center.y;
      const radius = prev.radius;
      const count = Math.max(2, Math.min(50, prev.count));
      const sweep = Math.max(0, Math.min(360, prev.sweepAngle));
      const start = prev.startAngle;
      const rotate = prev.rotateObjects;
      const source = prev.sourceElement;
      let baseW = 50;
      let baseH = 50;
      let baseRotation = 0;
      let fillColor = '#FF0000';
      let strokeColor = '#FF0000';
      let strokeW = 2;
      let shapeType: ShapeType = 'ellipse';
      let points: Point[] | undefined;

      if (source) {
        baseW = source.width;
        baseH = source.height;
        baseRotation = source.rotation || 0;
        fillColor = source.type === 'shape' ? source.fill : '#FF0000';
        strokeColor = source.type === 'shape' ? source.stroke : '#FF0000';
        strokeW = source.type === 'shape' ? source.strokeWidth : 2;
        if (source.type === 'shape') {
          shapeType = source.shapeType;
          points = source.points;
        } else if (source.type === 'text') {
          shapeType = 'rect';
        } else if (source.type === 'image') {
          shapeType = 'ellipse';
        }
      }

      const preview: CanvasElement[] = [];
      let angleStep = sweep / (count - 1);
      if (sweep >= 360 && count > 1) {
        angleStep = 360 / count;
      }
      for (let i = 0; i < count; i++) {
        const theta = start + angleStep * i;
        const rad = (theta * Math.PI) / 180;
        const px = cx + radius * Math.cos(rad);
        const py = cy + radius * Math.sin(rad);

        let rot = baseRotation;
        if (rotate) {
          rot = theta + 90;
        }

        const newEl: CanvasElement = {
          id: 'radial-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 7),
          layerId: activeLayerId,
          name: (source?.name || '도형') + ' (미리보기 ' + (i + 1) + ')',
          type: source?.type || 'shape',
          x: px - baseW / 2,
          y: py - baseH / 2,
          width: baseW,
          height: baseH,
          rotation: rot,
          opacity: source?.opacity ?? 1,
          flipH: source?.flipH,
          flipV: source?.flipV,
          shadow: source?.shadow,
          ...(source?.type === 'shape'
            ? {
                shapeType,
                fill: fillColor,
                stroke: strokeColor,
                strokeWidth: strokeW,
                strokeDash: source.strokeDash || 'solid',
                cornerRadius: source.cornerRadius,
                gradient: source.gradient,
                points,
              }
            : source?.type === 'text'
            ? {
                text: source.text,
                fontFamily: source.fontFamily,
                fontSize: source.fontSize,
                color: source.color,
                bold: source.bold,
                italic: source.italic,
                underline: source.underline,
                align: source.align,
                backgroundColor: source.backgroundColor,
              }
            : source?.type === 'brush'
            ? {
                points: source.points,
                color: source.color,
                strokeWidth: source.strokeWidth,
                isHighlighter: source.isHighlighter,
              }
            : source?.type === 'image'
            ? {
                src: source.src,
                naturalWidth: source.naturalWidth,
                naturalHeight: source.naturalHeight,
                filters: source.filters,
                lockAspectRatio: source.lockAspectRatio,
                cornerRadius: source.cornerRadius,
                borderWidth: source.borderWidth,
                borderColor: source.borderColor,
              }
            : {}),
        } as CanvasElement;
        preview.push(newEl);
      }

      const nextElements = [...elements, ...preview];
      setElements(nextElements);
      setSelectedElementIds(preview.map((e) => e.id));
      pushHistory(nextElements, layers, config);
      showToast(preview.length + '개 객체로 방사상 배열이 생성되었습니다.');
      return { ...prev, step: 'idle', previewElements: [], sourceElement: undefined };
    });
  }, [elements, layers, config, pushHistory, showToast]);

  const handleRadialCancel = useCallback(() => {
    setRadialToolState({
      step: 'idle',
      radius: 100,
      count: 8,
      startAngle: 0,
      sweepAngle: 360,
      rotateObjects: false,
      previewElements: [],
    });
    showToast('방사상 도구가 취소되었습니다.');
  }, [showToast]);
"""
    content = content[:insert_pos] + new_callbacks + content[insert_pos:]
    print("Inserted callbacks")
else:
    print("Could not find pushHistory end")

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")