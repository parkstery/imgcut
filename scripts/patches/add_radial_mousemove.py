with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add radial tool mousemove handling
old_mousemove = '''    // Arc rubber-band: end point or bend (radius) preview
    if (currentTool === 'shape' && selectedShapeType === 'arc' && arcDraft) {
      let cursor = config.snapToGrid ? { x: snapValue(pt.x), y: snapValue(pt.y) } : pt;
      if (!arcDraft.end && e.shiftKey) {
        cursor = snapPolylineAngle(arcDraft.start, cursor);
      }
      if (arcDraft.end) {
        arcBendRef.current = cursor;
        setArcBend(cursor);
      } else {
        setArcBend(cursor);
      }
      return;
    }

    // Panning canvas'''

new_mousemove = '''    // Arc rubber-band: end point or bend (radius) preview
    if (currentTool === 'shape' && selectedShapeType === 'arc' && arcDraft) {
      let cursor = config.snapToGrid ? { x: snapValue(pt.x), y: snapValue(pt.y) } : pt;
      if (!arcDraft.end && e.shiftKey) {
        cursor = snapPolylineAngle(arcDraft.start, cursor);
      }
      if (arcDraft.end) {
        arcBendRef.current = cursor;
        setArcBend(cursor);
      } else {
        setArcBend(cursor);
      }
      return;
    }

    // Radial Tool: update radius preview while dragging
    if (currentTool === 'radial') {
      const { step, center, radius } = radialToolState || {};
      if ((step === 'adjusting_radius' || step === 'preview') && center) {
        const dx = pt.x - center.x;
        const dy = pt.y - center.y;
        const newRadius = Math.max(1, Math.hypot(dx, dy));
        const newAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        onRadialUpdateRadius?.(newRadius, newAngle);
      }
      return;
    }

    // Panning canvas'''

if old_mousemove in content:
    content = content.replace(old_mousemove, new_mousemove)
    with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added radial tool mousemove handling')
else:
    print('Old mousemove block not found')