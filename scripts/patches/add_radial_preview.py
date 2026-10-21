with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''          })}

          {/* Active Brush Stroke Live Drawing Preview */}'''

new = '''          })}

        {/* Radial Tool Preview Elements */}
        {radialToolState?.previewElements?.length > 0 && (
          <g opacity={0.7} stroke="#F59E0B" strokeWidth={1} fill="none">
            {radialToolState.previewElements.map((el) => (
              <g key={el.id}>
                {el.type === 'shape' && (
                  <path
                    d={
                      el.shapeType === 'polyline' && el.points && el.points.length >= 2
                        ? getPolylinePath(el.points)
                        : el.shapeType === 'arc' && el.points && el.points.length >= 2 && el.arcRadius != null
                        ? getArcPath(el.points[0], el.points[1], el.arcRadius, !!el.arcLarge, !!el.arcSweep)
                        : getShapePath(el.shapeType, el.width, el.height, el.cornerRadius)
                    }
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    strokeDasharray={el.strokeDash === 'dashed' ? '8 6' : el.strokeDash === 'dotted' ? '3 4' : undefined}
                    transform={"translate(" + (el.x + el.width / 2) + " " + (el.y + el.height / 2) + ") rotate(" + (el.rotation || 0) + ") scale(" + (el.flipH ? -1 : 1) + " " + (el.flipV ? -1 : 1) + ") translate(" + (-(el.x + el.width / 2)) + " " + (-(el.y + el.height / 2)) + ")"} />
                )}
              </g>
            ))}
          </g>
        )}

        {/* Active Brush Stroke Live Drawing Preview */}'''

if old in content:
    content = content.replace(old, new)
    with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added radial tool preview rendering')
else:
    print('Old block not found')
    idx = content.find('Active Brush Stroke Live Drawing Preview')
    if idx >= 0:
        print('Found at:', idx)
        print(repr(content[idx-200:idx+100]))