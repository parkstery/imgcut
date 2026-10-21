with open(r'C:\20.HDev\imgman\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''<PropertiesPanel
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
          onRadialUpdateSweepAngle={(angle) => setRadialToolState((prev) => ({ ...prev, sweepAngle: Math.max(0, Math.min(360, angle))) })}
          onRadialToggleRotate={(rotate) => setRadialToolState((prev) => ({ ...prev, rotateObjects: rotate }))}
          onRadialUpdateStartAngle={(angle) => setRadialToolState((prev) => ({ ...prev, startAngle: ((angle % 360) + 360) % 360 }))}
      />'''

new = '''<PropertiesPanel
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
      />'''

if old in content:
    content = content.replace(old, new)
    with open(r'C:\20.HDev\imgman\src\App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed syntax error')
else:
    print('Old block not found')