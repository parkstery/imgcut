with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and fix the problematic preview section
# The issue is the text element inside the g tag with the transform template literal
# Let me replace the radial preview section with a simplified version that doesn't have nested JSX expressions inside template literals

old_radial_preview = """        {/* Radial Tool Preview Elements */}\n        {radialToolState?.previewElements?.length > 0 && (\n          <g opacity={0.7} stroke=\"#F59E0B\" strokeWidth={1} fill=\"none\">\n            {radialToolState.previewElements.map((el) => (\n              <g key={el.id}>\n                {el.type === 'shape' && (\n                  <path\n                    d={\n                      el.shapeType === 'polyline' && el.points && el.points.length >= 2\n                        ? getPolylinePath(el.points)\n                        : el.shapeType === 'arc' && el.points && el.points.length >= 2 && el.arcRadius != null\n                        ? getArcPath(el.points[0], el.points[1], el.arcRadius, !!el.arcLarge, !!el.arcSweep)\n                        : getShapePath(el.shapeType, el.width, el.height, el.cornerRadius)\n                    }\n                    stroke={el.stroke}\n                    strokeWidth={el.strokeWidth}\n                    strokeDasharray={el.strokeDash === 'dashed' ? '8 6' : el.strokeDash === 'dotted' ? '3 4' : undefined}\n                    transform={\"translate(\" + (el.x + el.width / 2) + \" \" + (el.y + el.height / 2) + \") rotate(\" + (el.rotation || 0) + \") scale(\" + (el.flipH ? -1 : 1) + \" \" + (el.flipV ? -1 : 1) + \") translate(\" + (-(el.x + el.width / 2)) + \" \" + (-(el.y + el.height / 2)) + \")\"} />\n                  {el.type === 'text' && (\n                    <text\n                      x={el.x + el.width / 2}\n                      y={el.y + el.height / 2}\n                      fill={el.color}\n                      font-family={el.fontFamily}\n                      font-size={el.fontSize}\n                      transform=\"rotate(\" + (el.rotation || 0) + \")\"\n                      text-anchor=\"middle\"\n                    >{el.text || ''}</text>\n                  )}\n                )}\n              </g>\n            ))}\n          </g>\n        )}"""

new_radial_preview = """        {/* Radial Tool Preview Elements */}\n        {radialToolState?.previewElements?.length > 0 && (\n          <g opacity={0.7} stroke=\"#F59E0B\" strokeWidth={1} fill=\"none\">\n            {radialToolState.previewElements.map((el) => (\n              <g key={el.id}>\n                {el.type === 'shape' && (\n                  <path\n                    d={\n                      el.shapeType === 'polyline' && el.points && el.points.length >= 2\n                        ? getPolylinePath(el.points)\n                        : el.shapeType === 'arc' && el.points && el.points.length >= 2 && el.arcRadius != null\n                        ? getArcPath(el.points[0], el.points[1], el.arcRadius, !!el.arcLarge, !!el.arcSweep)\n                        : getShapePath(el.shapeType, el.width, el.height, el.cornerRadius)\n                    }\n                    stroke={el.stroke}\n                    strokeWidth={el.strokeWidth}\n                    strokeDasharray={el.strokeDash === 'dashed' ? '8 6' : el.strokeDash === 'dotted' ? '3 4' : undefined}\n                    transform={\"translate(\" + (el.x + el.width / 2) + \" \" + (el.y + el.height / 2) + \") rotate(\" + (el.rotation || 0) + \") scale(\" + (el.flipH ? -1 : 1) + \" \" + (el.flipV ? -1 : 1) + \") translate(\" + (-(el.x + el.width / 2)) + \" \" + (-(el.y + el.height / 2)) + \")\"} />\n                )}\n                {el.type === 'text' && (\n                  <text\n                    x={el.x + el.width / 2}\n                    y={el.y + el.height / 2}\n                    fill={el.color}\n                    font-family={el.fontFamily}\n                    font-size={el.fontSize}\n                    transform=\"rotate(\" + (el.rotation || 0) + \")\"\n                    text-anchor=\"middle\"\n                  >{el.text || ''}</text>\n                )}\n              </g>\n            ))}\n          </g>\n        )}"""

if old_radial_preview in content:
    content = content.replace(old_radial_preview, new_radial_preview)
    print("Fixed radial preview rendering")
else:
    print("Radial preview pattern not found - checking content")
    # Try to find what's there
    idx = content.find('{* Radial')
    if idx >= 0:
        print(f"Found at {idx}")
    else:
        idx = content.find('Radial Tool Preview')
        if idx >= 0:
            print(f"Found at {idx}")
        else:
            print("Checking section around line 2440")
            lines = content.split('\n')
            for i in range(2438, 2460):
                if i < len(lines):
                    print(f'{i+1}: {lines[i][:100]}')

with open(r'C:\20.HDev\imgman\src\components\CanvasArea.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nCanvasArea.tsx fix done")