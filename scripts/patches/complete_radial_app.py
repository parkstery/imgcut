with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Point to imports
old_import = """import {
  CanvasConfig,
  CanvasElement,
  Layer,
  ToolType,
  ShapeType,
  HistorySnapshot,
  ImageElement,
  ShapeStylePreset,
} from './types';"""

new_import = """import {
  CanvasConfig,
  CanvasElement,
  Layer,
  ToolType,
  ShapeType,
  HistorySnapshot,
  ImageElement,
  ShapeStylePreset,
  Point,
} from './types';"""

content = content.replace(old_import, new_import)
print("1. Added Point import")

# 2. Add radial tool state after handleSelectTool
old_handle_select = """  const handleSelectTool = useCallback((tool: ToolType) => {
    if (tool === 'crop') {
      setSelectedElementIds([]);
      setCroppingImageId(null);
      setActiveImgCropBox(null);
      activeImgCropBoxRef.current = null;
    } else if (tool !== 'select' && croppingImageId) {
      setCroppingImageId(null);
      setActiveImgCropBox(null);
      activeImgCropBoxRef.current = null;
    }
    setCurrentTool(tool);
  }, [croppingImageId]);

  const toggleLeftPanel = useCallback(() => {"""

new_handle_select = """  const handleSelectTool = useCallback((tool: ToolType) => {
    if (tool === 'crop') {
      setSelectedElementIds([]);
      setCroppingImageId(null);
      setActiveImgCropBox(null);
      activeImgCropBoxRef.current = null;
    } else if (tool !== 'select' && croppingImageId) {
      setCroppingImageId(null);
      setActiveImgCropBox(null);
      activeImgCropBoxRef.current = null;
    }
    setCurrentTool(tool);
  }, [croppingImageId]);

  // Radial Object Tool State
  const [radialToolState, setRadialToolState] = useState<{
    step: 'idle' | 'placing_center' | 'adjusting_radius' | 'preview';
    center?: { x: number; y: number };
    radius: number;
    count: number;
    startAngle: number;
    sweepAngle: number;
    rotateObjects: boolean;
    sourceElement?: CanvasElement;
    previewElements: CanvasElement[];
  }>({
    step: 'idle',
    radius: 100,
    count: 8,
    startAngle: 0,
    sweepAngle: 360,
    rotateObjects: false,
    previewElements: [],
  });

  const handleRadialStart = useCallback(() => {
    let source: CanvasElement | undefined;
    if (selectedElementId) {
      source = elements.find((e) => e.id === selectedElementId);
    }
    setRadialToolState({
      step: 'placing_center',
      radius: 100,
      count: 8,
      startAngle: 0,
      sweepAngle: 360,
      rotateObjects: false,
      sourceElement: source,
      previewElements: [],
    });
    showToast('캔버스를 클릭하여 중심점을 지정하세요. 드래그로 반지름 조정, Shift로 15도 각도 스냅');
  }, [selectedElementId, elements, showToast]);

  const handleRadialSetCenter = useCallback((x: number, y: number) => {
    setRadialToolState((prev) => ({
      ...prev,
      step: 'adjusting_radius',
      center: { x, y },
      previewElements: [],
    }));
  }, []);

  const handleRadialUpdateRadius = useCallback(
    (radius: number, angle?: number) => {
      setRadialToolState((prev) => ({
        ...prev,
        radius,
        startAngle: angle ?? prev.startAngle,
      }));
  }, []);

  const handleRadialConfirm = useCallback(() => {
    setRadialToolState((prev) => {
      if (!prev.center || prev.count < 2) return prev;
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

  const toggleLeftPanel = useCallback(() => {"""

content = content.replace(old_handle_select, new_handle_select)
print("Added radial tool state and handlers")

# 3. Update CanvasArea props
old_canvas = """<CanvasArea
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onCropCanvas={handleCropCanvas}
          onCutCanvasRegion={handleCutCanvasRegion}
          onCopyCanvasRegion={handleCopyCanvasRegion}
          onTriggerPaste={handlePasteAction}
          onMouseMoveCanvas={(pt) => {
            lastMouseCanvasPosRef.current = pt;
          }}
          onCopyImagePart={handleCopyImagePart}
          onCutImagePart={handleCutImagePart}
          onCropBoxChange={handleCropBoxChange}
          layers={layers}
          elements={elements}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onUpdateElements={handleUpdateElements}
          onCommitHistory={handleCommitHistory}
          onDeleteElement={handleDeleteElement}
          activeLayerId={activeLayerId}
          selectedElementId={selectedElementId}
          selectedElementIds={selectedElementIds}
          onSelectElement={handleSelectElement}
          onSelectMultipleElements={handleSelectMultipleElements}
          onToggleSelectElement={handleToggleSelectElement}
          currentTool={currentTool}
          onSelectTool={handleSelectTool}
          selectedShapeType={selectedShapeType}
          primaryColor={primaryColor}
          onPrimaryColorChange={handlePrimaryColorChange}
          strokeWidth={strokeWidth}
          zoom={zoom}
          onZoomChange={setZoom}
          lastShapeStyle={lastShapeStyle}
          croppingImageId={croppingImageId}
          onStartCropImage={handleStartCropImage}
          onFinishCropImage={handleFinishCropImage}
          onInsertImage={handleInsertImage}
        />"""

new_canvas = """<CanvasArea
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onCropCanvas={handleCropCanvas}
          onCutCanvasRegion={handleCutCanvasRegion}
          onCopyCanvasRegion={handleCopyCanvasRegion}
          onTriggerPaste={handlePasteAction}
          onMouseMoveCanvas={(pt) => {
            lastMouseCanvasPosRef.current = pt;
          }}
          onCopyImagePart={handleCopyImagePart}
          onCutImagePart={handleCutImagePart}
          onCropBoxChange={handleCropBoxChange}
          layers={layers}
          elements={elements}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onUpdateElements={handleUpdateElements}
          onCommitHistory={handleCommitHistory}
          onDeleteElement={handleDeleteElement}
          activeLayerId={activeLayerId}
          selectedElementId={selectedElementId}
          selectedElementIds={selectedElementIds}
          onSelectElement={handleSelectElement}
          onSelectMultipleElements={handleSelectMultipleElements}
          onToggleSelectElement={handleToggleSelectElement}
          currentTool={currentTool}
          onSelectTool={handleSelectTool}
          selectedShapeType={selectedShapeType}
          primaryColor={primaryColor}
          onPrimaryColorChange={handlePrimaryColorChange}
          strokeWidth={strokeWidth}
          zoom={zoom}
          onZoomChange={setZoom}
          lastShapeStyle={lastShapeStyle}
          croppingImageId={croppingImageId}
          onStartCropImage={handleStartCropImage}
          onFinishCropImage={handleFinishCropImage}
          onInsertImage={handleInsertImage}
          // Radial Tool
          radialToolState={radialToolState}
          onRadialSetCenter={handleRadialSetCenter}
          onRadialUpdateRadius={handleRadialUpdateRadius}
          onRadialConfirm={handleRadialConfirm}
          onRadialCancel={handleRadialCancel}
          onRadialStart={handleRadialStart}
        />"""

content = content.replace(old_canvas, new_canvas)
print("Updated CanvasArea props")

# 4. Update PropertiesPanel props
old_props_panel = """<PropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onAlign={handleAlign}
          config={config}
          onUpdateConfig={handleUpdateConfig}
          isOpen={isRightPanelOpen}
          onToggleCollapse={toggleRightPanel}
          croppingImageId={croppingImageId}
          onStartCropImage={handleStartCropImage}
          onApplyCropImage={handleApplyCropImage}
          onCancelCropImage={handleFinishCropImage}
          onCutImagePart={handleCutImagePart}
          onCopyImagePart={handleCopyImagePart}
          activeCropBox={activeImgCropBox}
          onFitCanvasToContent={handleFitCanvasToContent}
          canFitCanvas={canFitCanvas}
          fitPreview={fitPreview}
      />"""

new_props_panel = """<PropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onAlign={handleAlign}
          config={config}
          onUpdateConfig={handleUpdateConfig}
          isOpen={isRightPanelOpen}
          onToggleCollapse={toggleRightPanel}
          croppingImageId={croppingImageId}
          onStartCropImage={handleStartCropImage}
          onApplyCropImage={handleApplyCropImage}
          onCancelCropImage={handleFinishCropImage}
          onCutImagePart={handleCutImagePart}
          onCopyImagePart={handleCopyImagePart}
          activeCropBox={activeImgCropBox}
          onFitCanvasToContent={handleFitCanvasToContent}
          canFitCanvas={canFitCanvas}
          fitPreview={fitPreview}
          // Radial Tool
          radialToolState={radialToolState}
          onRadialUpdateCount={(count) => handleRadialUpdateRadius(radialToolState.radius, radialToolState.startAngle)}
          onRadialUpdateSweepAngle={(angle) => setRadialToolState((prev) => ({ ...prev, sweepAngle: Math.max(0, Math.min(360, angle)) }))}
          onRadialToggleRotate={(rotate) => setRadialToolState((prev) => ({ ...prev, rotateObjects: rotate }))}
          onRadialUpdateStartAngle={(angle) => setRadialToolState((prev) => ({ ...prev, startAngle: ((angle % 360) + 360) % 360 }))}
          onRadialConfirm={handleRadialConfirm}
          onRadialCancel={handleRadialCancel}
      />"""

content = content.replace(old_props_panel, new_props_panel)
print("Updated PropertiesPanel props")

with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done App.tsx")