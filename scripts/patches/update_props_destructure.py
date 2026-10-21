with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_destructure = '''export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onAlign,
  config,
  onUpdateConfig,
  isOpen = true,
  onToggleCollapse,
  croppingImageId,
  onStartCropImage,
  onApplyCropImage,
  onCancelCropImage,
  onCutImagePart,
  onCopyImagePart,
  activeCropBox,
  onFitCanvasToContent,
  canFitCanvas = false,
  fitPreview = null,
}) => {'''

new_destructure = '''export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onAlign,
  config,
  onUpdateConfig,
  isOpen = true,
  onToggleCollapse,
  croppingImageId,
  onStartCropImage,
  onApplyCropImage,
  onCancelCropImage,
  onCutImagePart,
  onCopyImagePart,
  activeCropBox,
  onFitCanvasToContent,
  canFitCanvas = false,
  fitPreview = null,
  // Radial Tool
  radialToolState,
  onRadialUpdateCount,
  onRadialUpdateSweepAngle,
  onRadialToggleRotate,
  onRadialUpdateStartAngle,
  onRadialConfirm,
  onRadialCancel,
}) => {'''

if old_destructure in content:
    content = content.replace(old_destructure, new_destructure)
    with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated PropertiesPanel destructuring')
else:
    print('Old destructuring not found')