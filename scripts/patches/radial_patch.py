with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact location and replace
old = '''})}
              </g>
            );
          })}

          {/* Active Brush Stroke Live Drawing Preview */}'''

new = ''')}\n              </g>\n            );\n          })}\n\n        {/* Radial Tool Preview Elements */}
        {radialToolState?.previewElements?.length > 0 && (
          <g opacity={0.7}>
            {radialToolState.previewElements.map((el) => (
              <g key={el.id} transform={el.flipH || el.flipV ? `translate(${el.x + el.width / 2} ${el.y + el.height / 2}) scale(${el.flipH ? -1 : 1} ${el.flipV ? -1 : 1}) translate(${-(el.x + el.width / 2)} ${-(el.y + el.height / 2)})` : undefined}>
                {el.type === 'shape' && (
                  <g transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0} ${el.shapeType === 'line' || el.shapeType.startsWith('line-arrow') ? `0 ${el.height / 2}` : `${el.width / 2} ${el.height / 2}`})`}>
                    <path
                      d={
                        el.shapeType === 'polyline' && el.points && el.points.length >= 2
                          ? getPolylinePath(el.points)
                          : el.shapeType === 'arc' && el.points && el.points.length >= 2 && el.arcRadius != null
                          ? getArcPath(el.points[0], el.points[1], el.arcRadius, !!el.arcLarge, !!el.arcSweep)
                          : getShapePath(el.shapeType, el.width, el.height, el.cornerRadius)
                      }
                      fill={
                        el.shapeType === 'line' || el.shapeType.startsWith('line-arrow') || el.shapeType === 'polyline' || el.shapeType === 'arc'
                          ? 'none'
                          : el.gradient?.enabled
                          ? `url(#grad-${el.id})`
                          : el.fill
                      }
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      strokeLinecap={el.shapeType === 'line' || el.shapeType.startsWith('line-arrow') || el.shapeType === 'polyline' || el.shapeType === 'arc' ? 'round' : undefined}
                      strokeLinejoin={el.shapeType === 'line' || el.shapeType.startsWith('line-arrow') || el.shapeType === 'polyline' || el.shapeType === 'arc' ? 'round' : undefined}
                      strokeDasharray={el.strokeDash === 'dashed' ? '8 6' : el.strokeDash === 'dotted' ? '3 4' : undefined}
                      opacity={el.opacity}
                      stroke="currentColor"
                      color="#F59E0B"
                    />
                  </g>
                )}
                {el.type === 'brush' && (
                  <path
                    d={generateBrushSmoothPath(el.points)}
                    fill="none"
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={el.isHighlighter ? el.opacity * 0.45 : el.opacity}
                    color="#F59E0B"
                  />
                )}
                {el.type === 'text' && (
                  <text
                    x={el.align === 'center' ? el.x + el.width / 2 : el.align === 'right' ? el.x + el.width : el.x}
                    y={el.y + el.fontSize}
                    fontFamily={el.fontFamily}
                    fontSize={el.fontSize}
                    fontWeight={el.bold ? 'bold' : 'normal'}
                    fontStyle={el.italic ? 'italic' : 'normal'}
                    textDecoration={el.underline ? 'underline' : 'none'}
                    fill={el.color}
                    textAnchor={el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start'}
                    opacity={el.opacity}
                    color="#F59E0B"
                  >
                    {el.text.split('\n').map((line, i) => (
                      <tspan key={i} x={el.align === 'center' ? el.x + el.width / 2 : el.align === 'right' ? el.x + el.width : el.x} dy={i === 0 ? 0 : el.fontSize * 1.3}>
                        {line.length === 0 ? '\u00A0' : line}
                      </tspan>
                    ))}
                  </text>
                )}
                {el.type === 'image' && (
                  <image
                    href={el.src}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    preserveAspectRatio="none"
                    opacity={el.opacity}
                    color="#F59E0B"
                  />
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
    print('Replaced successfully!')
else:
    print('Old block not found!')
    # Find similar
    idx = content.find('Active Brush Stroke')
    if idx >= 0:
        print('Found at:', idx)
        print(repr(content[idx-200:idx+50]))