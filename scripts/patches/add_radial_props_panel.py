with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add radial tool props to PropertiesPanelProps
old_props = '''onCutImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;
  onCopyImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;
  activeCropBox?: { x: number; y: number; w: number; h: number } | null;
  onFitCanvasToContent?: () => void;
  canFitCanvas?: boolean;
  fitPreview?: string | null;
}'''

new_props = '''onCutImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;
  onCopyImagePart?: (imgElem: ImageElement, crop: { x: number; y: number; w: number; h: number }) => void;
  activeCropBox?: { x: number; y: number; w: number; h: number } | null;
  onFitCanvasToContent?: () => void;
  canFitCanvas?: boolean;
  fitPreview?: string | null;
  // Radial Tool
  radialToolState?: {
    step: 'idle' | 'placing_center' | 'adjusting_radius' | 'preview';
    center?: { x: number; y: number };
    radius: number;
    count: number;
    startAngle: number;
    sweepAngle: number;
    rotateObjects: boolean;
    sourceElement?: CanvasElement;
    previewElements: CanvasElement[];
  };
  onRadialUpdateCount?: (count: number) => void;
  onRadialUpdateSweepAngle?: (angle: number) => void;
  onRadialToggleRotate?: (rotate: boolean) => void;
  onRadialUpdateStartAngle?: (angle: number) => void;
  onRadialConfirm?: () => void;
  onRadialCancel?: () => void;
}'''

if old_props in content:
    content = content.replace(old_props, new_props)
    with open(r'C:\20.HDev\imgman\src\components\PropertiesPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added radial tool props to PropertiesPanelProps')
else:
    print('Old props block not found')