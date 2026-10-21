with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact preview section - look for "Active Brush Stroke"
old_preview_start = "          })}\n\n          {/* Active Brush Stroke Live Drawing Preview */}"
idx = content.find(old_preview_start)
if idx >= 0:
    # Find the end of this section - it ends with the closing of the isDrawing check
    # Let's find the pattern after it
    section_start = idx
    # The section is: {isDrawing && currentPoints.length > 1 && (...\n          )}
    # Find the closing pattern
    remainder = content[section_start:]
    close_idx = remainder.find("          )}\n        )")
    if close_idx >= 0:
        old_preview = remainder[:close_idx + len("          )}\n        )")]
        print(f"Found preview section at {section_start}, length {len(old_preview)}")
        print(f"Preview starts with: {repr(old_preview[:100])}")
        
        new_preview = """          })}\n\n        {/* Radial Tool Preview Elements */}\n        {radialToolState?.previewElements?.length > 0 && (\n          <g opacity={0.7} stroke=\"#F59E0B\" strokeWidth={1} fill=\"none\">\n            {radialToolState.previewElements.map((el) => (\n              <g key={el.id}>\n                {el.type === 'shape' && (\n                  <path\n                    d={\n                      el.shapeType === 'polyline' && el.points && el.points.length >= 2\n                        ? getPolylinePath(el.points)\n                        : el.shapeType === 'arc' && el.points && el.points.length >= 2 && el.arcRadius != null\n                        ? getArcPath(el.points[0], el.points[1], el.arcRadius, !!el.arcLarge, !!el.arcSweep)\n                        : getShapePath(el.shapeType, el.width, el.height, el.cornerRadius)\n                    }\n                    stroke={el.stroke}\n                    strokeWidth={el.strokeWidth}\n                    strokeDasharray={el.strokeDash === 'dashed' ? '8 6' : el.strokeDash === 'dotted' ? '3 4' : undefined}\n                    transform={\"translate(\" + (el.x + el.width / 2) + \" \" + (el.y + el.height / 2) + \") rotate(\" + (el.rotation || 0) + \") scale(\" + (el.flipH ? -1 : 1) + \" \" + (el.flipV ? -1 : 1) + \") translate(\" + (-(el.x + el.width / 2)) + \" \" + (-(el.y + el.height / 2)) + \")\"} />\n                  {el.type === 'text' && (\n                    <text\n                      x={el.x + el.width / 2}\n                      y={el.y + el.height / 2}\n                      fill={el.color}\n                      font-family={el.fontFamily}\n                      font-size={el.fontSize}\n                      transform=\"rotate(\" + (el.rotation || 0) + \")\"\n                      text-anchor=\"middle\"\n                    >{el.text || ''}</text>\n                  )}\n                )}\n              </g>\n            ))}\n          </g>\n        )}\n\n          {/* Active Brush Stroke Live Drawing Preview */}"""
        
        content = content[:section_start] + new_preview + content[section_start + len(old_preview):]
        print("Added radial tool preview rendering")
    else:
        print("Could not find end of preview section")
else:
    print(f"Preview start pattern not found at expected location")

with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nCanvasArea.tsx done")