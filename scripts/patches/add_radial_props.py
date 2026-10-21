with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the CanvasArea component call
old = '''<CanvasArea
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
        />'''

new = '''<CanvasArea
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
        />'''

if old in content:
    content = content.replace(old, new)
    with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added radial tool props to CanvasArea')
else:
    print('Old CanvasArea block not found')