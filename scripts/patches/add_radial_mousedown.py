with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add radial tool mousedown handling
old_mousedown = '''// Crop tool click
    if (currentTool === 'crop') {
      setIsDrawing(true);
      setDrawStart(pt);
      setCropBox({ x: pt.x, y: pt.y, w: 0, h: 0 });
      return;
    }

    // Brush or Highlighter tool'''

new_mousedown = '''// Crop tool click
    if (currentTool === 'crop') {
      setIsDrawing(true);
      setDrawStart(pt);
      setCropBox({ x: pt.x, y: pt.y, w: 0, h: 0 });
      return;
    }

    // Radial Object Tool
    if (currentTool === 'radial') {
      if (activeLayer.locked) return;
      const { step, center, radius, count, startAngle, sweepAngle, rotateObjects, sourceElement, previewElements } = radialToolState || {};

      if (step === 'placing_center') {
        // First click: set center point
        onRadialSetCenter?.(pt.x, pt.y);
        onRadialStart?.();
        return;
      }

      if (step === 'adjusting_radius' && center) {
        // Second click: confirm radius and show preview, or update radius
        const dx = pt.x - center.x;
        const dy = pt.y - center.y;
        const newRadius = Math.max(1, Math.hypot(dx, dy));
        const newAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        onRadialUpdateRadius?.(newRadius, newAngle);
        return;
      }

      if (step === 'preview' && center) {
        // Click to confirm or update
        const dx = pt.x - center.x;
        const dy = pt.y - center.y;
        const newRadius = Math.max(1, Math.hypot(dx, dy));
        const newAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        onRadialUpdateRadius?.(newRadius, newAngle);
        return;
      }

      return;
    }

    // Brush or Highlighter tool'''

if old_mousedown in content:
    content = content.replace(old_mousedown, new_mousedown)
    with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added radial tool mousedown handling')
else:
    print('Old mousedown block not found')