with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a simple radial preview rendering
old = '{/* Active Brush Stroke Live Drawing Preview */}'

new = '{/* Radial Tool Preview Elements */}\n        {radialToolState?.previewElements?.length > 0 && (\n          <g opacity={0.7} stroke="#F59E0B" strokeWidth={1} fill="none">\n            {radialToolState.previewElements.map((el) => (\n              <g key={el.id}>\n                {el.type === \'shape\' && (\n                  <path\n                    d={\n                      el.shapeType === \'polyline\' && el.points && el.points.length >= 2\n                        ? getPolylinePath(el.points)\n                        : el.shapeType === \'arc\' && el.points && el.points.length >= 2 && el.arcRadius != null\n                        ? getArcPath(el.points[0], el.points[1], el.arcRadius, !!el.arcLarge, !!el.arcSweep)\n                        : getShapePath(el.shapeType, el.width, el.height, el.cornerRadius)\n                    }\n                    stroke={el.stroke}\n                    strokeWidth={el.strokeWidth}\n                    strokeDasharray={el.strokeDash === \'dashed\' ? \'8 6\' : el.strokeDash === \'dotted\' ? \'3 4\' : undefined}\n                    transform={"translate(" + (el.x + el.width / 2) + " " + (el.y + el.height / 2) + ") rotate(" + (el.rotation || 0) + ") scale(" + (el.flipH ? -1 : 1) + " " + (el.flipV ? -1 : 1) + ") translate(" + (-(el.x + el.width / 2)) + " " + (-(el.y + el.height / 2)) + ")"}\n                  />\n                )}\n              </g>\n            ))}\n          </g>\n        )}\n\n        {/* Active Brush Stroke Live Drawing Preview */}'

if old in content:
    content = content.replace(old, new)
    with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added simple radial preview rendering')
else:
    print('Could not find marker')
    idx = content.find('Active Brush Stroke')
    if idx >= 0:
        print('Found at:', idx)
        print(repr(content[idx-100:idx+50]))